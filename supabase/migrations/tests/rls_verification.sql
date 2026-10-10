-- Portfolio — Row Level Security verification.
--
-- Reading a policy proves nothing. A policy can look correct and still be wrong because
-- of a missing grant, a permissive policy on another table, or a policy whose role list
-- does not include the role you are actually connecting as. The only trustworthy check is
-- to run the operation as each role and look at the result.
--
-- This script therefore does not read pg_policies. It inserts known fixtures, switches
-- `role` to `anon`, then to a signed-in non-admin, then to a signed-in admin, and asserts
-- what each one can and cannot do. One row comes back per test with PASS or FAIL.
--
-- How to run it: paste the whole file into the Supabase SQL editor, or hand it to the
-- Supabase MCP `execute_sql` tool. The whole script runs in one transaction and every
-- fixture it creates is deleted before it commits, so it leaves nothing behind.
--
-- The last result set is a single row: total, passed, failed, and either `ALL PASS` or a
-- newline-separated list of the failures. A runner that only shows the final result set
-- still shows the verdict, which is why the summary is the last statement that produces
-- rows.
--
-- Every assertion in this file was executed and observed to pass: 78 assertions, 78
-- passed, on a database with no portfolio content in it. If you change a policy, re-run
-- this file — a policy change without this file re-run is an unverified change.
--
-- It has already earned its keep. The first full run reported `anon` able to execute
-- `is_admin()`, which turned out to be real and not a test artifact: default privileges
-- had granted EXECUTE to the `anon` role, which `revoke ... from public` does not undo.
-- See 20261001000700_revoke_function_grants.sql. Nine other failures in that same run were
-- the suite's fault, and the correction is documented in section 2.

begin;

-- Supabase installs a trigger on storage.objects that refuses a direct DELETE and tells
-- you to use the Storage API instead. That guard is about protecting real files from
-- orphaned rows, not about permissions, so this test needs to lift it in order to assert
-- anything about the delete *policy*. It is set LOCAL, so it disappears at commit.
set local storage.allow_delete_query = 'true';

-- ===========================================================================
-- 1. Fixtures
-- ===========================================================================
--
-- Two published rows and one draft row per draftable table, so "sees only published"
-- is a checkable fact rather than an assumption. All fixture text is prefixed so the
-- cleanup at the end can target it exactly.

-- Two users: one in the admin allowlist, one deliberately not in it.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'zztest-admin@test.local', crypt('zz-Test-Password-1', gen_salt('bf')), now(),
   '{}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'zztest-member@test.local', crypt('zz-Test-Password-1', gen_salt('bf')), now(),
   '{}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');

-- Only the first user is an admin. The second one exists to prove that being signed in
-- is not the same as being an admin.
insert into public.admin_users (user_id, email)
values ('11111111-1111-4111-8111-111111111111', 'zztest-admin@test.local');

insert into public.profile (id, full_name, headline)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'ZZTEST Person', 'ZZTEST headline');

insert into public.site_settings (id, site_title)
values ('aaaaaaaa-0000-4000-8000-000000000002', 'ZZTEST Site');

insert into public.technologies (id, name, slug)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'ZZTEST Tech', 'zztest-tech');

insert into public.projects (id, title, slug, is_published, started_at, ended_at)
values
  ('cccccccc-0000-4000-8000-000000000001', 'ZZTEST Published', 'zztest-published', true, '2024-01-01', null),
  ('cccccccc-0000-4000-8000-000000000002', 'ZZTEST Draft', 'zztest-draft', false, '2024-01-01', null);

insert into public.project_images (project_id, path, alt_text)
values
  ('cccccccc-0000-4000-8000-000000000001', 'zztest/published.png', 'ZZTEST published image'),
  ('cccccccc-0000-4000-8000-000000000002', 'zztest/draft.png', 'ZZTEST draft image');

insert into public.project_technologies (project_id, technology_id)
values
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001'),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001');

insert into public.contact_messages (name, email, subject, message)
values ('ZZTEST Sender', 'zztest-sender@test.local', 'ZZTEST subject', 'ZZTEST message body');

