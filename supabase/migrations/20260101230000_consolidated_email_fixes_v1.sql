-- Migration: consolidated_email_fixes_v1
-- Description: Consolidates all email system fixes: lifecycle function, progress triggers, and generic daily reminder at 19:57 BRT.

-- 1. Lifecycle Function (handle_novena_lifecycle_event)
CREATE OR REPLACE FUNCTION public.handle_novena_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Hardcoded Project URL (Matches your project: twulftkpyobizcmtudww)
  project_url text := 'https://twulftkpyobizcmtudww.supabase.co'; 
  function_name text := 'novena-lifecycle';
  payload jsonb;
  request_id bigint;
BEGIN
  -- Construct Payload
  payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  -- Call Edge Function
  -- We use a dummy Authorization header because we are deploying with --no-verify-jwt
  SELECT
    net.http_post(
      url := project_url || '/functions/v1/' || function_name,
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer NO_VERIFY"}'::jsonb, 
      body := payload
    ) INTO request_id;

  RETURN NEW;
END;
$$;

-- 2. Triggers for Run Lifecycle (Start/Finish)
DROP TRIGGER IF EXISTS on_novena_start ON public.user_novena_runs;
CREATE TRIGGER on_novena_start
  AFTER INSERT ON public.user_novena_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();

DROP TRIGGER IF EXISTS on_novena_finish ON public.user_novena_runs;
CREATE TRIGGER on_novena_finish
  AFTER UPDATE ON public.user_novena_runs
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();

-- 3. Triggers for Day Progress Lifecycle (Halfway/Daily Completion)
DROP TRIGGER IF EXISTS on_day_completed ON public.user_day_progress;
DROP TRIGGER IF EXISTS on_day_completed_update ON public.user_day_progress;

CREATE TRIGGER on_day_completed_update
  AFTER UPDATE ON public.user_day_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true AND OLD.is_completed = false)
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();

DROP TRIGGER IF EXISTS on_day_completed_insert ON public.user_day_progress;
CREATE TRIGGER on_day_completed_insert
  AFTER INSERT ON public.user_day_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();

-- 4. Generic Daily Reminder Cron Job (19:57 BRT)
-- First unschedule carefully all previous attempts
DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-20h-brt');
    PERFORM cron.unschedule('reminders-daily-19h42-brt');
    PERFORM cron.unschedule('reminders-daily-19h50-brt');
    PERFORM cron.unschedule('reminders-daily-19h51-brt');
    PERFORM cron.unschedule('reminders-daily-19h57-brt');
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
