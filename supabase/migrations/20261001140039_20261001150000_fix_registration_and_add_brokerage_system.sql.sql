/*
# Fix registration trigger + add brokerage/lead system

## 1. Fix handle_new_user trigger function
- Add SET search_path = public to the SECURITY DEFINER function (was missing, can cause failures)

## 2. New columns on properties
- finishing_type (text): super_lux, lux, semi_lux, skeleton, furnished
- floor_plan_url (text): URL to floor plan image
- map_lat (numeric): latitude for map
- map_lng (numeric): longitude for map

## 3. New table: property_leads
- Lead capture form data from interested buyers (brokerage model)
- Tracks: name, phone, preferred viewing time, payment method, message
- Links to property and user (if logged in)
- Status pipeline: new -> contacted -> viewing_scheduled -> negotiating -> closed_won -> closed_lost

## 4. New table: deals
- Admin deal/commission pipeline
- Tracks: property, buyer, seller, deal status, commission percentage, commission amount
- Status: new_lead -> viewing_scheduled -> negotiating -> deal_closed -> deal_lost

## 5. RLS policies
- property_leads: user can see their own leads, admin can see all, anyone can insert
- deals: admin only CRUD
*/

-- 1. Fix handle_new_user with SET search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Add new columns to properties
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'finishing_type') THEN
    ALTER TABLE public.properties ADD COLUMN finishing_type text DEFAULT 'semi_lux';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'floor_plan_url') THEN
    ALTER TABLE public.properties ADD COLUMN floor_plan_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'map_lat') THEN
    ALTER TABLE public.properties ADD COLUMN map_lat numeric(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'map_lng') THEN
    ALTER TABLE public.properties ADD COLUMN map_lng numeric(10,7);
  END IF;
END $$;

-- 3. Create property_leads table
CREATE TABLE IF NOT EXISTS public.property_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  preferred_date date,
  preferred_time text,
  payment_method text DEFAULT 'cash',
  message text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_leads_insert_any" ON public.property_leads;
CREATE POLICY "property_leads_insert_any"
ON public.property_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "property_leads_select_own_or_admin" ON public.property_leads;
CREATE POLICY "property_leads_select_own_or_admin"
ON public.property_leads FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "property_leads_update_admin" ON public.property_leads;
CREATE POLICY "property_leads_update_admin"
ON public.property_leads FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "property_leads_delete_admin" ON public.property_leads;
CREATE POLICY "property_leads_delete_admin"
ON public.property_leads FOR DELETE
TO authenticated
USING (is_admin());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS property_leads_updated_at ON public.property_leads;
CREATE TRIGGER property_leads_updated_at
BEFORE UPDATE ON public.property_leads
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create deals table (commission pipeline)
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.property_leads(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text,
  seller_name text,
  seller_phone text,
  status text NOT NULL DEFAULT 'new_lead',
  commission_percentage numeric(5,2) DEFAULT 2.5,
  commission_amount numeric,
  property_price numeric,
  viewing_date timestamptz,
  viewing_agreement_signed boolean DEFAULT false,
  deal_closed_date timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_select_admin" ON public.deals;
CREATE POLICY "deals_select_admin"
ON public.deals FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "deals_insert_admin" ON public.deals;
CREATE POLICY "deals_insert_admin"
ON public.deals FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "deals_update_admin" ON public.deals;
CREATE POLICY "deals_update_admin"
ON public.deals FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "deals_delete_admin" ON public.deals;
CREATE POLICY "deals_delete_admin"
ON public.deals FOR DELETE
TO authenticated
USING (is_admin());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS deals_updated_at ON public.deals;
CREATE TRIGGER deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Add finishing_type to sell form default
-- Update existing properties to have a default finishing_type
UPDATE public.properties SET finishing_type = 'semi_lux' WHERE finishing_type IS NULL;
