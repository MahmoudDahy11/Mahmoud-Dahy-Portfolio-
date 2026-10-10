import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { AppProviders } from '@/app/providers'
import { publicRoutes } from '@/routes/publicRoutes'
import { Toaster } from '@/components/ui/sonner'
import { PUBLIC_ROUTES } from '@/constants/routes'

/**
 * Renders every public page against the live Supabase project and asserts that real
 * database content reaches the screen.
 *
 * Run with:
 *
 *   VITE_RUN_LIVE_TESTS=1 npm run test
 *
 * This is the test that would have caught the `snake_case` bug in `getProfile` and
 * `getSiteSettings`. Both services type-checked, both passed the unit tests, and both
 * returned `undefined` for every field once a real row existed. Nothing short of a real
 * response rendered by the real component exposes that class of mistake.
 *
 * It also checks the composer's job, not just the services': that `ProjectCard` reads
 * `project.title` rather than a raw column name, that the detail page resolves its slug
 * route, and that the layout puts `site_settings` into the header and footer.
 */

const live = import.meta.env.VITE_RUN_LIVE_TESTS === '1'

/**
 * Every render waits on real network round trips, so each test gets a budget well above the
 * 5s hermetic default. Passed per test rather than through `vi.setConfig` in a hook,
 * because the timeout is read before hooks run.
 */
const LIVE_TIMEOUT = 30_000

/**
 * A distinctive subject on the one row this file creates.
 *
 * The anon role has INSERT on `contact_messages` and nothing else, so the test cannot clean
 * up after itself. The subject makes the row findable, and the comment below is the
 * instruction for removing it:
 *
 *   delete from public.contact_messages where subject = 'Live form submission test';
 */
const FORM_TEST_SUBJECT = 'Live form submission test'

/**
 * Renders a route and waits for the text that proves its data has arrived.
 *
 * The expected text is supplied per page rather than a single shared marker, because two
 * pages legitimately contain no marker at all: the draft-slug page shows a not-found state
 * that must not leak the draft's own copy, and the project grid is asserted on card titles.
 * A single shared wait would spend the full timeout on those pages and then report a bare
 * timeout instead of the actual failure.
 */
