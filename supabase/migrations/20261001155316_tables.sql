-- Portfolio — tables, constraints, indexes and triggers.
--
-- Naming rules used throughout, per AGENTS.md section 8:
--   snake_case tables and columns, UUID primary keys, created_at/updated_at timestamps,
--   sort_order for owner-controlled ordering, is_published for drafts, explicit ON DELETE
--   behaviour on every foreign key, and an index on every foreign key column.
--
-- Two conventions worth knowing before reading further:
--
-- 1. Singleton tables (`profile`, `site_settings`) carry a unique index on a constant.
--    A unique index on the literal `true` can hold at most one row, so a second insert
--    fails at the database level. It cannot be bypassed by supplying a different id.
--
-- 2. Content that may be a draft carries `is_published`. Draft rows are invisible to
--    public readers because of the policies in the next migration, not because of
--    anything the frontend does.

-- ---------------------------------------------------------------------------
-- 1. Authorization allowlist
-- ---------------------------------------------------------------------------

-- The authorization model. A user is an admin if and only if a row exists here.
-- This table has no client write policy at all: the application can never promote
-- itself, so only the owner or a direct database/CLI action can add an admin.
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  -- Kept for display in the dashboard. Not authoritative: auth.users is.
  email text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Authorization allowlist. A row here is the only thing that makes a user an admin.';
comment on column public.admin_users.user_id is
  'auth.users.id of the granted admin.';
comment on column public.admin_users.email is
  'Denormalised for display only. The address of record is auth.users.email.';

-- ---------------------------------------------------------------------------
-- 2. Singleton tables
-- ---------------------------------------------------------------------------

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_title text not null,
  meta_description text,
  og_image_path text,
  -- 'light' | 'dark' | 'system'
  default_theme text not null default 'system',
  footer_text text,
  copyright_text text,
  show_availability_badge boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint site_settings_theme_check
    check (default_theme in ('light', 'dark', 'system'))
);

create table public.profile (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  headline text,
  short_bio text,
  bio text,
  -- Storage object paths, not URLs. Storing the path keeps the storage bucket movable
  -- and lets the frontend build the URL from one place.
  avatar_path text,
  cover_path text,
  resume_path text,
  location text,
  email text,
  phone text,
  availability_status text,
  years_of_experience integer,
  updated_at timestamptz not null default now(),
  constraint profile_years_check
    check (years_of_experience is null or years_of_experience >= 0)
);

-- ---------------------------------------------------------------------------
-- 3. About
-- ---------------------------------------------------------------------------

create table public.about_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Skills
-- ---------------------------------------------------------------------------

create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- SET NULL, not CASCADE: deleting a category must not silently delete skills.
  category_id uuid references public.skill_categories (id) on delete set null,
  proficiency smallint,
  icon_path text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_proficiency_check
    check (proficiency is null or proficiency between 0 and 100)
);

-- ---------------------------------------------------------------------------
-- 5. Projects
-- ---------------------------------------------------------------------------

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- URL segment. Unique so a project detail page always resolves to one project.
  slug text not null unique,
  summary text,
  description text,
  cover_image_path text,
  repository_url text,
  live_url text,
  role text,
  client_name text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_check
    check (ended_at is null or started_at is null or ended_at >= started_at)
);

-- Normalised many-to-many link between projects and technologies.
--
-- A composite primary key makes a duplicate pairing impossible, so there is no need for
-- application code to guard against inserting the same technology twice.
create table public.project_technologies (
  project_id uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, technology_id)
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  path text not null,
  -- NOT NULL: an image with no alt text is inaccessible, so the database refuses it.
  alt_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_images_alt_check check (length(btrim(alt_text)) > 0)
);

