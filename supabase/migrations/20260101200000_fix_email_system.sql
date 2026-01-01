-- Migration: fix_email_system
-- Description: Re-creates triggers and cron jobs with correct URL and Headers for disabled JWT verification.

-- 1. Lifecycle Function (called by Triggers)
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

-- 2. Triggers
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


-- 3. Cron Job (Reminders)
-- First clean up old jobs safely
DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-20h');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('reminders-daily-20h-brt');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule new job (23h UTC = 20h Brasilia)
SELECT cron.schedule(
    'reminders-daily-20h-brt',
    '0 23 * * *',
    $$
    select
      net.http_post(
        url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer NO_VERIFY"}'::jsonb,
        body:='{"force": false}'::jsonb
      ) as request_id;
    $$
);