async function renderAt(path: string, expected: string | RegExp) {
  const router = createMemoryRouter([...publicRoutes], { initialEntries: [path] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
      {/*
        `App.tsx` mounts the toast host, not `AppProviders`, because it is a sibling of the
        router rather than a provider. Mounting it here too is what makes the contact form's
        success and failure feedback observable, which is the only user-visible proof that a
        submission actually completed.
      */}
      <Toaster />
    </AppProviders>,
  )

  return screen.findByText(expected, undefined, { timeout: LIVE_TIMEOUT })
}

describe.skipIf(!live)('public pages render live content', () => {
  beforeAll(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set to run these tests.')
    }
  })

  it(
    'renders the profile from the database on the home page',
    async () => {
      await renderAt(PUBLIC_ROUTES.home, 'Flutter & Front-End Developer')

      // A camelCase field read inside a component. If a service stopped renaming keys,
      // this is the assertion that fails, rather than a silently blank page.
      expect(
        await screen.findByRole('heading', { name: '[Sample] Mahmoud Dahy' }),
      ).toBeInTheDocument()

      // The featured-projects query is a separate request from the profile, so it is
      // awaited on its own rather than assumed to have arrived alongside it.
      expect(
        await within(screen.getByRole('main')).findByText(/Field Service Tracker/),
      ).toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders site_settings in the layout header and footer',
    async () => {
      await renderAt(PUBLIC_ROUTES.home, 'Flutter & Front-End Developer')

      // The footer text and copyright both come from the layout, not the page, so these
      // prove the layout's query is wired up. The copyright line uses the managed
      // `copyright_text` column rather than a generated "© year name" line.
      expect(
        await screen.findByText('[Sample] content - not real portfolio data.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Built with React, TypeScript, and Supabase.')).toBeInTheDocument()
      // `site_title` drives the header logo.
      expect(screen.getAllByText('[Sample] Portfolio').length).toBeGreaterThan(0)
      // The home page deliberately uses the owner's name as the whole title, so this
      // asserts it is NOT decorated with the site name. If this ever starts failing because
      // the tab reads "[Sample] Mahmoud Dahy — [Sample] Portfolio", that is a regression.
      expect(document.title).toBe('[Sample] Mahmoud Dahy')
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders social links from the database',
    async () => {
      await renderAt(PUBLIC_ROUTES.home, 'Flutter & Front-End Developer')

      // Accessible names are built from the `label` and `platform` columns, which proves
      // these are rendered from the query result and not hardcoded.
      expect(
        await screen.findByRole('link', { name: /\[Sample\] GitHub \(github\)/ }),
      ).toHaveAttribute('href', 'https://github.com/example')
      expect(
        screen.getByRole('link', { name: /\[Sample\] LinkedIn \(linkedin\)/ }),
      ).toBeInTheDocument()
      // The email link is not external, so it must not claim to open a new tab.
      expect(screen.getByRole('link', { name: /\[Sample\] Email \(email\)/ })).not.toHaveTextContent(
        'opens in a new tab',
      )
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders the about page with its sections and grouped skills',
    async () => {
      await renderAt(PUBLIC_ROUTES.about, '[Sample] How I work')

      expect(screen.getByText('[Sample] What I am good at')).toBeInTheDocument()
      // A skill whose category_id is null must still be shown rather than dropped by the join.
      expect(screen.getByText('Uncategorised Sample')).toBeInTheDocument()
      // The unpublished skill must not be.
      expect(screen.queryByText('Hidden Sample Skill')).not.toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders the experience page',
    async () => {
      await renderAt(PUBLIC_ROUTES.experience, '[Sample] Current Employer')

      expect(screen.getByText('[Sample] Previous Employer')).toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders the education page',
    async () => {
      // Institution and field of study share one text node, so the match is a substring.
      await renderAt(PUBLIC_ROUTES.education, /\[Sample\] University/)

      expect(screen.getByText(/\[Sample\] Online Course/)).toBeInTheDocument()
      expect(screen.getByText('Bachelor of Science')).toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders the certificates page',
    async () => {
      await renderAt(PUBLIC_ROUTES.certificates, '[Sample] Flutter Development')

      // The credential id is rendered inside a labelled paragraph, not on its own.
      expect(screen.getByText(/SAMPLE-CERT-001/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Verify credential/ })).toHaveAttribute(
        'href',
        'https://example.com/verify/sample-cert-001',
      )
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders the services page',
    async () => {
      await renderAt(PUBLIC_ROUTES.services, '[Sample] Flutter app development')

      expect(screen.getByText('[Sample] Supabase and PostgreSQL')).toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'lists only published projects and omits the draft',
    async () => {
      await renderAt(PUBLIC_ROUTES.projects, '[Sample] Field Service Tracker')

      expect(screen.getByText('[Sample] Clinic Booking')).toBeInTheDocument()
      expect(screen.getByText('[Sample] Inventory Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('[Sample] Unpublished Draft')).not.toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'opens a project detail page by slug and shows its technologies',
    async () => {
      await renderAt(`${PUBLIC_ROUTES.projects}/sample-field-service-tracker`, /basements/)

      expect(
        screen.getByRole('heading', { name: '[Sample] Field Service Tracker', level: 1 }),
      ).toBeInTheDocument()
      // Technologies arrive through the embedded relation on the same row.
      expect(screen.getByText('Flutter')).toBeInTheDocument()
      expect(screen.getByText('Dart')).toBeInTheDocument()
      // External link, and it must be a *link*. It used to be a Base UI Button with
      // `render={<a/>}`, which sets role="button" and hides it from the list of links a
      // screen-reader user navigates by.
      const source = screen.getByRole('link', { name: /View source/ })
      expect(source).toHaveAttribute('href', 'https://github.com/example/field-service-tracker')
      expect(source).toHaveAttribute('rel', expect.stringContaining('noopener'))
      expect(source).not.toHaveAttribute('role', 'button')
      // The "All projects" back link is in-app navigation, and must also be a link.
      expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute(
        'href',
        PUBLIC_ROUTES.projects,
      )
    },
    LIVE_TIMEOUT,
  )

  it(
    'shows a not-found state for a draft slug instead of its content',
    async () => {
      await renderAt(`${PUBLIC_ROUTES.projects}/sample-internal-draft`, /could not be found/i)

      // The draft's own copy must not leak, even though its slug is guessable.
      expect(screen.queryByText(/must never appear/i)).not.toBeInTheDocument()
      expect(screen.queryByText('[Sample] Unpublished Draft')).not.toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'renders the contact page with profile contact details and the form',
    async () => {
      await renderAt(PUBLIC_ROUTES.contact, 'Cairo, Egypt')

      expect(screen.getByRole('heading', { name: 'Contact', level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'sample@example.com' })).toBeInTheDocument()
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
      // Social links are repeated on the contact page as labelled links. Scoped to main,
      // because the layout footer renders the same link.
      const main = screen.getByRole('main')
      expect(within(main).getByRole('link', { name: /\[Sample\] GitHub/ })).toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )

  it(
    'submits the contact form end to end',
    async () => {
      const user = userEvent.setup()

      await renderAt(PUBLIC_ROUTES.contact, 'Cairo, Egypt')

      // The full path, not just the service: React Hook Form state, Zod validation, the
      // TanStack mutation, the Supabase client, the anon role's INSERT grant, and the
      // database trigger. Any one of those can be wrong while every other test passes.
      await user.type(screen.getByLabelText(/^name/i), 'Phase 3 Live Test')
      await user.type(screen.getByLabelText(/email/i), 'live-test@example.com')
      await user.type(screen.getByLabelText(/subject/i), FORM_TEST_SUBJECT)
      await user.type(
        screen.getByLabelText(/message/i),
        'Submitted by the live render test to verify the whole form path.',
      )

      await user.click(screen.getByRole('button', { name: /send/i }))

      // Success feedback is required by the project's own rules, so its absence is a
      // failure here rather than a detail to skip.
      expect(
        await screen.findByText(/message (has been )?sent|thank you/i, {}, { timeout: LIVE_TIMEOUT }),
      ).toBeInTheDocument()
    },
    LIVE_TIMEOUT,
  )
})

afterAll(() => {
  // Unmount anything a test left behind, so a failing page cannot leak a live router and
  // a mounted QueryClient into the next file in the same worker.
  cleanup()
})
