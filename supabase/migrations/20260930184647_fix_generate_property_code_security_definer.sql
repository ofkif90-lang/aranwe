/*
# Fix generate_property_code RPC to be callable by authenticated users

## Problem
The function `generate_property_code()` was NOT `SECURITY DEFINER`, so when an
authenticated (non-admin) user called it via `supabase.rpc()`, RLS on the
`properties` table restricted the SELECT inside the function to only that
user's own rows — returning a wrong count and potentially failing.

## Fix
- Recreate the function as `SECURITY DEFINER` so it runs with the owner's
  privileges and bypasses RLS on `properties`.
- Re-grant EXECUTE to `authenticated` so non-admin users can call it.

## Notes
- No data is changed.
- The function logic is identical — only the security context changes.
*/

DROP FUNCTION IF EXISTS public.generate_property_code();

CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_num integer;
  code text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(property_code FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM public.properties
  WHERE property_code ~ '^ARA-[0-9]{5}$';

  code := 'ARA-' || lpad(next_num::text, 5, '0');
  RETURN code;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.generate_property_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_property_code() TO anon;
