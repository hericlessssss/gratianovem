-- Force processing of reminders immediately
-- This bypasses the "last_reminder_sent_at" check and "completedToday" check because force=true.
SELECT
  net.http_post(
    url:='https://twulftkpyobizcmtudww.supabase.co/functions/v1/process-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_-GE0QD5KBbyWNCP3I1iloQ_RD0yoyP8"}'::jsonb,
    body:='{"force": true}'::jsonb
  ) as request_id;
