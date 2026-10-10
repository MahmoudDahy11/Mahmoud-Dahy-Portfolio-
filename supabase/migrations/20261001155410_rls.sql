-- Portfolio — Row Level Security, policies and table grants.
--
-- This is the actual security boundary. The admin route guard in the frontend is only
-- user interface convenience; everything below is enforced by Postgres and holds no
-- matter what the browser sends.
--
-- Three roles matter:
--
--   anon         — an unauthenticated visitor (PostgREST's `anon` role)
--   authenticated— anyone with a valid Supabase session, admin or not
--   service_role — the server-side role, which bypasses RLS entirely
--
-- The rules being enforced:
--
--   * A visitor may READ published portfolio content, and nothing else.
--   * A visitor may INSERT one contact message, and nothing else.
--   * A signed-in non-admin may read exactly the same rows as a visitor, no more.
--   * Only a user present in `admin_users` may write, and may see drafts.
--   * Nobody, through any client, may write to `admin_users`.
--
-- Two habits used throughout, both from the Supabase Postgres guidance:
--
--   * `auth.uid()` and `public.is_admin()` are wrapped in `(select ...)`. Without the
--     wrapper Postgres evaluates them once per row; with it, once per query.
--   * Table grants are set explicitly even though the project already granted everything
--     by default. RLS is the main gate, but a narrow grant is a second, independent gate
--     that costs nothing and removes an entire class of mistake.

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

-- There is no "I will add this later" branch. A new table with RLS off is readable by
-- the whole internet, and Supabase's security advisor treats it as a critical finding.
alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.profile enable row level security;
alter table public.about_sections enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.technologies enable row level security;
alter table public.projects enable row level security;
alter table public.project_technologies enable row level security;
alter table public.project_images enable row level security;
alter table public.experiences enable row level security;
alter table public.educations enable row level security;
alter table public.certificates enable row level security;
alter table public.services enable row level security;
alter table public.social_links enable row level security;
alter table public.contact_messages enable row level security;
alter table public.media enable row level security;

-- ---------------------------------------------------------------------------
-- Function grants
-- ---------------------------------------------------------------------------

-- The project's default privileges gave EXECUTE on every function to anon and
-- authenticated. Undo that, then hand back exactly what is needed. `is_admin()` is only
-- ever called by policies that target `authenticated`, so `anon` needs no access.
--
-- The REVOKE names `anon` and `authenticated` explicitly and does not stop at `public`.
-- Revoking from `public` alone removes the pseudo-role grant but leaves the explicit
-- grants that default privileges made to the named roles, so `anon` keeps its EXECUTE.
-- 20261001161324_revoke_function_grants.sql fixes exactly this on the live project.
--
-- The two trigger functions get no EXECUTE grant. Postgres does not check EXECUTE when
-- firing a trigger, so revoking costs nothing and keeps them unreachable directly.
revoke all on function public.set_updated_at() from anon, authenticated, public;
revoke all on function public.contact_messages_seal_insert() from anon, authenticated, public;
revoke all on function public.is_admin() from anon, authenticated, public;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Table grants (second gate, independent of RLS)
-- ---------------------------------------------------------------------------
--
-- The REVOKEs are not optional. This project's default privileges are
-- `grant all on tables to anon, authenticated`, which Supabase applies automatically to
-- every table created in `public`. A GRANT on top of that adds nothing, so without the
-- revoke below `anon` would hold INSERT, UPDATE and DELETE on every content table and
-- RLS would be the only thing stopping a visitor from editing the portfolio.
--
-- After these statements each role holds exactly what its policies allow. RLS decides
-- *which rows*; the grant decides *which operations are even possible*. Two independent
-- gates instead of one.

-- Content tables: start from nothing, then add back only what is needed.
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

-- Contact messages: insert only for visitors. No UPDATE and no DELETE for anon, so a
-- visitor cannot mark a message read or remove one even before a policy is consulted.
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

-- ---------------------------------------------------------------------------
-- Policies: always-public rows
-- ---------------------------------------------------------------------------

-- `profile` and `site_settings` are singleton rows and are always public. There is no
-- draft state for them, so there is nothing to filter on.
create policy profile_public_read on public.profile
  for select to anon, authenticated using (true);

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

create policy skill_categories_public_read on public.skill_categories
  for select to anon, authenticated using (true);

create policy technologies_public_read on public.technologies
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Policies: public sees published rows only
-- ---------------------------------------------------------------------------

create policy about_sections_public_read on public.about_sections
  for select to anon, authenticated using (is_published);
create policy skills_public_read on public.skills
  for select to anon, authenticated using (is_published);
create policy projects_public_read on public.projects
  for select to anon, authenticated using (is_published);
create policy experiences_public_read on public.experiences
  for select to anon, authenticated using (is_published);
create policy educations_public_read on public.educations
  for select to anon, authenticated using (is_published);
create policy certificates_public_read on public.certificates
  for select to anon, authenticated using (is_published);
create policy services_public_read on public.services
  for select to anon, authenticated using (is_published);
create policy social_links_public_read on public.social_links
  for select to anon, authenticated using (is_published);

-- Child rows are reached through their published parent. Filtering the child table on
-- its own columns would not be enough: an image has no is_published column, so without
-- this join the images of an unpublished project would still be readable.
create policy project_images_public_read on public.project_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_images.project_id
        and p.is_published = true
    )
  );

