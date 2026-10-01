/*
# Allow users to view their own inquiries

## Problem
The inquiries table only had a SELECT policy for admins. Regular users
could create inquiries but could never see them again.

## Fix
Add a SELECT policy allowing each authenticated user to view their own
inquiries (where user_id matches auth.uid()).
*/

CREATE POLICY "inquiries_select_own"
  ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
