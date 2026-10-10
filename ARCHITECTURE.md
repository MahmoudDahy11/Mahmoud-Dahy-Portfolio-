# ARCHITECTURE.md — Portfolio Project

Phase 0 deliverable. This document is the architecture source of truth for the project.
It describes what will be built and why, before any application code is written.

Status: **Proposed** — pending owner approval.

---

## 1. Discovery Findings

### 1.1 Repository

| Item | Finding |
| --- | --- |
| Files present | `AGENTS.md`, `PROJECT_PLAN.md.md` |
| Application code | None |
| Frontend scaffold | None |
| Node.js | v20.20.2 |
| npm | 10.8.2 |
| Git repository root | `/home/mahmoud-dahy` (the **home directory** is the git repo) |

Notes:

- The plan file is named `PROJECT_PLAN.md.md`. The double extension is almost certainly
  accidental. It is harmless, but references to `PROJECT_PLAN.md` in `AGENTS.md` do not
  resolve on disk. Recommendation: rename to `PROJECT_PLAN.md`.
- The git root being the home directory is a problem for a real project: commits would
  include unrelated personal files. Recommendation: make `Portfolio/` its own git
  repository. Not changed automatically — this is the owner's decision.

### 1.2 Supabase Project

Project reference: `utncrpncpehtscbuygvp`.

| Resource | Finding |
| --- | --- |
| Tables in `public` | 0 |
| Storage buckets | 0 |
| RLS policies (`public` / `storage`) | 0 |
| Applied migrations | 0 |
| Edge functions | 0 |
| Auth users | 0 |
| Security advisories | 0 |

Conclusion: the project is **completely empty**. Nothing exists that could be damaged,
and there are no unrelated resources to protect. Every object created in Phase 2 will be
new, and the full schema will be reproducible from migration files kept in the repository.

---

## 2. Architecture Decision (Summary)

| Concern | Decision | Reason |
| --- | --- | --- |
| App type | Single-page React application (Vite) | Static hosting is enough; no server runtime needed |
| Backend | Supabase (Postgres + Auth + Storage + RLS) | Mandated by `AGENTS.md`; single system for data, auth and files |
| Admin model | Explicit `admin_users` allowlist table, enforced by RLS | Satisfies "authorization must be explicit"; DB-enforced, not frontend-enforced |
| Public vs admin | Same app, two route trees | Keeps one bundle and one design system; simplest to maintain |
| Server state | TanStack Query | Mandated; prevents duplicate fetching and gives caching and invalidation for free |
| Forms | React Hook Form + Zod | Mandated; one validation approach everywhere |
| Global state | None beyond React Query + React Router + theme | No Redux/Zustand. Simpler for a non-web expert to reason about |
| Animations | One small animation library, used sparingly | "Tasteful modern animations" without a framework-style animation system |
| Tests | Vitest + React Testing Library, plus SQL-level RLS tests | Unit/component coverage plus real database security verification |

---

## 3. Frontend Architecture

### 3.1 Layers

The project uses four layers. Each layer may only depend on the layer below it.

```text
pages / layouts        →  screens, compose features
components, features   →  reusable UI and per-entity logic
services, hooks        →  data access and React integration
lib, types, utils      →  infrastructure and pure helpers
```

The critical rule: **Supabase queries never appear inside a UI component.**
A component may call a hook. A hook may call a service. A service owns the query.

### 3.2 Folder Structure

