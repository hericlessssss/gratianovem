-- Enforce email_notifications to always be true for all users
-- Create a migration to update existing records and set default

-- 1. Update all existing profiles to have email_notifications = true
UPDATE public.profiles
SET email_notifications = true;

-- 2. Alter the table to set the default value to true (if not already)
ALTER TABLE public.profiles
ALTER COLUMN email_notifications SET DEFAULT true;

-- 3. (Optional) Check constraint to prevent it from being set to false?
-- The user said "remove the option... and make it so it is always activated".
-- Adding a constraint ensures it stays true even if API tries to update it.
-- But let's stick to default for now to avoid breaking existing update logic if it sends false.
-- Ideally we updated the frontend so it won't send false anymore.