create policy project_technologies_public_read on public.project_technologies
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_technologies.project_id
        and p.is_published = true
    )
  );

-- ---------------------------------------------------------------------------
-- Policies: contact form
-- ---------------------------------------------------------------------------

-- WITH CHECK constrains the row being written. It is the only place a visitor can
-- create data, so it is also the only place a visitor can try to write something they
-- should not. The length rules mirror the table's CHECK constraints and additionally
-- reject whitespace-only submissions, which pass a bare NOT NULL.
--
-- The four columns a visitor must never control — id, created_at, is_read, is_archived —
-- are not listed here because WITH CHECK cannot enforce them; the
-- contact_messages_seal_insert trigger overwrites them instead.
create policy contact_messages_public_insert on public.contact_messages
  for insert to anon, authenticated
  with check (
    not is_read
    and not is_archived
    and char_length(btrim(name)) between 1 and 120
    and char_length(btrim(email)) between 3 and 254
    and char_length(btrim(message)) between 1 and 5000
    and (subject is null or char_length(subject) <= 200)
  );

-- Deliberately absent: any SELECT, UPDATE or DELETE policy for anon. A visitor cannot
-- read the inbox, cannot mark their own message read, and cannot delete evidence.

-- ---------------------------------------------------------------------------
-- Policies: admin_users
-- ---------------------------------------------------------------------------

-- A signed-in user may read their own row, and nothing else. Enough for the dashboard to
-- answer "am I an admin?" without exposing the full allowlist to one admin viewing
-- another. There is no INSERT, UPDATE or DELETE policy for any role.
create policy admin_users_self_read on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Policies: admin full access on content tables
-- ---------------------------------------------------------------------------

-- One `is_admin()` check per table per operation. Read policy targets both roles so an
-- admin sees drafts as well as published rows in the same table; write policies target
-- `authenticated` only, which is where `auth.uid()` comes from.
create policy site_settings_admin_all on public.site_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy profile_admin_all on public.profile
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy about_sections_admin_all on public.about_sections
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy skill_categories_admin_all on public.skill_categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy skills_admin_all on public.skills
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy technologies_admin_all on public.technologies
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy projects_admin_all on public.projects
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy project_images_admin_all on public.project_images
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy project_technologies_admin_all on public.project_technologies
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy experiences_admin_all on public.experiences
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy educations_admin_all on public.educations
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy certificates_admin_all on public.certificates
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy services_admin_all on public.services
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy social_links_admin_all on public.social_links
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy contact_messages_admin_all on public.contact_messages
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy media_admin_all on public.media
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));