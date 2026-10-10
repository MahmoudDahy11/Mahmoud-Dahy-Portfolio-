-- Portfolio — narrow the table grants that default privileges widened.
--
-- Why this migration exists separately from 20261001155410_rls.sql, which now contains the
-- same statements:
--
--   The RLS migration had already been applied to the live project when the missing
--   REVOKEs were found. Supabase's default privileges are
--   `grant all on tables to anon, authenticated`, applied automatically to every table
--   created in `public`, so each table was born with full INSERT/UPDATE/DELETE for both
--   client roles. The GRANT statements in that migration therefore added nothing, and
--   `anon` held write access to every content table with RLS as its only protection.
--
--   Editing the already-applied migration would have left the repository claiming a
--   state the database was never in. So the fix lives here as an additive, idempotent
--   migration, and 00400 was corrected to describe the full intended end state.
--
--   Replaying this against a fresh database is safe: the statements are idempotent, and
--   running them after 00400 changes nothing.

-- Content tables: visitors and signed-in users may read, only admins may write.
revoke all on
  public.site_settings, public.profile, public.about_sections,
  public.skill_categories, public.skills, public.technologies,
  public.projects, public.project_technologies, public.project_images,
  public.experiences, public.educations, public.certificates,
  public.services, public.social_links
  from anon, authenticated;

grant select on
  public.site_settings, public.profile, public.about_sections,
  public.skill_categories, public.skills, public.technologies,
  public.projects, public.project_technologies, public.project_images,
  public.experiences, public.educations, public.certificates,
  public.services, public.social_links
  to anon, authenticated;

grant insert, update, delete on
  public.site_settings, public.profile, public.about_sections,
  public.skill_categories, public.skills, public.technologies,
  public.projects, public.project_technologies, public.project_images,
  public.experiences, public.educations, public.certificates,
  public.services, public.social_links
  to authenticated;

-- Contact messages: insert-only for visitors. Removing UPDATE and DELETE for anon means
-- a visitor cannot mark a message read or delete one even before a policy is consulted.
revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

-- Media library: nothing for visitors at all.
revoke all on public.media from anon, authenticated;
grant all on public.media to authenticated;

-- Authorization allowlist: readable by the authenticated user themselves, writable by
-- nobody through the client. Adding an admin is a deliberate out-of-band action.
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;