-- Migration: schedule_generic_reminder_1957
-- Description: Updates the cron job schedule to 19:57 BRT (22:57 UTC).

-- First unschedule carefully all previous attempts
DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-19h51-brt');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-19h50-brt');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule new job (22:57 UTC = 19:57 Brasilia Standard Time)
SELECT cron.schedule(
    'reminders-daily-19h57-brt',
    '57 22 * * *',
    $$
    select
      net.http_post(
        url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer NO_VERIFY"}'::jsonb,
        body:='{"force": false}'::jsonb
      ) as request_id;
    $$
);
