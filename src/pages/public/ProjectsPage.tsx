import { FolderKanban } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { ProjectCard, useProjects, useTechnologyFilters } from '@/features/projects'
import { usePageSeo } from '@/hooks/useSeo'
import { useSearchParams } from 'react-router-dom'

/**
 * Projects index: a responsive grid with a technology filter.
 *
 * The filter lives in the URL rather than in component state, so a filtered view can be
 * shared, bookmarked, and reached with the back button — the behaviour every visitor
 * expects from a filter. It also means there is no state to reset when navigating away
 * and back.
 *
 * Filtering happens on the client because the full list is already loaded: the query
 * fetches every published project once, and selecting a subset of that is instant. A
 * server-side filter would be the right call if the list ever grew to hundreds.
 */
export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTechnology = searchParams.get('tech') ?? ''

  const projects = useProjects()
  const technologies = useTechnologyFilters()

  usePageSeo({
    section: 'Projects',
    description: 'Selected projects, with the technologies used to build them.',
  })

  const allProjects = projects.data ?? []
  const visibleProjects = activeTechnology
    ? allProjects.filter((project) =>
        project.technologies.some((technology) => technology.slug === activeTechnology),
      )
    : allProjects

  function selectTechnology(slug: string) {
    // Writing the parameter rather than the whole object preserves anything else already
    // in the query string, and removing it is how "All" is expressed.
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (slug) next.set('tech', slug)
      else next.delete('tech')
      return next
    })
  }

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Projects"
          description="Things I have designed, built, and shipped."
          headingLevel="h1"
        />

        {/*
          The filter is rendered outside `QueryState` on purpose: it is derived from a
          second query, and hiding it behind the projects' loading state would make the
          controls appear and disappear as projects load.
        */}
        {technologies.data && technologies.data.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects by technology">
            <Button
              size="sm"
              variant={activeTechnology ? 'outline' : 'default'}
              onClick={() => selectTechnology('')}
              aria-pressed={!activeTechnology}
            >
              All
            </Button>

            {technologies.data.map((technology) => (
              <Button
                key={technology.slug}
                size="sm"
                variant={activeTechnology === technology.slug ? 'default' : 'outline'}
                onClick={() => selectTechnology(technology.slug)}
                aria-pressed={activeTechnology === technology.slug}
              >
                {technology.name}
                <span className={activeTechnology === technology.slug ? 'opacity-80' : 'text-muted-foreground'}>
                  {technology.count}
                </span>
              </Button>
            ))}
          </div>
        ) : null}

        {/*
          `data` is the full list, so the empty state can distinguish "no projects at all"
          from "no projects use this technology" — two very different messages, and only
          the second is worth showing a way out of.
        */}
        <QueryState
          isLoading={projects.isLoading}
          isError={projects.isError}
          error={projects.error}
          data={visibleProjects}
          skeletonRows={3}
          emptyTitle={
            activeTechnology
              ? 'No projects with that technology'
              : 'No projects published yet'
          }
          emptyDescription={
            activeTechnology
              ? 'Try a different filter, or view all projects.'
              : 'Published projects will appear here.'
          }
          emptyIcon={FolderKanban}
          emptyAction={
            activeTechnology ? (
              <Button size="sm" variant="outline" onClick={() => selectTechnology('')}>
                View all projects
              </Button>
            ) : undefined
          }
          onRetry={() => void projects.refetch()}
        >
          {(data) => (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((project, index) => (
                /*
                  A slight stagger makes the grid read as a group arriving, not a wall
                  appearing. The delay is capped so a long list never keeps later cards
                  waiting on a slow-looking cascade.
                */
                <div
                  key={project.id}
                  className="animate-fade-rise"
                  style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </Container>
    </Section>
  )
}