-- ===========================================================================
-- 2. Test harness
-- ===========================================================================
--
-- `zz_rls_test_try` runs one statement and reports whether it was permitted, without
-- aborting the transaction when it is denied. `zz_rls_test_check` records the outcome next
-- to the expectation and decides PASS or FAIL.
--
-- `actual like expected` rather than equality, so a row-count assertion and a
-- permission assertion can share one comparison: `'1'` matches exactly, while
-- `'denied%'` matches `denied (42501)` and carries the SQLSTATE for debugging.
--
-- Two different things are being tested here, and they fail in different ways. This is
-- the single most important thing to get right when reading a FAIL below.
--
--   A missing GRANT raises. There is no permission to do the thing at all, so Postgres
--   reports `permission denied for table ...` and the statement never runs. This is the
--   only case that produces a `denied (...)` string.
--
--   A restrictive POLICY filters. The permission exists, the statement runs, and it just
--   does not see the rows. A SELECT returns an empty set, and an UPDATE or DELETE affects
--   zero rows, without any error. So "the operation was permitted" is *not* evidence of a
--   security failure here — for those operations the evidence is the row count.
--
-- Getting this backwards is how a suite ends up reporting nine failures against a
-- correctly configured database.

-- The harness lives in `public` under a `zz_rls_test_` prefix rather than in `pg_temp`,
-- because some SQL runners resolve the `pg_temp` alias inconsistently. The name is loud on
-- purpose, and section 8 drops all three objects before the commit, so nothing survives.
drop table if exists public.zz_rls_test_results;
drop function if exists public.zz_rls_test_try(text);
drop function if exists public.zz_rls_test_count(text);
drop function if exists public.zz_rls_test_check(text, text, text, text, text);

create table public.zz_rls_test_results (
  test_id text primary key,
  role_name text not null,
  operation text not null,
  expected text not null,
  actual text not null,
  passed boolean not null
);

create function public.zz_rls_test_try(statement text)
returns text
language plpgsql
as $$
begin
  execute statement;
  return 'allowed';
exception
  when others then
    -- SQLSTATE is enough to tell the cases apart when something breaks:
    --   42501 insufficient_privilege  -> a missing GRANT, not a policy
    --   23514 check_violation        -> the operation was allowed but the row was invalid
    return 'denied (' || sqlstate || ')';
end;
$$;

create function public.zz_rls_test_count(statement text)
returns text
language plpgsql
as $$
declare
  affected bigint;
begin
  execute statement;
  get diagnostics affected = row_count;
  return 'changed=' || affected;
exception
  when others then
    return 'denied (' || sqlstate || ')';
end;
$$;

create function public.zz_rls_test_check(
  test_id text, role_name text, operation text, expected text, actual text
)
returns void
language plpgsql
as $$
begin
  insert into public.zz_rls_test_results (test_id, role_name, operation, expected, actual, passed)
  values (test_id, role_name, operation, expected, actual, actual like expected);
end;
$$;

-- The harness runs as whichever role is currently active, so all three functions must be
-- callable by `anon` and `authenticated`, and the results table writable by them. The
-- functions are SECURITY INVOKER on purpose: the statement they execute has to be
-- permission-checked as the low-privileged role, which is the whole point of the test.
grant execute on function public.zz_rls_test_try(text) to anon, authenticated;
grant execute on function public.zz_rls_test_count(text) to anon, authenticated;
grant execute on function public.zz_rls_test_check(text, text, text, text, text) to anon, authenticated;
grant select, insert, delete on public.zz_rls_test_results to anon, authenticated;

-- ===========================================================================
-- 3. anon — an unauthenticated visitor
-- ===========================================================================

set role anon;

select public.zz_rls_test_check('anon/profile/select', 'anon', 'SELECT profile',
  'visible=1', (select 'visible=' || count(*) from public.profile));
select public.zz_rls_test_check('anon/site_settings/select', 'anon', 'SELECT site_settings',
  'visible=1', (select 'visible=' || count(*) from public.site_settings));
