import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface UserRun {
    id: string;
    user_id: string;
    novena_id: string;
    started_at: string;
    profile: {
        display_name: string;
        email: string;
        email_notifications: boolean;
    };
    novena: {
        title: string;
        slug: string;
    };
    today_progress: {
        id: string;
    }[];
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");

        if (!smtpUser || !smtpPass) {
            throw new Error("SMTP credentials not configured.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Calculate "Today" as start of day in UTC
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 1. Get all active runs
        const { data: runs, error } = await supabase
            .from("user_novena_runs")
            .select(`
        id,
        user_id,
        novena_id,
        started_at,
        status,
        last_reminder_sent_at,
        profiles (
          display_name,
          email,
          email_notifications
        ),
        novenas (
          title,
          slug
        ),
        user_day_progress (
          id,
          completed_at,
          is_completed
        )
      `)
            .eq("status", "active");

        if (error) throw error;


        console.log(`Found ${runs?.length || 0} active runs. Starting processing...`);

        // Explicitly configure for Gmail
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465, // Use 465 for secure: true, or 587 for secure: false
            secure: true, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            logger: true, // log to console
            debug: true,  // include SMTP traffic in the logs
        });

        // Verify connection configuration
        try {
            await transporter.verify();
            console.log('Server is ready to take our messages');
        } catch (error) {
            console.error('SMTP Connection Error:', error);
            throw error;
        }

        let emailsSent = 0;
        const { force } = await req.json().catch(() => ({ force: false }));

        for (const run of runs as any) {
            // Skip if user has disabled notifications or has no profile
            if (!run.profiles?.email_notifications || !run.profiles?.email) {
                continue;
            }

            // Check if reminder already sent today (Unless forced)
            if (run.last_reminder_sent_at && !force) {
                const lastSent = new Date(run.last_reminder_sent_at);
                if (lastSent > todayStart) {
                    continue;
                }
            }

            // Check if they completed a task TODAY (Unless forced)
            // We look at 'user_day_progress'. Check if any entry has completed_at >= todayStart
            const completedToday = run.user_day_progress?.some((p: any) => {
                if (!p.is_completed || !p.completed_at) return false;
                const completedAt = new Date(p.completed_at);
                return completedAt >= todayStart;
            });

            if (completedToday && !force) {
                console.log(`Skipping run ${run.id} (${run.profiles.email}): User completed daily task.`);
                continue;
            } else if (completedToday && force) {
                console.log(`Run ${run.id}: User prayed today, but FORCE is enabled. Acknowledging.`);
            }

            // Logic to determine which Day Number they should be on
            const completedDays = run.user_day_progress?.filter((p: any) => p.is_completed).length || 0;
            const nextDay = Math.min(completedDays + 1, 9);

            const novenaTitle = run.novenas?.title;
            const userName = run.profiles?.display_name || "Peregrino";
            const userEmail = run.profiles?.email;

            if (!userEmail) continue;

            // Select Template (mais estético, mantendo dourado e botão)
            let subject = `✨ Não esqueça da sua oração hoje: ${novenaTitle}`;

            // Paleta / base visual (reaproveite se quiser centralizar em helpers)
            const GOLD = "#D4AF37";
            const BG = "#f6f5f2";
            const BORDER = "#e7e5e4";
            const TEXT = "#2b2b2b";
            const MUTED = "#6b7280";

            const pageWrap = `
            margin:0;
            padding:0;
            background:${BG};
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
            color:${TEXT};
            `;

            const cardStyle = `
            max-width:600px;
            width:100%;
            margin:0 auto;
            background:#ffffff;
            border:1px solid ${BORDER};
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 14px 34px rgba(17,24,39,.10);
            `;

            const headerStyle = `
            padding:26px 28px 18px 28px;
            background:linear-gradient(135deg, rgba(212,175,55,.18), rgba(255,255,255,1));
            border-bottom:1px solid ${BORDER};
            `;

            const brandStyle = `
            font-size:12px;
            letter-spacing:.14em;
            text-transform:uppercase;
            color:#8b6b00;
            font-weight:800;
            `;

            const titleStyle = `
            margin:10px 0 0 0;
            font-size:22px;
            line-height:1.25;
            font-weight:900;
            color:#111827;
            `;

            const bodyStyle = `padding:18px 28px 8px 28px;`;

            const pStyle = `
            margin:10px 0;
            font-size:15px;
            line-height:1.75;
            color:${TEXT};
            `;

            const smallStyle = `
            margin:12px 0 0 0;
            font-size:12px;
            line-height:1.6;
            color:#9ca3af;
            `;

            const btnStyle = `
            background-color:${GOLD};
            color:white;
            padding:12px 24px;
            text-decoration:none;
            border-radius:6px;
            font-weight:800;
            display:inline-block;
            box-shadow:0 10px 18px rgba(212,175,55,.22);
            `;

            const pillStyle = `
            display:inline-block;
            padding:6px 10px;
            border-radius:999px;
            font-size:12px;
            font-weight:800;
            color:#8b6b00;
            background:rgba(212,175,55,.14);
            border:1px solid rgba(212,175,55,.25);
            `;

            // Helper
            function reminderEmail({ preheader, icon, heading, intro, highlight, ctaLabel, slug, note }) {
                return `
            <!doctype html>
            <html lang="pt-BR">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>Gratia Novem</title>
            </head>
            <body style="${pageWrap}">
                <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
                ${preheader}
                </span>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG}; padding:24px 0;">
                <tr>
                    <td align="center" style="padding:0 14px;">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="${cardStyle}">
                        <tr>
                        <td style="${headerStyle}">
                            <div style="${brandStyle}">Gratia Novem</div>
                            <div style="${titleStyle}">${heading}</div>
                            <div style="margin-top:10px; text-align:center; font-size:38px;">${icon}</div>
                        </td>
                        </tr>

                        <tr>
                        <td style="${bodyStyle}">
                            <p style="${pStyle}"><strong>Olá, ${userName}</strong> 👋</p>
                            <p style="${pStyle}">${intro}</p>

                            <div style="margin:14px 0 6px 0; text-align:left;">
                            <span style="${pillStyle}">${highlight}</span>
                            </div>

                            <div style="text-align:center; margin:28px 0 10px 0;">
                            <a href="https://gratianovem.com.br/novena/${slug}" style="${btnStyle}" target="_blank" rel="noopener">
                                ${ctaLabel}
                            </a>
                            </div>

                            <p style="${smallStyle}">${note}</p>
                        </td>
                        </tr>

                        <tr>
                        <td style="padding:16px 28px; background:#fafafa; border-top:1px solid ${BORDER}; font-size:12px; line-height:1.6; color:#9ca3af;">
                            Você recebeu este lembrete porque está em uma jornada no Gratia Novem.
                            <br />
                            <span style="color:#b6b6b6;">© Gratia Novem • gratianovem.com.br</span>
                        </td>
                        </tr>
                    </table>

                    <div style="height:14px;"></div>
                    <div style="max-width:600px; text-align:center; font-size:11px; color:#9ca3af; padding:0 8px;">
                        Dica: se os e-mails estiverem caindo no spam, mova para “Principal” e marque como confiável.
                    </div>
                    </td>
                </tr>
                </table>
            </body>
            </html>
            `;
            }

            // Default reminder
            html = reminderEmail({
                preheader: `Ainda dá tempo de rezar hoje — dia ${nextDay} da ${novenaTitle}.`,
                icon: "🌙",
                heading: "Um lembrete para hoje",
                intro: `A noite está chegando ao fim, mas ainda há tempo para um momento de oração.`,
                highlight: `Falta pouco para completar o dia ${nextDay} de 9 • ${novenaTitle}`,
                ctaLabel: "Rezar Agora",
                slug: run.novenas?.slug,
                note: `Se você já fez a Novena hoje, pode ignorar este e-mail. 🙏`,
            });

            // Special Message for Day 5 (Halfway)
            if (nextDay === 5) {
                subject = `⛰️ Você já chegou na metade da ${novenaTitle}!`;

                html = reminderEmail({
                    preheader: `Força! Você chegou no dia 5 de 9 — continue firme na ${novenaTitle}.`,
                    icon: "⛰️",
                    heading: "Você está na metade do caminho!",
                    intro: `<strong>Dia 5 de 9.</strong> A jornada é árdua, mas a recompensa é muito maior.`,
                    highlight: `Metade concluída • ${novenaTitle}`,
                    ctaLabel: "Continuar Jornada",
                    slug: run.novenas?.slug,
                    note: `Se você já fez a ${novenaTitle} hoje, pode ignorar este e-mail. 🙏`,
                });
            }

            console.log(`Sending email to ${userEmail} for day ${nextDay}`);

            await transporter.sendMail({
                from: `Gratianovem <${smtpUser}>`,
                to: userEmail,
                subject,
                html,
            });

            // Update last_reminder_sent_at
            await supabase
                .from("user_novena_runs")
                .update({ last_reminder_sent_at: new Date().toISOString() })
                .eq("id", run.id);

            emailsSent++;
        }

        return new Response(JSON.stringify({ success: true, emailsSent }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error processing reminders:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
