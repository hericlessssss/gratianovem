-- Diagnostics for Novena Lifecycle Emails

-- 1. Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 2. Check if the trigger exists
SELECT event_object_table as table_name, trigger_name 
FROM information_schema.triggers 
WHERE trigger_name IN ('on_novena_start', 'on_novena_finish');

-- 3. Check recent outgoing http requests (Last 5)
-- This tells us if the database TRIED to send the request
SELECT * 
FROM net.http_request_queue 
ORDER BY id DESC 
LIMIT 5;

-- 4. Check http responses (Success/Failures of the network call)
-- Look for 'error_msg' or non-200 status codes
SELECT id, status_code, content_type, error_msg, created 
-- Note: Table name might vary slightly in older pg_net, usually net.http_response or net._http_response
FROM net._http_response 
ORDER BY id DESC 
LIMIT 5;

-- 5. Test Manual Call (Isolate Network vs Trigger)
-- This sends a FAKE Start payload to see if the function actually works when called directly
SELECT
  net.http_post(
    url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/novena-lifecycle',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_-GE0QD5KBbyWNCP3I1iloQ_RD0yoyP8"}'::jsonb,
    body:='{
        "type": "INSERT",
        "table": "user_novena_runs",
        "record": {
            "id": "00000000-0000-0000-0000-000000000000",
            "status": "in_progress"
        }
    }'::jsonb
  ) as request_id;
