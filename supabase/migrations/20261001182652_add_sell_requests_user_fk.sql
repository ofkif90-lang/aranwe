-- Add missing foreign key on sell_requests.user_id → profiles.id
-- This fixes the admin sell-requests query that uses: profiles!sell_requests_user_id_fkey(*)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sell_requests_user_id_fkey'
      AND table_name = 'sell_requests'
  ) THEN
    ALTER TABLE public.sell_requests
      ADD CONSTRAINT sell_requests_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;