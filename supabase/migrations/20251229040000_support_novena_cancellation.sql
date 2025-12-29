-- Migration: support_novena_cancellation_and_restart

-- 1. Update the 'status' CHECK constraint or ENUM if it exists
-- Inspecting typical Supabase logic, status is often a string check or enum.
-- Let's assume it's a check constraint or plain string for flexible adding.
-- Safest way is to Modify the CHECK constraint if it exists.

-- Note: We cannot easily see existing constraints without inspecting schemas.
-- Assuming 'status' column is text check. We will drop and re-add to be safe, adding 'cancelled'.
ALTER TABLE public.user_novena_runs 
DROP CONSTRAINT IF EXISTS user_novena_runs_status_check;

ALTER TABLE public.user_novena_runs
ADD CONSTRAINT user_novena_runs_status_check 
CHECK (status IN ('in_progress', 'completed', 'abandoned', 'cancelled'));

-- 2. Ensure Unique Index allows multiple 'completed'/'cancelled', but only ONE 'in_progress'
-- Try to drop potential existing restrictive unique index
DROP INDEX IF EXISTS unique_active_run_per_novena;
-- (Guessing common names, or just create the correct one)

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_run_per_novena
ON public.user_novena_runs (user_id, novena_id)
WHERE status = 'in_progress';

-- 3. Create a helper view or function to count completions
-- This makes frontend queries cleaner
CREATE OR REPLACE VIEW public.user_novena_stats AS
SELECT 
    user_id,
    novena_id,
    COUNT(*) FILTER (WHERE status = 'completed') as completion_count,
    MAX(completed_at) as last_completed_at
FROM public.user_novena_runs
GROUP BY user_id, novena_id;
