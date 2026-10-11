# Portfolio

A fully dynamic personal portfolio website with an authenticated admin dashboard (CMS). The public site reads all content from Supabase — no hardcoded portfolio content. The owner manages everything (profile, projects, skills, experience, education, certificates, services, messages, media, settings) through `/admin`.

## Features

**Public site**

- Home, About, Projects, Project detail (`/projects/:slug`), Experience, Education, Certificates, Services, Contact
- Technology filtering via URL query string (shareable, back-button friendly)
- Contact form with validation, honeypot, and success/failure feedback
- Responsive, accessible, SEO foundations (canonical, Open Graph, sitemap, robots, JSON-LD)
- Light/dark themes

**Admin dashboard (`/admin`)**

- Dashboard with content counts, draft counts, recent messages
- Full CRUD for projects (with gallery + technologies), skills, technologies, skill categories, experience, education, certificates, services, about sections, social links
- Single-row editors for profile and site settings
- Contact inbox: filtered views, counts, read/archive/delete (messages are never edited)
- Media library: upload, usage tracking (`Used by …`), unused filter, unrecorded-object scan
- Email/password auth with explicit `admin_users` allowlist

## Tech Stack

| Concern | Choice |
| --- | --- |
| Frontend | React 19, TypeScript (strict), Vite 8 |
| Styling | Tailwind CSS v4, shadcn/ui (`@base-ui/react`), Lucide icons |
| Routing | React Router v7 (`BrowserRouter`) |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions, RLS) |
| Tests | Vitest + React Testing Library |
| Lint | oxlint, Prettier, `tsc -b` |

No global client-state library. No custom server — the build output is a static bundle.

## Architecture

Four layers. Each layer may only depend on the layer below it:

```text
pages / layouts        → screens, compose features
components, features   → reusable UI and per-entity logic
services, hooks        → data access and React integration
lib, types, utils      → infrastructure and pure helpers
```

Rule: **Supabase queries never appear inside a UI component.** A component calls a hook (`src/features/*/hooks.ts`), a hook calls a service (`src/services/*.ts`), the service owns the query. Query keys are centralized in `src/lib/queryKeys.ts`.

Database columns are `snake_case`; the app is `camelCase`. The rename happens once in `src/services/base.ts` (`fetchFirst` / `fetchOne` for single-row and mutation reads).

Details: `ARCHITECTURE.md`. Deployment runbook: `DEPLOYMENT.md`. Running status: `PROJECT_STATUS.md`.

## Getting Started

Prerequisites: Node.js 20+, npm 10+.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

Vite bakes `VITE_*` values into the bundle at **build time**.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable anon key (public by design, protected by RLS) |
| `VITE_SITE_URL` | Absolute site origin, no trailing slash. `http://localhost:5173` locally; production origin in hosting env |

Never put the `service_role` key in this repo or in frontend env vars. `.env` is git-ignored.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Regenerate `sitemap.xml` + `robots.txt`, then typecheck + production build to `dist/` |
| `npm run sitemap` | Regenerate `public/sitemap.xml` + `public/robots.txt` only |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` / `lint:fix` | oxlint |
| `npm run test` | Hermetic unit/component tests (offline) |
| `npm run test:live` | Live suite against real Supabase (needs admin credentials, see below) |
| `npm run verify` | `typecheck` + `lint` + `test` + `build` |
| `npm run preview` | Serve production build locally |

Live tests (opt-in, never run by default):

```bash
VITE_LIVE_ADMIN_EMAIL='you@example.com' VITE_LIVE_ADMIN_PASSWORD='...' npm run test:live
```

## Supabase Backend

Project reference: `utncrpncpehtscbuygvp`.

- Schema source of truth: `supabase/migrations/` (17 tables in `public`, RLS on every table, 40+ indexes, constraints, `private.is_admin()` helper).
- Key tables: `profile`, `site_settings` (single-row), `about_sections`, `skill_categories`, `skills`, `technologies`, `projects`, `project_technologies`, `project_images`, `experiences`, `educations`, `certificates`, `services`, `social_links`, `contact_messages`, `media`, `admin_users`.
- RLS verification: `supabase/migrations/tests/rls_verification.sql` (78 assertions; see `PROJECT_STATUS.md` for re-run limits on populated DBs).
- Storage buckets: `portfolio-media` (images, 5 MB cap), `portfolio-files` (resume PDF, 10 MB cap). Both public-read, admin-write-only.
- Contact notifications: `AFTER INSERT` trigger via `pg_net` → `contact-notify` Edge Function (`supabase/functions/contact-notify/`) → Resend. Secrets (`RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, optional `CONTACT_FROM_EMAIL`) live in Supabase Edge Function secrets, never in the repo.
- Sample content: `supabase/seed.sql` + `supabase/cleanup_sample_content.sql` (deterministic `[Sample]` rows, reversible, never migrations).

Supabase dashboard items that code cannot enforce (check before every deploy): public sign-up **disabled**, leaked-password protection **enabled**, Site URL + Redirect URLs set to production origin, exactly one admin user with an `admin_users` row, 0 security advisories.

## Deployment

Any static host works. Requirement: serve `index.html` for unknown paths (client-side routing).

Recommended: **Cloudflare Pages** (free, unlimited bandwidth, commercial use allowed).

- Connect the GitHub repo, set build command `npm run build`, output directory `dist`, Node 20+.
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` (production origin) in the host's env settings **before** building.
- SPA fallback on Cloudflare: `public/_redirects` with `/* /index.html 200` (or Pages SPA routing option).
- Post-deploy: Supabase Auth Site URL → production origin, verify all public routes load directly, sign in at `/admin`, submit a test contact message, load `/sitemap.xml` and `/robots.txt`.

Full checklist: `DEPLOYMENT.md`.

## Project Structure

```text
src/
├── app/            # route table, providers
├── components/     # ui/ (shadcn) + reusable patterns (DataTable, dialogs, forms)
├── features/       # one folder per entity: hooks + presentation
├── pages/          # public/ + admin/ screens (compose features, no queries)
├── layouts/        # PublicLayout, AdminLayout, AuthLayout
├── services/       # sole Supabase access layer, one file per entity
├── schemas/        # Zod form schemas
├── types/          # database.ts (generated) + entities.ts (app-facing)
├── hooks/          # useSeo, useAuth, useMediaUrl, …
├── lib/            # supabase client, query client/keys, seo, destination
├── routes/         # publicRoutes, adminRoutes
├── constants/ utils/
supabase/
├── migrations/     # schema + RLS + storage + triggers
├── functions/contact-notify/
├── seed.sql / cleanup_sample_content.sql
scripts/
└── generate-sitemap.mjs
```

Conventions: files under ~120 lines where practical, one responsibility per component, `Result`-style service errors surfaced as `ErrorState` with retry, never silent `catch {}`.

## Security Model

- A valid session is not admin status. `RequireAdmin` checks both; Postgres RLS is the real boundary.
- `anon` can only `SELECT` public content + `INSERT` contact messages. It cannot read the inbox or write content.
- `admin_users` has no client write policy — the app can never promote itself.
- Public Storage buckets allow hotlinking (accepted for a portfolio). Contact form has insert-only policy + sealed `is_read`/`is_archived` + rate-limited notifications (10 emails / 10 min).

## Testing

`npm run test` is fully offline. `npm run test:live` exercises services, pages, and admin CRUD against the real project. Priority order: auth, authorization, DB operations, forms/validation, critical flows. Important behavior is verified by execution (typecheck, lint, build, live API), never claimed from reading code.
