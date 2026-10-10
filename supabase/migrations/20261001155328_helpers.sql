-- Portfolio — shared database helper functions.
--
-- These two functions are the only reusable server-side logic in the project.
-- Everything else is a plain table, a constraint, or a policy.

-- Keeps `updated_at` current on every content table.
--
-- This lives in the database on purpose: if the frontend had to send `updated_at`, one
-- forgotten field in one form would silently produce a wrong timestamp forever. A
-- trigger cannot be forgotten.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Returns true only for a user who has a row in `admin_users`.
--
-- This is the authorization model described in ARCHITECTURE.md section 9.2: being signed
-- in grants nothing. Admin is an explicit allowlist.
--
-- Security notes:
--   * SECURITY DEFINER, so the function can read `admin_users` while `admin_users`
--     itself is never writable or fully readable by the client.
--   * `search_path = ''`, so nothing in the function can be hijacked by a caller who
--     controls a schema earlier in the search path. Every name is schema-qualified.
--   * STABLE, because the answer cannot change within a single statement. Policies wrap
--     the call in `(select ...)` so Postgres evaluates it once per query instead of
--     once per row.
--   * The caller's identity is read from `auth.uid()` inside the body, so the function
--     always answers about the caller and never about an argument a caller could forge.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

-- Seals the columns a visitor must not control when submitting the contact form.
--
-- The insert policy alone cannot prevent a visitor from supplying their own `id`,
-- `created_at`, `is_read`, or `is_archived` in the JSON body, because every column they
-- send is a legal value on its own. Overwriting them in a BEFORE INSERT trigger makes
-- those four columns unfillable from the client for every role.
create or replace function public.contact_messages_seal_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := gen_random_uuid();
  new.created_at := now();
  new.is_read := false;
  new.is_archived := false;
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger keeping updated_at current on every content table.';
comment on function public.is_admin() is
  'True only when auth.uid() has a row in admin_users. Used by every admin policy.';
comment on function public.contact_messages_seal_insert() is
  'BEFORE INSERT trigger forcing id, created_at, is_read and is_archived on contact_messages.';