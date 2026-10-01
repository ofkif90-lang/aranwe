/*
# Fix admin policy recursion and restore permissions

## Problem
Admin policies queried `profiles` from inside policies on `profiles` and other
relations. PostgreSQL therefore detected infinite recursion, blocking property
creation, catalog reads, and admin screens.

## Changes
- Add `public.is_admin()` as a SECURITY DEFINER function that checks the
  current authenticated user's active profile without re-entering RLS.
- Replace every existing admin policy predicate that directly queried
  `profiles` with this function.
- Preserve all existing table, role, owner, and public visibility rules.
- Do not alter or delete application data.

## Security
- Anonymous users cannot execute the helper.
- Only an authenticated active profile whose role is `admin` passes the check.
- The two existing admin profiles remain admins.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO $$
DECLARE
  policy_row record;
  command_name text;
  using_clause text;
  check_clause text;
  admin_fragment_alias text := 'EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = auth.uid()) AND (p.role = ''admin''::text)))';
  admin_fragment_plain text := 'EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ''admin''::text)))';
BEGIN
  FOR policy_row IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      p.polname AS policy_name,
      p.polcmd AS policy_command,
      p.polpermissive AS is_permissive,
      regexp_replace(coalesce(pg_get_expr(p.polqual, p.polrelid), ''), '[[:space:]]+', ' ', 'g') AS using_expression,
      regexp_replace(coalesce(pg_get_expr(p.polwithcheck, p.polrelid), ''), '[[:space:]]+', ' ', 'g') AS check_expression,
      array_to_string(
        ARRAY(
          SELECT r.rolname
          FROM pg_roles r
          WHERE r.oid = ANY(p.polroles)
          ORDER BY r.rolname
        ), ', '
      ) AS roles
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%profiles%'
        OR coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%profiles%'
      )
  LOOP
    command_name := CASE policy_row.policy_command
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
    END;

    using_clause := nullif(replace(replace(policy_row.using_expression, admin_fragment_alias, 'public.is_admin()'), admin_fragment_plain, 'public.is_admin()'), '');
    check_clause := nullif(replace(replace(policy_row.check_expression, admin_fragment_alias, 'public.is_admin()'), admin_fragment_plain, 'public.is_admin()'), '');

    IF coalesce(using_clause, '') ILIKE '%profiles%' OR coalesce(check_clause, '') ILIKE '%profiles%' THEN
      RAISE EXCEPTION 'Could not safely rewrite policy %.%', policy_row.table_name, policy_row.policy_name;
    END IF;

    EXECUTE format('DROP POLICY %I ON %I.%I', policy_row.policy_name, policy_row.schema_name, policy_row.table_name);

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      policy_row.policy_name,
      policy_row.schema_name,
      policy_row.table_name,
      CASE WHEN policy_row.is_permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      command_name,
      policy_row.roles,
      CASE WHEN using_clause IS NULL THEN '' ELSE format(' USING (%s)', using_clause) END,
      CASE WHEN check_clause IS NULL THEN '' ELSE format(' WITH CHECK (%s)', check_clause) END
    );
  END LOOP;
END $$;