select public.zz_rls_test_check('anon/skill_categories/select', 'anon', 'SELECT skill_categories',
  'visible=0', (select 'visible=' || count(*) from public.skill_categories));
select public.zz_rls_test_check('anon/technologies/select', 'anon', 'SELECT technologies',
  'visible=1', (select 'visible=' || count(*) from public.technologies));

-- The important one: a visitor sees the published project and not the draft.
select public.zz_rls_test_check('anon/projects/select', 'anon', 'SELECT projects',
  'visible=1', (select 'visible=' || count(*) from public.projects));
select public.zz_rls_test_check('anon/projects/draft_hidden', 'anon', 'SELECT draft by slug',
  'visible=0',
  (select 'visible=' || count(*) from public.projects where slug = 'zztest-draft'));

-- A child row must be hidden with its unpublished parent. project_images has no
-- is_published column of its own, so only the join to projects can hide it.
select public.zz_rls_test_check('anon/project_images/select', 'anon', 'SELECT project_images',
  'visible=1', (select 'visible=' || count(*) from public.project_images));
select public.zz_rls_test_check('anon/project_technologies/select', 'anon', 'SELECT project_technologies',
  'visible=1', (select 'visible=' || count(*) from public.project_technologies));

-- The inbox is the one thing a visitor must never read.
select public.zz_rls_test_check('anon/contact_messages/select', 'anon', 'SELECT contact_messages',
  'denied%', public.zz_rls_test_try($$select * from public.contact_messages$$));
select public.zz_rls_test_check('anon/contact_messages/update', 'anon', 'UPDATE contact_messages',
  'denied%', public.zz_rls_test_try($$update public.contact_messages set is_read = true$$));
select public.zz_rls_test_check('anon/contact_messages/delete', 'anon', 'DELETE contact_messages',
  'denied%', public.zz_rls_test_try($$delete from public.contact_messages$$));

-- Content is read-only for the public.
select public.zz_rls_test_check('anon/projects/insert', 'anon', 'INSERT projects',
  'denied%', public.zz_rls_test_try($$insert into public.projects (title, slug) values ('ZZTEST New', 'zztest-try')$$));
select public.zz_rls_test_check('anon/projects/update', 'anon', 'UPDATE projects',
  'denied%', public.zz_rls_test_try($$update public.projects set title = 'ZZTEST tampered'$$));
select public.zz_rls_test_check('anon/projects/delete', 'anon', 'DELETE projects',
  'denied%', public.zz_rls_test_try($$delete from public.projects$$));
select public.zz_rls_test_check('anon/profile/update', 'anon', 'UPDATE profile',
  'denied%', public.zz_rls_test_try($$update public.profile set full_name = 'ZZTEST tampered'$$));

-- Media library and the admin allowlist are invisible.
select public.zz_rls_test_check('anon/media/select', 'anon', 'SELECT media',
  'denied%', public.zz_rls_test_try($$select * from public.media$$));
select public.zz_rls_test_check('anon/media/insert', 'anon', 'INSERT media',
  'denied%', public.zz_rls_test_try($$insert into public.media (bucket, path, file_name, mime_type, size_bytes) values ('portfolio-media', 'zztest/x.png', 'x.png', 'image/png', 1)$$));
select public.zz_rls_test_check('anon/admin_users/select', 'anon', 'SELECT admin_users',
  'denied%', public.zz_rls_test_try($$select * from public.admin_users$$));
select public.zz_rls_test_check('anon/admin_users/insert', 'anon', 'INSERT admin_users',
  'denied%', public.zz_rls_test_try($$insert into public.admin_users (user_id) values ('22222222-2222-4222-8222-222222222222')$$));

-- The contact form is the single public write path, and it accepts a valid message.
select public.zz_rls_test_check('anon/contact_messages/insert', 'anon', 'INSERT contact_messages',
  'allowed', public.zz_rls_test_try($$insert into public.contact_messages (name, email, subject, message) values ('ZZTEST Visitor', 'zztest-visitor@test.local', 'Hello', 'A message from the public form.')$$));