```text
Portfolio/
├── AGENTS.md
├── PROJECT_PLAN.md.md
├── ARCHITECTURE.md
├── PROJECT_STATUS.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── components.json                 # shadcn/ui configuration
├── .env.example
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── og-default.png
├── scripts/
│   └── generate-sitemap.ts         # injects project slugs into sitemap
├── supabase/
│   └── migrations/                 # SQL migrations, source of truth for the schema
│       ├── 20260101000000_schema.sql
│       ├── 20260101000001_rls.sql
│       ├── 20260101000002_storage.sql
│       └── tests/                  # RLS verification SQL
└── src/
    ├── main.tsx                    # entry point: providers + router
    ├── app/
    │   ├── App.tsx                 # route table only
    │   ├── router.tsx              # route definitions and guards
    │   └── providers.tsx           # Query, Theme, Auth providers
    ├── components/
    │   ├── ui/                     # shadcn/ui generated components
    │   └── common/                 # project-wide reusable components
    │       ├── Section.tsx
    │       ├── SectionHeading.tsx
    │       ├── PageHeader.tsx
    │       ├── EmptyState.tsx
    │       ├── ErrorState.tsx
    │       ├── LoadingState.tsx
    │       ├── ConfirmDialog.tsx
    │       ├── FormField.tsx
    │       ├── DataTable.tsx
    │       ├── SearchInput.tsx
    │       ├── ImageUpload.tsx
    │       └── ThemeToggle.tsx
    ├── features/
    │   ├── profile/
    │   ├── about/
    │   ├── skills/
    │   ├── projects/
    │   ├── experience/
    │   ├── education/
    │   ├── certificates/
    │   ├── services/
    │   ├── socialLinks/
    │   ├── messages/
    │   ├── media/
    │   ├── settings/
    │   ├── auth/
    │   └── contact/
    ├── pages/
    │   ├── public/
    │   └── admin/
    ├── layouts/
    │   ├── PublicLayout.tsx
    │   ├── AdminLayout.tsx
    │   └── AuthLayout.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useSeo.ts
    │   ├── useMediaUrl.ts
    │   └── useDebouncedValue.ts
    ├── lib/
    │   ├── supabase.ts             # single Supabase client instance
    │   ├── queryClient.ts
    │   ├── seo.ts                  # metadata helpers
    │   └── utils.ts                # cn() class merger
    ├── services/                   # one file per entity, owns all Supabase queries
    ├── schemas/                    # Zod schemas for forms
    ├── types/
    │   ├── database.ts             # generated from Supabase
    │   └── entities.ts             # app-facing types
    ├── constants/
    │   ├── routes.ts
    │   ├── storage.ts
    │   ├── navigation.ts
    │   └── validation.ts
    ├── providers/
    │   ├── ThemeProvider.tsx
    │   └── AuthProvider.tsx
    ├── types/…
    └── utils/
        ├── formatDate.ts
        ├── formatBytes.ts
        └── isEmpty.ts
```

### 3.3 Feature Folder Convention

Every feature folder follows the same six-part shape. This is what makes the admin
dashboard consistent: one entity, one predictable set of files.

```text
features/projects/
├── api.ts          # Supabase queries for this entity (select/insert/update/delete)
├── hooks.ts        # useProjects(), useProject(id), useCreateProject(), …
├── ProjectCard.tsx # presentation for this feature
├── ProjectForm.tsx # React Hook Form + Zod form
├── ProjectDialog.tsx
├── constants.ts    # feature-specific constants
└── index.ts        # public exports for the feature
```

The rest of the app imports from `features/projects`, never from its internals.

---

## 4. Routing

### 4.1 Public Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Home | Hero, about summary, featured projects, skills preview, contact CTA |
| `/about` | About | Long bio, skills, timeline summary |
| `/projects` | Projects | Grid with filter by technology and search |
| `/projects/:slug` | Project Details | Gallery, description, tech stack, links |
| `/experience` | Experience | Employment timeline |
| `/education` | Education | Academic timeline |
| `/certificates` | Certificates | Certificate list with credential links |
| `/services` | Services | Offered services |
| `/contact` | Contact | Contact form writing to `contact_messages` |
| `*` | Not Found | 404 page |

### 4.2 Admin Routes

| Path | Page |
| --- | --- |
| `/admin/login` | Login |
| `/admin` | Dashboard (counts, recent messages) |
| `/admin/profile` | Profile (single record editor) |
| `/admin/about` | About sections |
| `/admin/skills` | Skills + categories |
| `/admin/projects` | Projects CRUD, gallery, technologies |
| `/admin/experience` | Experience CRUD |
| `/admin/education` | Education CRUD |
| `/admin/certificates` | Certificates CRUD |
| `/admin/services` | Services CRUD |
| `/admin/social-links` | Social links CRUD |
| `/admin/messages` | Messages inbox (read / archive / delete) |
| `/admin/media` | Media library |
| `/admin/settings` | Site settings (single record editor) |

### 4.3 Route Protection

Two independent layers, as required by `AGENTS.md`:

1. **Frontend guard** — `ProtectedRoute` checks the auth session. Good UX, not security.
2. **Database RLS** — every write is rejected by Postgres unless the caller is listed in
   `admin_users`. This is the actual security boundary.

An unauthenticated or non-admin user calling the Supabase API directly receives empty
results on protected tables and permission errors on writes, regardless of the frontend.

---

## 5. State Strategy

| Kind of state | Tool | Notes |
| --- | --- | --- |
| Server data (portfolio content) | TanStack Query | Cached, invalidated on mutation |
| Auth session | Supabase Auth + `AuthProvider` | Single source; no duplicate copy |
| Form state | React Hook Form | Never mirrored into React state |
| URL state (filters, search, pagination) | React Router search params | Shareable and back-button friendly |
| UI state (open dialog, active tab) | Local component state | Never global unless genuinely shared |
| Theme | `ThemeProvider` (light/dark/system) | Persisted to `localStorage`, applied as a class on `<html>` |

