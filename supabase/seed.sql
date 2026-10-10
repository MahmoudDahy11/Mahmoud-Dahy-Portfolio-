-- =============================================================================
-- SAMPLE CONTENT SEED
-- =============================================================================
-- Purpose
--   Fills the database with realistic placeholder content so the public pages can be
--   verified against real data instead of only against empty states.
--
-- How this is marked
--   1. Every row has a fixed, recognisable id of the form:
--          5eed0000-0000-4000-8000-0000000000NN
--      so any row can be traced back to this file.
--   2. Visitor-facing text carries a "[Sample]" prefix, so it is obvious on screen that
--      it is not the portfolio owner's real content.
--
-- How to remove ALL of it
--   Run cleanup_sample_content.sql, which deletes by id prefix and therefore cannot
--   touch real content. Nothing else is required: child rows are removed with their
--   parents via ON DELETE CASCADE.
--
-- This is deliberately NOT a migration. Placeholder content must not be baked into
-- migration history, where it would follow the project to production.
-- =============================================================================

BEGIN;

-- ------------------------------------------------------------------ profile --
-- Single row. The app reads it with .limit(1).
insert into public.profile (
  id, full_name, headline, short_bio, bio, location, email,
  availability_status, years_of_experience
) values (
  '5eed0000-0000-4000-8000-000000000001',
  '[Sample] Mahmoud Dahy',
  'Flutter & Front-End Developer',
  'I build mobile and web products, mostly with Flutter, React, and TypeScript.',
  E'I am a software developer who has spent most of my career building mobile applications in Flutter.\n\nThese days I work across the whole stack: TypeScript and React on the front end, PostgreSQL and Supabase on the back, and a lot of time thinking about the design system that holds it together.\n\nThis site is a demonstration. Every word on it comes from a database row, and every row is managed through an admin dashboard.',
  'Cairo, Egypt',
  'sample@example.com',
  'open_to_work',
  6
);

-- ----------------------------------------------------------- site settings --
insert into public.site_settings (
  id, site_title, meta_description, default_theme, footer_text, copyright_text,
  show_availability_badge
) values (
  '5eed0000-0000-4000-8000-000000000002',
  '[Sample] Portfolio',
  'Sample portfolio of a Flutter and front-end developer, built with React and Supabase.',
  'system',
  'Built with React, TypeScript, and Supabase.',
  '[Sample] content - not real portfolio data.',
  true
);

-- -------------------------------------------------------- skill categories --
insert into public.skill_categories (id, name, slug, sort_order) values
  ('5eed0000-0000-4000-8000-000000000101', 'Languages',          'languages',          1),
  ('5eed0000-0000-4000-8000-000000000102', 'Frameworks',         'frameworks',         2),
  ('5eed0000-0000-4000-8000-000000000103', 'Backend & Data',     'backend-data',       3),
  ('5eed0000-0000-4000-8000-000000000104', 'Tools & Design',     'tools-design',       4);