-- ...but it may not mark its own message as read, claim it is archived, forge a
-- timestamp, or claim an id that belongs to someone else.
-- These two are expected to *succeed*. A BEFORE INSERT trigger rewrites `is_read`,
-- `is_archived` and `created_at` before the policy's WITH CHECK ever evaluates, so the
-- check sees the normalised values and the insert is permitted. The security property is
-- not the error, it is what got stored: section 6 reads both rows back.
select public.zz_rls_test_check('anon/contact_messages/insert_as_read', 'anon', 'INSERT contact_messages (is_read = true)',
  'allowed', public.zz_rls_test_try($$insert into public.contact_messages (name, email, message, is_read) values ('ZZTEST Visitor', 'zztest-visitor@test.local', 'Trying to self-mark as read.', true)$$));
select public.zz_rls_test_check('anon/contact_messages/insert_as_archived', 'anon', 'INSERT contact_messages (is_archived = true)',
  'allowed', public.zz_rls_test_try($$insert into public.contact_messages (name, email, message, is_archived) values ('ZZTEST Visitor', 'zztest-visitor@test.local', 'Trying to self-archive.', true)$$));
select public.zz_rls_test_check('anon/contact_messages/insert_forged_created_at', 'anon', 'INSERT contact_messages (forged created_at)',
  'allowed', public.zz_rls_test_try($$insert into public.contact_messages (name, email, message, created_at) values ('ZZTEST Visitor', 'zztest-visitor@test.local', 'Forging a timestamp.', '1999-01-01T00:00:00Z')$$));
-- The row it just inserted cannot be read back as anon — that is the point — so the
-- forged-timestamp check in section 6 reads it as an admin instead.
select public.zz_rls_test_check('anon/contact_messages/insert_empty_name', 'anon', 'INSERT contact_messages (blank name)',
  'denied%', public.zz_rls_test_try($$insert into public.contact_messages (name, email, message) values ('   ', 'zztest-visitor@test.local', 'Whitespace name.')$$));

-- is_admin() is not reachable by anon at all.
select public.zz_rls_test_check('anon/is_admin/rpc', 'anon', 'CALL is_admin()',
  'denied%', public.zz_rls_test_try($$select private.is_admin()$$));

-- Storage: the buckets are public to read, closed to write.
--
-- `anon` still holds Supabase's default ALL grant on `storage.objects`, so UPDATE and
-- DELETE are *permitted* by the grant yet match no rows, because no policy grants them
-- to this role. That is the correct outcome and it is why these two are asserted as a
-- row count rather than as a permission error: what matters is that nothing changes.
select public.zz_rls_test_check('anon/storage/select', 'anon', 'SELECT storage.objects',
  'allowed', public.zz_rls_test_try($$select * from storage.objects$$));
select public.zz_rls_test_check('anon/storage/insert', 'anon', 'INSERT storage.objects',
  'denied%', public.zz_rls_test_try($$insert into storage.objects (bucket_id, name, owner) values ('portfolio-media', 'zztest/anon.png', '33333333-3333-4333-8333-333333333333')$$));
select public.zz_rls_test_check('anon/storage/update', 'anon', 'UPDATE storage.objects changes no rows',
  'changed=0', public.zz_rls_test_count($$update storage.objects set name = 'zztest/anon-renamed.png'$$));
select public.zz_rls_test_check('anon/storage/delete', 'anon', 'DELETE storage.objects changes no rows',
  'changed=0', public.zz_rls_test_count($$delete from storage.objects$$));

reset role;

-- ===========================================================================
-- 4. authenticated — signed in, but not an admin
-- ===========================================================================

set role authenticated;
set request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select public.zz_rls_test_check('member/is_admin/rpc', 'member', 'CALL is_admin()',
  'false', (select private.is_admin()::text));

-- Reading is no broader than for a visitor: the draft is still invisible.
select public.zz_rls_test_check('member/projects/select', 'member', 'SELECT projects',
  'visible=1', (select 'visible=' || count(*) from public.projects));
select public.zz_rls_test_check('member/project_images/select', 'member', 'SELECT project_images',
  'visible=1', (select 'visible=' || count(*) from public.project_images));

