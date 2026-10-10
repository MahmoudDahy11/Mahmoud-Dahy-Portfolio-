# Portfolio Project — Implementation Plan

## Project Goal

Build a production-ready, fully dynamic personal developer portfolio with a secure admin dashboard.

The public portfolio and admin dashboard must use Supabase as the backend.

All portfolio content that needs to be managed by the owner must be stored dynamically in Supabase.

The owner should be able to manage the portfolio without modifying source code.

---

# Phase 0 — Discovery & Architecture

## Objectives

Before writing application code:

- Inspect the repository.
- Inspect the available Supabase MCP connection.
- Inspect the existing Supabase project.
- Determine whether the project is empty or contains existing resources.
- Confirm the available frontend environment.
- Design the application architecture.
- Design the database schema.
- Design authentication and authorization.
- Design the Storage structure.
- Identify required public pages.
- Identify required admin pages.

Do not build the complete application during this phase.

### Deliverables

- Architecture decision
- Folder structure
- Database schema proposal
- Authentication model
- RLS strategy
- Storage strategy
- Public page list
- Admin page list
- Initial UI/design direction

---

# Phase 1 — Project Foundation

Set up:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form
- Zod
- Supabase client
- ESLint / formatting configuration where appropriate

Create the foundational:

- layouts
- routing
- design tokens
- reusable UI components
- error handling
- loading states
- application configuration

Verify the project builds successfully.

---

# Phase 2 — Supabase Backend

Using the connected Supabase MCP:

1. Inspect the current project.
2. Create the required database schema.
3. Create tables.
4. Create relationships.
5. Create indexes.
6. Create constraints.
7. Create RLS policies.
8. Create the required Storage buckets.
9. Create Storage policies.
10. Create the admin authentication setup.
11. Verify the schema.

Do not ask the user to manually create the database if MCP can perform the operation.

Do not destroy existing unrelated Supabase resources.

---

# Phase 3 — Public Portfolio

Build the public website.

Initial pages:

- Home
- About
- Projects
- Project Details
- Experience
- Education
- Certificates
- Services
- Contact

The exact page structure may be refined during implementation.

All content must be retrieved dynamically from Supabase.

The public site should include:

- responsive design
- modern professional UI
- tasteful animations
- dark/light theme if appropriate
- SEO foundations
- accessible components
- loading states
- empty states
- error states

---

# Phase 4 — Admin Authentication

Implement:

- login
- logout
- session handling
- protected routes
- unauthorized handling
- admin-only functionality

Security must be enforced through Supabase RLS in addition to frontend route protection.

---

# Phase 5 — Admin Dashboard

Build the admin dashboard.

Required sections:

- Dashboard
- Profile
- About
- Skills
- Projects
- Experience
- Education
- Certificates
- Services
- Social Links
- Messages
- Media
- Settings

Each relevant section should support the appropriate CRUD operations.

Use reusable:

- data tables
- forms
- dialogs
- confirmation dialogs
- upload components
- feedback components

---

# Phase 6 — Media Management

Implement Supabase Storage integration.

Support:

- image upload
- image preview
- deletion
- replacement
- validation
- useful file metadata

Integrate media management with projects, certificates, profile, and other relevant entities.

---

# Phase 7 — Portfolio UX

Improve the public experience with:

- animations
- transitions
- hover states
- project filtering where useful
- featured projects
- project technologies
- external links
- GitHub links
- live demo links
- responsive layouts

Animations must remain professional and performant.

---

# Phase 8 — SEO & Accessibility

Implement:

- page metadata
- Open Graph metadata
- semantic HTML
- accessible navigation
- accessible forms
- alt text
- sitemap
- robots configuration
- canonical URLs where appropriate

Verify the important public pages.

---

# Phase 9 — Testing & Security

Verify:

- authentication
- authorization
- RLS
- Storage policies
- CRUD operations
- form validation
- error handling
- responsive layouts
- public access restrictions
- admin access restrictions

Run:

- lint
- type checking
- tests where available
- production build

Fix all important errors.

---

# Phase 10 — Deployment

Prepare the application for production deployment.

Verify:

- environment variables
- production Supabase configuration
- frontend build
- routing
- authentication redirects
- Storage URLs
- SEO configuration

Document the deployment process.

---

# Execution Rules

The agent must:

1. Work sequentially.
2. Never skip required phases.
3. Never implement the entire project in one uncontrolled operation.
4. Verify every meaningful phase before continuing.
5. Update PROJECT_STATUS.md after meaningful progress.
6. Use Supabase MCP whenever available.
7. Never expose secrets.
8. Never claim completion without verification.
9. Keep the implementation understandable to a Flutter developer.
10. Prefer simple and maintainable solutions.

---

# Definition of Done

The project is considered complete only when:

- Public portfolio works.
- All required portfolio content is dynamic.
- Admin dashboard works.
- Admin authentication works.
- RLS is implemented and verified.
- Supabase Storage works.
- CRUD operations work.
- Responsive design works.
- SEO foundations are implemented.
- Important accessibility requirements are implemented.
- Production build succeeds.
- Known issues are documented.
- PROJECT_STATUS.md accurately reflects the final state.