import { describe, expect, it, beforeAll } from 'vitest'
import { getProfile } from '@/services/profile'
import { getSiteSettings } from '@/services/siteSettings'
import { getAboutSections } from '@/services/about'
import { getSkills } from '@/services/skills'
import { getPublishedProjects, getProjectBySlug, getTechnologyFilters } from '@/services/projects'
import { getExperiences } from '@/services/experience'
import { getEducations } from '@/services/education'
import { getCertificates } from '@/services/certificates'
import { getServices } from '@/services/services'
import { getSocialLinks } from '@/services/socialLinks'

/**
 * End-to-end checks against the real Supabase project.
 *
 * These are excluded from `npm test` by default, because a normal test run must not depend
 * on a network or on the database holding particular rows. Run them deliberately:
 *
 *   VITE_RUN_LIVE_TESTS=1 npm run test
 *
 * The flag is read from `import.meta.env` rather than `process.env` because the app's
 * tsconfig deliberately has no Node types, and adding them for one test file would widen
 * the global scope of the whole project.
 *
 * They exist because the failure this project actually hit was not a type error. Two
 * services returned `snake_case` keys while claiming to return camelCase, which the
 * compiler and the unit tests were both perfectly happy with, and which only appeared as
 * `undefined` once a real row came back. Anything that depends on the real shape of a real
 * response belongs here.
 */

const live = import.meta.env.VITE_RUN_LIVE_TESTS === '1'

describe.skipIf(!live)('live Supabase reads', () => {
  beforeAll(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set to run these tests.')
    }
  })

  it('reads the profile with camelCase keys', async () => {
    const profile = await getProfile()

    expect(profile).not.toBeNull()
    // The seed's row. A snake_case value here would mean the rename never ran.
    expect(profile?.fullName).toBe('[Sample] Mahmoud Dahy')
    expect(profile?.shortBio).toBeTruthy()
    expect(profile?.yearsOfExperience).toBe(6)
  })

  it('reads site settings with camelCase keys', async () => {
    const settings = await getSiteSettings()

    expect(settings?.siteTitle).toBe('[Sample] Portfolio')
    expect(settings?.showAvailabilityBadge).toBe(true)
  })

  it('reads published about sections in order', async () => {
    const sections = await getAboutSections()

    expect(sections.length).toBeGreaterThan(0)
    expect(sections[0]?.title).toContain('[Sample]')
    expect(sections[0]?.isPublished).toBe(true)
  })

  it('reads published skills and groups the uncategorised one', async () => {
    const skills = await getSkills()

    // The seed includes a published skill with no category, which proves the left join
    // keeps it instead of dropping it.
    expect(skills.some((skill) => skill.skillCategories === null)).toBe(true)
    expect(skills.some((skill) => skill.skillCategories !== null)).toBe(true)
    expect(skills.find((skill) => skill.name === 'Flutter')?.skillCategories?.name).toBe('Frameworks')
    // The unpublished sample skill must not reach the public list.
    expect(skills.some((skill) => skill.name === 'Hidden Sample Skill')).toBe(false)
  })

  it('reads published projects with their technologies resolved', async () => {
    const projects = await getPublishedProjects()

    expect(projects.length).toBe(3)
    expect(projects[0]?.title).toContain('[Sample]')
    expect(projects[0]?.isFeatured).toBe(true)
    expect(projects[0]?.repositoryUrl).toContain('https://')

    const names = projects[0]?.technologies.map((technology) => technology.name) ?? []
    expect(names).toContain('Flutter')
  })

  it('hides the unpublished draft, by RLS and by query filter', async () => {
    const draft = await getProjectBySlug('sample-internal-draft')

    expect(draft).toBeNull()
  })

  it('returns a published project by slug', async () => {
    const project = await getProjectBySlug('sample-clinic-booking')

    expect(project?.title).toBe('[Sample] Clinic Booking')
    expect(project?.clientName).toBe('[Sample] Sample Clinic')
  })

  it('counts projects per technology for the filter', async () => {
    const filters = await getTechnologyFilters()

    // TypeScript and PostgreSQL each appear on two published projects.
    expect(filters.find((item) => item.slug === 'typescript')?.count).toBe(2)
    expect(filters.find((item) => item.slug === 'postgresql')?.count).toBe(2)
    expect(filters.find((item) => item.slug === 'dart')?.count).toBe(1)
  })

  it('reads experience, with the current role last and undated', async () => {
    const experiences = await getExperiences()

    expect(experiences.length).toBe(3)
    const current = experiences.find((item) => item.isCurrent)
    expect(current?.endDate).toBeNull()
    expect(current?.company).toBe('[Sample] Current Employer')
  })

  it('reads education, certificates, services, and social links', async () => {
    expect((await getEducations()).length).toBe(2)
    expect((await getCertificates()).length).toBe(3)
    expect((await getServices()).length).toBe(4)
    expect((await getSocialLinks()).length).toBe(4)
  })
})
