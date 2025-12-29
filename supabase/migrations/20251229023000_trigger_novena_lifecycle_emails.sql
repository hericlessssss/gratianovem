-- Migration: trigger_novena_lifecycle_emails

-- 1. Create the hook function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.handle_novena_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url text := 'https://twulftkpyobizcmtudww.supabase.co'; -- Add to env if dynamic, but usually static in migrations
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

  -- Call Edge Function using pg_net
  -- Note: We use the service role key usually, but for triggers calling public functions we rely on the function handling auth or verifying source.
  -- Better: Pass a service_role key header if possible, or assume anon if function is open. 
  -- However, net.http_post is async.
  
  -- We'll pass the ANON key or SERVICE key if we can get it from secrets, but in triggers it's hard to access secrets directly safely.
  -- For now we assume the FUNCTION is protected and checks for a specific header or is deployed with 'no-verify-jwt' and we trust the source IP (which is internal Supabase).
  -- OR we just send it. Let's send with Authorization header for integrity.
  
  -- Ideally we'd use `vault` or `pgsodium` but let's keep it simple: Call with basic structure. 
  -- The Edge Function `novena-lifecycle` should probably verify it's coming from a trigger, 
  -- but Supabase Database Webhooks usually just POST.

  SELECT
    net.http_post(
      url := project_url || '/functions/v1/' || function_name,
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_-GE0QD5KBbyWNCP3I1iloQ_RD0yoyP8"}'::jsonb, 
      body := payload
    ) INTO request_id;

  RETURN NEW;
END;
$$;

-- 2. Create Trigger for Start (INSERT)
DROP TRIGGER IF EXISTS on_novena_start ON public.user_novena_runs;
CREATE TRIGGER on_novena_start
  AFTER INSERT ON public.user_novena_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();

-- 3. Create Trigger for Finish (UPDATE)
DROP TRIGGER IF EXISTS on_novena_finish ON public.user_novena_runs;
CREATE TRIGGER on_novena_finish
  AFTER UPDATE ON public.user_novena_runs
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();
