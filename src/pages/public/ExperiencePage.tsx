import { Briefcase } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { FieldSelector } from '@/components/common/FieldSelector'
import { ExperienceTimeline, useExperiences, filterExperiencesByField } from '@/features/experience'
import { FIELD_LABELS, FIELD_OPTIONS, ALL_FIELDS, type FieldFilter } from '@/constants/fields'
import { usePageSeo } from '@/hooks/useSeo'
import { useState } from 'react'

/** Full employment history, most recent role first. */
export default function ExperiencePage() {
  const [field, setField] = useState<FieldFilter>(ALL_FIELDS)
  const experiences = useExperiences()
  const allExperiences = experiences.data ?? []

  const availableFields = FIELD_OPTIONS.filter((option) =>
    allExperiences.some((experience) => experience.field === option),
  )
  const filterOptions: FieldFilter[] = [ALL_FIELDS, ...availableFields]
  const activeField = filterOptions.includes(field) ? field : ALL_FIELDS
  const visibleExperiences = filterExperiencesByField(allExperiences, activeField)

  usePageSeo({
    section: 'Experience',
    description: 'Roles held, responsibilities taken on, and teams worked with.',
  })

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Experience"
          description="Roles held and what I was responsible for."
          headingLevel="h1"
        />

        <div className="max-w-3xl">
          {availableFields.length > 0 ? (
            <div className="mb-6 space-y-2">
              <FieldSelector
                includeAll
                options={filterOptions}
                value={activeField}
                onChange={setField}
                ariaLabel="Filter experience by field"
              />
              {activeField !== ALL_FIELDS ? (
                <p className="text-muted-foreground text-sm">
                  Showing roles in {FIELD_LABELS[activeField]}.
                </p>
              ) : null}
            </div>
          ) : null}

          <QueryState
            isLoading={experiences.isLoading}
            isError={experiences.isError}
            error={experiences.error}
            data={visibleExperiences}
            skeletonRows={4}
            emptyTitle={
              activeField === ALL_FIELDS
                ? 'No experience added yet'
                : `No ${FIELD_LABELS[activeField]} experience added yet`
            }
            emptyDescription={
              activeField === ALL_FIELDS
                ? 'Roles will appear here once they are published.'
                : `Roles in ${FIELD_LABELS[activeField]} will appear here once they are published.`
            }
            emptyIcon={Briefcase}
            onRetry={() => void experiences.refetch()}
          >
            {(data) => <ExperienceTimeline experiences={data} />}
          </QueryState>
        </div>
      </Container>
    </Section>
  )
}
