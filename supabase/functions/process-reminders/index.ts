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

        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

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

            // Select Template
            let subject = `✨ Não esqueça da sua oração hoje: ${novenaTitle}`;
            let html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Olá, ${userName}</h2>
          <p>A noite está chegando ao fim, mas ainda há tempo para um momento de paz.</p>
          <p>Falta pouco para completar o <strong>dia ${nextDay}</strong> da sua novena <strong>${novenaTitle}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gratianovem.com.br/novena/${run.novenas?.slug}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Rezar Agora
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Se você já rezou, pode ignorar este email.</p>
        </div>
      `;

            // Special Message for Day 5 (Halfway)
            if (nextDay === 5) {
                subject = `⛰️ Você já chegou na metade da novena ${novenaTitle}!`;
                html = `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D4AF37;">Força, ${userName}!</h2>
            <p><strong>Dia 5 de 9.</strong> A jornada é árdua, mas a recompensa é muito maior.</p>
            <p>Você já percorreu metade do caminho. Continue firme em seu propósito.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://gratianovem.com.br/novena/${run.novenas?.slug}" style="background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Continuar Jornada
              </a>
            </div>
          </div>
        `;
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