No Redux, no Zustand. If a need for global client state appears later, it is added only
after confirming it cannot be expressed as server state, URL state, or local state.

---

## 6. Database Schema

Design rules: `snake_case`, UUID primary keys, `created_at` / `updated_at` on every table,
`sort_order` for owner-controlled ordering, `is_published` for draft content,
foreign keys with explicit delete behaviour, and indexes only where a query needs them.

### 6.1 Entity Relationship Summary

```text
site_settings (single row)
profile      (single row)

about_sections

skill_categories ──< skills

projects ──< project_technologies >── technologies
        ├──< project_images

experiences
educations
certificates
services
social_links

contact_messages
media
admin_users ──> auth.users
```

### 6.2 Tables

#### `profile` — the person (single row)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Fixed single row, enforced by a unique index |
| `full_name` | `text` NOT NULL | |
| `headline` | `text` | e.g. "Flutter & Mobile Developer" |
| `short_bio` | `text` | Used on home hero |
| `bio` | `text` | Long form, About page |
| `avatar_path` | `text` | Storage path, not URL |
| `cover_path` | `text` | Optional hero background |
| `resume_path` | `text` | Optional CV file |
| `location` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `availability_status` | `text` | e.g. "available", "open to offers" |
| `years_of_experience` | `int` | |
| `updated_at` | `timestamptz` | Trigger-maintained |

Single-row tables are enforced with a partial unique index on a constant, so a second
insert fails at the database level instead of relying on frontend discipline.

#### `site_settings` — site-wide configuration (single row)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Single row |
| `site_title` | `text` NOT NULL | |
| `meta_description` | `text` | Default SEO description |
| `og_image_path` | `text` | Default social share image |
| `default_theme` | `text` | `light` / `dark` / `system` |
| `footer_text` | `text` | |
| `copyright_text` | `text` | |
| `show_availability_badge` | `boolean` | |
| `updated_at` | `timestamptz` | Trigger-maintained |

#### `about_sections`

`id`, `title`, `content`, `image_path`, `sort_order`, `is_published`, timestamps.
Multiple ordered paragraphs/blocks for the About page.

#### `skill_categories`

`id`, `name`, `slug` UNIQUE, `sort_order`, timestamps.
Grouping avoids repeating a category string on every skill.

#### `skills`

`id`, `name`, `category_id` → `skill_categories.id` ON DELETE SET NULL,
`proficiency` (`smallint` 0–100, nullable), `icon_path`, `sort_order`, `is_published`,
timestamps.

#### `projects`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `title` | `text` NOT NULL | |
| `slug` | `text` UNIQUE NOT NULL | URL segment, generated from title |
| `summary` | `text` | Card and SEO description |
| `description` | `text` | Detail page body |
| `cover_image_path` | `text` | |
| `repository_url` | `text` | |
| `live_url` | `text` | |
| `role` | `text` | e.g. "Flutter Developer" |
| `client_name` | `text` | Optional |
| `is_featured` | `boolean` | Shown on home page |
| `is_published` | `boolean` | Draft support |
| `sort_order` | `int` | |
| `started_at` / `ended_at` | `date` | Nullable end date |

#### `project_technologies` — join table

`project_id` → `projects.id` ON DELETE CASCADE, `technology_id` → `technologies.id`
ON DELETE CASCADE, composite primary key. Normalised, so a technology name is stored
once and can be filtered without string matching.

#### `technologies`

`id`, `name`, `slug` UNIQUE, `icon_path`, `sort_order`, timestamps.

#### `project_images` — gallery

`id`, `project_id` → `projects.id` ON DELETE CASCADE, `path`, `alt_text`,
`sort_order`, timestamps. `alt_text` is required for accessibility.

#### `experiences`

`id`, `company`, `title`, `description`, `location`, `employment_type`,
`start_date` (date NOT NULL), `end_date` (date, NULL when current),
`is_current` (boolean), `sort_order`, `is_published`, timestamps.
A check constraint keeps `end_date` null only when `is_current` is true.

#### `educations`

`id`, `institution`, `degree`, `field_of_study`, `description`, `logo_path`,
`start_date`, `end_date`, `grade`, `sort_order`, `is_published`, timestamps.

#### `certificates`

`id`, `title`, `issuer`, `issued_on` (date), `credential_id`, `credential_url`,
`image_path`, `sort_order`, `is_published`, timestamps.

#### `services`

`id`, `title`, `description`, `icon_path`, `price_hint`, `sort_order`, `is_published`,
timestamps.

#### `social_links`

`id`, `platform` (e.g. `github`), `label`, `url`, `icon_path`, `sort_order`,
`is_published`, timestamps. `platform` drives which Lucide icon is rendered.

