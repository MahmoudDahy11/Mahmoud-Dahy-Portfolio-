import { GraduationCap } from 'lucide-react'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { EducationTimeline, useEducations } from '@/features/education'
import { usePageSeo } from '@/hooks/useSeo'

/** Academic history, most recent qualification first. */
export default function EducationPage() {
  const education = useEducations()

  usePageSeo({
    section: 'Education',
    description: 'Degrees, institutions, and academic background.',
  })

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Education"
          description="Degrees, institutions, and academic background."
          headingLevel="h1"
        />

        <div className="max-w-3xl">
          <QueryState
            isLoading={education.isLoading}
            isError={education.isError}
            error={education.error}
            data={education.data}
            skeletonRows={3}
            emptyTitle="No education added yet"
            emptyDescription="Qualifications will appear here once they are published."
            emptyIcon={GraduationCap}
            onRetry={() => void education.refetch()}
          >
            {(data) => <EducationTimeline education={data} />}
          </QueryState>
        </div>
      </Container>
    </Section>
  )
}
