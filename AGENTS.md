# AGENTS.md — Portfolio Project Rules

## 1. Project Identity

This project is a fully dynamic personal portfolio website with an authenticated admin dashboard.

The portfolio owner is a software developer with strong Flutter/mobile development experience but limited web development experience.

The application must therefore prioritize:

* Clean architecture
* Simplicity
* Maintainability
* Readability
* Security
* Reusability
* Beginner-friendly code
* Professional UI/UX
* Production readiness

Do not introduce complexity unless there is a clear reason for it.

---

# 2. Core Technology Stack

Use the following stack unless there is a strong technical reason to change it:

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router

### Data

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Supabase Row Level Security

### Forms & Validation

* React Hook Form
* Zod

### Server State

* TanStack Query

### Icons

* Lucide React

Do not add libraries simply because they are popular.

Before adding a dependency, determine whether the feature can reasonably be implemented with the existing stack.

---

# 3. Architecture Principles

The project must be modular.

Do NOT place Supabase queries directly inside UI components.

Prefer a structure similar to:

```text
src/
├── components/
├── features/
│   ├── projects/
│   ├── skills/
│   ├── experience/
│   ├── education/
│   ├── certificates/
│   ├── services/
│   └── messages/
├── pages/
│   ├── public/
│   └── admin/
├── layouts/
├── hooks/
├── lib/
├── services/
├── types/
├── utils/
├── constants/
└── routes/
```

The exact structure may evolve as the project grows, but responsibilities must remain separated.

---

# 4. Component Rules

Components must have a single clear responsibility.

Avoid giant components.

As a general rule:

* Prefer files under 120 lines.
* If a file becomes significantly larger, evaluate whether it should be split.
* Do not split files artificially just to satisfy the line limit.
* Reuse components when the same UI pattern appears more than once.

Do not duplicate large blocks of JSX.

---

# 5. TypeScript Rules

Use TypeScript strictly.

Avoid:

```ts
any
```

unless there is a documented and justified reason.

Prefer:

```ts
type
interface
unknown
generics
```

Use explicit types for:

* Supabase data
* API responses
* Forms
* Component props
* Database entities
* Utility functions

Do not silently ignore TypeScript errors.

---

# 6. Supabase Rules

Supabase is the primary backend.

Use Supabase for:

* PostgreSQL database
* Authentication
* Storage
* Row Level Security
* Dynamic portfolio content

The public portfolio must NOT contain hardcoded portfolio content when that content is intended to be managed through the admin dashboard.

Examples:

* Profile information
* About content
* Skills
* Projects
* Experience
* Education
* Certificates
* Services
* Social links
* Site settings
* Media

These should be stored in Supabase.

---

# 7. Supabase MCP Rules

When Supabase MCP is connected and available, use it actively.

The agent should perform database-related work through the Supabase MCP rather than asking the user to manually create tables.

The agent is expected to:

1. Inspect the existing Supabase project.
2. Determine what already exists.
3. Design the required database schema.
4. Create required tables.
5. Create relationships and constraints.
6. Create indexes when useful.
7. Create RLS policies.
8. Create required storage buckets.
9. Configure storage policies.
10. Create required database functions/triggers only when justified.
11. Verify the resulting schema.
12. Test the important database operations.

Do not blindly recreate existing tables.

Before destructive operations such as:

* dropping tables
* deleting columns
* deleting policies
* removing buckets
* changing destructive constraints

stop and explain the impact.

Never expose or hardcode:

* Supabase service role keys
* private credentials
* secrets
* access tokens

Never put privileged Supabase credentials in frontend code.

---

# 8. Database Design Rules

The database must be designed before implementing the Admin Dashboard.

Prefer normalized relational tables.

Use:

* UUID primary keys where appropriate
* timestamps
* foreign keys
* unique constraints
* useful indexes
* sensible defaults
* NOT NULL where appropriate

Use consistent naming.

Database naming convention:

```text
snake_case
```

Examples:

```text
projects
project_tags
skills
experiences
certificates
site_settings
social_links
contact_messages
```

Frontend TypeScript naming convention:

```text
camelCase
PascalCase
```

---

# 9. Row Level Security

RLS is mandatory.

Never assume that hiding an Admin route provides security.

Security must be enforced at the Supabase database level.

Public users should only be able to access data that is intentionally public.

Authenticated admin users should have the required write permissions.

Do not create policies such as:

```text
authenticated users can do everything
```

unless there is a clear security justification.

The admin authorization model must be explicit.

---

# 10. Authentication

Use Supabase Auth.

The admin dashboard must require authentication.

Unauthenticated users must not be able to access protected admin functionality.

Admin authorization must also be enforced through database policies.

Do not rely only on frontend route guards.

The application should handle:

* login
* logout
* session persistence
* loading state
* expired sessions
* unauthorized access
* protected routes

---

# 11. Public Portfolio Rules

The public website should be:

* Responsive
* Fast
* Accessible
* SEO-friendly
* Professional
* Visually polished

The design direction is:

> Professional developer portfolio + tasteful modern animations.

Avoid excessive animations.

Animations must support the user experience rather than distract from content.

---

# 12. Admin Dashboard Rules

The admin dashboard should feel like a real content management system.

It should provide appropriate CRUD functionality for dynamic portfolio content.

Prefer reusable patterns for:

* tables
* forms
* dialogs
* confirmation dialogs
* image upload
* loading states
* empty states
* error states
* success feedback

CRUD interfaces should be consistent.

Do not create a completely different UI pattern for every entity.

---

# 13. Forms

All important forms must have validation.

Use:

```text
React Hook Form
+
Zod
```

Forms must provide:

