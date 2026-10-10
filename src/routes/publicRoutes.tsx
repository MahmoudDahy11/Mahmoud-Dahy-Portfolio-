import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { PublicLayout } from '@/layouts/PublicLayout'

/**
 * Public pages are loaded on demand so the first visit downloads only what the visitor
 * actually opens. Each page still resolves to the same small component file.
 */
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const ProjectsPage = lazy(() => import('@/pages/public/ProjectsPage'))
const ProjectDetailsPage = lazy(() => import('@/pages/public/ProjectDetailsPage'))
const ExperiencePage = lazy(() => import('@/pages/public/ExperiencePage'))
const EducationPage = lazy(() => import('@/pages/public/EducationPage'))
const CertificatesPage = lazy(() => import('@/pages/public/CertificatesPage'))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))

/**
 * Public route tree.
 *
 * Everything public sits under PublicLayout, which owns the header, footer, and the
 * skip-to-content link. Page components therefore never render chrome themselves.
 */
export const publicRoutes: RouteObject[] = [
  {
    Component: PublicLayout,
    children: [
      // An index route matches its parent path, so it must not declare a path of its own.
      // PUBLIC_ROUTES.home documents "/" as the home location and is used by navigate().
      { index: true, Component: HomePage },
      { path: PUBLIC_ROUTES.about, Component: AboutPage },
      { path: PUBLIC_ROUTES.projects, Component: ProjectsPage },
      { path: PUBLIC_ROUTES.projectDetails, Component: ProjectDetailsPage },
      { path: PUBLIC_ROUTES.experience, Component: ExperiencePage },
      { path: PUBLIC_ROUTES.education, Component: EducationPage },
      { path: PUBLIC_ROUTES.certificates, Component: CertificatesPage },
      { path: PUBLIC_ROUTES.services, Component: ServicesPage },
      { path: PUBLIC_ROUTES.contact, Component: ContactPage },
    ],
  },
]
