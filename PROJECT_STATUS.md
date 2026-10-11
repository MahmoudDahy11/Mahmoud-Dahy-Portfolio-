# PROJECT_STATUS.md

Last updated: October 11, 2026 — design refinement pass (light preserved, dark redesigned),
implemented and verified. Light theme keeps its exact palette with a recomposed hero (no
decorative shapes or framing, quiet text links for contact/CV actions), a lead-feature
project layout, and de-carded Services/Certificates/Contact/CTA sections. Dark theme is a
new intentional palette (charcoal #141414, section #1B1B1B, card #1D1D1D, off-white #F1EEE8,
warm gray #AAA49B, borders #353535, same brand orange). Gate run today: `npm run verify`
green (162 hermetic tests passed, 32 live-gated skipped; typecheck, lint, build clean).

Button-label fix (same session): `variant="link"`/`"ghost"` link-buttons rendered orange
text on an unintended orange background (empty colored rectangles in the hero and track
panels). Root cause was `VARIANT_CLASSES` in `src/components/ui/link-button.tsx` prepending
the default variant's `bg-primary`, which `tailwind-merge` keeps whenever the chosen variant
declares no background. Removed the prepend (the only change); verified with headless
Chromium computed styles plus screenshots in both themes, then re-ran the full suite green.
Previous state below is unchanged.

Last updated: October 7, 2026 — contact-form email notifications, complete and verified end
to end. A visitor's message is stored and emailed to the owner: an `AFTER INSERT` trigger
queues a call to the `contact-notify` Edge Function with pg_net, and that function reads the
row back and sends it through Resend. The two secrets (`RESEND_API_KEY`,
`CONTACT_NOTIFY_EMAIL`) are set, and a live test through the anon REST path — the exact call
the form makes — returned 200 `{"ok":true}` from Resend 53 ms after the insert. The test row
was removed again. Gate run today: `npm run verify` green (132 hermetic tests, build clean).

The implementation is complete through the planned build phases, and deployment has been
prepared as `DEPLOYMENT.md`, but the project is not fully complete as a production site
until a static host is chosen, deployed, and the owner-controlled Supabase Auth settings are
confirmed. The last `npm run test:live` (October 6) could not be fully re-run because
`VITE_LIVE_ADMIN_EMAIL` and `VITE_LIVE_ADMIN_PASSWORD` were not available in the
environment; the network-enabled run reached Supabase and stopped at the missing credentials
check after 24 live tests passed and 7 credential-gated tests skipped.

This file is the running record of the project's real state. A feature is only listed as
complete after it has been verified, and the verification itself is listed below.

---

## Current Phase

**Phase 10 — deployment: PENDING OWNER DECISION.** Phases 0–9 are implemented and documented.
Phase 10 is prepared, not executed: no production host has been chosen and no deployed site
has been verified in a browser.

Current local gate: `npm run verify` green (128 hermetic tests, build clean). Current live
gate status: PARTIAL re-run on October 6, 2026 — network access succeeded, 24 live tests
passed, 7 credential-gated live tests were skipped, and 1 admin allowlist test stopped
because `VITE_LIVE_ADMIN_EMAIL` / `VITE_LIVE_ADMIN_PASSWORD` were not supplied.

Next: **choose and configure a production host**, then run the post-deploy checklist in
`DEPLOYMENT.md`.

---

## Phase 2 Summary (completed earlier, never written up)

Phase 2 built the entire Supabase backend. It is complete and verified; the gap was only in
this document.

### Schema

17 tables in `public`, all with RLS enabled, 40 indexes, 6 foreign keys, and constraints on
every column where a wrong value would be silently accepted.

| Group | Tables |
| --- | --- |
| Single-row | `profile`, `site_settings` |
| Content | `about_sections`, `skills`, `skill_categories`, `projects`, `project_technologies`, `project_images`, `technologies`, `experiences`, `educations`, `certificates`, `services`, `social_links` |
| Operational | `contact_messages`, `media`, `admin_users` |

Notable constraints, each added because the alternative was a bug that surfaces only in
production:

- `projects.slug`, `technologies.slug`, `skill_categories.slug` are unique.
- `experiences_current_dates_check` rejects a current role that also has an `end_date`.
- `skills.proficiency` is constrained to 0–100.
- `media.size_bytes > 0`, and `media` is unique on `(bucket, path)`.
- `contact_messages` constrains name, email, message, and subject lengths, which is the
  first line of defence against a junk inbox.
- `project_images.alt_text` is nullable (description optional, since 2026-10-06), but when
  present it must be non-empty — a gallery image can never ship with a blank description.

### Authorization

- `private.is_admin()` is `SECURITY DEFINER` and lives in a `private` schema. `anon` has no
  execute grant on it; `authenticated` does.
- The `narrow_grants` migration reduced table grants to the minimum each role needs, rather
  than granting blanket `SELECT`/`INSERT`/`UPDATE` and relying on policies alone. This
  matters: an absent grant is a second, independent barrier.
- `anon` has exactly two privileges on the whole database: `SELECT` on public content tables
  and `INSERT` on `contact_messages`. It cannot read the inbox, cannot update or delete a
  message, and cannot write any content.
- `admin_users` has no client write policy at all, so the application can never promote
  itself.

### Storage

Two public-read buckets, `portfolio-media` and `portfolio-files`, with admin-only write,
update, and delete policies. Public-read is required so images render in `<img>` tags and
Open Graph tags without expiring signed URLs.

### Verification

- `supabase/migrations/tests/rls_verification.sql` — 78 assertions across the anon,
  non-admin member, and admin roles.
- An 18-case live role smoke test was run over the real HTTP API and every case matched its
  expected result.
- Security advisories: 0, both before and after this phase.

---

## Phase 3 Summary

### What was implemented

Phase 3 replaced every public placeholder with a page that reads real content from
Supabase, and added the data-access layer the rest of the project depends on.

**Data-access layer** (`src/services/`)

One file per entity. This is the only layer permitted to talk to Supabase.

- `base.ts` owns the shared plumbing: error checking, the `snake_case` → `camelCase` rename,
  and the four read helpers.
- `profile`, `siteSettings`, `about`, `skills`, `projects`, `experience`, `education`,
  `certificates`, `services`, `socialLinks`, `contactMessages`, `mediaUrls`.
- `projects.ts` embeds the technologies and gallery in the same query, so the detail page
  makes one request instead of N+1, and computes the technology filter counts in the service
  where the data already is.
- `skills.ts` uses a left embed, not `!inner`, so a skill with no category is grouped rather
  than silently dropped. Verified against the live API, not assumed.

**Feature hooks** (`src/features/*/hooks.ts`)

TanStack Query hooks for every entity, with all query keys centralised in
`src/lib/queryKeys.ts` so no two components can disagree about a cache entry.

**Public pages**

All nine routes are implemented: home, about, projects, project detail, experience,
education, certificates, services, contact.

- Home composes the hero, three featured projects, a skills preview, an experience preview,
  and a contact call to action.
- Projects filters by technology through the URL query string, so a filtered view can be
  shared, bookmarked, and reached with the back button.
- Project detail renders a not-found state for a draft slug. A missing project and an
  unpublished one are deliberately indistinguishable, because the database cannot tell them
  apart either and confirming a draft's existence would leak it.
- Contact shows the email address before any message is written, and submits through a
  React Hook Form + Zod form with a honeypot, a pending state, and success and failure
  toasts.

**Layout and SEO**

- `PublicLayout` reads `site_settings` for the site name, footer text, copyright, and the
  document title.
- `usePageSeo` builds each page title from the managed `site_title` column rather than a
  hardcoded "Portfolio", so editing the site name in the admin dashboard actually changes
  the browser tab.
- Skeleton, empty, and error states on every data-backed section, including a distinction
  between "no projects yet" and "no projects use this filter".

### Three real bugs found by verifying against live data

These are recorded because each one type-checked, passed the unit tests, and passed the
production build. None was caught by static analysis.

| Bug | Why it was invisible | Fix |
| --- | --- | --- |
| `getProfile` and `getSiteSettings` returned `snake_case` keys while typed as camelCase | The cast was legal, so every field resolved to `undefined` at runtime | Added `fetchFirst`/`fetchOne` so there is one correct way to read a single row or a mutation result |
| `Button render={<Link />}` produced `role="button"` on every navigation link | Type-checks, looks correct, and is what Base UI documents | Added `LinkButton`, `ExternalLinkButton`, and `DestinationButton` in `src/components/ui/link-button.tsx`, which reuse the button styling but keep link semantics |
| `site_settings.copyright_text` was never read; social links were fetched but rendered nowhere | A managed column with no consumer, and an unused hook — neither is an error | The layout now uses `copyright_text` and renders social links; `SocialLinks` is used by both the footer and the contact page |

### Sample content

The live database now holds clearly-marked sample content so the pages could be verified
against real data rather than only against empty states.

- `supabase/seed.sql` — the content, with an explanation of what it is and how to reverse it.
- `supabase/cleanup_sample_content.sql` — removes it by deterministic id prefix, so it cannot
  touch anything the owner creates later.

Every seeded row has an id of the form `5eed0000-0000-4000-8000-0000000000NN`, and every
visitor-facing string carries a `[Sample]` prefix. Neither file is a migration: placeholder
content must not be baked into migration history where it would follow the project to
production.

The seed deliberately includes edge cases that the UI has to survive:

- a **published** skill with no category, proving the left join keeps it;
- an **unpublished** skill, proving `is_published` filtering works;
- an **unpublished project**, proving RLS and the grid both hide a draft.

---

## Build Output

| Chunk | Raw | Gzip |
| --- | --- | --- |
| `index` (app code) | 38 kB | 11 kB |
| `react` | 219 kB | 68 kB |
| `supabase` | 184 kB | 48 kB |
| `router` | 96 kB | 32 kB |
| `forms` (zod + RHF) | 114 kB | 35 kB |
| `vendor` (base-ui, lucide, etc.) | 260 kB | 84 kB |
| `index` (css) | 80 kB | 14 kB |

Every page is a separate lazy chunk of 2–5 kB. No chunk approaches the 500 kB warning
threshold.

---

## Phase 4 Summary

Phase 4 makes the admin area genuinely reachable, and establishes the rule that a valid
session is not the same thing as being an admin.

### What was already in place

The foundation existed from Phase 1 and needed no rewriting: `AuthProvider` with real
`signInWithPassword` / `signOut` calls, session restoration on load, `RequireAdmin` guarding
the admin route tree, the lazy route split, and the login form with RHF + Zod validation. What
was missing was the admin-membership check and a working submit.

### The bootstrap problem

There were no `auth.users` rows and no `admin_users` rows, so nothing could be tested. The
public signup endpoint could not be used: it required a confirmation email, the project has
no SMTP configured, and it is now email-rate-limited.

The account was therefore created with a direct insert into `auth.users` and
`auth.identities`, hashing the password with `crypt(..., gen_salt('bf'))` — the same bcrypt
scheme GoTrue uses. This is a deliberate one-time bootstrap, not a pattern to repeat.

The first attempt failed with a 500, and the auth logs gave the reason:

```text
error finding user: sql: Scan error on column index 3, name "confirmation_token":
converting NULL to string is unsupported
```

GoTrue scans `confirmation_token` as a non-null string, so the row was created with
`confirmation_token`, `recovery_token`, `email_change_token_new` and `email_change` set to
`''` rather than NULL. Sign-in then returned a valid access token.

Two other generated columns reject explicit values — `auth.users.confirmed_at` and
`auth.identities.email` — so those are left to their defaults. A hand-written `auth.users`
insert is easy to get subtly wrong; using the Supabase dashboard is the better route for any
future account.

### Admin membership is now enforced in the UI

`RequireAdmin` previously asked only "is there a session?". That is the wrong question,
because with sign-up open a session proves nothing. It now asks two:

1. Is there a session? If not, redirect to sign in, remembering where the admin was going.
2. Is that session on the allowlist? If not, explain that the account is not an admin and
   link back to sign in — rather than showing a dashboard whose every request is rejected.

The check reads the caller's own `admin_users` row, which `admin_users_self_read` already
restricts to `auth.uid()`. No client-side filter is added, deliberately: the policy is the
single source of truth, and duplicating it in TypeScript would be a second thing to forget to
update.

`signOut` now clears the React Query cache **before** calling Supabase, so a failed sign-out
cannot leave the previous admin's cached "is an admin" result for the next person to sign in.

### Live verification with three real accounts

The security model was tested by acting as each caller over the HTTP API, not by reading
policies. A throwaway non-admin account was created for the test and deleted afterwards; the
admin account remains.

| Caller | `admin_users` | `contact_messages` | Draft project | Write `projects` | Write `admin_users` |
| --- | --- | --- | --- | --- | --- |
| anonymous | no rows | permission denied | hidden | denied | denied |
| signed in, no allowlist row | `[]` | `[]` | hidden | **denied** | **denied** |
| signed in, on allowlist | own row | readable | visible | allowed | denied |

The third row of that table is the important one: a signed-in user with no allowlist row is
**denied every write**, including inserting their own `admin_users` row. `admin_users` has no
client `INSERT` grant, so privilege escalation is impossible. The application cannot promote
itself, which was the design intent and is now confirmed rather than assumed.

No data was modified by these tests: the two write attempts were rejected by RLS, and the
seeded content was re-read afterwards to confirm it is intact.

### A security setting the documentation got wrong

Live Auth reported `disable_signup: false`, while `ARCHITECTURE.md` stated self-registration
was disabled. Anyone on the internet could have created an account.

RLS contained it — a self-registered user can read published content and write nothing, and
cannot add itself to `admin_users` — so it was never a route to admin. But the document was
wrong about a security control, which is the kind of error that becomes dangerous after the
next change. **The owner is disabling sign-up in the Supabase dashboard**; see Known Issues
for the confirmation status. A pre-deploy checklist has been added to `ARCHITECTURE.md`
section 16.1, because Auth settings are not migrations and no test or RLS policy can catch
this.

---

## Phase 5 Summary

Every admin section is now real. `PlaceholderPage` has been deleted, because nothing imports
it any more.

### Shared patterns, built before the entities

The plan called for this ordering deliberately: thirteen sections written their own way would
have been thirteen slightly different admin interfaces, and `AGENTS.md` forbids that.

| Component | Purpose |
| --- | --- |
| `DataTable` | Loading, empty, error, and populated states, plus a `hideBelow` rule per column |
| `EntityDialog` | The one create/edit dialog, with identical submit and failed-save behaviour |
| `EntityForm` | The page-level equivalent, for the two single-row tables |
| `ConfirmDialog` | One destructive confirmation |
| `RowActions` | The edit and delete pair, with the record's name in the accessible label |
| `SlugField` | Slug input with autofill, shared by projects, skill categories, and technologies |
| `ImageUploadField` / `FileUploadField` | Storage-backed pickers that write a path, never a URL |
| `useCrudMutations` | Create, update, delete with cache invalidation and toasts |
| `useSaveMutation` | The same guarantees for a single-row table, where create and delete are meaningless |

### Services

CRUD added for Experience, Education, Services, Social Links, Skills, Skill Categories,
Technologies, About Sections, and Certificates. `profile` and `site_settings` gained
`saveProfile` / `saveSiteSettings`, which read the existing row and then insert or update.

`contactMessages.ts` gained the admin half — filtered reads, counts, and triage — in the same
file as the public submit path, because it is one table and the two halves share the
explanation of why the public may only insert.

### Six managed columns that nothing read

The same class of bug Phase 3 found in `copyright_text`, found again and fixed. Each of these
was a column the owner could set and a form could save, with no consumer anywhere — which is
worse than having no column, because the form implies the value is used.

| Column | Consumer added |
| --- | --- |
| `profile.avatar_path` | Already rendered by the hero; no form could set it. Added to the profile form. |
| `profile.cover_path` | Already rendered by the About page; no form could set it. Added to the profile form. |
| `profile.resume_path` | Already rendered by the hero's résumé button; no form could set it. Added, with a new PDF picker. |
| `site_settings.meta_description` | `usePageSeo` now falls back to it for any page without its own description |
| `site_settings.og_image_path` | `usePageSeo` now falls back to it for the Open Graph and Twitter image |
| `site_settings.show_availability_badge` | The hero badge now needs the status text *and* this switch. The profile holds the text, the setting is the sitewide switch. |

`site_settings.default_theme` is the seventh such column and is **still unresolved** — see
Known Issues.

### Two columns narrowed at the service boundary

`site_settings.default_theme` and `media.bucket` are `text` with a CHECK constraint, so the
generated types say `string` and the constraint is invisible to TypeScript. Both entity types
now narrow the field (`ThemeOption`, `StorageBucket`) and both are narrowed at runtime by
`toThemeOption` and `toStorageBucket`. This is the same trade already accepted for
`camelize` and `jsonb`: where a CHECK constraint carries information the type system cannot
see, the type is corrected in one place and the value is validated where it enters.

### Validation that had to be written

`storagePathField` rejects a value containing `://`. Without it, a URL pasted into
`avatar_path` was accepted, and `imageUrl` — which *builds* an address from a path — would
have produced `…/portfolio-media/https://…` and rendered a broken image with nothing in the
console to explain it. The comments claimed this was validated; the test proved it was not.

### Deliberate omissions

- **No generic CRUD service helper.** An attempt using Supabase's generic `.from(table)`
  produced `TS2769`, because the generated client types `.from()` against a union of real
  table names. Every service spells its queries out, which is also what keeps the publish
  filter visible at each call site.
- **No edit form for contact messages.** The text is what a visitor wrote; rewriting it would
  make the inbox stop being a record of what was received. The owner triages and replies over
  email.
- **No theme control in the settings form**, because nothing reads the value yet. Offering a
  dropdown that changes nothing would be the same decorative-column problem in a new place.

---

## Phase 10 Summary

Deployment has been prepared rather than performed: no host has been chosen, and actually
deploying is a step the owner should make consciously rather than something to slip in
amid code changes. `DEPLOYMENT.md` covers every item Phase 10 names:

- Environment variables, with an explicit warning that `VITE_*` values are baked in at
  build time and `VITE_SITE_URL` must be the production origin before the build runs.
- The SPA-routing fallback requirement, with copy-paste config for Vercel (rewrites),
  Netlify/Cloudflare (`_redirects`).
- The Supabase side that lives outside any migration: Site URL and redirect URLs, sign-up
  still disabled, leaked-password protection, exactly one admin user.
- Storage URLs: nothing to change; they derive from the bucket names.
- SEO: `/sitemap.xml` and `/robots.txt` regenerate on every build.
- A post-deploy verification checklist and how to roll back.

Phase 10 ends with the documentation in place; choosing a host completes it.

## Phase 6 Summary

### Phase 6.1 / 6.2 — Per-entity media usage

A stored file is referenced one-directionally: a content row stores the path, and `media`
records what was uploaded. Nothing in the schema links the two, so before this change the
library could not tell an in-use image from an orphan, and the delete confirmation could only
warn in the abstract that "a project or your profile" might break.

`src/services/mediaUsage.ts` reads every column that stores a storage path and returns a map
keyed by `bucket::path`, so a caller holding an asset asks one question and gets the list of
records that point at it. The columns are read from:

| Section | Columns |
| --- | --- |
| Profile | `avatar_path`, `cover_path` (media bucket), `resume_path` (files bucket) |
| About | `about_sections.image_path` |
| Skills | `skills.icon_path`, `technologies.icon_path` |
| Projects | `projects.cover_image_path`, `project_images.path` |
| Education | `educations.logo_path` |
| Certificates | `certificates.image_path` |
| Services | `services.icon_path` |
| Social links | `social_links.icon_path` |
| Settings | `site_settings.og_image_path` |

The bucket is part of the map key because the same path in two buckets is two different
files. A reference held by a *draft* row counts as used: the draft is invisible today, but
deleting its image would break it the moment the owner published.

The media library now shows `Used by …` (with the referencing records named) or `Unused`, and
a "Show unused only" filter lists the unreferenced records with a count. The delete
confirmation names the exact records that would break, instead of warning generically.

**Usage read failures are treated as unknown, not as unused.** If the usage query fails the
badges and the filter are withheld rather than every file being labelled "Unused" — that
label would be an invitation to delete a file that is in fact in use. `MediaAssetCard` takes
`references: MediaReference[] | undefined`, where `undefined` means "not known".

The card was extracted to `src/features/media/MediaAssetCard.tsx` so `MediaPage.tsx` stays
about orchestration rather than layout.

### Phase 6.3 — Unrecorded-object scan

A file whose `media` insert failed (or that was placed in a bucket outside the dashboard)
has no library entry, so the grid can neither show it nor delete it. `mediaOrphans.ts`
closes that gap:

- `listFolder` walks both buckets (a `MAX_DEPTH` guard prevents a pathological tree from
  pinning the tab).
- An object is reported only when it is missing from *both* the `media` table and the
  content-reference map, so a hand-typed path that a content row still uses is never
  offered for deletion.
- Removal goes through the same admin-only Storage delete policy; the scan itself needs no
  privilege beyond the public read the buckets already allow.

The scan is opt-in — `UnrecordedFilesPanel` refetches only when the owner clicks "Scan
buckets" — because walking both buckets costs more than the library's own reads. Deleting
one result refetches the scan so the list never shows a file that was just removed.

### Deliberate omissions

- **The usage map is not invalidated by content mutations.** It is a query with the default
  `staleTime: 0`, so it refetches whenever the media page mounts — which is exactly when it is
  read. Adding `media.usage` to nine CRUD hooks would refresh a page that is not open.

---

## Phase 8 Summary

The audit checked every requirement in `ARCHITECTURE.md` section 11 against the code, and
fixed the three gaps it found:

1. **Structured data did not exist.** `useSeo` now accepts a `jsonLd` object and manages a
   single `<script id="application-ld-json" type="application/ld+json">` tag — one tag, not
   one per render, and removed again when the data it describes disappears. The home page
   emits `Person` (name, job title, description, avatar, URL) built from the profile row;
   the project detail page emits `BreadcrumbList` (Home → Projects → this project).
   The objects are memoised, because `useSeo` re-applies the tag whenever `jsonLd` changes
   and rebuilding it every render would rewrite the tag for nothing.
2. **Admin pages were indexable.** `robots.txt` disallows `/admin`, but a crawler that has
   already seen a page keeps returning it unless the page itself opts out. `useNoIndex()`
   sets `noindex, nofollow` for the whole admin tree.
3. **The animation and sitemap gaps** were closed in Phase 7 (recorded there).

What the audit verified rather than changed: one `h1` per public page with no skipped
levels; `header`/`nav`/`main`/`section`/`article`/`footer` landmarks on every page; alt text
present on every `<img>` (gallery alt text is optional; when the owner leaves it blank the
image renders with an empty, decorative alt); skip links
with `tabIndex={-1}` targets on both layouts; visible `:focus-visible` rings globally; form
labels and error announcements through the shared field components.

---

## Owner Decisions

| Question | Decision |
| --- | --- |
| Git repository | `Portfolio/` is its own git repository on branch `main`, with a `.gitignore` covering `node_modules/`, `.env*`, and build output. |
| Admin authorization | Explicit `admin_users` allowlist, as designed in `ARCHITECTURE.md`. |
| Sample content | Seeded with `[Sample]`-prefixed placeholder rows so Phase 3 could be verified against real data. Reversible via `supabase/cleanup_sample_content.sql`. |
| Public sign-up | Disabling in the Supabase Auth dashboard, after the live project was found to have it open despite the design saying otherwise. |
| Admin account | The owner chose the credentials. The first account was created by direct `auth.users` insert because signup was email-rate-limited and no SMTP is configured. |

---

## Architecture Decisions Made

| Decision | Reason |
| --- | --- |
| Single React SPA, no server runtime | Static hosting suffices; simplest to deploy and maintain |
| Explicit `admin_users` allowlist instead of trusting "authenticated" | `AGENTS.md` forbids blanket authenticated write access; makes authorization explicit and DB-enforced |
| `private.is_admin()` security-definer helper in a non-exposed schema | Lets policies check admin status without exposing `admin_users` to the client |
| Minimum table grants in addition to RLS | An absent grant is a second, independent barrier; policy bugs then fail closed |
| Supabase queries confined to `services/`, reached through `features/*/hooks.ts` | Enforces the "no queries in components" rule structurally |
| TanStack Query only, no global client-state library | Server state is the real state; Redux/Zustand would add unused indirection |
| Draft support via `is_published` on content tables | Lets the owner prepare content before it goes live |
| Normalised `project_technologies` join table | Enables reliable technology filtering without string matching |
| Both Storage buckets public-read, admin-write-only | Public images must render directly in `<img>` and OG tags without expiring signed URLs |
| `contact_messages` is insert-only for the public | The only public write path; a trigger seals `is_read`, `is_archived`, and `created_at` before the policy's `WITH CHECK` runs |
| `admin_users` has no client write policy at all | Promotion to admin must never be something the app can do to itself |
| Email/password only, public sign-up disabled | Single credential path; no unauthorised account creation |
| `@tanstack/react-table` v8, not v9 | v9 renamed the public API; this code uses the stable v8 API |
| shadcn components use `@base-ui/react`, which has no `asChild` | Buttons render other elements with `nativeButton={false}` plus `render={...}` |
| `LinkButton` for navigation, `Button` for actions | Base UI's Button sets `role="button"` on whatever it renders, which removes navigation links from the list of links a screen-reader user navigates by |
| `destinationFor` tests the raw string for a scheme, not a parsed `URL` | Resolving `/projects` against an `http` base reports protocol `http:`, so every internal path would be misclassified as external |
| Technology filter state lives in the URL, and filtering is client-side | The full list is already loaded, so subsetting is instant; the URL makes a filtered view shareable and back-button friendly |
| Project descriptions render as text, never HTML | No HTML column exists, so the owner cannot store a script through this path |
| Vendor chunks split by `advancedChunks` in Vite 8 | Keeps heavy dependencies cached between deploys |
| Sample content lives in `seed.sql`, not a migration | Placeholder data must not follow the project into production through migration history |
| Live API tests are opt-in via `VITE_RUN_LIVE_TESTS=1` | A normal test run must not depend on a network or on the database holding particular rows |
| Contact messages are read-only and triaged in the admin | The text is a record of what a visitor sent; editing it would make the inbox disagree with what was received |
| Admin CRUD is spelled out per service, not generated | Supabase's generated client types `.from()` against a union of table names, so a generic helper does not type-check; explicit queries also keep the publish filter visible at each call site |
| `storagePathField` rejects URLs in `*_path` columns | `imageUrl` builds an address from a path, so a pasted URL produces a broken image with no explanation in the console |
| CHECK-constrained `text` columns are narrowed in the entity type and validated at the service boundary | The generated types cannot see a constraint; this is where the type is corrected and the value checked |
| Live tests were not run for the Phase 5 work | The Supabase MCP tools were connected but not exposed to the session, so the live pass could not be performed. Not claimed as verified. |

Full reasoning for each architectural decision is in `ARCHITECTURE.md`.

---

## Completed Features

| Feature | Status |
| --- | --- |
| Vite + React + TypeScript scaffold | Verified |
| Tailwind v4 design tokens with dark mode | Verified |
| shadcn/ui primitives installed | Verified |
| Provider composition (query, theme, auth) | Verified |
| Route tree with lazy pages and catch-all | Verified by tests |
| `RequireAdmin` frontend guard (session + allowlist) | Verified by test and live sign-in |
| Loading, empty, error, and skeleton states | Verified |
| Form field components with Zod + RHF | Verified by tests |
| 17-table schema, indexes, constraints, RLS, Storage | Verified live |
| Generated database types replacing the placeholder | Verified |
| Minimum-privilege grants and `private.is_admin()` | Verified live |
| Service layer for all 13 content entities | Verified live |
| TanStack Query hooks with centralised query keys | Verified |
| All 9 public pages reading live content | Verified by live render tests |
| Technology filter, shareable through the URL | Verified |
| Contact form submitting to `contact_messages` | Verified end to end |
| Contact form notification (trigger → Edge Function → Resend) | Verified end to end — live insert through the anon REST path, function 200, email accepted by Resend |
| SEO: titles, descriptions, canonical, Open Graph, Twitter | Verified by live render tests |
| Social links and managed copyright in the layout | Verified by live render tests |
| `npm run verify` (typecheck, lint, test, build) | Passing |
| `npm run test:live` (25 live tests) | Passing as of Phase 4; **not re-run** after Phase 5 |
| Admin sign-in against a real account | Verified end to end |
| Non-admin isolation, including self-promotion | Verified live with three accounts |
| Sign-out control in `AdminLayout` | Present — the Phase 4 issue was stale |
| Shared admin patterns: `DataTable`, `EntityDialog`, `EntityForm`, `ConfirmDialog`, `RowActions`, `SlugField` | Verified by types and build |
| CRUD for 9 publishable content sections | Implemented; **live round trip unverified** |
| Profile and Site Settings single-row forms | Implemented; **live round trip unverified** |
| Contact inbox: filtered views, counts, read/archive/delete | Implemented; **live round trip unverified** |
| Media library: upload, grid, alt text, delete | Implemented; **upload path unverified** |
| Per-entity media usage tracking and unused filter | Verified by types, lint, and build |
| Unrecorded storage-object scan and removal | Complete — live-verified this session (probe file correctly absent from the unrecorded list) |
| Dashboard overview with database-side counts | Implemented; **live counts unverified** |
| `avatar_path`, `cover_path`, `resume_path` editable | Implemented |
| Six previously unconsumed `site_settings`/`profile` columns wired to consumers | Verified by types and unit tests |
| `sitemap.xml` and `robots.txt` | Generated at build time; verified against live project slugs and present in `dist/` |
| Structured data (`Person`, `BreadcrumbList`) and admin `noindex` | Verified by `src/test/seo.test.tsx` (5 tests) |

Not complete, and not claimed: live verification of any Phase 5 write path, image rendering
against a real uploaded file, password reset, and the resolution of `default_theme` (see
Known Issues).

---

## Current Implementation State

The public site is fully functional and reads all of its content from Supabase. A visitor
can browse projects with working filtering, read a project detail page, submit a contact
message, and navigate the whole site. Content is the seeded sample data described above.

Sign-in works end to end. An admin can authenticate at `/admin/login` and reach the
dashboard, and the guard confirms the account is on the allowlist before rendering it.

The 13 dashboard sections are all implemented: an admin can sign in and change every piece of
dynamic content on the site — profile, about, skills and technologies, projects, experience,
education, certificates, services, social links, media, messages, and site settings — with
consistent tables, forms, validation, loading states, and success and failure feedback
throughout. The dashboard shows content counts, draft counts, and recent messages.

**This has not been exercised against the live database.** The Supabase MCP server is
connected but its tools were not exposed to the session that wrote the code, so the CRUD round
trips have not been run. The security model underneath is unchanged from Phase 4 and remains
verified: `private.is_admin()` gates every write, and a non-admin is refused by the database
regardless of what the browser asks for. What is unverified is the new application code
calling that already-verified model correctly.

---

## Remaining Work

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Discovery and architecture | Complete |
| 1 | Project foundation | Complete |
| 2 | Supabase backend | Complete |
| 3 | Public portfolio pages | Complete |
| 4 | Admin authentication | Complete |
| 5 | Admin dashboard CRUD sections | Complete — all admin sections are real pages, live-verified this session. |
| 6 | Media management | Complete — library, upload, alt text, delete, per-entity usage tracking, and unrecorded-object scan/removal. |
| 7 | Public UX polish | Complete — sitemap/robots generator, content-arrival fade, staggered project grid, and card hover states. |
| 8 | SEO and accessibility | Complete — audit pass done: structured data added, admin `noindex` added, headings and alt text verified. |
| 9 | Testing and security verification | Hermetic side green today (128 tests, offline-clean). Live suite previously passed 32/32; today's re-run is PARTIAL because admin credentials were not available in the environment. RLS suite re-runnability still open — see Known Issues. |
| 10 | Deployment | PENDING. Documented in `DEPLOYMENT.md`, but no host has been chosen and an actual production deploy has not been run. |

---

## Known Issues and Open Items

| Item | Type | Notes |
| --- | --- | --- |
| **Public sign-up must be confirmed disabled** | **Security, owner action** | Live Auth reported `disable_signup: false` while the design said it was disabled. The owner is disabling it in the dashboard. Until that is done, anyone can create an account: they can read published content and write nothing, so it is not a route to admin, but it contradicts the design. `ARCHITECTURE.md` 16.1 has a pre-deploy checklist because no test can catch this. |
| **Leaked-password protection is disabled** | **Security, owner action** | The Supabase security advisor now reports `auth_leaked_password_protection` as a warning. Enabling it (Authentication → Attack Protection) rejects passwords found in public breach corpora. Only one account exists, so there is no exposure window today, but it should be on before any second account exists. |
| Change the admin password | Security, owner action | The current password was pasted into chat, so it is in the conversation history. It should be changed in the Supabase dashboard. The password reset email flow is enabled, but no SMTP provider is configured, so reset email will not actually send until SMTP is set up. |
| **Rotate two credentials that were pasted into chat** | **Security, owner action** | To finish the notification setup the Resend key (`re_...`) and a Supabase access token (`sbp_...`) were pasted into this conversation, so both are in the history — the same situation as the admin password below. Rotate them: create a new API key in Resend and a new access token in Supabase, update `RESEND_API_KEY` in **Edge Functions → Secrets**, and delete the old ones. Also confirm the notification email arrived in the inbox (Resend accepted it with a 200; delivery itself was not observed from this side). |
| No SMTP provider configured | Gap | Affects email confirmation and password reset. Not needed for sign-in. Configuring SMTP is a dashboard task. Unrelated to the contact notification, which uses Resend directly from the Edge Function. |
| ~~Phase 5 CRUD is not verified against the live database~~ | **Resolved this session** | `src/test/live-admin-crud.test.ts` executed against the live project: 7/7 pass — upload, draft creation with relations, anon isolation, admin triage, publish, relation removal, full delete. Two real bugs were found and fixed along the way (see Resolved during Phase 5.1). |
| The RLS assertion suite cannot be re-run against a populated database | Verification gap | `supabase/migrations/tests/rls_verification.sql` inserts its own fixture `profile` and `site_settings` rows, and both tables now have `(... (true))` singleton unique indexes. On a database that already holds a profile, the fixture insert fails on `23505` and the transaction aborts. Its own comment says the 78 passing assertions were observed "on a database with no portfolio content in it". So the note "if you change a policy, re-run this file" is no longer actionable as written. No policy has changed since that run, but the next person to change one needs either an empty database (Supabase branch) or a suite rewritten to assert against the content that is actually there. |
| `site_settings.default_theme` has no consumer and no form control | Open design question | The column is `NOT NULL` with a CHECK, the schema validates it, and a save preserves it — but nothing reads it, so `ThemeProvider` still starts from `localStorage` and falls back to `'system'`. Wiring it is not a one-liner: the pre-paint script in `index.html` reads `localStorage` before any data loads, so honouring a database default means either a brief flash of the wrong theme or a change to how the initial theme is delivered. A theme dropdown was deliberately left out of the settings form rather than adding a control that changes nothing. Needs an owner decision. |
| Image rendering is unverified | Gap, partially closed | The upload path is now live-verified: a real PNG was uploaded, its `media` row read back, its storage object listed, and both removed again. What remains unverified is the purely visual half — a real image actually rendered in a browser `<img>`, because the seed still sets every `*_path` to `NULL`. The media library can now produce that file. |
| Migration version drift | Minor | The last local file is `20261001162500_move_is_admin_to_private_schema.sql`, but Supabase recorded the same migration as `20261001162403`. The schema is correct; only the recorded version number differs. |
| Honeypot is client-side only | Accepted | A bot that posts directly to PostgREST bypasses it. The insert-only policy and the trigger sealing `is_read`/`is_archived` are the real controls. CAPTCHA only if spam actually occurs. The notification path now has its own guard: more than 10 messages in 10 minutes drops the email (never the message) and logs a warning, so a script cannot burn the Resend quota. |
| `pg_net` is reported as "extension in public" | Accepted | The security advisor flags it after the notification migration. It cannot be moved (`alter extension pg_net set schema` errors with *does not support SET SCHEMA*), and its objects live in the `net` schema, which PostgREST does not expose — verified: an anon `rpc/http_post` call returns 404. The trigger function itself runs `security definer`, so `anon` never needs `net.http_post`. |
| `contact-notify` runs with `verify_jwt = false` | Accepted, by design | pg_net sends no user JWT, so the platform check is off and the function authorizes itself: it accepts only an `INSERT` payload for `public.contact_messages`, takes the row id from it, and reads the message back with the secret key. Callers cannot invent content — at most they can point at an existing row, and ids are never returned to visitors. |
| Public Storage buckets allow hotlinking | Accepted | Acceptable for a personal portfolio; bucket-level rate limiting is available if it becomes a problem. |
| `camelize` would rename a `jsonb` column's own keys | Accepted, documented | No table stores arbitrary JSON, so nothing is affected today. A future JSON column must be excluded from the transform. `ARCHITECTURE.md` records this. |
| `lucide-react` v1 has no brand icons | Accepted | GitHub, LinkedIn, and X use generic icons with the real name in screen-reader text. Adding an icon library for three logos was not worth it. |
| Live tests leave one contact message | Minor | The anon role has `INSERT` on `contact_messages` and nothing else, so the form test cannot delete its own row. It is tagged `Live form submission test`; delete it with `delete from public.contact_messages where subject = 'Live form submission test';` |
| No commits yet | Repo hygiene | `git init` ran and `.gitignore` is in place, but nothing has been committed. No commit will be made unless requested. |
| Five uploaded project screenshots are not attached to any project | Content, owner action | `media` holds `projects/dashboard1…3`, `clients`, and `auth` (uploaded 2026-10-06 14:06), but `project_images` is empty, so no project has a gallery. Attach them from the project dialog's Gallery section; a description per image is optional (the field is labelled as such) and is stored as `NULL` when left blank. |
| A project saved as a draft is invisible on the public site, which reads as a bug | UX, by design | Confirmed live: `Factory Management System_1` had `is_published = false`, so RLS hid it from anon while the admin table showed it with a `Draft` badge. The row was published as the fix; the `Published` switch itself was verified end to end (`src/test/publishToggle.test.tsx`). |
| ~~Saving a project after adding a gallery image did nothing~~ | **Resolved this session** | The gallery schema rejects a row with no file, but `GalleryEditor` was the only part of the form that never rendered `formState.errors` — so a rejected save showed no toast, no message, and no request. Each row now draws its own `path` and `altText` errors, `EntityDialog` scrolls to and focuses the first invalid field after a rejected save, and `requiredText` reports a plain "… is required." instead of "must be at least 1 characters." The gallery description became optional afterwards (recorded in the verification table below), so a missing file is now the only thing that can block a save. |

Resolved during Phase 7:

| Item | Resolution |
| --- | --- |
| `sitemap.xml` and `robots.txt` did not exist | `scripts/generate-sitemap.mjs` now regenerates both into `public/` before every build: the eight static routes plus each published project slug (drafts excluded, verified against the live API), with `lastmod` from `updated_at`. `robots.txt` allows the public pages, disallows `/admin`, and points at the sitemap. Both are gitignored because they are build artifacts; the generator needs no credential beyond the anon key and degrades to static routes when the API is unreachable. |
| Public site had no motion when content arrived | `QueryState` now fades content in once when it replaces the skeleton (the single motion beat the public site uses), the projects grid staggers its cards (delay capped at 300 ms), and `ProjectCard` lifts 2 px on hover. All of it rides on the existing `--motion-*` tokens, and the `prefers-reduced-motion` query in `index.css` collapses every animation to nothing. |

Resolved during Phase 6:

| Item | Resolution |
| --- | --- |
| Orphaned media files are possible | Every library entry now shows what references it and an "unused only" filter finds unreferenced records. A separate scan lists objects in the buckets with no `media` row and no content reference, and can remove them. |
| Media library could delete a file it did not know was in use | The delete confirmation now names the exact records that would break, and a file with unknown usage is never labelled "Unused". |

Resolved during Phase 5:

| Item | Resolution |
| --- | --- |
| The status file claimed there was no sign-out control | Stale. `SignOutButton` has been rendered in `AdminLayout` all along; the issue was removed rather than the code |
| All 13 admin sections rendered `PlaceholderPage` | Each is now a real page, and `PlaceholderPage.tsx` is deleted |
| `avatar_path`, `cover_path`, `resume_path` were rendered publicly but unsettable | Added to the profile form; `FileUpload` / `FileUploadField` added for the PDF résumé |
| `meta_description`, `og_image_path`, `show_availability_badge` were saved but never read | `usePageSeo` falls back to the first two; the hero badge now respects the third |
| `toDatabaseRow` omitted no keys, so a partial update could blank columns | `undefined` object keys are now dropped; regression test in `src/test/admin-crud.test.ts` |
| `educations.degree` is `NOT NULL` but the schema made it optional | Made required, matching the database |
| `defaultTheme` and `media.bucket` were plain `string` | Narrowed to `ThemeOption` and `StorageBucket` in the entity types, with `toThemeOption` / `toStorageBucket` at the service boundary |
| A URL pasted into a `*_path` field was accepted | `storagePathField` rejects it; test added |
| `about_sections` create ignored `sortOrder` and hand-built snake_case | Rewritten through `toDatabaseRow`, matching every other service |

Resolved during Phase 5.1:

| Item | Resolution |
| --- | --- |
| `uploadMedia` always sent `content-type: text/plain` outside browsers, so buckets rejected the upload as an unsupported mime type | `uploadMedia` now passes `contentType: file.type` through to the storage call. Browser behaviour is unchanged (the FormData path ignores the option), and the PostgREST/Storage route now works in any runtime. Caught by the live test, not by types. |
| A live CRUD test in the jsdom process could not build a `File` the storage upload's fetch could consume | The test builds the payload with `node:buffer`'s `File` and a tiny local shim (`src/test/nodeBufs.d.ts`) types the one class the app's tsconfig deliberately refuses to see. |
| `adminAccess.test.ts` made a real network request in every hermetic `npm test` run and intermittently hit the 5 s timeout | Gated behind `VITE_RUN_LIVE_TESTS`; the hermetic suite is fully offline now. |
| Live tests timed out at the default 5 s on cold networks | `npm run test:live` now passes `--test-timeout=30000`; hermetic runs keep the stricter default. |

Resolved during Phase 4:

| Item | Resolution |
| --- | --- |
| No admin account existed | Created in `auth.users` / `auth.identities` and registered in `admin_users`. Sign-in verified over the HTTP API. |
| Login submit button was permanently `disabled` | Enabled; shows a pending label while submitting. |
| `RequireAdmin` accepted any signed-in user | Now also verifies the allowlist and explains a non-admin instead of showing a broken dashboard. |
| Admin status could survive sign-out in the query cache | The cache is cleared at the start of `signOut`, before the network call. |
| A non-admin could reach protected tables | Confirmed denied by live test, not assumed. `admin_users` self-promotion is also denied. |

Resolved during Phase 3:

| Item | Resolution |
| --- | --- |
| `getProfile` / `getSiteSettings` returned `snake_case` keys | Fixed with `fetchFirst`; `src/test/live-api.test.ts` now fails if it regresses |
| Navigation links announced as buttons | Fixed with `LinkButton` / `ExternalLinkButton` / `DestinationButton` |
| `copyright_text` had no consumer | The layout now renders it, falling back to a generated line |
| Social links were fetched but never rendered | `SocialLinks` component, used in the footer and on the contact page |
| `site_title` did not reach the document title | Added `usePageSeo`, which builds titles from the managed column |
| Route test asserted placeholder copy ("Home" heading) | Replaced with a structural assertion that survives content changes |
| `!inner` embed dropped uncategorised skills | Switched to a left embed; the seed now contains a published uncategorised skill to keep this tested |

---

## Verification Performed

| Check | Command | Result |
| --- | --- | --- |
| Certificate image lightbox | `npm run typecheck`; `npm run lint`; `npm run test -- src/test/imageLightbox.test.tsx`; `npm run build` | Pass — certificate images on the public certificates page now open in the shared responsive lightbox, with multi-certificate navigation when more than one certificate has an image. Build succeeded; sitemap generation could not fetch live project slugs in this environment and used static routes only. |
| Profile image lightbox | `npm run typecheck`; `npm run lint`; `npm run test -- src/test/imageLightbox.test.tsx`; `npm run build` | Pass — the home hero avatar and About page profile image now open in the same responsive lightbox as project images when an uploaded image exists. Build succeeded; sitemap generation could not fetch live project slugs in this environment and used static routes only. |
| Project detail image lightbox | `npm run typecheck`; `npm run lint`; `npm run test -- src/test/imageLightbox.test.tsx`; `npm run test`; `npm run build` | Pass — cover and gallery images open a responsive lightbox with previous/next controls, thumbnail navigation, Escape close, ArrowLeft/ArrowRight cycling, close button, and backdrop close. Build succeeded; sitemap generation could not fetch live project slugs in this environment and used static routes only. |
| Admin dashboard content-card routing | `npm run typecheck`; `npm run lint`; `npm run test -- src/test/routes.test.tsx` | Pass — each dashboard content card now uses the shared `ADMIN_ROUTES` value that matches the sidebar, and the full-card overlay is scoped with `relative` so the Media card link cannot cover the rest of the grid. |
| Gallery save rejection is now visible | `src/test/galleryErrors.test.tsx` + headless Chrome | Pass — a row with no file reports "An image is required.", focus moves to the offending input and neither case calls the submit handler; the browser probe shows the message in the dialog where the save used to be silent, and saving a complete row still sends `PATCH` + the `project_images` insert with a "Project saved." toast. |
| Gallery description is optional | migration `20261006160631_project_images_alt_text_optional.sql`, `npm run verify`, headless Chrome, SQL on the live DB | Pass — `project_images.alt_text` is now nullable (the `project_images_alt_check` CHECK stays, so a present-but-blank description is still rejected); `projectSchema.gallery.altText` uses `optionalText`, the service maps `''` → `NULL` on insert/update and normalises both sides before comparing so an unchanged row is not rewritten, `projectToFormValues` maps `NULL` → `''`, and the public detail page renders `alt=""` for a missing description. Probe: upload with an empty description saves, closes the dialog, shows "Project saved." and posts `alt_text: null`. Real-database check: a row inserted with `alt_text` NULL was accepted, then removed (table left at 0 rows). Tests: `galleryErrors.test.tsx` (blank description saves as `''`), `admin-crud.test.ts` (blank trims to `''`), `routes.test.tsx` wait raised to 10 s under suite load. |
| Cover image upload and save | headless Chrome | Pass — upload, `Image uploaded.` toast, `PATCH` with the new `cover_image_path`, dialog closes with "Project saved." |
| Combined gate | `npm run verify` | Pass — typecheck, lint, 132 tests, build clean |
| Route test under suite load | `src/test/routes.test.tsx` | The public-page assertion used the default 1 s wait for a lazy-loaded page chunk and failed once the suite grew; the wait is now 10 s and the suite passes repeatedly. |
| Draft hidden from the public site | SQL as `anon` + headless Chrome | Pass — the full project had `is_published = false`; after publishing, an `anon`-role query returns it with its cover, and `http://localhost:5173/projects` renders both cards with the cover image loaded (`naturalWidth > 0`). The detail route resolves too. |
| Create-project dialog and publish switch | headless Chrome + `src/test/publishToggle.test.tsx` | Pass — on `/admin/projects` the dialog opens, validation reports "Slug is required.", a submit reaches Supabase, and turning the `Published` switch on delivers `isPublished: true` to the submit handler. |
| TypeScript | `npm run typecheck` | Pass, strict, no errors |
| Lint | `npm run lint` | Pass, no warnings |
| Hermetic tests | `npm run test` | Pass — 10 files, 128 tests, 32 skipped |
| Production build | `npm run build` | Pass |
| Combined gate | `npm run verify` | Pass — 128 tests, build clean |
| Hermetic suite is offline | network deliberately required for nothing | Found and fixed: `adminAccess.test.ts`'s signed-out check made a real request in every run and intermittently hit the 5 s default timeout. It is now gated behind `VITE_RUN_LIVE_TESTS` like every other live check; `npm test` has no network dependency. |
| Live admin CRUD harness | `npm run test:live` | Pass — 7/7: upload, draft creation with relations, anon isolation, admin triage, publish → public read, relation removal, full delete. Leftover check via SQL: 0 probe projects / media / messages |
| Security advisories (re-check this session) | Supabase advisor | Zero table/RLS findings. Only the known `auth_leaked_password_protection` warning, already listed above. |
| Media usage service and library changes | `npm run verify` (Phase 6.1/6.2) | Pass — typecheck, lint, 120 tests, build clean |
| Unrecorded-object scan and removal | `npm run verify` (Phase 6.3); live path later exercised by the Phase 5.1 suite | Pass — typecheck, lint, 120 tests at the time, build clean; live path verified later |
| Sitemap and robots generation | `npm run sitemap`, `npm run build` | Pass — 8 static routes and 3 live published slugs written; both files confirmed in `dist/` |
| SEO hook behaviour (title, canonical, OG, JSON-LD lifecycle, `noindex`) | `src/test/seo.test.tsx` | Pass — 5 tests: tag set, JSON-LD written/updated/removed, no tag when absent, `noindex, nofollow` |
| Media usage keys and label formatting | `src/test/mediaUsage.test.ts` | Pass — 4 tests, including that the same path in two buckets stays two files |
| Heading hierarchy and landmarks | manual audit of all 9 public pages | Pass — one `h1` per page, no skipped levels, all landmarks present, every `<img>` has alt text |
| Live API tests | `npm run test:live` | Pass — 11 read checks against the live database after all later changes |
| Profile and settings schema validation | `src/test/schemas.test.ts` | Pass — including that a URL is rejected in a `*_path` field and each of the three themes is accepted |
| `toThemeOption` / `toStorageBucket` narrowing | `src/test/format.test.ts` | Pass — valid values pass through, unknown values fall back |
| Partial-update key omission | `src/test/admin-crud.test.ts` | Pass — `undefined` keys are not sent, so a partial update cannot blank other columns |
| Full suite including live | `npm run test:live` | Pass — 4 files, 32 tests, this session |
| Admin allowlist check | `src/test/adminAccess.test.ts` | Pass — signed-out returns `false` without throwing; a real admin sign-in returns `true` |
| `camelize` key mapping | `src/test/services.test.ts` | Pass — multi-word, nested, null relation, and falsy-value cases |
| Internal vs external URL classification | `src/test/destination.test.ts` | Pass — 17 cases including `mailto:`, protocol-relative, and unparseable input |
| Route tree | `src/test/routes.test.tsx` | Pass — 9 public and 14 admin paths, unauthenticated redirect |
| Every public page against live data | `src/test/live-render.test.tsx` | Pass — 13 tests, each asserting real database content reaches the screen |
| Contact form end to end | `src/test/live-render.test.tsx` | Pass — RHF → Zod → mutation → anon `INSERT` → trigger; row confirmed in the database and then deleted |
| RLS enforcement over HTTP | manual probes | Pass — anon reads published content, cannot see the draft, cannot read the inbox, cannot update or delete a message, cannot insert a project or profile |
| Contact trigger sealing | manual probe | Pass — forged `is_read: true, is_archived: true` stored as `false` |
| RLS assertion suite | `supabase/migrations/tests/rls_verification.sql` | 78 assertions, documented as passing; not re-runnable on a populated DB (known limitation) |
| Live admin CRUD suite | `npm run test:live` (Phase 5.1) | Pass — 7/7 via the real service code, with cleanup verified by SQL afterwards |
| Live suite, full | `npm run test:live` | Pass — 4 files, 32 tests |
| Deployment preparation | `DEPLOYMENT.md` written | Done — env vars, SPA routing fallback, Auth redirect URLs, Supabase checklist, SEO config, post-deploy checks |
| Admin sign-in | HTTP API, real credentials | Pass — valid access token issued for the allowlisted account |
| Non-admin isolation | three real accounts over HTTP | Pass — a signed-in user with no allowlist row can read published content, sees no draft, and is denied every write including self-promotion to `admin_users` |
| Data integrity after the probes | re-read seeded tables | Pass — 4 projects and the sample profile unchanged; the probe account was deleted |
| Security advisories | Supabase advisor | 0 table/RLS findings. One Auth warning: leaked-password protection is disabled (owner action, listed above) |
| Edge Function deploy and boot | Supabase MCP deploy (`contact-notify`, `verify_jwt = false`) + `curl` | Pass — a malformed body returns `400 {"error":"Unexpected payload."}`, which means the bundle compiled, `Deno.serve` ran, and the `./email.ts` import resolved |
| Notification chain, trigger → function | SQL insert into `contact_messages`, then `net._http_response` and the function logs | Pass — the trigger queued the request 27 ms after the insert, the function validated the payload, read the row back with the secret key, and stopped exactly where expected: `contact-notify: RESEND_API_KEY and CONTACT_NOTIFY_EMAIL must be set for this function.` (502, because the secrets were not set yet). Test rows deleted afterwards. |
| Notification chain, full path with secrets set | anon `POST /rest/v1/contact_messages` (the form's own call), then `net._http_response` and `logs` | **Pass — 201 from PostgREST, 200 `{"ok":true}` from `contact-notify` 53 ms later, and the function log reads `POST | 200 | …/functions/v1/contact-notify`.** Resend returned an id, so the message was accepted. Row deleted afterwards; inbox still clean. |
| Visitor path still works with the trigger installed | anon `POST /rest/v1/contact_messages` with the publishable key | Pass — 201, and the queued call produced the same 502 for the missing secret, so a real submission saves regardless of the provider |
| The function cannot be told to email made-up content | direct `POST` with a fabricated row id, and with a wrong table name | Pass — a well-formed but unknown id returns `404 {"error":"Message not found."}`, a payload for another table returns 400; the request body is never used as message content |
| The trigger function is off the anonymous REST surface | anon `POST /rest/v1/rpc/contact_messages_notify_email` | Pass — `PGRST202`, no such function, because EXECUTE was revoked from `public`, `anon` and `authenticated` |
| Inbox still closed to the public | anon `GET /rest/v1/contact_messages` | Pass — `42501 permission denied for table contact_messages` |
| Combined gate after the change | `npm run verify` | Pass — typecheck, lint, 132 tests, build clean |
| Advisories after the migration | Supabase advisor (security and performance) | Same two warnings as before plus the new, accepted `extension_in_public` for pg_net (see Known Issues); no RLS or table findings |

The non-admin test used a real account created for the purpose and deleted afterwards, because
a mocked identity cannot demonstrate that the database refuses an escalation attempt.

---

## Next Recommended Step

The code-side implementation is ready for deployment, but the project is not fully complete
as a production site until Phase 10 is executed and verified:

1. **`default_theme` decision** — see Known Issues: a brief flash of the wrong theme, a change to how the initial theme reaches the browser, or leave the column unused.
2. **Owner security actions** — still outstanding: disable public sign-up, enable leaked-password protection, change the admin password (the current one has been pasted in chat).
3. **RLS assertion suite re-runnability** — it fails against a populated database. Options: a throwaway Supabase branch (empty tables), or rewriting its assertions for a populated database. The schema/policies have not changed since it passed, so this is maintenance, not a gate.
4. **Phase 10 deployment** — prepared. The only decision left is which static host to deploy to, per `DEPLOYMENT.md`.
5. **Live verification re-run** — provide `VITE_LIVE_ADMIN_EMAIL` and `VITE_LIVE_ADMIN_PASSWORD`, then run `npm run test:live` again before deployment.
6. **Contact notifications — done; two follow-ups** — the feature is live and verified. Confirm the test email reached `mahmouddahy377@gmail.com`, then rotate the Resend key and the Supabase access token that were pasted into chat (see Known Issues). After that, no action is needed unless a domain is verified for Resend, in which case set `CONTACT_FROM_EMAIL` (§6 of `DEPLOYMENT.md`).

Phases 6, 7, and 8 are complete and verified hermetically.

---

## CV Update — second CV for the ELV / Light Current track (October 10, 2026, complete and verified)

The profile now supports two independent CVs. `profile.resume_path` remains the software/
Flutter CV, unchanged; a new nullable `profile.resume_elv_path` column holds the ELV /
Light Current CV. Both are uploaded, replaced and downloaded independently through the
existing profile form and the existing hero download buttons (now labelled "Flutter CV"
and "ELV CV"; each button appears only when its own file exists). The media library's
usage tracking recognises both files, so neither is reported as an unreferenced orphan.

Changes:
- Migration `20261010162850_add_profile_elv_resume_path.sql` — additive, nullable column,
  applied to the live project via Supabase MCP.
- `src/types/database.ts` (`profile` Row/Insert/Update), `src/schemas/profile.ts`,
  `src/pages/admin/ProfilePage.tsx` (second `FileUploadField`), `src/features/profile/Hero.tsx`,
  `src/services/mediaUsage.ts` (ELV résumé reference in the files bucket), and the schema/
  entity tests.

Verification:
- Live DB: `information_schema.columns` confirms `resume_elv_path text null` beside the
  existing `resume_path`; RLS/grants are table-scoped, so no policy change was needed.
- `npm run typecheck` — pass. `npm run lint` — pass. `npm run test` — 135 passed, 32 skipped.
- `npm run build` — pass.
- Supabase security advisor — no new findings; only the two pre-existing warnings
  (`pg_net` extension in `public`, leaked-password protection disabled).

Not done (out of scope for this task): the broader Software/ELV track selector, track-aware
content, and separate ELV content described in `portfolio_evolution_plan.md`. This change
adds only the second CV, consistent with the existing design and mechanism.

---

## Skills Update — Software / ELV field for skills and categories (October 10, 2026, complete and verified)

Skills and skill categories now carry a `field` (`software` or `elv`). The admin Skills page
assigns a field to each skill and category and filters the two tables by it; the category
dropdown in the skill form lists only the categories of the chosen field. On the public home
page a "Skills field" selector in the hero switches the Skills section between Software and
ELV. The Flutter CV / ELV CV buttons and every other feature are untouched.

This follows `portfolio_evolution_plan.md` §7 and §9 (Skills): field-specific categories, and
a Software / ELV selection in the hero that focuses the skills shown.

Changes:
- Migration `20261010165417_skills_field.sql` — additive, non-destructive: `field text not
  null default 'software'` plus a `check (field in ('software','elv'))` on both `skills` and
  `skill_categories`, and an index on each. The default means every existing row keeps its
  meaning (the current catalogue is software/Flutter); no row is rewritten and no column is
  dropped. Applied to the live project via Supabase MCP.
- `src/constants/fields.ts` (new) — `FIELD_OPTIONS`, `FieldOption`, `FIELD_LABELS`, mirroring
  the CHECK; `src/utils/toFieldOption.ts` — the runtime narrowing, following `toThemeOption`.
- `src/types/database.ts` (the `field` column), `src/types/entities.ts` (`Skill.field` and
  `SkillCategory.field` narrowed to `FieldOption`), `src/schemas/skills.ts` (both schemas
  require a field), `src/services/skills.ts` (narrows `field` on read and write).
- `src/components/common/FieldSelector.tsx` (new) — the shared Software / ELV segmented
  control, reusing the button-group pattern from the public projects filter.
- Admin: `SkillsTable` and `SkillCategoriesTable` gained a field filter and a Field column;
  `SkillDialog` and `SkillCategoryDialog` gained a Field select and default a new record to
  the active filter. `SkillDialog` clears a category that no longer matches the chosen field.
- Public: `Hero` shows the "Skills field" selector; `HomePage` owns the selection and passes
  it to `SkillsPreview`, which lists only that field's published skills.

Verification:
- Live DB: `information_schema.columns` confirms `field text not null default 'software'` on
  both tables; `pg_constraint` confirms both CHECKs. A self-cleaning `DO` block inserted an
  ELV category and skill, confirmed an invalid field (`mechanical`) was rejected with a
  `check_violation`, then deleted both rows. Counts unchanged afterwards: 7 skills, 4
  categories, all still `software`, no test rows left.
- `npm run verify` — pass: typecheck, lint, 150 tests (15 files, 18 new/updated tests
  covering `toFieldOption`, the two schemas, the field-specific category filter, the form
  defaulting, and the public preview filter), and build.
- Supabase security advisor — no new findings; only the two pre-existing warnings.

Decisions:
- The column is named `field`, matching the task's wording and the existing `field_of_study`
  convention; the values are `software` / `elv`.
- The public **About** page skills section is left showing the full set, because the field
  selector lives in the home hero and there is no selection to read on About. Making About
  track-aware would need a shared/persisted selection, which is a later plan item, not this
  one.
- Technologies (the project filter catalogue) are unchanged: this task is about skills and
  skill categories only.

Not done (later plan items): field assignment for projects, experience, certificates, and
services; a site-wide/persisted track selection; and the CV buttons following the selected
field.

---

## Skills Update follow-up — field filter with an "All" option on About and the hero (October 10, 2026, complete and verified)

The Skills field selector now offers an "All" option and, per the owner's request, is shown
in both places that list skills: the About page skills section (grouped by category) and the
home hero. Each page keeps its own selection; "All" lists every published skill, and picking
Software or ELV narrows to that field. This supersedes the earlier decision to leave About
unfiltered.

Changes:
- `src/constants/fields.ts` — added the filter-only value `ALL_FIELDS` (`'all'`), the ordered
  `FIELD_FILTER_OPTIONS`, the `FieldFilter` type, and `FIELD_FILTER_LABELS`. `all` is a view
  value only; it is never written to a row and cannot reach the database.
- `src/components/common/FieldSelector.tsx` — added an `includeAll` mode, typed with overloads
  so the admin tables (one field only) keep their `FieldOption` signature while the public
  selectors use `FieldFilter`.
- `src/features/skills/SkillsByCategory.tsx` — added `filterSkillsByField(skills, filter)`,
  the single definition of what a field filter means, shared by the preview and About.
- `src/pages/public/AboutPage.tsx` — the Skills section now owns its own field state (default
  "All"), shows the selector, filters the list, and phrases the empty state per field.
- `src/features/profile/Hero.tsx`, `src/pages/public/HomePage.tsx`,
  `src/features/skills/SkillsPreview.tsx` — the hero selector gained "All" and the states are
  typed `FieldFilter`; the home preview defaults to "All".

Verification:
- `npm run verify` — pass: typecheck, lint, 153 tests (15 files) and build. New/updated tests
  cover the "All" preview case and `filterSkillsByField`.
- No database change was needed: this is a presentation change over the existing `field`
  column, and `all` is never sent to the database.

Decisions:
- "All" is a filter value, not a third field: adding it to `FIELD_OPTIONS` would have put an
  illegal value in the admin forms and the schema. It lives only in the public filter type.
- The two selectors are independent local state (hero for the home preview, About for the full
  list). A single shared/persisted selection would be a later plan item, and duplicating a
  small `<FieldSelector>` is simpler than lifting state across routes.
- Default is "All" on both pages, so no published skill is hidden until the visitor narrows
  the view.

---

## Skills Update — filter relocated to About only, empty fields hidden (October 10, 2026, complete and verified)

Per the owner's follow-up, the field filter now lives only on the About page. It was removed
from the home hero, the home preview shows every published skill again, and a field that has
no skills is no longer offered: the ELV button appears only once at least one ELV skill
exists, and vice versa for Software. This supersedes the "on About and the hero" decision
above.

Changes:
- `src/features/profile/Hero.tsx`, `src/pages/public/HomePage.tsx` — reverted the hero to take
  only `profile`; the field state and the selector are gone from the home page.
- `src/features/skills/SkillsPreview.tsx` — shows all published skills again (no field prop);
  it filters nothing now that the only selector is on About.
- `src/pages/public/AboutPage.tsx` — builds its option list from the fields that actually have
  a skill (`availableFields`) and hides the whole selector when none do; falls back to "All"
  if the selected field disappears. The empty state still names the field.
- `src/components/common/FieldSelector.tsx` — added an `options` prop so a caller can narrow
  the list (About passes "All" + only the non-empty fields).
- Removed `src/test/skillsPreview.test.tsx`, which tested the now-removed preview filtering.

Verification:
- `npm run verify` — pass: typecheck, lint, 150 tests (14 files) and build.
- No database change: the `field` column and the "All" filter value are unchanged.

Decisions:
- A field with no skills is hidden rather than shown-and-empty, so the page never advertises
  content the owner has not written.
- The About selector stays because it is now the only place the full list is filtered; the
  home preview intentionally shows everything.

---

## Projects — field assignment + field-based filter (replace technology filter) (October 11, 2026, complete and verified)

Implemented the two-track (Software / ELV) model for Projects. Filtering is by `field`, not by
technology. Technologies remain visible on project cards. A field with no projects is hidden
entirely (no selector/button).

Migration (applied via Supabase MCP, single-statement safe):
- `supabase/migrations/20261010180000_projects_field.sql` — adds `projects.field` `text NOT NULL`
  with `DEFAULT 'software'`, adds `CHECK (field in ('software','elv'))`, adds comment, and
  creates `projects_field_idx` on `(field)`. Backward compatible: existing projects remain
  `software`. Verified: column exists NOT NULL with default, CHECK allows only software/elv,
  index exists, existing rows are `software`, an invalid value (`mechanical`) was rejected by
  CHECK, and no data loss (test insert rolled back).

Schema/types:
- `src/types/database.ts` — `projects.Row/Insert/Update` include `field`.
- `src/types/entities.ts` — `Project = Omit<Row<'projects'>, 'field'> & { field: FieldOption }`
  (runtime narrowing).
- `src/schemas/project.ts` — `field: z.enum(FIELD_OPTIONS)` added.
- `src/utils/toFieldOption.ts` — narrows stored strings to `FieldOption` with fallback `'software'`
  (unreachable while CHECK enforced).
- `src/services/projects.ts` — narrows `field` via `toFieldOption` in `toProject`/`toProjectWithRelations`;
  create/update return mapped `Project` objects.

Admin UI:
- `src/features/projects/ProjectDialog.tsx` — `EMPTY_PROJECT.field = 'software'`,
  `projectToFormValues` includes `field`.
- `src/features/projects/ProjectForm.tsx` — added Field `SelectField` (Software/ELV), fixed JSX
  structure, and clarified technologies helper text to "Technologies used on this project."

Public UI:
- `src/features/projects/filter.ts` — new `filterProjectsByField(projects, filter: FieldFilter)`.
- `src/features/projects/index.ts` — exports `filterProjectsByField`; removed `useTechnologyFilters`
  from barrel.
- `src/features/projects/hooks.ts` — removed `useTechnologyFilters` hook and `getTechnologyFilters`
  import (filter is now local by field).
- `src/pages/public/ProjectsPage.tsx` — replaced technology-based filtering with local field
  filter (`useState<FieldFilter>(ALL_FIELDS)`), computes `availableFields` from projects that
  exist for each `FieldOption`, builds `filterOptions = [ALL_FIELDS, ...availableFields]`, uses
  `activeField = filterOptions.includes(field) ? field : ALL_FIELDS` fallback, hides selector
  entirely when no field has projects, and renders field-aware empty title/description.
  Technologies remain on `ProjectCard`. Removed URL `tech` param dependency and technology
  chips.

Tests:
- `src/test/projectField.test.ts` — covers `filterProjectsByField` for 'all' and per-field cases,
  and verifies `projectToFormValues` preserves `field` and `EMPTY_PROJECT.field = 'software'`.
- Updated project fixtures in `src/test/live-admin-crud.test.ts`, `src/test/galleryErrors.test.tsx`,
  `src/test/publishToggle.test.tsx`, and `src/test/admin-crud.test.ts` to include `field: 'software'`
  so schema validation passes.
- Removed `src/test/skillsPreview.test.tsx` (no longer applicable).

Verification:
- `npm run verify` — typecheck, lint, tests (154 passed / 32 skipped, 15 test files passed / 4
  skipped of 19), build all green.
- Migration applied and verified against live DB (column+CHECK+index present, existing data
  unchanged, invalid values rejected).

Decisions:
- Filter by field (not technology) to match the two-track model and keep UI consistent with
  Skills (About-only/Projects use same FieldSelector pattern). Technologies stay visible on cards
  (informational), not as filter controls here.
- Hide empty fields: if a field has no projects, its selector/button is not shown (and fallback
  to 'all' guards against stale selection). Matches Skills empty-field hiding behavior.
- `all` is never written to DB (filter-only). Field values are strictly `software|elv` (DB CHECK).
- Admin always selects exactly one field; public can choose 'All' + non-empty fields via
  `FieldSelector` with `options` + `includeAll` overloads.
- Keep changes additive and minimal; no unrelated refactors.

---

## Experience & Certificates — field assignment + field-based filter (October 11, 2026, complete and verified)

Extended the two-track (Software / ELV) model to Experience and Certificates. Filtering is by `field`. A field with no items is hidden entirely.

Migrations (applied via Supabase MCP):
- `supabase/migrations/20261011100000_experiences_field.sql` — adds `experiences.field` text NOT NULL default 'software', CHECK (`software`/`elv`), comment, `experiences_field_idx`.
- `supabase/migrations/20261011100001_certificates_field.sql` — adds `certificates.field` text NOT NULL default 'software', CHECK (`software`/`elv`), comment, `certificates_field_idx`. Backward compatible; existing rows remain `software`.

Schema/types:
- `src/types/database.ts` — `experiences` and `certificates` Row/Insert/Update include `field`.
- `src/types/entities.ts` — `Experience` and `Certificate` narrowed to `{ field: FieldOption }`.
- `src/utils/toFieldOption.ts` (shared) used by services to narrow stored strings.
- `src/schemas/experience.ts` — added `field: z.enum(FIELD_OPTIONS)`.
- `src/schemas/certificate.ts` — added `field: z.enum(FIELD_OPTIONS)`.

Admin UI:
- `src/features/experience/ExperienceDialog.tsx` — `EMPTY_EXPERIENCE.field='software'`, `experienceToFormValues` includes `field`, added Field `SelectField`.
- `src/features/certificates/CertificateDialog.tsx` — `EMPTY_CERTIFICATE.field='software'`, `certificateToFormValues` includes `field`, added Field `SelectField` in a grid layout.

Services:
- `src/services/experience.ts`, `src/services/certificates.ts` — narrow `field` via `toFieldOption` in mappers and return mapped objects for all reads/writes.

Public UI:
- `src/features/experience/filter.ts`, `src/features/experience/index.ts` — `filterExperiencesByField` + export.
- `src/features/certificates/filter.ts`, `src/features/certificates/index.ts` — `filterCertificatesByField` + export.
- `src/pages/public/ExperiencePage.tsx` — field filter with availableFields (hide empty), fallback to 'all', field-aware empty states.
- `src/pages/public/CertificatesPage.tsx` — same field filter behavior.

Tests:
- `src/test/experienceField.test.ts`, `src/test/certificateField.test.ts` — filter + form defaults.
- `src/test/schemas.test.ts` — updated certificate valid fixture to include `field`.

Verification:
- `npm run verify` — typecheck, lint, tests (162 passed / 32 skipped, 17 test files passed / 4 skipped), build green.

Decisions:
- Consistent with Projects/Skills: filter by field, hide empty fields, `all` filter-only, DB CHECK enforces allowed values. Technologies/info unchanged.
