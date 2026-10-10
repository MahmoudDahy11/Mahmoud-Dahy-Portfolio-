-- Portfolio — revoke the default-privilege function grants that `from public` missed.
--
-- 20261001155410_rls.sql tried to close this with:
--
--   revoke all on function public.is_admin() from public;
--   grant execute on function public.is_admin() to authenticated, service_role;
--
-- The first statement does not do what it looks like. `public` is the pseudo-role every
-- role belongs to, so revoking from it only removes the implicit grant. It says nothing
-- about grants that were made *to a named role*. Supabase's default privileges are
--
--   alter default privileges in schema public
--     grant execute on functions to anon, authenticated, service_role;
--
-- so when the helper functions were created in 20261001155328_helpers.sql, `anon` and
-- `authenticated` each received an explicit, durable EXECUTE grant. Those survived the
-- revoke, leaving `anon` able to call a SECURITY DEFINER function that reads the admin
-- allowlist.
--
-- This was caught by supabase/migrations/tests/rls_verification.sql asserting that `anon`
-- cannot execute `is_admin()`, which returned "allowed" instead of a permission error.
--
-- The fix is to name the roles in the REVOKE. Revoking from `anon` as well as from
-- `public` leaves the ACL holding only what the GRANT below adds back.

-- Revoke from the named roles first, then from public, so the result does not depend on
-- whether a grant arrived via the pseudo-role or via default privileges.
revoke all on function public.set_updated_at() from anon, authenticated;
revoke all on function public.contact_messages_seal_insert() from anon, authenticated;
revoke all on function public.is_admin() from anon, authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.contact_messages_seal_insert() from public;
revoke all on function public.is_admin() from public;

-- Only the roles that genuinely need it get EXECUTE back. Every policy that calls
-- `is_admin()` targets `authenticated`, and `service_role` reaches these tables through
-- PostgREST and the dashboard.
--
-- The two trigger functions deliberately get no EXECUTE grant. Postgres does not check
-- EXECUTE privilege when firing a trigger, so revoking it costs nothing and keeps the
-- functions unreachable as ordinary functions.
grant execute on function public.is_admin() to authenticated, service_role;