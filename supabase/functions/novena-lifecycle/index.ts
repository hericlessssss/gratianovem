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
        user_id: string;
        novena_id: string;
        status: string;
        started_at: string;
        completed_at?: string;
    };
    schema: string;
    old_record?: {
        status: string;
    };
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: WebhookPayload = await req.json();
        const { record, type, old_record } = payload;

        console.log(`Received webhook: ${type} for run ${record.id}`);

        // 1. Identify Event Type
        let eventType: "START" | "FINISH" | null = null;

        if (type === "INSERT" && record.status === "in_progress") {
            eventType = "START";
        } else if (type === "UPDATE" && record.status === "completed" && old_record?.status !== "completed") {
            eventType = "FINISH";
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
        const { data: runData, error: runError } = await supabase
            .from("user_novena_runs")
            .select(`
                *,
                profiles (display_name, email),
                novenas (title, slug)
            `)
            .eq("id", record.id)
            .single();

        if (runError || !runData) {
            throw new Error(`Failed to fetch run data: ${runError?.message}`);
        }

        const userEmail = runData.profiles?.email;
        const userName = runData.profiles?.display_name || "Peregrino";
        const novenaTitle = runData.novenas?.title;
        const novenaSlug = runData.novenas?.slug;

        if (!userEmail) {
            console.log("No user email found. Skipping.");
            return new Response(JSON.stringify({ message: "No email" }), {
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
            logger: true,
            debug: true,
        });

        let subject = "";
        let html = "";

        // Paleta / Identidade (mantendo o dourado e o botão)
        const GOLD = "#D4AF37";
        const BG = "#f6f5f2";
        const CARD_BG = "#ffffff";
        const TEXT = "#2b2b2b";
        const MUTED = "#6b7280";
        const BORDER = "#e7e5e4";

        // Tipografia “clássica” + layout mais “premium”
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
        background:${CARD_BG};
        border:1px solid ${BORDER};
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 14px 34px rgba(17,24,39,.10);
        `;

        const headerStyle = `
        padding:28px 28px 18px 28px;
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
        margin:8px 0 0 0;
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

        const subtleStyle = `
        margin:10px 0 0 0;
        font-size:13px;
        line-height:1.6;
        color:${MUTED};
        `;

        const dividerStyle = `height:1px;background:${BORDER};margin:18px 0;`;

        const quoteBox = `
        margin:18px 0 8px 0;
        padding:14px 14px;
        background:rgba(212,175,55,.10);
        border:1px solid rgba(212,175,55,.25);
        border-radius:12px;
        font-size:13px;
        line-height:1.6;
        color:${MUTED};
        `;

        const footerStyle = `
        padding:16px 28px;
        background:#fafafa;
        border-top:1px solid ${BORDER};
        font-size:12px;
        line-height:1.6;
        color:#9ca3af;
        `;

        // Mantendo cores e “pegada” do botão (mesma base, só com sombra leve)
        const btnStyle = `
        background-color: ${GOLD};
        color: white;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        font-family: sans-serif;
        display: inline-block;
        box-shadow: 0 10px 18px rgba(212,175,55,.22);
        `;

        const h2Style = `color:${GOLD}; font-size:24px; margin:0; text-align:center; font-weight:900;`;


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

        // Helper: template base (table-friendly + preheader)
        function renderEmail({ preheader, icon, heading, lead, paragraphs, ctaHref, ctaLabel, quoteHtml }: RenderEmailParams) {
            return `
        <!doctype html>
        <html lang="pt-BR">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Gratia Novem</title>
        </head>
        <body style="${pageWrap}">
            <!-- Preheader (texto de preview) -->
            <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
            ${preheader}
            </span>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG}; padding:24px 0;">
            <tr>
                <td align="center" style="padding:0 14px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="${cardStyle}">
                    <!-- Header -->
                    <tr>
                    <td style="${headerStyle}">
                        <div style="${brandStyle}">Gratia Novem</div>
                        <div style="${titleStyle}">Uma mensagem para sua jornada</div>
                        <div style="margin-top:10px; text-align:center; font-size:40px;">${icon}</div>
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="${bodyStyle}">
                        <h2 style="${h2Style}">${heading}</h2>

                        <p style="${pStyle}">${lead}</p>

                        ${paragraphs
                    .map((t) => `<p style="${pStyle}">${t}</p>`)
                    .join("")}

                        <div style="${dividerStyle}"></div>

                        <div style="text-align:center; padding:6px 0 16px 0;">
                        <a href="${ctaHref}" style="${btnStyle}" target="_blank" rel="noopener">
                            ${ctaLabel}
                        </a>
                        </div>

                        ${quoteHtml ? `<div style="${quoteBox}">${quoteHtml}</div>` : ""}

                        <p style="${subtleStyle}">
                        Se você tiver qualquer dúvida, é só responder este e-mail — vamos te ajudar. 🙏
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td style="${footerStyle}">
                        Você recebeu este e-mail porque iniciou uma jornada no Gratia Novem.
                        <br/>
                        <span style="color:#b6b6b6;">© Gratia Novem • gratianovem.com.br</span>
                    </td>
                    </tr>
                </table>

                <div style="height:14px;"></div>
                <div style="max-width:600px; text-align:center; font-size:11px; color:#9ca3af; padding:0 8px;">
                    Dica: adicione nosso remetente aos contatos para garantir a entrega na caixa de entrada.
                </div>
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

    } catch (error: any) {
        console.error("Error processing lifecycle email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
