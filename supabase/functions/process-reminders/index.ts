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

        // Calculate "Today" as start of day in BRT (UTC-3)
        // 00:00 BRT = 03:00 UTC.
        // This ensures that if a user prayed at 02:00 UTC (23:00 BRT yesterday), it doesn't count as today.
        const todayStart = new Date();
        todayStart.setUTCHours(3, 0, 0, 0);

        // 1. Get all active runs
        const { data: runs, error } = await supabase
            .from("user_novena_runs")
            .select(`
                id,
                user_id,
                last_reminder_sent_at,
                profiles!inner (email, display_name, email_notifications),
                status
            `)
            .eq("status", "in_progress");

        if (error) throw error;

        console.log(`Found ${runs.length} active runs. Processing generic reminders...`);

        // 2. Group by User to avoid spamming
        // We only want to send ONE email per user, even if they have 5 novenas.
        const usersToRemind = new Map<string, {
            email: string;
            name: string;
            runIds: string[];
        }>();

        for (const run of runs as any) {
            // Check if reminder was already sent "Today" (BRT) for this run
            if (run.last_reminder_sent_at) {
                const lastSent = new Date(run.last_reminder_sent_at);
                if (lastSent >= todayStart) {
                    continue; // Already processed today
                }
            }

            const email = run.profiles?.email;
            const name = run.profiles?.display_name || "Peregrino";

            if (!email) continue;
            if (run.profiles?.email_notifications === false) continue;

            if (!usersToRemind.has(email)) {
                usersToRemind.set(email, {
                    email,
                    name,
                    runIds: [],
                });
            }

            usersToRemind.get(email)!.runIds.push(run.id);
        }

        console.log(`Sending emails to ${usersToRemind.size} unique users.`);

        // 3. Send Generic Motivational Email
        const results = [];
        let emailsSent = 0;

        // Helper Template Function
        function reminderEmail({ preheader, icon, heading, intro, highlight, ctaLabel, slug, note }: any) {
            const GOLD = "#D4AF37";
            const BG = "#f6f5f2";
            const BORDER = "#e7e5e4";
            const TEXT = "#2b2b2b";

            // ... Styles ...
            const pageWrap = `margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${TEXT};`;
            const cardStyle = `max-width:600px;width:100%;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;box-shadow:0 14px 34px rgba(17,24,39,.10);`;
            const headerStyle = `padding:26px 28px 18px 28px;background:linear-gradient(135deg, rgba(212,175,55,.18), rgba(255,255,255,1));border-bottom:1px solid ${BORDER};`;
            const brandStyle = `font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8b6b00;font-weight:800;`;
            const titleStyle = `margin:10px 0 0 0;font-size:22px;line-height:1.25;font-weight:900;color:#111827;`;
            const bodyStyle = `padding:18px 28px 8px 28px;`;
            const pStyle = `margin:10px 0;font-size:15px;line-height:1.75;color:${TEXT};`;
            const btnStyle = `background-color:${GOLD};color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:800;display:inline-block;box-shadow:0 10px 18px rgba(212,175,55,.22);`;
            const pillStyle = `display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800;color:#8b6b00;background:rgba(212,175,55,.14);border:1px solid rgba(212,175,55,.25);`;
            const smallStyle = `margin:12px 0 0 0;font-size:12px;line-height:1.6;color:#9ca3af;`;

            return `
             <!doctype html>
             <html lang="pt-BR">
             <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Gratia Novem</title></head>
             <body style="${pageWrap}">
                 <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG}; padding:24px 0;">
                 <tr><td align="center" style="padding:0 14px;">
                     <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="${cardStyle}">
                         <tr><td style="${headerStyle}">
                             <div style="${brandStyle}">Gratia Novem</div>
                             <div style="${titleStyle}">${heading}</div>
                             <div style="margin-top:10px; text-align:center; font-size:38px;">${icon}</div>
                         </td></tr>
                         <tr><td style="${bodyStyle}">
                             <p style="${pStyle}">${intro}</p>
                             <div style="margin:14px 0 6px 0; text-align:left;"><span style="${pillStyle}">${highlight}</span></div>
                             <div style="text-align:center; margin:28px 0 10px 0;">
                                 <a href="https://gratianovem.com.br/novenas" style="${btnStyle}" target="_blank" rel="noopener">${ctaLabel}</a>
                             </div>
                             <p style="${smallStyle}">${note}</p>
                         </td></tr>
                         <tr><td style="padding:16px 28px; background:#fafafa; border-top:1px solid ${BORDER}; font-size:12px; line-height:1.6; color:#9ca3af;">
                             Você recebeu este lembrete porque está em uma jornada no Gratia Novem.<br /><span style="color:#b6b6b6;">© Gratia Novem • gratianovem.com.br</span>
                         </td></tr>
                     </table>
                 </td></tr></table>
             </body></html>`;
        }

        for (const [email, user] of usersToRemind) {
            try {
                // Determine a creative subject
                const subjects = [
                    "🙏 Não pare agora: sua oração está sendo ouvida",
                    "🕯️ Um convite para estar com Deus hoje",
                    "✨ A perseverança é a chave da graça",
                    "🕊️ Continue firme na sua Novena",
                    "🙌 Deus se agrada de quem persiste",
                ];
                // Pick random subject
                const subject = subjects[Math.floor(Math.random() * subjects.length)];

                // Generic Motivational Content
                const html = reminderEmail({
                    preheader: `Sua jornada espiritual continua. Não deixe de rezar hoje.`,
                    icon: "🕯️",
                    heading: `Sua jornada continua, ${user.name}.`,
                    intro: `<strong>Deus não olha para o tempo, mas para o amor com que rezamos.</strong><br/>Continue firme na sua caminhada de fé. Cada dia é um passo mais perto da graça.`,
                    highlight: "Continue suas Novenas",
                    ctaLabel: "Ver Minhas Novenas",
                    slug: "",
                    note: `Se você já rezou hoje, que Deus abençoe sua fidelidade. Se ainda não, Ele te espera.`,
                });

                console.log(`Sending generic reminder to ${email}`);

                await transporter.sendMail({
                    from: `"Gratia Novem" <${smtpUser}>`,
                    to: email,
                    subject: subject,
                    html: html,
                });

                // 4. Update last_reminder_sent_at for ALL runs of this user
                if (user.runIds.length > 0) {
                    await supabase
                        .from("user_novena_runs")
                        .update({ last_reminder_sent_at: new Date().toISOString() })
                        .in("id", user.runIds);
                }

                results.push({ email, status: "sent" });
                emailsSent++;

            } catch (err) {
                console.error(`Failed to send to ${email}:`, err);
                results.push({ email, status: "error", error: err });
            }
        }

        return new Response(JSON.stringify({ success: true, emailsSent, results }), {
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
