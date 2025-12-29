-- Function to allow a user to delete their own account
-- This function deletes the user from auth.users, which should cascade to public tables

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public, auth, extensions
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the ID of the user calling the function
  current_user_id := auth.uid();

  -- Safety check: Ensure we have a user ID
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users
  -- If foreign keys are set up with ON DELETE CASCADE, this will remove
  -- profiles, user_novena_runs, testimonials, etc. automatically.
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