-- ---------------------------------------------------------------------------
-- 6. Experience
-- ---------------------------------------------------------------------------

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  description text,
  location text,
  employment_type text,
  start_date date not null,
  -- Null while the role is current.
  end_date date,
  is_current boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An open-ended role is the only case where a missing end date makes sense.
  constraint experiences_current_dates_check check (end_date is not null or is_current),
  constraint experiences_dates_check
    check (end_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- 7. Education
-- ---------------------------------------------------------------------------

create table public.educations (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text not null,
  field_of_study text,
  description text,
  logo_path text,
  start_date date,
  end_date date,
  grade text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint educations_dates_check
    check (end_date is null or start_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- 8. Certificates
-- ---------------------------------------------------------------------------

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issued_on date,
  credential_id text,
  credential_url text,
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. Services
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon_path text,
  price_hint text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. Social links
-- ---------------------------------------------------------------------------

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  -- Lowercase platform key such as 'github' or 'linkedin'. The frontend maps it to a
  -- Lucide icon, so adding a new platform needs a frontend entry, not a database change.
  platform text not null,
  label text not null,
  url text not null,
  icon_path text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_platform_check
    check (length(btrim(platform)) > 0)
);

-- ---------------------------------------------------------------------------
-- 11. Contact messages
-- ---------------------------------------------------------------------------

-- The only table the public may write to, and only by inserting.
--
-- Length limits double as cheap spam control: a visitor cannot insert a 5 MB row, which
-- keeps the table usable even if an automated script targets it.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint contact_messages_email_check check (char_length(btrim(email)) between 3 and 254),
  constraint contact_messages_subject_check
    check (subject is null or char_length(subject) <= 200),
  constraint contact_messages_message_check
    check (char_length(btrim(message)) between 1 and 5000)
);

comment on table public.contact_messages is
  'Contact form submissions. Insert-only for the public; never readable by the public.';

-- ---------------------------------------------------------------------------
-- 12. Media library
-- ---------------------------------------------------------------------------

-- Metadata for uploaded files. The bytes live in Supabase Storage; this table only
-- records where they are and how to describe them.
create table public.media (
  id uuid primary key default gen_random_uuid(),
  -- Storage bucket *name*, e.g. 'portfolio-media'. Deliberately a name rather than
  -- storage.buckets.id: a readable name survives a bucket being recreated, and it is
  -- what the frontend needs to build a public URL.
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  alt_text text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_bucket_check check (bucket in ('portfolio-media', 'portfolio-files')),
  constraint media_size_check check (size_bytes > 0),
  constraint media_dimensions_check
    check ((width is null or width > 0) and (height is null or height > 0)),
  constraint media_path_unique unique (bucket, path)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Singleton guards. A unique index over the constant `true` can hold at most one row, so
-- these two tables can never grow a second row — not even if an insert supplies a fresh
-- id, which a plain primary key check would happily allow. This has to be an index
-- rather than a table-level UNIQUE constraint, because Postgres does not accept a
-- constraint over an expression.
create unique index site_settings_singleton_guard on public.site_settings ((true));
create unique index profile_singleton_guard on public.profile ((true));

-- Foreign keys. Postgres does not index these automatically, and both joins and
-- ON DELETE CASCADE scan them.
create index skills_category_id_idx on public.skills (category_id);
create index project_images_project_id_idx on public.project_images (project_id);
-- The composite primary key already covers lookups by project_id.
create index project_technologies_technology_id_idx on public.project_technologies (technology_id);
create index media_created_by_idx on public.media (created_by);

-- The public portfolio reads only published rows, and always in sort_order. A partial
-- index over just those rows keeps the public read path small no matter how many drafts
-- accumulate.
create index about_sections_published_idx
  on public.about_sections (sort_order) where is_published;
create index skills_published_idx
  on public.skills (sort_order) where is_published;
create index projects_published_idx
  on public.projects (sort_order, created_at desc) where is_published;
create index experiences_published_idx
  on public.experiences (sort_order) where is_published;
create index educations_published_idx
  on public.educations (sort_order) where is_published;
create index certificates_published_idx
  on public.certificates (sort_order) where is_published;
create index services_published_idx
  on public.services (sort_order) where is_published;
create index social_links_published_idx
  on public.social_links (sort_order) where is_published;

-- Featured projects on the home page.
create index projects_featured_idx
  on public.projects (sort_order) where is_featured and is_published;

-- Project detail page lookup by slug is already covered by the unique constraint on
-- projects.slug, and technologies/skill_categories slug lookups likewise.

-- Admin inbox: newest first, plus a small index for the unread counter on the dashboard.
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index contact_messages_unread_idx
  on public.contact_messages (created_at desc)
  where not is_read and not is_archived;

create index media_created_at_idx on public.media (created_at desc);