#### `contact_messages`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `name` | `text` NOT NULL | |
| `email` | `text` NOT NULL | |
| `subject` | `text` | |
| `message` | `text` NOT NULL | |
| `is_read` | `boolean` | Default false |
| `is_archived` | `boolean` | Default false |
| `created_at` | `timestamptz` | |

Public visitors may insert. Nobody except an admin may read, update, or delete. This is
the only table where the public has write access, and it is insert-only by policy.

#### `media` — media library metadata

`id`, `bucket`, `path`, `file_name`, `mime_type`, `size_bytes`, `width`, `height`,
`alt_text`, `created_by`, timestamps. File bytes live in Storage, never in Postgres.

`bucket` holds the readable Storage bucket name (`portfolio-media` or `portfolio-files`),
not a foreign key. `storage.buckets` lives in a Supabase-managed schema that the client
cannot join to, so a foreign key would be unenforceable and a stored uuid would be
meaningless to anyone reading the row. A `CHECK` constraint restricts the column to the two
known bucket names instead, which is the guarantee a foreign key would have given.

#### `admin_users` — the authorization allowlist

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` UNIQUE → `auth.users.id` ON DELETE CASCADE | |
| `email` | `text` | For readability in the dashboard |
| `created_at` | `timestamptz` | |

A user is an admin **only** if a row exists here. Being merely "authenticated" grants
nothing. This is the explicit authorization model `AGENTS.md` requires.

### 6.3 Shared Database Objects

- `public.set_updated_at()` — trigger function keeping `updated_at` current. Attached to
  every content table so no frontend code has to remember it.
- `public.contact_messages_seal_insert()` — `BEFORE INSERT` trigger forcing `id`,
  `created_at`, `is_read` and `is_archived` on `contact_messages`, so a visitor cannot
  supply them.
- `private.is_admin()` — `SECURITY DEFINER`, `STABLE`, fixed `search_path`, returns
  `true` only when `auth.uid()` appears in `admin_users`. Used by every admin policy.
  Because it is `SECURITY DEFINER`, it can read `admin_users` without exposing that
  table to the client.

#### Why `is_admin()` lives in a `private` schema

It has to be `SECURITY DEFINER`, because it reads `admin_users`, which the client is not
allowed to read. RLS cannot express "evaluate this check as a different role", so the
function is the only way a policy can ask the question.

That combination has one consequence worth being explicit about: a `SECURITY DEFINER`
function in `public` is exposed by PostgREST as an RPC endpoint at `/rest/v1/rpc/is_admin`,
reachable by any signed-in user. Supabase's database linter flags this as
`authenticated_security_definer_function_executable`.

Moving the function to `private` removes the endpoint. PostgREST serves only `public` by
default, so the function is unreachable over the API while remaining callable from inside
a policy expression, which runs as the querying role. `authenticated` therefore keeps the
`EXECUTE` grant it needs and loses the HTTP route it did not need.

The frontend never calls this function. It learns whether the signed-in user is an admin by
reading its own `admin_users` row, which the `admin_users_self_read` policy returns only
for an admin — so the RLS policy is the single place that decides what "admin" means, and
there is no second code path that could disagree with it.

---

## 7. RLS Strategy

Row Level Security is enabled on **every** table. No table is left unprotected.

### 7.1 Policy Matrix

| Table | Public read | Public write | Admin |
| --- | --- | --- | --- |
| `profile` | yes | no | full |
| `site_settings` | yes | no | full |
| `about_sections` | `is_published = true` | no | full |
| `skill_categories` | yes | no | full |
| `skills` | `is_published = true` | no | full |
| `projects` | `is_published = true` | no | full |
| `project_images` | via published project | no | full |
| `technologies` | yes | no | full |
| `project_technologies` | via published project | no | full |
| `experiences` | `is_published = true` | no | full |
| `educations` | `is_published = true` | no | full |
| `certificates` | `is_published = true` | no | full |
| `services` | `is_published = true` | no | full |
| `social_links` | `is_published = true` | no | full |
| `contact_messages` | **none** | insert only | full |
| `media` | **none** | none | full |
| `admin_users` | own row only | **none** | none (seeded by owner/CLI) |

Notes on intent:

- Public reads are limited to published content, so drafts never leak.
- `contact_messages` is insert-only for the public. Insert policies use
  `WITH CHECK`, which constrains what may be written: a visitor cannot mark their own
  message as read, cannot forge `created_at`, and cannot insert an id belonging to
  another row.
- `admin_users` has no client insert/update/delete policy at all. Promotion to admin is
  never something the application can do to itself.
- Child tables (`project_images`, `project_technologies`) are read through a join to a
  published project, so an unpublished project leaks nothing, not even its images.

### 7.2 Verification Approach

RLS is not "verified" by reading the policies. Phase 2 and Phase 9 will execute SQL as
four distinct roles — `anon`, `authenticated` non-admin, admin, and service role — and
assert the expected allow/deny result for each operation. The SQL lives in
`supabase/migrations/tests/` so it can be re-run.

---

## 8. Storage Strategy

### 8.1 Buckets

| Bucket | Public | Purpose |
| --- | --- | --- |
| `portfolio-media` | yes | Images: avatar, project covers, galleries, certificates, logos, tech icons, OG image |
| `portfolio-files` | yes | Documents: resume PDF |

Decision: both buckets are public. Reason — the public portfolio must render images
directly in `<img>` tags and Open Graph tags for social crawlers. Signed URLs would
expire, would complicate SEO previews, and would require a server to mint them, which
this project does not have. Writes remain admin-only, so the buckets are read-public and
write-restricted.

If a private document is ever needed (for example an unpublished client report), it
gets its own private bucket with admin-only policies. That change is local and does not
affect the schema.

### 8.2 Object Layout

Folder prefixes inside `portfolio-media` keep the bucket navigable and make it easy to
apply folder-scoped rules later.

```text
portfolio-media/
├── profile/       avatar, cover
├── projects/      covers and galleries
├── certificates/  certificate images
├── experience/    company logos
├── education/     institution logos
├── technologies/  stack icons
└── misc/          anything unclassified
```

### 8.3 Storage Rules

- Uploads are admin-only, enforced by policies on `storage.objects`.
- File type is restricted per bucket by `allowed_mime_types` (images only for
  `portfolio-media`; PDF only for `portfolio-files`).
- File size is capped at the bucket level (`5 MB` for images, `10 MB` for files).
- The frontend re-validates type and size before upload, because client validation
  improves the error message but is not a security control.
- Object keys are generated from a sanitised name plus a random suffix, so uploads never
  overwrite each other by accident.

---

## 8.4 Sample Content

The live database holds clearly-marked placeholder content so the public pages can be
verified against real data rather than only against empty states.

| File | Purpose |
| --- | --- |
| `supabase/seed.sql` | The content, plus a header explaining what it is and how to reverse it |
| `supabase/cleanup_sample_content.sql` | Removes it, filtered on the seed's id prefix |

Two properties make this safe to keep in the repository:

1. **Every seeded row has a deterministic id** of the form
   `5eed0000-0000-4000-8000-0000000000NN`. The cleanup script deletes by that prefix, so it
   cannot touch a row the owner creates later through the admin dashboard, whatever its
   content. Running it twice is harmless.
2. **Every visitor-facing string carries a `[Sample]` prefix**, so placeholder content is
   obvious on screen and never mistaken for the owner's real work.

Neither file is a migration. Placeholder data must not be baked into migration history, where
it would follow the project into production.

The seed deliberately contains the cases that break naive queries:

- a **published** skill with no `category_id`, which a `!inner` embed silently drops;
- an **unpublished** skill, which proves `is_published` filtering rather than only join
  behaviour;
- an **unpublished project**, which proves RLS and the grid both hide a draft, and which the
  project detail page must report as "not found" without leaking its content.

---

## 9. Authentication and Authorization

### 9.0 Verified live behaviour

The allowlist model was tested against the live project with three separate accounts rather
than by reading the policies. Each result below is an observed response, not an expectation.

| Caller | `admin_users` read | `contact_messages` read | Draft project | Write to `projects` | Write to `admin_users` |
| --- | --- | --- | --- | --- | --- |
| anonymous | no rows | denied | not visible | denied | denied |
| signed in, no allowlist row | `[]` | `[]` | not visible | **denied** | **denied** |
| signed in, on allowlist | own row | readable | visible | allowed | denied |

Two results carry the design:

- A signed-in user with **no** allowlist row gets an empty `admin_users` result rather than
  an error, and can still read published content. That is why the dashboard guard can treat
  "no row" as "not an admin" and show an explanation, instead of a broken page of errors.
- That same user is **denied** every write, including an attempt to insert their own
  `admin_users` row. `admin_users` holds no client `INSERT` grant, so privilege escalation is
  impossible even for a logged-in user who is not an admin. The application can never promote
  itself.

### 9.1 Authentication

Supabase Auth with email and password.

- Session persisted by the Supabase client and restored on load.
- `AuthProvider` exposes `session`, `user`, `isLoading`, `signIn`, `signOut`.
- Protected routes render a loading state while the session is being restored, then
  either the page or a redirect to `/admin/login`.
- Expired sessions are handled by Supabase's auto-refresh; a failed refresh signs the
  user out and redirects with an explanatory message rather than a blank screen.

Decisions:

- **No public sign-up.** Self-registration is disabled in Supabase Auth settings, so the
  only accounts are ones the owner creates. This is a security control, not a UI choice.
  See section 9.3 — this was configured late, and the live project had it open until
  Phase 4.
- **No social login** for admin. One credential path is easier to reason about and to
  secure. Revisit only if the owner asks for it.
- **No password reset UI in Phase 4**, but the Supabase reset email flow stays enabled so
  a locked-out owner is not permanently locked out.
- **A valid session is not an admin.** The two are separate claims, so `RequireAdmin` asks
  both questions: is there a session, and is that session on the allowlist. A user who
  somehow obtained an account is shown an explanation, not a dashboard whose every request
  the database refuses.
- **`admin_users` is read with no filter.** The `admin_users_self_read` policy already
  restricts the result to `auth.uid()`. Adding `.eq('user_id', ...)` client-side would be
  redundant, and dropping the policy later would then silently expose every row. The policy
  is the single source of truth.
- **The query cache is cleared on sign-out, before the network call.** Admin status is
  cached, and a failed sign-out must not leave the previous admin's result in the cache for
  whoever signs in next.

### 9.3 Sign-up must be disabled in Supabase, and it was not

This is recorded because the documentation was wrong before the database was checked.

`ARCHITECTURE.md` asserted self-registration was disabled. The live Auth settings reported
`disable_signup: false`, meaning **any visitor could create an account**. The RLS design
contained the damage — a self-registered user gets read access to published content and no
writes, and cannot add themselves to `admin_users` — so this was never a path to admin. But
it contradicted the stated design, and "authenticated" quietly meaning "anyone on the
internet" is exactly the kind of assumption that becomes dangerous after the next change.

Two lessons, and the second matters more than the first:

1. Verify a security setting against the running project. A design document is a claim.
2. Account creation cannot be closed from the database. Disabling sign-up is a Supabase Auth
   setting, and no migration or RLS policy can enforce it. It has to be checked at deploy
   time, so it belongs in the release checklist in section 16.

### 9.2 Authorization

Three checks, in order:

1. Is the user authenticated? (Supabase session)
2. Is the user in `admin_users`? (`is_admin()`, checked via RLS)
3. Does the specific policy allow this operation?

The frontend uses step 1 for UX and step 2 for navigation. Step 3 is enforced by
Postgres and is what actually matters. A user who bypasses the frontend entirely still
cannot write anything.

---

## 10. UI and Design Direction

Professional developer portfolio with restrained modern motion.

### 10.1 Design Tokens

shadcn/ui with CSS custom properties in `index.css`, defining light and dark values for
background, foreground, card, muted, primary, secondary, accent, destructive, border,
input and ring. Both themes use the same component structure — only token values change.

Visual direction:

- Neutral surface with a single confident accent colour, plus one warm highlight.
- Generous spacing, one type scale, one radius scale, one shadow scale.
- Dark mode is a first-class token set, not an inverted afterthought.
- Contrast meets WCAG AA in both themes.

### 10.2 Motion

One animation library, used for:

- Fade-and-rise on scroll into view (once, short distance, fast).
- Subtle hover lift on interactive cards.
- Page-level transitions kept under 200 ms.

Explicitly avoided: parallax, scroll-jacking, animated counters, auto-playing carousels,
motion on body text. Respect `prefers-reduced-motion` and disable animation for users
who request it.

### 10.3 Responsive Strategy

Mobile-first, container-driven layout.

| Breakpoint | Behaviour |
| --- | --- |
| < 640 px | Single column, drawer navigation, stacked forms |
| 640–1024 px | Two-column grids, full navigation bar |
| 1024–1280 px | Three-column grids where useful, constrained content width |
| > 1280 px | Content capped at a max width; no stretched text lines |

Grids use `auto-fill` with `minmax` so they reflow without per-breakpoint column counts.
Tables in the admin switch to stacked cards on small screens rather than scrolling
horizontally.

### 10.4 Reusable UI Components

`components/ui/` — shadcn/ui primitives (button, input, textarea, label, card, dialog,
select, table, badge, toast, skeleton, tabs, switch, tooltip, dropdown-menu).

`components/common/` — project patterns reused across pages:

| Component | Purpose |
| --- | --- |
| `Section` | Consistent page section with spacing rhythm |
| `SectionHeading` | Title, subtitle, alignment |
| `PageHeader` | Admin page title, description, primary action |
| `EmptyState` | Icon, message, optional call to action |
| `ErrorState` | Human-readable message plus retry |
| `LoadingState` / skeletons | Never a blank screen |
| `ConfirmDialog` | Standard destructive confirmation |
| `DataTable` | Columns, rows, loading, empty, error, row actions |
| `ImageUpload` | Upload, preview, replace, remove, validation |
| `FormField` | Label, input, error message, help text, correct `aria` wiring |

---

## 11. SEO Strategy

| Requirement | Approach |
| --- | --- |
| Page titles and descriptions | `useSeo` hook backed by `site_settings` and per-page data |
| Open Graph / Twitter | Same hook, using the configured OG image |
| Canonical URLs | Absolute URL from the configured site URL |
| Semantic HTML | `header`, `nav`, `main`, `section`, `article`, `footer`, single `h1` per page |
| Heading hierarchy | Strict order, no skipped levels |
| Image alt text | Required field in `project_images`; descriptive elsewhere |
| `robots.txt` | Static file, allows public pages and disallows `/admin` |
| `sitemap.xml` | Static base entries plus a small script that appends published project slugs |
| Structured data | `Person` JSON-LD on home, `BreadcrumbList` on detail pages |
| Admin pages | `noindex, nofollow` and excluded from the sitemap |

Note on honesty: since this is a client-rendered SPA, social crawlers that do not execute
JavaScript will see only the base metadata in `index.html`. This is an accepted
limitation of the chosen architecture, and the metadata in `index.html` is kept accurate
and generic so link previews are never wrong or empty.

---

## 12. TypeScript and Data Typing

- `src/types/database.ts` is generated from the live Supabase schema, never hand-written.
  It is regenerated after every migration so it cannot drift.
- `src/types/entities.ts` exposes app-facing aliases such as `Project` and `Profile`, so
  components never reference raw row types directly.
- Strict mode, no `any`. Zod schemas define form shapes and the types are inferred from
  them with `z.infer`, so forms and types cannot disagree.

### 12.1 The `snake_case` to `camelCase` rename

PostgreSQL columns are `snake_case`; the rest of the app is `camelCase`. The rename happens
once, in `src/services/base.ts`, and nowhere else.

It cannot drift from the schema, because the return type of the transform is
`Row<TableName>`, and that type is itself *derived* from the generated database types. Rename
a column, regenerate the types, and the compiler reports it at every call site. The runtime
rule and the compile-time type describe the same thing, so they cannot disagree.

It is recursive, because an embedded relation arrives under a key named after its table:
`project_technologies: [{ technology: { icon_path } }]` has to become
`projectTechnologies: [{ technology: { iconPath } }]` for the UI to read it at all.

The known cost: a `jsonb` column's *own* keys would also be renamed. No table in this schema
stores arbitrary JSON, so nothing is affected. If such a column is ever added, the transform
must skip its value.

### 12.2 Single-row and mutation reads

Reading one row or reading back a write goes through `fetchFirst` or `fetchOne`, never
through `runQuery` plus `rows[0]`.

That is not a style preference. `runQuery` returns the raw rows, and casting them to a
camelCase type is legal TypeScript, so the mistake produces `undefined` for every field at
runtime while passing the compiler, the unit tests, and the build. It happened to
`getProfile` and `getSiteSettings`, and it was only found by rendering a real page against
the real database. One function per shape removes the opportunity.

---

## 12.3 Link semantics

`Button` is for actions: submitting, filtering, opening a dialog. Navigation uses
`LinkButton`, `ExternalLinkButton`, or `DestinationButton` from
`src/components/ui/link-button.tsx`, which reuse the same `buttonVariants` styling.

The reason is not cosmetic. Base UI's `Button` sets `role="button"` on whatever element it
renders, including an `<a>`. That makes assistive technology announce a link as a button and,
more seriously, removes it from the list of links a screen-reader user navigates by. The
primary calls to action on every public page are exactly the links that should be in that
list.

`DestinationButton` exists because the same database field is sometimes a path and sometimes
a full URL — `repository_url`, `live_url`, and `profile.resume_path` are all owner-supplied
strings. `destinationFor` in `src/lib/destination.ts` is the single place that decides, so
the header, the footer, the social links, and the SEO helper cannot disagree.

It tests the raw string for a leading scheme rather than resolving it against a base first.
Resolving is the obvious approach and it is wrong: `new URL('/projects', 'http://example.com')`
reports the protocol `http:`, so every internal path would be classified as external and
handed to an anchor instead of the router.

---

## 13. Error Handling

| Layer | Responsibility |
| --- | --- |
| `services/*.ts` | Convert Supabase errors into a typed `Result`-style throw with a readable message |
| `hooks/*.ts` | Surface failures to React Query so components render `ErrorState` |
| Components | Render the error state, offer retry, never swallow silently |
| Global | TanStack Query default retry and error logging configured in one place |

User-facing messages are human ("Could not save the project. Please try again.").
Technical detail stays in the console for debugging and never contains secrets.

---

## 14. Testing Strategy

| Level | Tool | Focus |
| --- | --- | --- |
| Unit | Vitest | Zod schemas, formatters, slug generation, helpers, the key rename |
| Component | Vitest + React Testing Library | Empty/error/loading states, form validation, dialogs |
| Route | Vitest | Route tree shape, unauthenticated redirect |
| Live API | Vitest, opt-in | Every service against the real project, asserting real response shapes |
| Live render | Vitest + RTL, opt-in | Every public page rendering real database content |
| Database / RLS | SQL executed through Supabase MCP | Every policy, per role |
| Build | `tsc` + `vite build` + oxlint | Compilation and rules |

Priority order follows `AGENTS.md`: authentication, authorization, database operations,
forms and validation, then critical flows.

### 14.1 Why the live tests are separate

`npm run test` is hermetic: no network, no assumption about what rows exist. The live tests
are opt-in and run the same services against the real project:

```bash
npm run test:live
```

They are not redundant with the unit tests. All three of the real bugs found in Phase 3
passed typecheck, passed lint, passed the unit tests, and passed the production build:

- two services returned `snake_case` keys while typed as camelCase, so every field resolved to
  `undefined` at runtime;
- every navigation link carried `role="button"` and so was missing from the list of links a
  screen-reader user navigates by;
- a managed `copyright_text` column had no consumer, and a social-links hook was fetched but
  rendered nowhere.

None of those are type errors or logic errors. They are mismatches between the code and the
shape of a real response from a real database, and only a real response rendered by the real
component exposes them.

The form-submission test cannot delete its own row, because the anonymous role holds `INSERT`
on `contact_messages` and nothing else. The row it leaves behind is tagged with a known
subject so it can be found and removed.

---

## 15. Environment Variables

```text
VITE_SUPABASE_URL=https://utncrpncpehtscbuygvp.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable anon key>
VITE_SITE_URL=https://example.com
```

Only the publishable anon key is used in the frontend. This key is safe to ship: it is
protected by RLS, which is precisely why the RLS design above is strict. The service role
key is never used, never stored, and never referenced in frontend code.

---

## 16. Known Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Client-side rendering limits SEO for crawlers that skip JS | Accurate base metadata, JSON-LD, sitemap, clean URLs |
| Public read buckets allow hotlinking of images | Acceptable for a personal portfolio; bucket-level rate limiting is available if it ever matters |
| Contact form is open to spam | Insert-only policy, honeypot field, and length constraints; CAPTCHA only if spam appears |
| Owner edits drafts and forgets to publish | Draft badge and a "unpublished items" count on the dashboard |
| Adding a dependency later without justification | Re-check against `AGENTS.md` before every install |
| Supabase Auth settings drift from this document, as sign-up already did | Re-verify Auth settings before every deploy. They are not migrations and cannot be enforced by RLS; see section 9.3 |
| A second admin is added without a matching `admin_users` row | The account authenticates but the dashboard shows "You are not an admin" rather than failing silently. Adding the row is a deliberate owner action |

### 16.1 Pre-deploy checklist

Items that no migration, test, or build can catch, because they live in Supabase's own
configuration:

- [ ] Public sign-up is **disabled** (Authentication → Sign In / Providers).
- [ ] Leaked-password protection is **enabled** (Authentication → Attack Protection). It
      reports as disabled in the security advisor, and it rejects any password found in a
      public breach corpus.
- [ ] Admin email confirmation is not required for the owner's existing account, and
      **is** left required for any future invite flow.
- [ ] Only the publishable anon key is in `.env`; no service-role key anywhere.
- [ ] Both Storage buckets are public-read and admin-write.
- [ ] Security advisories report 0 findings.

---

## 17. Phase Boundaries

| Phase | Scope |
| --- | --- |
| 0 | Discovery and this document |
| 1 | Vite + React + TS + Tailwind + shadcn + Router + Query + RHF/Zod, layouts, design tokens, base components, build verification |
| 2 | Supabase schema, indexes, RLS, Storage buckets and policies, generated types, RLS verification |
| 3 | Public portfolio pages reading from Supabase |
| 4 | Admin authentication and route protection |
| 5 | Admin dashboard CRUD sections |
| 6 | Media management |
| 7 | Public UX polish and filtering |
| 8 | SEO and accessibility |
| 9 | Testing and security verification |
| 10 | Deployment |

Nothing from a later phase is implemented early. Each phase ends with verification and an
update to `PROJECT_STATUS.md`.
