-- Update the cron job to run at 20h BRT (23h UTC)
-- Note: We are keeping the same command/key, so the user MUST disable JWT verification in the dashboard for 'process-reminders'.

SELECT cron.unschedule('reminders-daily-20h');

SELECT cron.schedule(
    'reminders-daily-20h-brt', -- New unique name
    '0 23 * * *',              -- 23h UTC = 20h Brasilia Time
    $$
    select
      net.http_post(
        url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_-GE0QD5KBbyWNCP3I1iloQ_RD0yoyP8"}'::jsonb,
        body:='{"force": false}'::jsonb
      ) as request_id;
    $$
);
