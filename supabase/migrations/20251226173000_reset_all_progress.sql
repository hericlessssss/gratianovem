-- DANGER: This migration deletes ALL user progress history.
-- It is intended to reset the application to a blank state as requested.

BEGIN;

-- 1. Delete all day progress records (Child table)
DELETE FROM user_day_progress;

-- 2. Delete all novena runs (Parent table)
DELETE FROM user_novena_runs;

COMMIT;
