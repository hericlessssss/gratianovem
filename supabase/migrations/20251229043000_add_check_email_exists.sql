-- Function to check if an email already exists
-- This allows the frontend to validate unique emails during sign up
-- RETURNS true if email exists, false otherwise

CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin) to check auth.users or profiles
SET search_path = public, auth, extensions -- Secure search path
AS $$
BEGIN
  -- Check if email exists in profiles (which mirrors auth.users for active users)
  -- We check profiles because it's in public schema, but checking auth.users is more definitive
  -- Since this is SECURITY DEFINER, we can check auth.users directly if we want, 
  -- but usually checking profiles is safer logic if we rely on that sync.
  -- However, to be 100% sure about "Account already exists" for auth purposes, we check auth.users
  
  -- Check auth.users (requires SECURITY DEFINER)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = email_to_check) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO service_role;
