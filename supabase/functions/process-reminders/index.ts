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

        // Explicitly configure for Gmail
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        // Verify connection configuration
        try {
            await transporter.verify();
            console.log('Server is ready to take our messages');
        } catch (error) {
            console.error('SMTP Connection Error:', error);
            throw error;
        }

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

        // 3. Send Emails with Randomized Content
        const results = [];
        let emailsSent = 0;

        // --- NEW TEMPLATE DESIGN (Dark/Gold) ---
        interface EmailVariant {
            subject: string;
            heading: string;
            lead: string;
            body: string;
            quote: string;
        }

        const emailVariants: EmailVariant[] = [
            {
                subject: "Sua novena te espera 🙏",
                heading: "Um momento de paz",
                lead: "O mundo corre, mas a oração nos acalma.",
                body: "Reserve 5 minutos do seu dia para se reconectar com o sagrado. Sua novena está à sua espera.",
                quote: "“A oração é o respiro da alma.” — Santo Agostinho"
            },
            {
                subject: "Não desista agora ✨",
                heading: "A graça da perseverança",
                lead: "Cada dia rezado é uma vitória espiritual.",
                body: "Sabemos que a rotina é pesada, mas a constância traz frutos que duram para sempre. Continue firme!",
                quote: "“Quem a Deus tem, nada lhe falta.” — Santa Teresa d’Ávila"
            },
            {
                subject: "Um convite especial para você 🕊️",
                heading: "Deus tem um encontro com você",
                lead: "Ele espera por este momento o dia todo.",
                body: "Não deixe para depois o que pode transformar seu dia agora. Sua novena é um canal de graça.",
                quote: "“Fizeste-nos para Ti, e inquieto está o nosso coração enquanto não repousa em Ti.”"
            },
            {
                subject: "Sua jornada continua 🕯️",
                heading: "Passo a passo",
                lead: "A fé se constrói no dia a dia.",
                body: "Você já caminhou até aqui. Dê mais um passo hoje na sua jornada de oração.",
                quote: "“Comece fazendo o que é necessário, depois o que é possível, e de repente você estará fazendo o impossível.” — São Francisco"
            },
            {
                subject: "Precisando de força? 💪",
                heading: "O auxílio vem do Alto",
                lead: "Nas dificuldades, a oração é nosso escudo.",
                body: "Entregue suas preocupações de hoje na sua novena. Deixe que Deus cuide do resto.",
                quote: "“Tudo posso naquele que me fortalece.” — Filipenses 4:13"
            },
            {
                subject: "A intercessão dos santos 🌹",
                heading: "Você não está só",
                lead: "Os santos rezam conosco e por nós.",
                body: "Peça a intercessão do santo da sua novena hoje. O céu está atento à sua voz.",
                quote: "“Sede alegres na esperança, pacientes na tribulação, perseverantes na oração.”"
            },
            {
                subject: "Foco no que importa ✝️",
                heading: "Priorize sua alma",
                lead: "Muitas coisas nos distraem, mas só uma é necessária.",
                body: "Deixe o celular de lado por alguns minutos e volte seu coração para o que é eterno.",
                quote: "“Buscai primeiro o Reino de Deus, e tudo o mais vos será acrescentado.”"
            },
            {
                subject: "Seu progresso espiritual 📈",
                heading: "Cada Ave-Maria conta",
                lead: "Nenhuma oração volta vazia.",
                body: "Mesmo que pareça pouco, sua fidelidade diária está construindo um tesouro no céu. Vamos rezar?",
                quote: "“Rezar é amar e amar é servir.” — Santa Madre Teresa"
            },
            {
                subject: "Vamos rezar juntos? 🤝",
                heading: "Comunidade de fé",
                lead: "Milhares de pessoas estão rezando neste momento.",
                body: "Una sua voz a essa corrente de oração. Sua participação fortalece a todos nós.",
                quote: "“Onde dois ou três estiverem reunidos em meu nome, eu estou no meio deles.”"
            },
            {
                subject: "Lembrete de fé 🔔",
                heading: "Não quebre o ciclo",
                lead: "A constância é a chave dos milagres.",
                body: "Você assumiu este compromisso com sua fé. Mantenha a chama acesa hoje.",
                quote: "“Sê fiel até a morte, e dar-te-ei a coroa da vida.” — Apocalipse 2:10"
            }
        ];

        function renderEmail(user: any, variant: EmailVariant) {
            // Colors
            const BG = "#0f172a"; // Deep Blue Background (Tailwind slate-900 like)
            const CARD = "#ffffff";
            const TEXT = "#334155"; // Slate-700
            const GOLD = "#d4af37";
            const GOLD_LIGHT = "rgba(212, 175, 55, 0.1)";

            return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: ${BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 40px 15px;">
                            <!-- Main Card -->
                            <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: ${CARD}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                
                                <!-- Header Icon -->
                                <tr>
                                    <td align="center" style="padding: 40px 0 20px 0;">
                                        <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${GOLD_LIGHT}; display: flex; align-items: center; justify-content: center;">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2V22" />
                                                <path d="M7 8H17" />
                                            </svg>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Title -->
                                <tr>
                                    <td align="center" style="padding: 0 40px;">
                                        <h1 style="margin: 0; color: ${GOLD}; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Gratia Novem</h1>
                                        <h2 style="margin: 10px 0 0 0; color: #1e293b; font-size: 24px; font-weight: 700;">${variant.heading}</h2>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td align="center" style="padding: 20px 40px;">
                                        <p style="margin: 0 0 16px 0; color: ${TEXT}; font-size: 16px; line-height: 1.6;">
                                            Olá, <strong>${user.name}</strong>. ${variant.lead}
                                        </p>
                                        <p style="margin: 0; color: ${TEXT}; font-size: 16px; line-height: 1.6;">
                                            ${variant.body}
                                        </p>
                                    </td>
                                </tr>

                                <!-- CTA Button -->
                                <tr>
                                    <td align="center" style="padding: 10px 40px 30px 40px;">
                                        <a href="https://gratianovem.com.br/novenas" style="display: inline-block; background-color: ${GOLD}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: opacity 0.2s;">
                                            Rezar Agora
                                        </a>
                                    </td>
                                </tr>

                                <!-- Quote Box -->
                                <tr>
                                    <td align="center" style="padding: 0 40px 40px 40px;">
                                        <div style="background-color: #f8fafc; border-left: 3px solid ${GOLD}; padding: 16px; text-align: left; border-radius: 4px;">
                                            <p style="margin: 0; color: #64748b; font-style: italic; font-size: 14px; line-height: 1.5;">
                                                ${variant.quote}
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f1f5f9; padding: 20px; text-align: center;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                            Você está recebendo este e-mail porque iniciou uma novena no Gratia Novem.
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

        for (const [email, user] of usersToRemind) {
            try {
                // Select Random Variant
                const variant = emailVariants[Math.floor(Math.random() * emailVariants.length)];

                const html = renderEmail(user, variant);

                console.log(`Sending reminder to ${email} with subject: ${variant.subject}`);

                await transporter.sendMail({
                    from: `"Gratia Novem" <${smtpUser}>`,
                    to: email,
                    subject: variant.subject,
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