* validation
* useful error messages
* loading state
* disabled submit state when appropriate
* success feedback
* failure feedback

Never silently fail.

---

# 14. Data Fetching

Use TanStack Query for server state where appropriate.

Do not repeatedly fetch the same data unnecessarily.

Handle:

* loading
* success
* empty
* error

states explicitly.

Avoid putting asynchronous database logic directly into presentational components.

---

# 15. Error Handling

Every important asynchronous operation must have proper error handling.

Bad:

```ts
try {
  await saveProject()
} catch {}
```

Good:

```ts
try {
  await saveProject()
} catch (error) {
  // Handle and report the error appropriately.
}
```

Errors shown to users should be understandable.

Technical details should remain available for debugging without exposing secrets.

---

# 16. Loading and Empty States

Never leave the user staring at a blank screen during data loading.

Provide appropriate:

* Skeletons
* Spinners
* Empty states
* Error states

For example:

```text
Loading projects...
No projects have been added yet.
Failed to load projects.
```

---

# 17. Media / Storage

Portfolio images and other uploaded media should use Supabase Storage.

Do not store large image files directly inside PostgreSQL.

Database records should store the relevant metadata and file path/URL.

The media system should support:

* upload
* preview
* delete
* replacement
* useful file validation

Validate file type and reasonable file size.

---

# 18. SEO

The public portfolio must include proper SEO foundations.

Include where appropriate:

* page titles
* meta descriptions
* canonical URLs
* Open Graph metadata
* Twitter/X metadata
* semantic HTML
* proper heading hierarchy
* descriptive image alt text
* sitemap
* robots configuration

Do not generate fake SEO content.

---

# 19. Accessibility

Follow accessible web practices.

Important requirements include:

* semantic HTML
* keyboard navigation
* visible focus states
* accessible labels
* proper button usage
* sufficient contrast
* meaningful alt text
* accessible dialogs
* accessible form errors

Do not rely only on color to communicate meaning.

---

# 20. Responsive Design

The application must work properly on:

* Mobile
* Tablet
* Desktop
* Large desktop screens

Do not design desktop first and simply hope it works on mobile.

Check important layouts at different viewport sizes.

Avoid unnecessary horizontal scrolling.

---

# 21. UI Design

Use a consistent design system.

Define reusable:

* colors
* typography
* spacing
* radii
* shadows
* buttons
* inputs
* cards
* badges
* dialogs

Do not randomly introduce different visual styles throughout the application.

The portfolio should look modern but not overloaded.

---

# 22. Dark Mode

Support dark mode if it can be implemented cleanly.

The theme should remain readable and accessible.

Do not create two completely separate designs.

Use the same design system with appropriate theme tokens.

---

# 23. Code Quality

Prefer readable code over clever code.

Avoid unnecessary abstractions.

Avoid:

* premature optimization
* unnecessary design patterns
* huge utility files
* deeply nested components
* duplicated business logic
* magic numbers
* magic strings

Use constants when values have semantic meaning.

---

# 24. Comments

Do not comment obvious code.

Bad:

```ts
// Set loading to true
setLoading(true)
```

Comments should explain:

* why something is done
* non-obvious constraints
* important architectural decisions
* security considerations

---

# 25. Git Rules

Keep changes organized.

Use meaningful commit messages when commits are requested.

Do not modify unrelated files.

Do not introduce unrelated refactoring while implementing a feature.

---

# 26. Testing

Important functionality must be tested.

Prioritize tests for:

* authentication
* authorization
* database operations
* forms
* validation
* important business logic
* critical UI flows

Do not claim something works without verifying it.

---

# 27. Verification

After implementing a feature, verify:

1. TypeScript compilation
2. Linting
3. Build
4. Relevant tests
5. Runtime behavior
6. Supabase behavior when applicable
7. RLS/security behavior when applicable
8. Responsive behavior when applicable

Fix errors before moving to the next phase.

---

# 28. Phase Discipline

The project must be implemented in phases.

Do not jump randomly between phases.

Before starting a phase:

1. Read the project plan.
2. Read this AGENTS.md.
3. Inspect the existing implementation.
4. Identify dependencies.
5. Implement only the required scope.
6. Verify the implementation.
7. Update the project status document.

If something required by the plan cannot be completed exactly, explicitly mark it as:

```text
PARTIAL
```

and explain why.

Never silently replace a planned requirement with a different implementation.

---

# 29. Project Status

Maintain:

```text
PROJECT_STATUS.md
```

After each completed task or meaningful feature, update it with:

* Current phase
* Completed features
* Current implementation state
* Remaining work
* Known issues
* Decisions made
* Verification performed
* Next recommended step

Do not claim a feature is complete if it has not been verified.

---

# 30. Decision Making

When multiple reasonable implementations exist:

1. Prefer the simplest one.
2. Prefer the implementation easiest for the project owner to understand.
3. Prefer established patterns.
4. Avoid unnecessary dependencies.
5. Preserve future extensibility.
6. Consider security before convenience.

Do not make major architectural decisions silently.

For significant decisions, document the decision and the reason.

---

# 31. Important Rule

The project owner is not an expert web developer.

Code must therefore be written so that an experienced Flutter developer can understand the architecture and continue maintaining the project.

Do not optimize the code for showing off technical complexity.

Optimize it for:

```text
Clarity
+
Maintainability
+
Security
+
Professional quality
```

---

# 32. Final Rule

Before saying "done", verify the actual implementation.

Never report:

* "database created"
* "authentication works"
* "RLS is secure"
* "build passes"
* "feature is complete"

unless the implementation was actually checked.

If something is uncertain, say so explicitly.

