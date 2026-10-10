import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAdmin } from '@/components/common/RequireAdmin'
import { ADMIN_ROUTES, ADMIN_SEGMENTS } from '@/constants/routes'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'

/**
 * Admin pages are also loaded on demand, so a visitor who never opens /admin never
 * downloads the dashboard code.
 */
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const ProfilePage = lazy(() => import('@/pages/admin/ProfilePage'))
const AboutPage = lazy(() => import('@/pages/admin/AboutPage'))
const SkillsPage = lazy(() => import('@/pages/admin/SkillsPage'))
const ProjectsPage = lazy(() => import('@/pages/admin/ProjectsPage'))
const ExperiencePage = lazy(() => import('@/pages/admin/ExperiencePage'))
const EducationPage = lazy(() => import('@/pages/admin/EducationPage'))
const CertificatesPage = lazy(() => import('@/pages/admin/CertificatesPage'))
const ServicesPage = lazy(() => import('@/pages/admin/ServicesPage'))
const SocialLinksPage = lazy(() => import('@/pages/admin/SocialLinksPage'))
const MessagesPage = lazy(() => import('@/pages/admin/MessagesPage'))
const MediaPage = lazy(() => import('@/pages/admin/MediaPage'))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))

/**
 * Admin route tree.
 *
 * `RequireAdmin` is a usability guard only. It keeps unauthenticated visitors out of the
 * dashboard UI, but it is not the security boundary: Row Level Security in Supabase
 * rejects every unauthorised write regardless of what the browser does.
 */
/**
 * The layout path, taken from the full ADMIN_ROUTES value so the route tree and links
 * cannot drift apart.
 */
const ADMIN_ROOT_PATH = ADMIN_ROUTES.root

export const adminRoutes: RouteObject[] = [
  {
    path: ADMIN_ROOT_PATH,
    children: [
      {
        Component: AuthLayout,
        children: [{ path: ADMIN_SEGMENTS.login, Component: LoginPage }],
      },
      {
        Component: RequireAdmin,
        children: [
          {
            Component: AdminLayout,
            children: [
              // /admin renders the dashboard, so this is an index route and carries no path.
              { index: true, Component: DashboardPage },
              { path: ADMIN_SEGMENTS.profile, Component: ProfilePage },
              { path: ADMIN_SEGMENTS.about, Component: AboutPage },
              { path: ADMIN_SEGMENTS.skills, Component: SkillsPage },
              { path: ADMIN_SEGMENTS.projects, Component: ProjectsPage },
              { path: ADMIN_SEGMENTS.experience, Component: ExperiencePage },
              { path: ADMIN_SEGMENTS.education, Component: EducationPage },
              { path: ADMIN_SEGMENTS.certificates, Component: CertificatesPage },
              { path: ADMIN_SEGMENTS.services, Component: ServicesPage },
              { path: ADMIN_SEGMENTS.socialLinks, Component: SocialLinksPage },
              { path: ADMIN_SEGMENTS.messages, Component: MessagesPage },
              { path: ADMIN_SEGMENTS.media, Component: MediaPage },
              { path: ADMIN_SEGMENTS.settings, Component: SettingsPage },
            ],
          },
        ],
      },
    ],
  },
]
