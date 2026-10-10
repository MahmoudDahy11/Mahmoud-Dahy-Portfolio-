# DEPLOYMENT.md

How to take this portfolio to production. Everything below assumes the architecture in
`ARCHITECTURE.md`: a fully client-rendered SPA (Vite + React) with Supabase acting as the
database, auth provider, and file storage. There is no custom server — deployment is
"build a static bundle and host it somewhere that serves files."

## 1. Before anything ships

Run the two gates and fix anything they surface:

```bash
npm run verify        # typecheck, lint, hermetic tests, production build
npm run test:live     # the live suite against real Supabase (needs admin credentials)
```

`npm run test:live` signs in with `VITE_LIVE_ADMIN_EMAIL` and
`VITE_LIVE_ADMIN_PASSWORD`, which are supplied only for the run and never written to a
file:

```bash
VITE_LIVE_ADMIN_EMAIL='you@example.com' VITE_LIVE_ADMIN_PASSWORD='...' npm run test:live
```

## 2. Environment variables

Vite reads `.env` at **build time** and bakes the values into the bundle. There are three
variables, one of which (the anon key) is public by design:

| Variable | Purpose | Production value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://utncrpncpehtscbuygvp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable anon key | the `sb_publishable_...` key |
| `VITE_SITE_URL` | Absolute origin of the deployed site | e.g. `https://yourdomain.com` |

Rules:

- Set these in the hosting provider's environment settings *before* building — the build
  will not pick up `.env` from a fresh checkout, and hardcoding them would bake a
  development URL into `canonical`, Open Graph, and the sitemap.
- `VITE_SITE_URL` must be the production origin, without a trailing slash, or every
  canonical/OG URL and the sitemap will point at the old origin.
- Never put `service_role` keys or any non-anon Supabase key in these variables.

## 3. Build

```bash
npm run build
```

The build script refreshes `public/sitemap.xml` and `public/robots.txt` first
(`scripts/generate-sitemap.mjs`), then runs TypeScript and Vite's production build.
Output lands in `dist/`. The sitemap step only needs the anon key, and if the API is
unreachable it still writes both files with the static routes, so a flaky network never
fails the build — but remember to check the sitemap the next successful build produces if
your project list changed.

## 4. Hosting the SPA

Any static host works. The one hard requirement: **client-side routing**. The app uses a
BrowserRouter (clean URLs like `/projects`), so the host must serve `index.html` for
unknown paths rather than a 404. Configure one of:

- **Vercel** — `vercel.json` at the repo root:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
  (Sitemap and robots are static files, so they are served directly before the rewrite
  applies.)
- **Netlify** — `public/_redirects`:
  ```
  /*    /index.html   200
  ```
- **Cloudflare Pages** — Pages serves `_redirects` the same way; alternatively use the
  built-in SPA routing option.

Build settings in the provider dashboard: build command `npm run build`, output
directory `dist`.

## 5. Supabase configuration checklist

These live in Supabase's dashboard, not in code, so no test can catch a miss. Work through
`ARCHITECTURE.md` §16.1 as well:

- **Auth → URL Configuration**: set the Site URL to the production origin. Under Redirect
  URLs add `https://yourdomain.com/**` (or the exact post-auth destinations). Without it,
  email confirmation and password-reset links bounce back to the wrong host.
- **Auth → Providers**: confirm public sign-up is **disabled**. A signed-in visitor without
  an `admin_users` row still cannot touch admin data, but the design is that only the
  owner ever logs in.
- **Auth → Attack Protection**: enable leaked-password protection.
- **Storage buckets**: `portfolio-media` and `portfolio-files` should stay public-read,
  admin-write. Image and PDF URLs are derived from the bucket names, so they need no
  additional config after deployment.
- **Admin account**: there should be exactly one Auth user, and it should have a row in
  `admin_users`. Changing or resetting its password should happen from the dashboard — not
  in chat, since credentials shared anywhere become part of history.
- **Edge Function secrets**: the contact-form notification needs `RESEND_API_KEY` and
  `CONTACT_NOTIFY_EMAIL` — see §6. Without them messages are still stored, but no email is
  sent.

## 6. Contact form email notifications

Submitting the contact form does two things: it stores the message in `contact_messages`
(the visitor's confirmation), and an `AFTER INSERT` trigger queues an HTTP request with
`pg_net` to the `contact-notify` Edge Function, which emails the owner through Resend. The
browser is not involved in the second step, so no key or endpoint was added to the site —
the Resend API key exists only in the function's environment.

Setup lives in the dashboard, because secrets never belong in the repository:

1. Create a free account at [resend.com](https://resend.com) and copy an API key
   (`re_...`) from **API Keys**.
2. In Supabase: **Edge Functions → Secrets** (or `supabase secrets set --env-file
   supabase/functions/.env`), and set:

   | Secret | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the `re_...` key |
   | `CONTACT_NOTIFY_EMAIL` | the inbox that should receive notifications |
   | `CONTACT_FROM_EMAIL` | optional; defaults to `Portfolio Contact <onboarding@resend.dev>` |

3. **Sender address**: Resend only delivers from a verified sender. `onboarding@resend.dev`
   is their test sender and only reaches the address on your Resend account, so signing up
   with the same address as `CONTACT_NOTIFY_EMAIL` works immediately. To send from your own
   domain, add it in Resend and follow the DNS records, then set
   `CONTACT_FROM_EMAIL=Your Name <hello@yourdomain.com>`.

No redeploy is needed after changing secrets — they take effect on the next call.

**Testing and debugging.** Submit a message from `/contact`; it should arrive within a few
seconds. If it does not:

- `Edge Functions → contact-notify → Logs` shows what the function did (a missing secret is
  logged as `RESEND_API_KEY and CONTACT_NOTIFY_EMAIL must be set`, a provider rejection is
  logged with Resend's status and message).
- `select status_code, content from net._http_response order by created desc limit 5;` in
  the SQL editor shows what the trigger received back.
- The message is always stored, even when the email fails. Nothing on the visitor's side
  breaks when the provider is down.

## 7. SEO and crawling

- `/sitemap.xml` and `/robots.txt` are generated on every build from the live project
  slugs; nothing further to configure.
- Admin pages are excluded from the sitemap and carry `noindex, nofollow`.
- Because this is a client-rendered SPA, social crawlers that do not execute JavaScript see
  the baseline `index.html` metadata. Title, description, canonical, and Open Graph tags
  must remain accurate in `index.html`; the runtime tags from `useSeo` only improve
  the browser and crawler-after-hydration experience.

## 8. After deploying — verify in a real browser

1. Load `/`, `/about`, `/projects`, `/experience`, `/education`, `/certificates`,
   `/services`, `/contact` directly (tests the SPA fallback).
2. Confirm one project detail page loads by URL.
3. Sign in at `/admin`; reload; sign out.
4. Submit a test contact message, confirm the notification email arrives, and archive the
   message from the dashboard.
5. Load `/sitemap.xml` and `/robots.txt` directly.

## 9. Rollback

Static deployments are safe to roll back: point the host at the previous build. Supabase
schema changes so far are additive and handled by migrations in `supabase/migrations`;
there is nothing to undo for a pure redeploy.