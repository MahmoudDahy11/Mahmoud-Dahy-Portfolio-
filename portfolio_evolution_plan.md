# Portfolio Evolution Plan — Mahmoud Dahy

## 1. Purpose

Evolve the existing portfolio from a Flutter-only portfolio into a unified, professional engineering portfolio that presents two complementary tracks:

1. **Software Development** — especially Flutter and the projects already built.
2. **ELV / Light Current Engineering** — the user's developing engineering career focus.

This is an extension of the current portfolio, not a rebuild from scratch. Preserve the existing professional design, working features, and architecture wherever practical.

The goal is to make the portfolio useful for recruiters and companies hiring in either track, while keeping each audience focused on the information relevant to them.

---

## 2. Core Positioning

### Proposed identity

**Mahmoud Dahy — Software & ELV Engineer**

Supporting description:

> Communications & Electronics Engineering graduate with software development experience and a growing focus on ELV / Light Current Engineering.

This positioning should communicate a coherent engineering background rather than suggesting two unrelated careers. Do not imply professional ELV employment or expertise that has not yet been earned.

The wording can be refined later, but the portfolio should consistently communicate:
- Communications & Electronics Engineering foundation.
- Demonstrated software development work.
- A developing specialization in ELV / Light Current systems.
- Evidence-based skills and projects.

---

## 3. Main Experience: One Portfolio, Two Tracks

The portfolio remains one website with one shared visual identity. It should offer a clear way to focus the content on either track.

### Track selector

A visible selector may be placed in the hero section or another prominent area:

- **Software**
- **ELV**

Selecting a track should adjust which content is emphasized and/or shown first. It should not create two disconnected websites or duplicate the entire portfolio.

Expected behavior:
- **Software mode:** prioritize Flutter/software skills, software projects, relevant experience, software certificates, GitHub, and the Software CV.
- **ELV mode:** prioritize ELV/Light Current skills, engineering projects, relevant training/certificates, engineering experience, and the ELV CV.
- **All / shared content:** retain shared sections such as education, contact details, and general engineering background where appropriate.

The exact interaction, routing, persistence, and visual design will be decided during the implementation phase. Do not implement them without reviewing the current app first.

---

## 4. Proposed Information Architecture

Treat this as a target structure, not a requirement to add every section immediately. First inspect the current portfolio and map existing sections to the structure below.

1. **Navigation**
   - Existing branding and navigation should be preserved where effective.
   - Add access to the two professional tracks without cluttering the navbar.

2. **Hero**
   - Name and concise professional identity.
   - Short description connecting software development with the engineering background.
   - Primary actions such as View Projects, Contact, and Download CV.
   - Clear Software / ELV track selection.

3. **About**
   - Communications & Electronics Engineering background.
   - Software development experience supported by real projects.
   - Current ELV / Light Current learning and specialization, described honestly.

4. **Professional Tracks**
   - Software Development.
   - ELV / Light Current Engineering.
   - Each track should explain its focus and lead to relevant work and skills.

5. **Skills**
   - Separate software and ELV categories.
   - Use accurate, defensible proficiency labels rather than arbitrary percentage bars.
   - Distinguish demonstrated experience from familiarity and ongoing learning.

6. **Experience**
   - Show genuine employment, internships, training, or independent project work with accurate labels.
   - Do not invent company employment or professional ELV experience.
   - If appropriate, represent software work as independent/project-based experience and ELV activity as professional development until actual employment exists.

7. **Projects**
   - Allow filtering by All, Software, and ELV/Engineering.
   - Keep existing software projects, including relevant Flutter and graduation-project work.
   - Add ELV projects only when there is genuine design, documentation, simulation, or hands-on work to present.
   - Each project should describe the problem, scope, role, tools/systems, design decisions, and evidence or outcome where available.

8. **Education**
   - Communications & Electronics Engineering degree.
   - Graduation project: Phoenix — Search & Rescue Robot, with the A+ grade represented accurately.

9. **Certificates & Training**
   - Categorize items by track where useful.
   - Include only certificates or training that have actually been completed or clearly label ongoing learning.
   - Preserve certificate details and credential links where available.

10. **CV Downloads**
    - Provide separate CVs for the two target paths:
      - Software / Flutter CV.
      - ELV / Light Current CV.
    - Make it clear which CV is intended for each audience.
    - Do not force both career tracks into one overloaded CV.

11. **Services**
    - Keep only services the user can genuinely provide.
    - Organize by track if both software and engineering services are offered.
    - Do not advertise regulated or safety-critical design/installation services beyond actual competence and applicable qualifications.

12. **Contact**
    - One shared contact section.
    - Make it easy for either software or ELV recruiters/companies to get in touch.
    - Keep existing working contact functionality.

---

## 5. Content and Credibility Rules

These rules apply to all portfolio content:

- Never fabricate employment, clients, projects, certificates, project outcomes, or technical expertise.
- Do not claim to be an ELV specialist before the user's skills and practical work support that claim.
- Use clear labels such as **Hands-on**, **Working Knowledge**, **Familiar With**, or **Currently Learning** only when accurate.
- Avoid meaningless skill percentages such as “CCTV 90%.”
- Distinguish personal projects, academic projects, training exercises, and professional employment.
- Do not list a technology or ELV subsystem as a proven skill merely because it appears in the roadmap.
- Keep descriptions concise, specific, and evidence-based.

---

## 6. Design Direction

The updated portfolio should remain professional, modern, responsive, and consistent with the existing visual design.

Guidelines:
- Preserve the current design system, brand identity, and working UI unless a specific change is justified.
- Avoid making the site look like two unrelated portfolios stitched together.
- Make the track selector easy to understand and use on mobile and desktop.
- Keep pages readable, fast, accessible, and recruiter-friendly.
- Use consistent terminology, spacing, typography, cards, filters, and interaction patterns.
- Avoid unnecessary animations, decorative complexity, and duplicated content.
- Do not choose a new color palette or redesign the entire interface without first inspecting the existing design.

---

## 7. Dynamic Content and Admin Dashboard

The current portfolio already uses Supabase and has an admin dashboard. The default plan is to extend the current system rather than replace it.

The desired result is for relevant content to be manageable from the existing dashboard, including:
- Track/category assignment for projects.
- Skill categories and truthful proficiency labels.
- Certificate/training categories.
- Project visibility, featured status, and display order.
- CV files/links for the appropriate track.
- Track-specific descriptions or highlights if required.

Potential content classifications:
- `software`
- `elv`
- `engineering` or `shared`

These are conceptual examples, not a final database schema. Inspect the existing Supabase tables, policies, storage, application models, and dashboard before changing anything.

### Implementation safeguards
- Do not recreate the Supabase project or replace the current backend.
- Do not make destructive schema changes without an explicit migration plan.
- Preserve existing data and working features.
- Review authentication, Row Level Security (RLS), storage permissions, and existing integrations before modifying them.
- Prefer backward-compatible changes and migrations.
- Avoid hardcoding content that is intended to be managed dynamically.
- Do not change the database schema just to match this document if the current schema can support the goal cleanly.

---

## 8. Implementation Strategy: One Section at a Time

This document defines the overall vision only. Implementation prompts and decisions will be prepared separately, one part at a time.

For each part:

1. Inspect the current implementation and relevant files before editing.
2. Report what already exists and how it maps to this plan.
3. Identify the smallest necessary changes.
4. Explain any database, routing, UI, or data-model impact before making risky changes.
5. Implement only the scope of the current task.
6. Preserve unrelated functionality and existing visual quality.
7. Test the affected behavior and check for regressions.
8. Update the project progress/status documentation if the repository already uses it.
9. Report completed, partially completed, and remaining items honestly.

Do not implement the entire portfolio transformation in one pass. Wait for a dedicated prompt for each section or feature.

---

## 9. Suggested Work Order

The order can be adjusted after inspecting the current project:

1. **Audit the existing portfolio** — sections, routes, components, Supabase schema, admin dashboard, current styling, and working integrations.
2. **Finalize positioning and navigation** — shared identity and Software / ELV track experience.
3. **Adapt the Hero and About sections** — preserve the existing design while updating the content.
4. **Implement track-aware content structure** — only after the current data model is understood.
5. **Update Skills** — categories and credible proficiency labels.
6. **Update Projects** — track filters and project presentation.
7. **Update Experience and Education** — accurate, evidence-based descriptions.
8. **Update Certificates and Training** — categories and credential details.
9. **Add separate CV options** — Software and ELV.
10. **Review Services and Contact** — align them with real capabilities and keep integrations working.
11. **Final responsive, accessibility, data-security, and regression review.**

This is a planning sequence, not authorization to start every step automatically.

---

## 10. Definition of Success

The updated portfolio is successful when:

- It still feels like one cohesive, professional personal brand.
- A software recruiter can quickly find Flutter skills, software projects, and the Software CV.
- An ELV recruiter can quickly find relevant engineering skills, genuine ELV work/training, and the ELV CV.
- Shared education and engineering background reinforce the story instead of adding confusion.
- The admin dashboard can manage the relevant content without unnecessary manual code edits.
- Existing projects, Supabase integrations, contact form, and other working features continue to function.
- The site is responsive, credible, easy to navigate, and free from fabricated claims.
- Changes are implemented incrementally and verified rather than replacing the existing portfolio wholesale.

---

## 11. Important Instruction

**Do not start implementation from this document alone.**

Use this file as the high-level product vision. Before making changes, inspect the existing portfolio. The user will provide a separate prompt for each section or feature, and work should proceed one part at a time.