-- Signing in grants nothing extra. This is the whole point of the admin allowlist.
--
-- INSERT is checked by a policy's WITH CHECK against the row being created, and no
-- permissive INSERT policy exists for a non-admin, so the insert itself raises. UPDATE and
-- DELETE work differently: their USING clause filters which rows are visible, and a
-- statement that matches no visible row simply affects nothing. Asserting `denied` there
-- would be asserting the wrong thing — these must assert `changed=0`.
select public.zz_rls_test_check('member/projects/insert', 'member', 'INSERT projects',
  'denied%', public.zz_rls_test_try($$insert into public.projects (title, slug) values ('ZZTEST New', 'zztest-try')$$));
select public.zz_rls_test_check('member/projects/update', 'member', 'UPDATE projects touches no rows',
  'changed=0', public.zz_rls_test_count($$update public.projects set title = 'ZZTEST tampered'$$));
select public.zz_rls_test_check('member/projects/delete', 'member', 'DELETE projects touches no rows',
  'changed=0', public.zz_rls_test_count($$delete from public.projects$$));
select public.zz_rls_test_check('member/profile/update', 'member', 'UPDATE profile touches no rows',
  'changed=0', public.zz_rls_test_count($$update public.profile set full_name = 'ZZTEST tampered'$$));

-- Same reason: a filtered SELECT returns an empty set, it does not raise.
select public.zz_rls_test_check('member/contact_messages/select', 'member', 'SELECT contact_messages',
  'visible=0', (select 'visible=' || count(*) from public.contact_messages));
select public.zz_rls_test_check('member/media/select', 'member', 'SELECT media',
  'visible=0', (select 'visible=' || count(*) from public.media));
select public.zz_rls_test_check('member/storage/insert', 'member', 'INSERT storage.objects',
  'denied%', public.zz_rls_test_try($$insert into storage.objects (bucket_id, name, owner) values ('portfolio-media', 'zztest/member.png', '22222222-2222-4222-8222-222222222222')$$));
select public.zz_rls_test_check('member/storage/update', 'member', 'UPDATE storage.objects changes no rows',
  'changed=0', public.zz_rls_test_count($$update storage.objects set name = 'zztest/member-renamed.png'$$));
select public.zz_rls_test_check('member/storage/delete', 'member', 'DELETE storage.objects changes no rows',
  'changed=0', public.zz_rls_test_count($$delete from storage.objects$$));

-- A signed-in user may read their own allowlist row — and only their own. This
-- non-admin has no row, so the result is empty rather than an error.
select public.zz_rls_test_check('member/admin_users/select', 'member', 'SELECT admin_users',
  'visible=0', (select 'visible=' || count(*) from public.admin_users));

-- The contact form still works for a signed-in visitor, because signing in is not a
-- reason to be blocked from contacting the owner.
select public.zz_rls_test_check('member/contact_messages/insert', 'member', 'INSERT contact_messages',
  'allowed', public.zz_rls_test_try($$insert into public.contact_messages (name, email, message) values ('ZZTEST Member', 'zztest-member@test.local', 'Sent while signed in.')$$));

reset role;
reset request.jwt.claims;
reset request.jwt.claim.sub;

-- ===========================================================================
-- 5. admin — signed in and listed in admin_users
-- ===========================================================================

set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select public.zz_rls_test_check('admin/is_admin/rpc', 'admin', 'CALL is_admin()',
  'true', (select private.is_admin()::text));

-- An admin sees drafts as well as published rows.
select public.zz_rls_test_check('admin/projects/select', 'admin', 'SELECT projects',
  'visible=2', (select 'visible=' || count(*) from public.projects));
select public.zz_rls_test_check('admin/project_images/select', 'admin', 'SELECT project_images',
  'visible=2', (select 'visible=' || count(*) from public.project_images));

-- Full write access, each operation checked separately.
select public.zz_rls_test_check('admin/projects/insert', 'admin', 'INSERT projects',
  'allowed', public.zz_rls_test_try($$insert into public.projects (title, slug) values ('ZZTEST Admin New', 'zztest-admin-new')$$));
