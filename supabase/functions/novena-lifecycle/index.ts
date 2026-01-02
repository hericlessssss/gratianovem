import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
    type: "INSERT" | "UPDATE";
    table: string;
    record: {
        id: string;
        user_id?: string;       // Present in runs
        novena_id?: string;     // Present in runs
        run_id?: string;        // Present in progress
        status?: string;        // Present in runs
        day_number?: number;    // Present in progress
        is_completed?: boolean; // Present in progress
        started_at?: string;
        completed_at?: string;
    };
    schema: string;
    old_record?: {
        status?: string;
        is_completed?: boolean;
    };
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: WebhookPayload = await req.json();
        const { record, type, old_record, table } = payload;

        console.log(`Received webhook: ${type} on ${table} for id ${record.id}`);

        // 1. Identify Event Type
        let eventType: "START" | "FINISH" | "HALFWAY" | null = null;

        if (table === 'user_novena_runs') {
            if (type === "INSERT" && record.status === "in_progress") {
                eventType = "START";
            } else if (type === "UPDATE" && record.status === "completed" && old_record?.status !== "completed") {
                eventType = "FINISH";
            }
        } else if (table === 'user_day_progress') {
            // Check for Halfway Mark (Day 5 Completed)
            if (type === "UPDATE" && record.is_completed && !old_record?.is_completed && record.day_number === 5) {
                eventType = "HALFWAY";
            }
        }

        if (!eventType) {
            console.log("Not a relevant lifecycle event. Skipping.");
            return new Response(JSON.stringify({ message: "Skipped" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Setup Supabase & SMTP
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");

        if (!smtpUser || !smtpPass) {
            throw new Error("SMTP credentials not configured.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Fetch Data (User Profile & Novena Info)
        // If event is regarding a Run, record.id is run_id
        // If event is regarding Progress, record.run_id is run_id
        const runId = record.run_id || record.id;

        const { data: runData, error: runError } = await supabase
            .from("user_novena_runs")
            .select(`
                *,
                profiles (display_name, email, email_notifications),
                novenas (title, slug)
            `)
            .eq("id", runId)
            .single();

        if (runError || !runData) {
            throw new Error(`Failed to fetch run data: ${runError?.message}`);
        }

        const userEmail = runData.profiles?.email;
        const userName = runData.profiles?.display_name || "Peregrino";
        const emailEnabled = runData.profiles?.email_notifications;
        const novenaTitle = runData.novenas?.title;
        const novenaSlug = runData.novenas?.slug;

        if (!userEmail) {
            console.log("No user email found. Skipping.");
            return new Response(JSON.stringify({ message: "No email" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Strict check: if user explicitly disabled notifications (though we enforce true now), respect it if desired.
        if (emailEnabled === false) {
            console.log("User has disabled email notifications. Skipping.");
            return new Response(JSON.stringify({ message: "Notifications disabled" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 4. Prepare Email Content
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
        });

        let subject = "";
        let html = "";

        // Paleta / Identidade (mantendo o dourado e o botão)
        // 5. Helper: New Dark/Gold Template
        interface RenderEmailParams {
            preheader: string;
            icon: string;
            heading: string;
            lead: string;
            paragraphs: string[];
            ctaHref: string;
            ctaLabel: string;
            quoteHtml?: string;
        }

        function renderEmail({ preheader, icon, heading, lead, paragraphs, ctaHref, ctaLabel, quoteHtml }: RenderEmailParams) {
            // Colors
            const BG = "#0f172a"; // Deep Blue
            const CARD = "#ffffff";
            const TEXT = "#334155";
            const GOLD = "#d4af37";
            const GOLD_LIGHT = "rgba(212, 175, 55, 0.1)";

            return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Gratia Novem</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: ${BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 40px 15px;">
                            <!-- Main Card -->
                            <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: ${CARD}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                
                                <!-- Header Icon -->
                                <tr>
                                    <td align="center" style="padding: 40px 0 20px 0;">
                                        <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${GOLD_LIGHT}; display: flex; align-items: center; justify-content: center; line-height: 48px; font-size: 24px;">
                                            ${icon}
                                        </div>
                                    </td>
                                </tr>

                                <!-- Title -->
                                <tr>
                                    <td align="center" style="padding: 0 40px;">
                                        <h1 style="margin: 0; color: ${GOLD}; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Gratia Novem</h1>
                                        <h2 style="margin: 10px 0 0 0; color: #1e293b; font-size: 24px; font-weight: 700;">${heading}</h2>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td align="center" style="padding: 20px 40px;">
                                        <p style="margin: 0 0 16px 0; color: ${TEXT}; font-size: 16px; line-height: 1.6;">
                                            ${lead}
                                        </p>
                                        ${paragraphs.map(p => `
                                        <p style="margin: 0 0 16px 0; color: ${TEXT}; font-size: 16px; line-height: 1.6;">
                                            ${p}
                                        </p>`).join('')}
                                    </td>
                                </tr>

                                <!-- CTA Button -->
                                <tr>
                                    <td align="center" style="padding: 10px 40px 30px 40px;">
                                        <a href="${ctaHref}" style="display: inline-block; background-color: ${GOLD}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: opacity 0.2s;">
                                            ${ctaLabel}
                                        </a>
                                    </td>
                                </tr>

                                <!-- Quote Box -->
                                ${quoteHtml ? `
                                <tr>
                                    <td align="center" style="padding: 0 40px 40px 40px;">
                                        <div style="background-color: #f8fafc; border-left: 3px solid ${GOLD}; padding: 16px; text-align: left; border-radius: 4px;">
                                            <p style="margin: 0; color: #64748b; font-style: italic; font-size: 14px; line-height: 1.5;">
                                                ${quoteHtml}
                                            </p>
                                        </div>
                                    </td>
                                </tr>` : ''}

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f1f5f9; padding: 20px; text-align: center;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                            Você recebeu este e-mail porque iniciou uma jornada no Gratia Novem.
                                        </p>
                                        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">
                                            © ${new Date().getFullYear()} Gratia Novem
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Unsubscribe / Brand -->
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding-top: 20px;">
                                        <p style="margin: 0; color: #475569; font-size: 12px;">
                                            Gratia Novem • Oração e Perseverança
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `;
        }

        if (eventType === "START") {
            subject = `✨ Início de Jornada: ${novenaTitle}`;

            html = renderEmail({
                preheader: `Seu 1º dia na ${novenaTitle} já começou — continue com a gente.`,
                icon: "🕯️",
                heading: `Sua jornada começou, ${userName}.`,
                lead: `Hoje você deu o primeiro passo na ${novenaTitle}.`,
                paragraphs: [
                    `Que este tempo de oração seja um refúgio de paz e um encontro profundo com a graça.`,
                    `Não se preocupe com o tempo — preocupe-se apenas com o amor colocado em cada dia.`,
                    `Nós estaremos aqui para te lembrar a cada passo do caminho.`,
                ],
                ctaHref: `https://gratianovem.com.br/novena/${novenaSlug}`,
                ctaLabel: "Ver Minha Novena",
                quoteHtml: `“Comece fazendo o que é necessário, depois o que é possível, e de repente você estará fazendo o impossível.”<br/><strong>— São Francisco de Assis</strong>`,
            });
        } else if (eventType === "HALFWAY") {
            subject = `⛰️ Você já chegou na metade da ${novenaTitle}!`;

            html = renderEmail({
                preheader: `Força! Você chegou no dia 5 de 9 — continue firme na ${novenaTitle}.`,
                icon: "⛰️",
                heading: "Você está na metade do caminho!",
                lead: `Parabéns, ${userName}. Você completou 5 dias da ${novenaTitle}.`,
                paragraphs: [
                    `A jornada é árdua, mas a recompensa é muito maior.`,
                    `Continue firme — a intercessão dos santos é poderosa e sua fé está sendo fortalecida a cada dia.`,
                ],
                ctaHref: `https://gratianovem.com.br/novena/${novenaSlug}`,
                ctaLabel: "Continuar Jornada",
                quoteHtml: `“Quem a Deus tem, nada lhe falta. Só Deus basta.”<br/><strong>— Santa Teresa de Ávila</strong>`,
            });
        } else {
            subject = `🎉 Graça Alcançada: ${novenaTitle} Completada!`;

            html = renderEmail({
                preheader: `Parabéns! Você concluiu a ${novenaTitle}. Veja seus progressos.`,
                icon: "🕊️",
                heading: `Parabéns, ${userName}!`,
                lead: `Você completou os 9 dias da ${novenaTitle}.`,
                paragraphs: [
                    `Sua perseverança é um testemunho de fé. Acreditamos que nenhuma oração volta vazia, e o céu certamente sorriu para sua dedicação.`,
                    `Continue firme — uma jornada termina para que outra possa começar.`,
                ],
                ctaHref: `https://gratianovem.com.br/meus-progressos`,
                ctaLabel: "Ver Meus Progressos",
                quoteHtml: `“Fizeste-nos para Ti, e inquieto está o nosso coração enquanto não repousa em Ti.”<br/><strong>— Santo Agostinho</strong>`,
            });
        }


        // 5. Send Email
        console.log(`Sending ${eventType} email to ${userEmail} for novena ${novenaTitle}`);
        await transporter.sendMail({
            from: `Gratianovem <${smtpUser}>`,
            to: userEmail,
            subject,
            html,
        });

        return new Response(JSON.stringify({ success: true, event: eventType }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        console.error("Error processing lifecycle email:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
