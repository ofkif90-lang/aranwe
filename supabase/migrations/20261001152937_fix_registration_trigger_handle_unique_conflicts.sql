/*
# Fix registration: handle_new_user trigger fails on username/email conflicts

## Problem
The `handle_new_user` trigger inserts into `profiles` after a new auth.users row is created.
It uses `ON CONFLICT (id) DO NOTHING` which only handles primary key conflicts.
But `profiles` also has UNIQUE constraints on `username` and `email`.
If a new user picks a username that already exists in profiles, the trigger raises
a unique violation error, which rolls back the entire auth.users INSERT —
registration fails completely with no user-friendly error.

## Fix
1. Rewrite `handle_new_user` to handle username conflicts by appending a suffix.
2. Handle email conflicts gracefully (shouldn't happen since auth.users also checks email,
   but defensive coding).
3. Wrap the insert in an exception handler so trigger failure never blocks registration.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  final_username text;
  base_username text;
  suffix int := 0;
BEGIN
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8));
  final_username := base_username;

  -- Ensure username uniqueness by appending a numeric suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix::text;
  END LOOP;

  BEGIN
    INSERT INTO public.profiles (id, full_name, username, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      final_username,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    -- If email conflicts (shouldn't happen, but just in case), still don't block signup
    NULL;
  END;

  RETURN NEW;
END;
$$;