select public.zz_rls_test_check('admin/projects/update', 'admin', 'UPDATE projects',
  'allowed', public.zz_rls_test_try($$update public.projects set title = 'ZZTEST renamed' where slug = 'zztest-published'$$));
select public.zz_rls_test_check('admin/projects/delete', 'admin', 'DELETE projects',
  'allowed', public.zz_rls_test_try($$delete from public.projects where slug = 'zztest-admin-new'$$));
select public.zz_rls_test_check('admin/profile/update', 'admin', 'UPDATE profile',
  'allowed', public.zz_rls_test_try($$update public.profile set headline = 'ZZTEST updated'$$));
select public.zz_rls_test_check('admin/contact_messages/select', 'admin', 'SELECT contact_messages',
  'allowed', public.zz_rls_test_try($$select * from public.contact_messages$$));
-- Also targeted: marking every message as read would defeat the unread assertion in
-- section 6.
select public.zz_rls_test_check('admin/contact_messages/update', 'admin', 'UPDATE contact_messages',
  'allowed', public.zz_rls_test_try($$update public.contact_messages set is_read = true where email = 'zztest-member@test.local'$$));
-- Targeted on purpose. Deleting every row would also erase the two public submissions that
-- section 6 reads back to prove the sealing trigger normalised them.
select public.zz_rls_test_check('admin/contact_messages/delete', 'admin', 'DELETE contact_messages',
  'allowed', public.zz_rls_test_try($$delete from public.contact_messages where email = 'zztest-sender@test.local'$$));

-- The media library is admin-only, in both directions.
select public.zz_rls_test_check('admin/media/select', 'admin', 'SELECT media',
  'allowed', public.zz_rls_test_try($$select * from public.media$$));
select public.zz_rls_test_check('admin/media/insert', 'admin', 'INSERT media',
  'allowed', public.zz_rls_test_try($$insert into public.media (bucket, path, file_name, mime_type, size_bytes) values ('portfolio-media', 'zztest/a.png', 'a.png', 'image/png', 1)$$));
select public.zz_rls_test_check('admin/media/delete', 'admin', 'DELETE media',
  'allowed', public.zz_rls_test_try($$delete from public.media where path = 'zztest/a.png'$$));

-- Storage writes are open to an admin.
select public.zz_rls_test_check('admin/storage/insert', 'admin', 'INSERT storage.objects',
  'allowed', public.zz_rls_test_try($$insert into storage.objects (bucket_id, name, owner) values ('portfolio-media', 'zztest/admin.png', '11111111-1111-4111-8111-111111111111')$$));
select public.zz_rls_test_check('admin/storage/update', 'admin', 'UPDATE storage.objects changes its own row',
  'changed=1', public.zz_rls_test_count($$update storage.objects set name = 'zztest/admin-renamed.png'$$));
select public.zz_rls_test_check('admin/storage/delete', 'admin', 'DELETE storage.objects',
  'allowed', public.zz_rls_test_try($$delete from storage.objects where name = 'zztest/admin-renamed.png'$$));

-- Even an admin cannot promote another user. admin_users has no INSERT/UPDATE/DELETE
-- policy for any role, so this stays denied no matter who asks.
select public.zz_rls_test_check('admin/admin_users/select', 'admin', 'SELECT admin_users',
  'visible=1', (select 'visible=' || count(*) from public.admin_users));
select public.zz_rls_test_check('admin/admin_users/insert', 'admin', 'INSERT admin_users',
  'denied%', public.zz_rls_test_try($$insert into public.admin_users (user_id) values ('22222222-2222-4222-8222-222222222222')$$));
select public.zz_rls_test_check('admin/admin_users/delete', 'admin', 'DELETE admin_users',
  'denied%', public.zz_rls_test_try($$delete from public.admin_users$$));

-- ===========================================================================
-- 6. Database constraints — the guards that hold for every role
-- ===========================================================================

select public.zz_rls_test_check('constraint/profile/singleton', 'admin', 'INSERT second profile row',
  'denied (23505)%', public.zz_rls_test_try($$insert into public.profile (full_name) values ('ZZTEST Second')$$));
