/*
# Add private property contact details and display controls

## New columns
- `properties.display_fields`: JSON settings controlled by the owner or an
  administrator to decide which public detail sections appear.

## New table
- `property_contact_details`
- `property_id`: one contact record per property.
- `contact_phone`: phone number supplied with the sale request.
- `created_at`, `updated_at`: audit timestamps.

## Security
- Contact phone is never readable by anonymous visitors.
- Only the property owner and active administrators can manage contact details.
- Public property pages can read only the display settings and normal property
  information.
- Row-level security is enabled with separate policies for each operation.
*/

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS display_fields jsonb NOT NULL DEFAULT '{"address":true,"location":true,"price":true,"area":true,"bedrooms":true,"bathrooms":true,"floors":true,"description":true,"features":true}'::jsonb;

CREATE TABLE IF NOT EXISTS public.property_contact_details (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_contact_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_contact_select_owner_or_admin" ON public.property_contact_details;
CREATE POLICY "property_contact_select_owner_or_admin"
ON public.property_contact_details FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_contact_details.property_id
      AND p.owner_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "property_contact_insert_owner_or_admin" ON public.property_contact_details;
CREATE POLICY "property_contact_insert_owner_or_admin"
ON public.property_contact_details FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_contact_details.property_id
      AND p.owner_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "property_contact_update_owner_or_admin" ON public.property_contact_details;
CREATE POLICY "property_contact_update_owner_or_admin"
ON public.property_contact_details FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_contact_details.property_id
      AND p.owner_id = auth.uid()
  )
  OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_contact_details.property_id
      AND p.owner_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "property_contact_delete_owner_or_admin" ON public.property_contact_details;
CREATE POLICY "property_contact_delete_owner_or_admin"
ON public.property_contact_details FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_contact_details.property_id
      AND p.owner_id = auth.uid()
  )
  OR public.is_admin()
);

DROP TRIGGER IF EXISTS property_contact_details_updated_at ON public.property_contact_details;
CREATE TRIGGER property_contact_details_updated_at
BEFORE UPDATE ON public.property_contact_details
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP POLICY IF EXISTS "support_attachments_admin_read" ON storage.objects;
CREATE POLICY "support_attachments_admin_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'support-attachments' AND public.is_admin());

DROP POLICY IF EXISTS "support_attachments_admin_upload" ON storage.objects;
CREATE POLICY "support_attachments_admin_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments' AND public.is_admin());
