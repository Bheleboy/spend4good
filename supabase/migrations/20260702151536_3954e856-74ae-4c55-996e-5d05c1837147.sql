
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule if already exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-deadline-reminder-daily') THEN
    PERFORM cron.unschedule('send-deadline-reminder-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'send-deadline-reminder-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wyduakldroqavjaplodc.supabase.co/functions/v1/send-deadline-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHVha2xkcm9xYXZqYXBsb2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTE5NTEsImV4cCI6MjA5ODU2Nzk1MX0.48-Jn-SdMt85RHwbLFta10CcgITzP2L0MsxYpFWelRE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