-- ----------------------------------------------------------------- skills --
-- 'Uncategorised Sample' is published and has no category on purpose. It proves the UI
-- groups an uncategorised skill under "Other" instead of dropping it, which is why the
-- query uses a left join rather than `!inner`.
--
-- 'Hidden Sample Skill' is unpublished and categorised, the mirror image: it proves the
-- public list is filtered by is_published and not merely by category.
insert into public.skills (id, name, category_id, proficiency, sort_order, is_published) values
  ('5eed0000-0000-4000-8000-000000000201', 'Dart',       '5eed0000-0000-4000-8000-000000000101', 95, 1, true),
  ('5eed0000-0000-4000-8000-000000000202', 'TypeScript', '5eed0000-0000-4000-8000-000000000101', 85, 2, true),
  ('5eed0000-0000-4000-8000-000000000203', 'SQL',        '5eed0000-0000-4000-8000-000000000101', 80, 3, true),
  ('5eed0000-0000-4000-8000-000000000204', 'Flutter',    '5eed0000-0000-4000-8000-000000000102', 92, 1, true),
  ('5eed0000-0000-4000-8000-000000000205', 'React',      '5eed0000-0000-4000-8000-000000000102', 82, 2, true),
  ('5eed0000-0000-4000-8000-000000000206', 'Tailwind',   '5eed0000-0000-4000-8000-000000000102', 80, 3, true),
  ('5eed0000-0000-4000-8000-000000000207', 'Supabase',   '5eed0000-0000-4000-8000-000000000103', 85, 1, true),
  ('5eed0000-0000-4000-8000-000000000208', 'PostgreSQL', '5eed0000-0000-4000-8000-000000000103', 78, 2, true),
  ('5eed0000-0000-4000-8000-000000000209', 'Firebase',   '5eed0000-0000-4000-8000-000000000103', 75, 3, true),
  ('5eed0000-0000-4000-8000-000000000210', 'Figma',      '5eed0000-0000-4000-8000-000000000104', 70, 1, true),
  ('5eed0000-0000-4000-8000-000000000211', 'Git',        '5eed0000-0000-4000-8000-000000000104', 88, 2, true),
  ('5eed0000-0000-4000-8000-000000000212', 'Uncategorised Sample', null,                                      50, 3, true),
  ('5eed0000-0000-4000-8000-000000000213', 'Hidden Sample Skill',   '5eed0000-0000-4000-8000-000000000101',   60, 4, false);

-- ----------------------------------------------------------- technologies --
insert into public.technologies (id, name, slug, sort_order) values
  ('5eed0000-0000-4000-8000-000000000301', 'Flutter',     'flutter',     1),
  ('5eed0000-0000-4000-8000-000000000302', 'Dart',        'dart',        2),
  ('5eed0000-0000-4000-8000-000000000303', 'React',       'react',       3),
  ('5eed0000-0000-4000-8000-000000000304', 'TypeScript',  'typescript',  4),
  ('5eed0000-0000-4000-8000-000000000305', 'Supabase',    'supabase',    5),
  ('5eed0000-0000-4000-8000-000000000306', 'PostgreSQL',  'postgresql',  6),
  ('5eed0000-0000-4000-8000-000000000307', 'Firebase',    'firebase',    7),
  ('5eed0000-0000-4000-8000-000000000308', 'Figma',       'figma',       8);

-- -------------------------------------------------------------- projects --
-- `sample-internal-draft` is unpublished on purpose. It is the live proof that the
-- public site cannot see a draft, and that the details page cannot be used to guess
-- one into existence.
insert into public.projects (
  id, title, slug, summary, description, repository_url, live_url, role, client_name,
  is_featured, is_published, sort_order, started_at, ended_at
) values
  ('5eed0000-0000-4000-8000-000000000401',
   '[Sample] Field Service Tracker',
   'sample-field-service-tracker',
   'An offline-first Flutter app for technicians who work where there is no signal.',
   E'Technicians updating job records in basements and rural areas is the hard version of offline-first.\n\nThis app queues every write locally, reconciles when the network returns, and shows the technician a plain statement of what has synced and what has not. The reconciliation rules are deliberately boring: last write wins per field, and conflicts are surfaced rather than silently resolved.',
   'https://github.com/example/field-service-tracker', null,
   '[Sample] Lead developer', '[Sample] Sample Client',
   true, true, 1, '2024-03-01', '2024-11-30'),
  ('5eed0000-0000-4000-8000-000000000402',
   '[Sample] Clinic Booking',
   'sample-clinic-booking',
   'A booking flow for a small clinic, built so it stays usable on an old phone.',
   E'A booking flow for a small clinic that needed to work on the handsets its patients already owned.\n\nThe whole flow fits in one screen per step. No framework beyond what the browser already provides, no bundle worth complaining about, and a confirmation SMS that goes out from an edge function rather than the app.',
   null, null,
   '[Sample] Developer', '[Sample] Sample Clinic',
   true, true, 2, '2023-06-01', '2023-10-15'),
  ('5eed0000-0000-4000-8000-000000000403',
   '[Sample] Inventory Dashboard',
   'sample-inventory-dashboard',
   'A read-only dashboard over a stock database nobody wanted to rewrite.',
   E'The interesting constraint here was that the source of truth was a stock database that was not going to be replaced.\n\nSo the dashboard is strictly read-only, all filtering happens in SQL, and the page is fast because the browser is only ever handed the rows it is about to show.',
   null, null,
   '[Sample] Developer', null,
   true, true, 3, '2022-09-01', '2023-02-28'),
  ('5eed0000-0000-4000-8000-000000000404',
   '[Sample] Unpublished Draft',
   'sample-internal-draft',
   'This project is a draft. It must never appear on the public site.',
   'A draft used to verify that Row Level Security hides unpublished rows from anonymous visitors.',
   null, null,
   '[Sample] Developer', null,
   false, false, 4, '2025-01-01', null);

