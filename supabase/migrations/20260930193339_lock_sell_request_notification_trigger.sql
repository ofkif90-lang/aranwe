/*
# Lock internal sell-request notification trigger

## Security
- Prevent direct client RPC execution of the internal trigger function.
- The database trigger remains able to invoke it after a new sell request.
- No data is changed.
*/

REVOKE EXECUTE ON FUNCTION public.notify_admins_on_sell_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_sell_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_sell_request() FROM authenticated;
