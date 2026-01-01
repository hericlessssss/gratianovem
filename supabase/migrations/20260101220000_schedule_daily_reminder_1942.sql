-- Migration: schedule_daily_reminder_1942
-- Description: Updates the cron job schedule to 19:42 BRT (22:42 UTC).

-- First unschedule carefully
DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-20h-brt');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule new job (22:42 UTC = 19:42 Brasilia Standard Time)
-- NOTE: If DST is active, this might shift, but currently Brazil doesn't use DST.
SELECT cron.schedule(
    'reminders-daily-19h42-brt',
    '42 22 * * *',
    $$
    select
      net.http_post(
        url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer NO_VERIFY"}'::jsonb,
        body:='{"force": false}'::jsonb
      ) as request_id;
    $$
);
