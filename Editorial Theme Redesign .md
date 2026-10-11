# Task: Editorial Theme Redesign — UI Only

## Objective

Redesign the existing personal portfolio website for **Mahmoud Dahy** using a distinctive, modern Editorial design system inspired by the approved reference design.

The current website is fully functional and must remain functional. This task is strictly a **visual redesign**, not a feature implementation or architectural refactoring.

## 1. Mandatory Rules

- Inspect the existing codebase and understand its current architecture before making changes.
- Read all project instructions and existing implementation plans first.
- Preserve **100% of the existing business logic, application behavior, and data flow**.
- Do not modify Supabase configuration, database schemas, migrations, RLS policies, Edge Functions, authentication, storage, or backend integrations.
- Do not modify the existing Admin Dashboard functionality or its current layout.
- Preserve all existing routes, navigation behavior, forms, validation, filtering, search, theme switching, and interactive features.
- Keep all existing dynamic content connected to its current data sources. Never replace Supabase-driven content with hardcoded mock data.
- Do not remove, rename, or change the contracts of existing components, functions, hooks, services, state providers, or API integrations.
- Avoid unnecessary dependencies, architectural changes, and unrelated code cleanup.
- Prefer existing components and styling infrastructure whenever possible.
- If a visual change appears to require modifying application logic, find a UI-only alternative.
- Preserve existing SEO metadata, accessibility, and loading, empty, and error states.

## 2. Approved Design Direction: Editorial

Replace the current generic dark developer-portfolio appearance with a refined, warm, editorial visual identity.

### Color Palette

Use these colors as the initial design tokens:

- Warm Ivory Background: `#F7F3EB`
- White / Surface: `#FFFDFA`
- Primary Text: `#171717`
- Secondary Text: `#69645F`
- Burnt Orange Accent: `#F06423`
- Subtle Borders: `#E7E0D6`
- Muted Surface: `#EFE9DF`

Use orange selectively for primary buttons, active navigation, small labels, icons, and decorative accents.

Avoid excessive gradients, glowing effects, neon colors, generic blue buttons, and unnecessary visual decoration.

Preserve the existing light/dark theme functionality if available. The Editorial palette above defines the light theme; create a coherent dark counterpart without removing existing theme-switching behavior.

### Typography

- Use a sophisticated editorial heading style with a suitable serif font.
- Use a clean, highly readable sans-serif font for body text, navigation, buttons, and technical information.
- Establish a clear hierarchy through heading sizes, font weights, line heights, and spacing.
- Use large, confident hero typography without making it overwhelming on mobile.
- Use existing locally available fonts when appropriate; avoid introducing external font dependencies unnecessarily.

### Layout and Visual Identity

- Use generous whitespace, asymmetrical compositions, editorial grids, and carefully controlled visual contrast.
- Add subtle orange geometric accents, thin divider lines, understated labels, and refined hover states.
- Avoid making every section a rounded card. Mix open layouts, structured grids, and cards where appropriate.
- Keep the result professional, distinctive, lightweight, and suitable for an engineering/software portfolio.
- Use restrained shadows, consistent border radii, and subtle transitions.
- Avoid excessive animations and parallax effects.

## 3. Homepage Redesign

### Navigation

- Create a clean, minimal navigation bar with the existing logo and navigation items.
- Use subtle orange indicators for the active section.
- Preserve all current navigation destinations, responsive menu behavior, and theme-switching functionality.
- Ensure the navigation remains usable on small screens.

### Hero Section

Redesign the existing hero into a strong editorial composition featuring:

- The existing profile image.
- The existing name: Mahmoud Dahy.
- The existing professional information and biography.
- Clear primary and secondary calls to action.
- Existing social links and CV download/view actions.
- A balanced image composition with subtle burnt-orange geometric accents.

Do not invent new personal information or replace the existing content with placeholder text.

### Dual Professional Identity: Flutter and ELV

Clearly communicate the two professional tracks:

1. **Flutter / Software Development**
2. **ELV / Light Current Engineering**

Use two visually consistent but distinct sections or panels. Maintain the existing field-based content, links, and filtering behavior.