-- ---------------------------------------------------- project technologies --
insert into public.project_technologies (project_id, technology_id) values
  ('5eed0000-0000-4000-8000-000000000401', '5eed0000-0000-4000-8000-000000000301'),
  ('5eed0000-0000-4000-8000-000000000401', '5eed0000-0000-4000-8000-000000000302'),
  ('5eed0000-0000-4000-8000-000000000401', '5eed0000-0000-4000-8000-000000000305'),
  ('5eed0000-0000-4000-8000-000000000402', '5eed0000-0000-4000-8000-000000000303'),
  ('5eed0000-0000-4000-8000-000000000402', '5eed0000-0000-4000-8000-000000000304'),
  ('5eed0000-0000-4000-8000-000000000402', '5eed0000-0000-4000-8000-000000000306'),
  ('5eed0000-0000-4000-8000-000000000403', '5eed0000-0000-4000-8000-000000000304'),
  ('5eed0000-0000-4000-8000-000000000403', '5eed0000-0000-4000-8000-000000000306'),
  ('5eed0000-0000-4000-8000-000000000403', '5eed0000-0000-4000-8000-000000000308');

-- --------------------------------------------------------- about sections --
insert into public.about_sections (id, title, content, sort_order, is_published) values
  ('5eed0000-0000-4000-8000-000000000501',
   '[Sample] How I work',
   E'Read the codebase before proposing a change.\n\nMake the smallest change that solves the actual problem, and leave the surrounding code in a state the next person expects.\n\nSay what I do not know. A confident wrong answer costs more than an honest question.',
   1, true),
  ('5eed0000-0000-4000-8000-000000000502',
   '[Sample] What I am good at',
   E'Turning an ambiguous request into a screen that does one thing clearly.\n\nMobile interfaces that behave correctly on slow networks and small screens.\n\nData models that a second developer can read and change without asking me first.',
   2, true),
  ('5eed0000-0000-4000-8000-000000000503',
   '[Sample] Currently learning',
   'Accessibility work in depth, because the audits I inherited were mostly unfixed contrast and missing labels.',
   3, true);

-- ------------------------------------------------------------- experience --
-- Constraint check: a current role must have is_current = true and end_date = null.
insert into public.experiences (
  id, company, title, description, location, employment_type,
  start_date, end_date, is_current, sort_order, is_published
) values
  ('5eed0000-0000-4000-8000-000000000601',
   '[Sample] Current Employer', '[Sample] Mobile Engineer',
   E'Owning a Flutter application used by field staff in low-connectivity environments.\n\nMost of my time goes into sync correctness and into reducing the number of places a piece of state can live.',
   'Cairo, Egypt', 'Full-time', '2024-01-01', null, true, 1, true),
  ('5eed0000-0000-4000-8000-000000000602',
   '[Sample] Previous Employer', '[Sample] Software Developer',
   E'Built and maintained two customer-facing Flutter applications across three releases a year.\n\nIntroduced a small component library, which removed most of the duplicated layout code between the two apps.',
   'Cairo, Egypt', 'Full-time', '2022-02-01', '2023-12-31', false, 2, true),
  ('5eed0000-0000-4000-8000-000000000603',
   '[Sample] Sample Studio', '[Sample] Junior Developer',
   'First professional role. Wrote a lot of code, reviewed very little of it, and learned the cost of a migration you cannot roll back.',
   'Remote', 'Full-time', '2020-09-01', '2022-01-31', false, 3, true);

