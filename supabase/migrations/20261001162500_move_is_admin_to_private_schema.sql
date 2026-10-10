-- Portfolio — move `is_admin()` out of the PostgREST-exposed schema.
--
-- Supabase's database linter reports:
--
--   [WARN] authenticated_security_definer_function_executable
--   Function `public.is_admin()` can be executed by the `authenticated` role as a
--   `SECURITY DEFINER` function via `/rest/v1/rpc/is_admin`.
--
-- The warning is fair about the mechanism and wrong about the consequence, but the fix is
-- cheap, so take it. While `is_admin()` sits in `public`, PostgREST exposes it as an RPC
-- endpoint that any signed-in user can call directly, over HTTP, with no RLS involved.
--
-- The function cannot be made `SECURITY INVOKER` instead, because it has to read
-- `admin_users` — a table that is deliberately not readable by the client — and RLS has no
-- way to express "evaluate this policy as someone else".
--
-- The fix is to move it to a schema PostgREST does not serve. Supabase only exposes
-- `public` by default, so a function in `private` is unreachable over the API while still
-- being callable from inside a policy expression, which runs as the querying user. The
-- policies therefore keep working unchanged in substance; only the schema qualifier
-- moves.
--
-- Nothing on the client calls this function. The frontend learns whether the signed-in
-- user is an admin by reading their own `admin_users` row through the
-- `admin_users_self_read` policy, which returns a row only for an admin. That route was
-- already permitted and is unchanged by this migration.

create schema if not exists private;

comment on schema private is
  'Server-side helpers that policies depend on. Not served by PostgREST, so nothing here '
  'is reachable over the API. Anything a client needs must live in public.';

-- `alter function ... set schema` moves the function and its comment in one step.
alter function public.is_admin() set schema private;

-- Lock the schema down before handing out the single grant that policies need. A policy
-- expression runs as the querying role, so `authenticated` keeps EXECUTE, but it gains
-- nothing it did not already have: the function takes no arguments and reads the caller's
-- own identity from `auth.uid()`, so it can only ever answer a question about the caller.
revoke all on schema private from public;
revoke all on function private.is_admin() from anon, authenticated, public;

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

comment on function private.is_admin() is
  'True only when auth.uid() has a row in admin_users. Used by every admin policy. Lives '
  'outside public so PostgREST does not expose it as an RPC endpoint.';

-- Repoint every admin policy at the new schema. `alter policy` rewrites the expression in
-- place, so this does not drop and recreate the policies, and no policy is briefly absent
-- while the migration runs.
alter policy site_settings_admin_all on public.site_settings
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy profile_admin_all on public.profile
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy about_sections_admin_all on public.about_sections
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy skill_categories_admin_all on public.skill_categories
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy skills_admin_all on public.skills
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy technologies_admin_all on public.technologies
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy projects_admin_all on public.projects
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy project_images_admin_all on public.project_images
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy project_technologies_admin_all on public.project_technologies
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy experiences_admin_all on public.experiences
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy educations_admin_all on public.educations
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy certificates_admin_all on public.certificates
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy services_admin_all on public.services
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy social_links_admin_all on public.social_links
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy contact_messages_admin_all on public.contact_messages
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy media_admin_all on public.media
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- The public read policies, the contact-form insert policy and the admin self-read policy
-- never call `is_admin()`, so they are deliberately left alone.