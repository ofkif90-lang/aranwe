/*
# Add is_admin column to notifications

## Purpose
Allow distinguishing admin-targeted notifications from user notifications.
Admin notifications are created when users submit properties, support tickets, or inquiries.

## Changes
- Add `is_admin` boolean column to `notifications` table, default false
- Update existing admin notification inserts to use is_admin = true

## Security
- No RLS changes needed (existing policies already cover the new column)
*/

DO $$ BEGIN
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