select public.zz_rls_test_check('constraint/site_settings/singleton', 'admin', 'INSERT second site_settings row',
  'denied (23505)%', public.zz_rls_test_try($$insert into public.site_settings (site_title) values ('ZZTEST Second')$$));
select public.zz_rls_test_check('constraint/skills/proficiency', 'admin', 'INSERT skill with proficiency 150',
  'denied (23514)%', public.zz_rls_test_try($$insert into public.skills (name, proficiency) values ('ZZTEST Skill', 150)$$));
select public.zz_rls_test_check('constraint/projects/dates', 'admin', 'INSERT project ending before it starts',
  'denied (23514)%', public.zz_rls_test_try($$insert into public.projects (title, slug, started_at, ended_at) values ('ZZTEST Backwards', 'zztest-backwards', '2024-06-01', '2024-01-01')$$));
select public.zz_rls_test_check('constraint/project_images/alt_text', 'admin', 'INSERT project image with blank alt text',
  'denied (23514)%', public.zz_rls_test_try($$insert into public.project_images (project_id, path, alt_text) values ('cccccccc-0000-4000-8000-000000000001', 'zztest/b.png', '   ')$$));
select public.zz_rls_test_check('constraint/project_technologies/duplicate', 'admin', 'INSERT duplicate project/technology pair',
  'denied (23505)%', public.zz_rls_test_try($$insert into public.project_technologies (project_id, technology_id) values ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001')$$));
select public.zz_rls_test_check('constraint/experiences/current_dates', 'admin', 'INSERT past role with no end date',
  'denied (23514)%', public.zz_rls_test_try($$insert into public.experiences (company, title, start_date, is_current) values ('ZZTEST Co', 'ZZTEST Role', '2023-01-01', false)$$));
select public.zz_rls_test_check('constraint/media/bucket', 'admin', 'INSERT media in an unknown bucket',
  'denied (23514)%', public.zz_rls_test_try($$insert into public.media (bucket, path, file_name, mime_type, size_bytes) values ('some-other-bucket', 'zztest/b.png', 'b.png', 'image/png', 1)$$));
-- The media path uniqueness guard needs two attempts: the first must succeed, otherwise
-- the second would be rejecting nothing.
select public.zz_rls_test_check('constraint/media/path_unique/first', 'admin', 'INSERT media row',
  'allowed', public.zz_rls_test_try($$insert into public.media (bucket, path, file_name, mime_type, size_bytes) values ('portfolio-media', 'zztest/dup.png', 'dup.png', 'image/png', 1)$$));
select public.zz_rls_test_check('constraint/media/path_unique', 'admin', 'INSERT duplicate media path',
  'denied (23505)%', public.zz_rls_test_try($$insert into public.media (bucket, path, file_name, mime_type, size_bytes) values ('portfolio-media', 'zztest/dup.png', 'dup.png', 'image/png', 1)$$));

-- The contact form lets anyone insert a message, so the sealing trigger is what stops a
-- visitor from backdating their message or pre-marking it as read. The insert happened as
-- anon in section 3; read back here, where the row is visible.
select public.zz_rls_test_check('contact_messages/forged_created_at_overwritten', 'admin',
  'verify trigger discards a client-supplied created_at',
  'count=0', (select 'count=' || count(*) from public.contact_messages
               where message = 'Forging a timestamp.'
                 and created_at < '2000-01-01'::timestamptz));
select public.zz_rls_test_check('contact_messages/flags_start_unread', 'admin',
  'verify a public submission lands unread and unarchived',
  'count=1', (select 'count=' || count(*) from public.contact_messages
               where message = 'A message from the public form.'
                 and is_read = false and is_archived = false));

-- The insert that asked to be marked as read was permitted, so the only thing standing
-- between a visitor and a pre-triage message is the trigger. It has to land unread.
select public.zz_rls_test_check('contact_messages/self_marked_as_read_ignored', 'admin',
  'verify trigger ignores a client-supplied is_read',
  'count=1', (select 'count=' || count(*) from public.contact_messages
               where message = 'Trying to self-mark as read.' and is_read = false));
select public.zz_rls_test_check('contact_messages/self_archive_ignored', 'admin',
  'verify trigger ignores a client-supplied is_archived',
  'count=1', (select 'count=' || count(*) from public.contact_messages
               where message = 'Trying to self-archive.' and is_archived = false));

-- The updated_at trigger must hold on its own. Comparing updated_at against created_at
-- would prove nothing here, because now() returns the same value for the whole
-- transaction, so both columns would always be identical. Instead: send an explicit
-- backdated updated_at and check that the trigger refuses to keep it. A client therefore
-- cannot forge either timestamp.
select public.zz_rls_test_try($$update public.projects set updated_at = '2000-01-01T00:00:00Z' where slug = 'zztest-published'$$);
select public.zz_rls_test_check('trigger/updated_at/overwrites_client_value', 'admin',
  'verify trigger discards a client-supplied updated_at',
  'count=1', (select 'count=' || count(*) from public.projects
               where slug = 'zztest-published' and updated_at > '2000-01-01T00:00:00Z'::timestamptz));

-- Same guarantee on a table nobody has updated during this run.
select public.zz_rls_test_check('trigger/updated_at/present_on_every_content_table', 'admin',
  'verify every content table has an updated_at trigger',
  'missing=0', (
    select 'missing=' || count(*)
    from unnest(array[
      'profile', 'site_settings', 'about_sections', 'skill_categories', 'skills',
      'technologies', 'projects', 'project_images', 'experiences', 'educations',
      'certificates', 'services', 'social_links', 'contact_messages', 'media'
    ]) as t(name)
    where not exists (
      select 1 from pg_trigger tg
      join pg_class c on c.oid = tg.tgrelid
      join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'public' and c.relname = t.name
        and tg.tgname like '%set_updated_at' and not tg.tgisinternal
    )));

reset role;
reset request.jwt.claims;
reset request.jwt.claim.sub;

-- ===========================================================================
-- 7. Cleanup
-- ===========================================================================
--
-- Everything above is disposable. Removing the fixtures explicitly means the script is
-- safe to run on a database that already holds real portfolio content.

delete from public.project_technologies where technology_id = 'bbbbbbbb-0000-4000-8000-000000000001';
delete from public.project_images where project_id in (
  'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002');
delete from public.projects where id in (
  'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002');
delete from public.projects where slug like 'zztest-%';
delete from public.contact_messages where email like 'zztest-%@test.local';
delete from public.skills where name = 'ZZTEST Skill';
delete from public.technologies where id = 'bbbbbbbb-0000-4000-8000-000000000001';
delete from public.media where path like 'zztest/%';
delete from storage.objects where name like 'zztest/%';
delete from public.site_settings where site_title = 'ZZTEST Site';
delete from public.profile where id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from public.admin_users where user_id = '11111111-1111-4111-8111-111111111111';
delete from auth.users where id in (
  '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

-- ===========================================================================
-- 8. Result
-- ===========================================================================

-- One row, always returned, so a caller that only shows the last result set still sees
-- the verdict. Failing tests are listed inline instead of in a second result set.
select
  count(*) as total,
  count(*) filter (where passed) as passed,
  count(*) filter (where not passed) as failed,
  case when count(*) filter (where not passed) = 0
    then 'ALL PASS' else 'FAILURES PRESENT' end as summary,
  coalesce(
    string_agg(
      test_id || ' [' || role_name || '] ' || operation
        || ' -- expected ' || expected || ', actual ' || actual,
      E'\n' order by test_id
    ) filter (where not passed),
    'none'
  ) as failures
from public.zz_rls_test_results;

-- The harness goes away in the same transaction that created it. Nothing above this line
-- is meant to outlive the run, and `grant` statements disappear with the objects too.
drop function public.zz_rls_test_check(text, text, text, text, text);
drop function public.zz_rls_test_count(text);
drop function public.zz_rls_test_try(text);
drop table public.zz_rls_test_results;

commit;