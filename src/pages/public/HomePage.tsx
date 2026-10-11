import { FolderKanban } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { SkeletonList } from '@/components/common/LoadingState'
import { useMemo } from 'react'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/common/EmptyState'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { ContactCta } from '@/features/contact'
import { ExperiencePreview } from '@/features/experience'
import { Hero, useProfile } from '@/features/profile'
import { TrackPanels } from '@/features/profile/TrackPanels'
import { ProjectCard, useProjects } from '@/features/projects'
import { SkillsPreview } from '@/features/skills'
import { usePageSeo } from '@/hooks/useSeo'
import { imageUrl } from '@/services/mediaUrls'

/** How many featured projects to show. Three fills a row and leaves room to breathe. */
const FEATURED_LIMIT = 3

/**
 * Home page.
 *
 * Composed entirely from feature sections, so this file contains no queries and no
 * formatting logic. Each section owns its own loading, empty, and error state, which means
 * one failing query shows an error in that section only and never blanks the whole page.
 */
export default function HomePage() {
  const profile = useProfile()
  const featured = useProjects({ featuredOnly: true, limit: FEATURED_LIMIT })

  // Falls back to the profile's own headline, then to a static description, so the meta
  // description is never empty even before the owner fills anything in.
  const description =
    profile.data?.shortBio?.trim() ||
    profile.data?.headline?.trim() ||
    'Personal portfolio: projects, experience, and contact details.'

  /*
    Person structured data so a search engine that executes JavaScript can tell this is a
    named individual with a role, not a generic blog. The memo keeps the object's identity
    stable across renders: `useSeo` re-applies the script tag whenever `jsonLd` changes,
    and rebuilding it every render would rewrite the tag pointlessly.
  */
  const personJsonLd = useMemo(() => {
    if (!profile.data) return null

    const person: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.data.fullName,
      url: `${import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173'}/`,
    }

    if (profile.data.headline?.trim()) person.jobTitle = profile.data.headline
    if (profile.data.shortBio?.trim()) person.description = profile.data.shortBio

    const avatar = imageUrl(profile.data.avatarPath)
    if (avatar) person.image = avatar

    return person
  }, [profile.data])

  // The home page's tab title is the owner's own name, so it is used bare rather than
  // with the site name appended: "Mahmoud Dahy — Mahmoud Dahy's Portfolio" helps nobody.
  usePageSeo({
    section: profile.data?.fullName?.trim() || 'Portfolio',
    bare: true,
    description,
    jsonLd: personJsonLd,
  })

  return (
    <>
      {/*
        The hero needs a profile row, so it is skipped entirely until one exists rather
        than rendering a half-empty section. `profile.isLoading` is checked first because
        that is the only state where waiting is correct.
      */}
      {profile.isLoading ? <SkeletonList rows={2} className="py-16" /> : null}

      {profile.data ? <Hero profile={profile.data} /> : null}

      <TrackPanels />

      {/*
        Only projects the owner has flagged as featured appear here. When none are flagged
        the section shows its empty state, which points at the full projects page rather
        than pretending there is nothing to see.
      */}
      <Section>
        <Container>
          <SectionHeading
            title="Featured work"
            description="A few projects that show what I build and how I build it."
            headingLevel="h2"
          >
            <Link
              to={PUBLIC_ROUTES.projects}
              className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              All projects
            </Link>
          </SectionHeading>

          <QueryState
            isLoading={featured.isLoading}
            isError={featured.isError}
            error={featured.error}
            data={featured.data}
            skeletonRows={3}
            emptyTitle="No projects published yet"
            emptyDescription="Published projects will appear here."
            emptyIcon={FolderKanban}
            emptyAction={
              <Link
                to={PUBLIC_ROUTES.projects}
                className="text-primary text-sm font-medium hover:underline"
              >
                Browse all projects
              </Link>
            }
            onRetry={() => void featured.refetch()}
          >
            {(projects) => (
              <div className="grid gap-6 lg:grid-cols-2">
                {projects.map((project, index) =>
                  // The lead project gets a wide horizontal composition; the rest stay
                  // compact. Index-based only — filtering, links, and visibility are
                  // unchanged.
                  index === 0 ? (
                    <div key={project.id} className="lg:col-span-2">
                      <ProjectCard project={project} layout="horizontal" />
                    </div>
                  ) : (
                    <ProjectCard key={project.id} project={project} />
                  ),
                )}
              </div>
            )}
          </QueryState>
        </Container>
      </Section>

      <SkillsPreview />
      <ExperiencePreview />

      {profile.data ? <ContactCta profile={profile.data} /> : <EmptyState title="Profile not set up yet" />}
    </>
  )
}
