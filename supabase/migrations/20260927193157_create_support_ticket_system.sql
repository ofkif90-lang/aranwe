/*
# Support Ticket System

## Purpose
Creates a complete support ticket system for customer support — separate from property inquiries.
Users can submit tickets with attachments, admins can reply and manage status.

## New Tables

### support_tickets
- id (uuid PK)
- ticket_number (text, unique, e.g. "SUP-00001")
- user_id (uuid FK -> auth.users, nullable for anonymous submissions)
- name (text, not null)
- email (text, not null)
- phone (text)
- category (text: account_problem, website_problem, property_problem, payment_problem, technical_problem, complaint, suggestion, general_inquiry, other)
- subject (text, not null)
- description (text, not null)
- status (text: open, in_progress, waiting_user, resolved, closed — default: open)
- admin_notes (text, internal admin notes)
- created_at (timestamptz)
- updated_at (timestamptz)

### ticket_replies
- id (uuid PK)
- ticket_id (uuid FK -> support_tickets ON DELETE CASCADE)
- user_id (uuid FK -> auth.users, nullable)
- sender_type (text: user, admin)
- message (text, not null)
- created_at (timestamptz)

### ticket_attachments
- id (uuid PK)
- ticket_id (uuid FK -> support_tickets ON DELETE CASCADE)
- reply_id (uuid FK -> ticket_replies, nullable)
- file_url (text, not null — path in Supabase Storage)
- file_name (text, not null)
- file_type (text, not null — MIME type)
- file_size (bigint, not null — bytes)
- created_at (timestamptz)

## Security
- RLS enabled on all tables
- Users can read/update their own tickets (by user_id)
- Admins can read/update all tickets (via profile role check)
- Users can insert tickets and replies on their own tickets
- Users can insert attachments on their own tickets
- Admins can insert replies on any ticket
*/

-- Sequence for ticket numbers
DO $$ BEGIN
  CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL DEFAULT ('SUP-' || lpad(nextval('support_ticket_seq')::text, 5, '0')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  category text NOT NULL DEFAULT 'general_inquiry',
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets
DROP POLICY IF EXISTS "select_own_tickets" ON public.support_tickets;
CREATE POLICY "select_own_tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert tickets (user_id defaults to auth.uid())
DROP POLICY IF EXISTS "insert_own_tickets" ON public.support_tickets;
CREATE POLICY "insert_own_tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
DROP POLICY IF EXISTS "update_own_tickets" ON public.support_tickets;
CREATE POLICY "update_own_tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can read all tickets
DROP POLICY IF EXISTS "admin_select_tickets" ON public.support_tickets;
CREATE POLICY "admin_select_tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Admins can update all tickets
DROP POLICY IF EXISTS "admin_update_tickets" ON public.support_tickets;
CREATE POLICY "admin_update_tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ticket_replies table
CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL DEFAULT 'user',
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- Users can read replies on their own tickets
DROP POLICY IF EXISTS "select_own_ticket_replies" ON public.ticket_replies;
CREATE POLICY "select_own_ticket_replies" ON public.ticket_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- Users can insert replies on their own tickets
DROP POLICY IF EXISTS "insert_own_ticket_replies" ON public.ticket_replies;
CREATE POLICY "insert_own_ticket_replies" ON public.ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- Admins can read all replies
DROP POLICY IF EXISTS "admin_select_ticket_replies" ON public.ticket_replies;
CREATE POLICY "admin_select_ticket_replies" ON public.ticket_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Admins can insert replies
DROP POLICY IF EXISTS "admin_insert_ticket_replies" ON public.ticket_replies;
CREATE POLICY "admin_insert_ticket_replies" ON public.ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ticket_attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.ticket_replies(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Users can read attachments on their own tickets
DROP POLICY IF EXISTS "select_own_ticket_attachments" ON public.ticket_attachments;
CREATE POLICY "select_own_ticket_attachments" ON public.ticket_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- Users can insert attachments on their own tickets
DROP POLICY IF EXISTS "insert_own_ticket_attachments" ON public.ticket_attachments;
CREATE POLICY "insert_own_ticket_attachments" ON public.ticket_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- Admins can read all attachments
DROP POLICY IF EXISTS "admin_select_ticket_attachments" ON public.ticket_attachments;
CREATE POLICY "admin_select_ticket_attachments" ON public.ticket_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);

-- Auto-update updated_at on support_tickets
DO $$ BEGIN
  CREATE OR REPLACE TRIGGER update_support_ticket_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create storage bucket for support attachments (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support-attachments bucket (private)
DROP POLICY IF EXISTS "support_attachments_owner_read" ON storage.objects;
CREATE POLICY "support_attachments_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'support-attachments' AND owner = auth.uid());

DROP POLICY IF EXISTS "support_attachments_owner_upload" ON storage.objects;
CREATE POLICY "support_attachments_owner_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'support-attachments' AND owner = auth.uid());

DROP POLICY IF EXISTS "support_attachments_admin_read" ON storage.objects;
CREATE POLICY "support_attachments_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "support_attachments_admin_upload" ON storage.objects;
CREATE POLICY "support_attachments_admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
