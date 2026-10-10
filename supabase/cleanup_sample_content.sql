-- =============================================================================
-- SAMPLE CONTENT CLEANUP
-- =============================================================================
-- Removes every row created by seed.sql, and nothing else.
--
-- Safety: every delete is filtered on the deterministic id prefix
--   5eed0000-0000-4000-8000-0000000000
-- so a row that the owner created through the admin dashboard can never match,
-- whatever its content. Running this twice is harmless.
--
-- Order note: project_images and project_technologies are removed automatically by
-- ON DELETE CASCADE from projects, so they are not listed. skills is listed
-- explicitly because skills.category_id is ON DELETE SET NULL, which would leave
-- the sample skills behind as uncategorised rows rather than deleting them.
--
-- Run inside a transaction so a failure leaves the content untouched.
-- =============================================================================

BEGIN;

delete from public.projects         where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.skills           where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.technologies     where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.skill_categories where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.about_sections   where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.experiences      where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.educations       where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.certificates     where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.services         where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.social_links     where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.site_settings    where id::text like '5eed0000-0000-4000-8000-0000000000%';
delete from public.profile          where id::text like '5eed0000-0000-4000-8000-0000000000%';

COMMIT;

-- Expected result: every table above reports 0 rows.
select 'profile' as table_name, count(*) from public.profile          where id::text like '5eed0000-0000-4000-8000-0000000000%'
union all select 'projects',     count(*) from public.projects         where id::text like '5eed0000-0000-4000-8000-0000000000%'
union all select 'skills',       count(*) from public.skills           where id::text like '5eed0000-0000-4000-8000-0000000000%'
union all select 'site_settings',count(*) from public.site_settings    where id::text like '5eed0000-0000-4000-8000-0000000000%';