The design must communicate both fields clearly without making the homepage crowded or confusing.

### Featured Projects

- Redesign project cards with editorial spacing, stronger typography, clean image presentation, and subtle hover interactions.
- Preserve existing project images, titles, descriptions, technologies, field classifications, featured status, and destination links.
- Keep technology tags visible on project cards.
- Preserve the existing field-based filtering and all current project visibility rules.
- Ensure images maintain appropriate aspect ratios and do not become stretched or cropped incorrectly.
- Use responsive grids that adapt naturally to desktop, tablet, and mobile screens.

### Remaining Sections

Apply the same visual identity consistently to the existing public-facing sections:

- About
- Skills
- Projects
- Experience
- Education
- Certificates
- Services
- Contact
- Footer

Do not add, remove, or reorder sections unless the existing implementation already requires it for responsive presentation. Preserve all existing content and interactions.

## 4. Other Pages and UI States

- Apply the Editorial theme consistently across all existing public-facing pages, detail views, dialogs, and shared UI components.
- Preserve the current Admin Dashboard UI and functionality completely.
- Ensure existing loading indicators, skeletons, empty states, error messages, form states, and success notifications remain functional and visually consistent where applicable.
- Keep existing form submissions, email notifications, authentication, and database operations unchanged.

## 5. Responsive Design and Accessibility

- Support desktop, laptop, tablet, and mobile viewports.
- Prevent horizontal overflow, clipped content, overlapping elements, and unreadable typography.
- Maintain keyboard navigation, visible focus indicators, semantic HTML, and sufficient color contrast.
- Respect reduced-motion preferences.
- Ensure buttons, links, inputs, and navigation remain usable with touch input.

## 6. Implementation Workflow

### Phase A — Audit

Before editing:

1. Read the repository instructions and project documentation.
2. Identify the frontend framework, styling system, routing, theme management, shared components, and public/admin boundaries.
3. Identify all public-facing pages and the components responsible for their appearance.
4. Trace existing interactive behavior and data connections that must remain untouched.
5. Provide a concise implementation plan and identify any potential regression risks.

### Phase B — Implement

1. Establish reusable Editorial design tokens using the existing styling system.
2. Update shared public-facing typography, colors, spacing, buttons, navigation, and surfaces.
3. Redesign the homepage and its existing sections.
4. Apply the theme consistently to other public-facing pages.
5. Preserve existing functionality and minimize the number of files changed.
6. Do not perform unrelated refactoring.

### Phase C — Verify

After implementation:

1. Run the existing linting, type-checking, tests, and production build where available.
2. Fix any errors introduced by the redesign.
3. Verify existing routes and navigation.
4. Verify Supabase-driven content still loads correctly.
5. Verify project filtering, field selectors, technology tags, and visibility rules.
6. Verify forms, CV links, theme switching, and other existing interactive features.
7. Confirm that the Admin Dashboard has not been unintentionally changed.
8. Test responsive layouts at representative desktop, tablet, and mobile sizes.
9. Review the final appearance against the approved Editorial direction.

Do not claim a test passed unless it was actually executed successfully.

## 7. Acceptance Criteria

The task is complete only when:

- The public website has a clearly recognizable Editorial visual identity.
- The warm ivory, charcoal, and burnt-orange palette is applied consistently.
- Typography, whitespace, grids, and project presentation are substantially improved.
- Both Flutter and ELV are represented clearly.
- All existing dynamic content and Supabase integrations continue working.
- No existing features, routes, or business rules have been removed or altered.
- The Admin Dashboard remains unchanged.
- Responsive layouts work correctly.
- The project passes all applicable checks, or any pre-existing failures are explicitly documented.

## Final Instruction

**Change the presentation, not the product's behavior.**

Treat the existing implementation as the source of truth. Prioritize visual improvements, preserve existing functionality, and avoid any change outside the scope of the public-facing design.

At completion, report:

- The files changed.
- The public-facing components redesigned.
- Confirmation of whether the Admin Dashboard remained untouched.
- Tests and build commands executed, including their actual results.
- Any remaining visual or technical issues.
