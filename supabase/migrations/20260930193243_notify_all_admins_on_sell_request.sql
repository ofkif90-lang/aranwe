/*
# Notify both administrators about new sell requests

## Changes
- Add a SECURITY DEFINER trigger function that creates one notification for
  every active admin profile whenever a new `sell_requests` row is created.
- Add the trigger to `sell_requests`.
- Existing seller notifications and request data are unchanged.

## Security
- The trigger runs with a fixed `public` search path.
- Admin recipients are selected from the database by their immutable profile
  role, not from client-supplied IDs.
- The function is not exposed as a client-callable API.
*/

CREATE OR REPLACE FUNCTION public.notify_admins_on_sell_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_title text;
  property_code text;
BEGIN
  SELECT title, property_code
  INTO property_title, property_code
  FROM public.properties
  WHERE id = NEW.property_id;

  INSERT INTO public.notifications (user_id, title, message, type, is_admin)
  SELECT
    p.id,
    'طلب بيع جديد',
    format('يوجد طلب بيع جديد للعقار "%s" (%s) بانتظار المراجعة.', coalesce(property_title, 'عقار'), coalesce(property_code, 'بدون رقم')),
    'property',
    true
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND p.is_active = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admins_after_sell_request ON public.sell_requests;
CREATE TRIGGER notify_admins_after_sell_request
AFTER INSERT ON public.sell_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_sell_request();
