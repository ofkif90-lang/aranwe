-- Insert sell_requests rows for pending properties that are missing them
INSERT INTO public.sell_requests (property_id, user_id, status)
SELECT p.id, p.owner_id, 'pending'
FROM public.properties p
WHERE p.approval_status = 'pending'
  AND p.status = 'unpublished'
  AND NOT EXISTS (
    SELECT 1 FROM public.sell_requests sr WHERE sr.property_id = p.id
  )
ON CONFLICT DO NOTHING;
