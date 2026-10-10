/**
 * Route paths, kept in one place so links and navigation never hardcode strings.
 * Using `as const` lets the compiler check that path literals passed to `navigate`
 * are real routes.
 */

export const PUBLIC_ROUTES = {
  home: '/',
  about: '/about',
  projects: '/projects',
  projectDetails: '/projects/:slug',
  experience: '/experience',
  education: '/education',
  certificates: '/certificates',
  services: '/services',
  contact: '/contact',
} as const

export const ADMIN_ROUTES = {
  root: '/admin',
  login: '/admin/login',
  dashboard: '/admin',
  profile: '/admin/profile',
  about: '/admin/about',
  skills: '/admin/skills',
  projects: '/admin/projects',
  experience: '/admin/experience',
  education: '/admin/education',
  certificates: '/admin/certificates',
  services: '/admin/services',
  socialLinks: '/admin/social-links',
  messages: '/admin/messages',
  media: '/admin/media',
  settings: '/admin/settings',
} as const

/**
 * Admin paths relative to the `/admin` layout.
 *
 * React Router resolves child routes against their parent, so the route tree needs the
 * segment only (`'profile'`), while links and `navigate()` need the full path. Keeping
 * both here avoids retyping either form inside the router.
 */
export const ADMIN_SEGMENTS = {
  login: 'login',
  profile: 'profile',
  about: 'about',
  skills: 'skills',
  projects: 'projects',
  experience: 'experience',
  education: 'education',
  certificates: 'certificates',
  services: 'services',
  socialLinks: 'social-links',
  messages: 'messages',
  media: 'media',
  settings: 'settings',
} as const

export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES]
export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES]

/** Builds a project detail path from a slug. */
export function projectDetailPath(slug: string) {
  return `/projects/${slug}`
}
