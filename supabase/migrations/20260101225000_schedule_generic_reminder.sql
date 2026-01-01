-- Migration: schedule_generic_reminder_1950
-- Description: Updates the cron job schedule to 19:50 BRT (22:50 UTC).

-- First unschedule carefully all previous attempts
DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-20h-brt');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-19h42-brt');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule new job (22:50 UTC = 19:50 Brasilia Standard Time)
SELECT cron.schedule(
    'reminders-daily-19h51-brt',
    '51 22 * * *',
    $$
    select
      net.http_post(
        url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer NO_VERIFY"}'::jsonb,
        body:='{"force": false}'::jsonb
      ) as request_id;
    $$
);
