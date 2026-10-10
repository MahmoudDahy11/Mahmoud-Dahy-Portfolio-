import { Briefcase } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { ExperienceTimeline, useExperiences } from '@/features/experience'
import { usePageSeo } from '@/hooks/useSeo'

/** Full employment history, most recent role first. */
export default function ExperiencePage() {
  const experiences = useExperiences()

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
          <QueryState
            isLoading={experiences.isLoading}
            isError={experiences.isError}
            error={experiences.error}
            data={experiences.data}
            skeletonRows={4}
            emptyTitle="No experience added yet"
            emptyDescription="Roles will appear here once they are published."
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