-- -------------------------------------------------------------- education --
insert into public.educations (
  id, institution, degree, field_of_study, description, start_date, end_date, grade, sort_order, is_published
) values
  ('5eed0000-0000-4000-8000-000000000701',
   '[Sample] University', 'Bachelor of Science', 'Computer Science',
   'Graduated with a project on scheduling algorithms, which is the only time I have used any of it since.',
   '2016-09-01', '2020-06-01', 'BSc', 1, true),
  ('5eed0000-0000-4000-8000-000000000702',
   '[Sample] Online Course', 'Professional Certificate', 'Database Design',
   'A database design course, mostly useful for the section on normalisation and mostly the reason this project exists.',
   '2023-01-01', '2023-04-01', null, 2, true);

-- ----------------------------------------------------------- certificates --
insert into public.certificates (
  id, title, issuer, issued_on, credential_id, credential_url, sort_order, is_published
) values
  ('5eed0000-0000-4000-8000-000000000801',
   '[Sample] Flutter Development', '[Sample] Certificate Issuer', '2023-05-01', 'SAMPLE-CERT-001',
   'https://example.com/verify/sample-cert-001', 1, true),
  ('5eed0000-0000-4000-8000-000000000802',
   '[Sample] SQL Fundamentals', '[Sample] Certificate Issuer', '2022-11-01', 'SAMPLE-CERT-002',
   null, 2, true),
  ('5eed0000-0000-4000-8000-000000000803',
   '[Sample] Accessibility Audit', '[Sample] Certificate Issuer', '2024-08-01', null,
   null, 3, true);

-- --------------------------------------------------------------- services --
insert into public.services (id, title, description, price_hint, sort_order, is_published) values
  ('5eed0000-0000-4000-8000-000000000901',
   '[Sample] Flutter app development',
   E'End-to-end mobile development in Flutter, from data model to store submission.\n\nIncludes a handover session so the team can maintain it without me.',
   '[Sample] From $X', 1, true),
  ('5eed0000-0000-4000-8000-000000000902',
   '[Sample] Front-end development',
   'React and TypeScript interfaces, built on an existing design system or on a new one agreed up front.',
   '[Sample] From $X', 2, true),
  ('5eed0000-0000-4000-8000-000000000903',
   '[Sample] Supabase and PostgreSQL',
   'Schema design, Row Level Security policies, and the backend features an application actually needs, without the ones it does not.',
   '[Sample] Project based', 3, true),
  ('5eed0000-0000-4000-8000-000000000904',
   '[Sample] Technical review',
   'A written review of an existing codebase or design, with the findings ranked by what is worth fixing first.',
   '[Sample] Fixed fee', 4, true);

-- ---------------------------------------------------------- social links --
insert into public.social_links (id, platform, label, url, sort_order, is_published) values
  ('5eed0000-0000-4000-8000-000000001001', 'github',    '[Sample] GitHub',    'https://github.com/example', 1, true),
  ('5eed0000-0000-4000-8000-000000001002', 'linkedin',  '[Sample] LinkedIn',  'https://linkedin.com/in/example', 2, true),
  ('5eed0000-0000-4000-8000-000000001003', 'x',         '[Sample] X',         'https://x.com/example', 3, true),
  ('5eed0000-0000-4000-8000-000000001004', 'email',     '[Sample] Email',     'mailto:sample@example.com', 4, true);

COMMIT;
