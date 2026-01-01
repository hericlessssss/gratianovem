-- Migration: add_daily_progress_email_trigger
-- Description: Adds a trigger to user_day_progress to notify the lifecycle edge function when a day is completed.

-- 1. Create Trigger for Daily Progress (UPDATE)
DROP TRIGGER IF EXISTS on_day_completed ON public.user_day_progress;

-- We only fire this when a day is marked as completed (is_completed changes from false to true)
CREATE TRIGGER on_day_completed_update
  AFTER UPDATE ON public.user_day_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true AND OLD.is_completed = false)
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();

-- Also fire on INSERT if it's inserted as completed
DROP TRIGGER IF EXISTS on_day_completed_insert ON public.user_day_progress;
CREATE TRIGGER on_day_completed_insert
  AFTER INSERT ON public.user_day_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION public.handle_novena_lifecycle_event();
