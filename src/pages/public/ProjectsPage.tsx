import { FolderKanban } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { FieldSelector } from '@/components/common/FieldSelector'
import { ProjectCard, useProjects, filterProjectsByField } from '@/features/projects'
import { FIELD_LABELS, FIELD_OPTIONS, ALL_FIELDS, type FieldFilter } from '@/constants/fields'
import { usePageSeo } from '@/hooks/useSeo'
import { useState } from 'react'

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
  const [field, setField] = useState<FieldFilter>(ALL_FIELDS)

  const projects = useProjects()
  const allProjects = projects.data ?? []

  const availableFields = FIELD_OPTIONS.filter((option) =>
    allProjects.some((project) => project.field === option),
  )
  const filterOptions: FieldFilter[] = [ALL_FIELDS, ...availableFields]
  const activeField = filterOptions.includes(field) ? field : ALL_FIELDS
  const visibleProjects = filterProjectsByField(allProjects, activeField)

  usePageSeo({
    section: 'Projects',
    description: 'Selected projects, with the technologies used to build them.',
  })

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
        {availableFields.length > 0 ? (
          <div className="mb-8 space-y-2">
            <p className="text-muted-foreground text-sm font-medium">Projects field</p>
            <FieldSelector
              value={activeField}
              onChange={setField}
              includeAll
              options={filterOptions}
              ariaLabel="Filter projects by field"
            />
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
            activeField === 'all'
              ? 'No projects published yet'
              : `No ${FIELD_LABELS[activeField]} projects published yet`
          }
          emptyDescription={
            activeField === 'all'
              ? 'Published projects will appear here.'
              : 'Published projects will appear here for this field.'
          }
          emptyIcon={FolderKanban}
          emptyAction={undefined}
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
