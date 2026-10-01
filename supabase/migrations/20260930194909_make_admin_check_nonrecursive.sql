/*
# Make administrator authorization non-recursive

## Problem
The SQL administrator helper could be expanded while PostgreSQL evaluated
row policies. That caused the original `profiles` policy recursion error to
appear again during property saves.

## Security changes
- Recreate `public.is_admin()` as a PL/pgSQL SECURITY DEFINER function so it
  executes as a separate protected function call.
- Keep the fixed `public` search path and active-admin check.
- Keep execution denied to anonymous users and allowed only for authenticated
  users.
- No application data is changed.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  ) INTO caller_is_admin;

  RETURN caller_is_admin;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
