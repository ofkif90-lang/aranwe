/*
# Fix ambiguous column reference in sell request notification trigger

## Problem
The `notify_admins_on_sell_request()` trigger function declared PL/pgSQL
variables named `property_title` and `property_code`. The SELECT inside the
function read `title, property_code` from the `properties` table without
prefixing the table name, so PostgreSQL could not tell whether
`property_code` referred to the variable or the column. That ambiguity
raised an error and aborted the sell_requests INSERT, which is why users
saw "تعذر إرسال طلب البيع".

## Fix
- Prefix all column references with the table alias so there is no ambiguity.
- No data changes; the trigger behavior is unchanged.
*/

CREATE OR REPLACE FUNCTION public.notify_admins_on_sell_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title text;
  v_property_code text;
BEGIN
  SELECT p.title, p.property_code
  INTO v_property_title, v_property_code
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  INSERT INTO public.notifications (user_id, title, message, type, is_admin)
  SELECT
    p.id,
    'طلب بيع جديد',
    format('يوجد طلب بيع جديد للعقار "%s" (%s) بانتظار المراجعة.', coalesce(v_property_title, 'عقار'), coalesce(v_property_code, 'بدون رقم')),
    'property',
    true
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND p.is_active = true;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_on_sell_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_sell_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_sell_request() FROM authenticated;
