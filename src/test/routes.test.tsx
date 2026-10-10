import { render, screen } from '@testing-library/react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { adminRoutes } from '@/routes/adminRoutes'
import { publicRoutes } from '@/routes/publicRoutes'
import { AppProviders } from '@/app/providers'

/**
 * Route-tree checks.
 *
 * These exist because two mistakes are easy to make and invisible until a visitor hits the
 * page: an index route that also declares a path, and an admin path that does not resolve
 * the way `ADMIN_ROUTES` promises. Matching real path strings against the tree catches both
 * without starting a browser.
 */
const routes = [...publicRoutes, ...adminRoutes]

function isMatchable(path: string) {
  return matchRoutes(routes, path) !== null
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  // AppProviders supplies the auth and theme contexts that pages read. The router is
  // created without AppProviders' own browser router, so the memory router can be used.
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('public routes', () => {
  it('matches the home page', () => {
    expect(isMatchable('/')).toBe(true)
  })

  it.each(['/about', '/projects', '/experience', '/education', '/certificates', '/services', '/contact'])(
    'matches %s',
    (path) => {
      expect(isMatchable(path)).toBe(true)
    },
  )

  it('matches a project detail path with its slug parameter', () => {
    expect(isMatchable('/projects/my-first-project')).toBe(true)
  })

  it('does not match an unknown public path', () => {
    expect(isMatchable('/not-a-page')).toBe(false)
  })
})

describe('admin routes', () => {
  it.each([
    '/admin/login',
    '/admin',
    '/admin/profile',
    '/admin/about',
    '/admin/skills',
    '/admin/projects',
    '/admin/experience',
    '/admin/education',
    '/admin/certificates',
    '/admin/services',
    '/admin/social-links',
    '/admin/messages',
    '/admin/media',
    '/admin/settings',
  ])('matches %s', (path) => {
    expect(isMatchable(path)).toBe(true)
  })

  it('renders the login form at /admin/login', async () => {
    renderAt('/admin/login')

    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('redirects an unauthenticated visitor from the dashboard to the login page', async () => {
    // Supabase is unreachable in this environment, so the session never restores and the
    // guard must fall through to the login route rather than rendering the dashboard.
    renderAt('/admin')

    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders a public page without needing authentication', async () => {
    renderAt('/')

    // Asserted structurally rather than by copy. The home page's content comes from
    // Supabase, so its headings change with the data; what must hold regardless is that
    // the public shell renders at all and does not fall through to the login route.
    // The generous timeout is for the lazy-loaded page chunk: it resolves in about a
    // second on its own and slower still while the rest of the suite is compiling.
    const main = await screen.findByRole('main', {}, { timeout: 10_000 })
    expect(main).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })
})