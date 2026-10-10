import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { formatDateRange } from '@/utils/formatDate'
import { useExperiences } from './hooks'

/** How many roles to preview before linking to the full timeline. */
const PREVIEW_LIMIT = 3

/**
 * Most recent roles on the home page.
 *
 * Deliberately a summary. The full timeline, with descriptions, is on the Experience page;
 * repeating all of it here would make the home page a second, worse version of that page.
 */
export function ExperiencePreview() {
  const experiences = useExperiences()

  return (
    <Section className="bg-muted/40 border-y">
      <Container>
        <SectionHeading
          title="Experience"
          description="Where I have worked and what I was responsible for."
          headingLevel="h2"
        >
          <Link
            to={PUBLIC_ROUTES.experience}
            className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Full history
          </Link>
        </SectionHeading>

        <QueryState
          isLoading={experiences.isLoading}
          isError={experiences.isError}
          error={experiences.error}
          data={experiences.data}
          skeletonRows={3}
          emptyTitle="No experience added yet"
          emptyDescription="Roles will appear here once they are published."
          emptyIcon={Briefcase}
          onRetry={() => void experiences.refetch()}
        >
          {(data) => (
            <ol className="space-y-6">
              {data.slice(0, PREVIEW_LIMIT).map((experience) => (
                <li key={experience.id} className="border-l-2 pl-4">
                  <p className="text-muted-foreground text-sm">
                    {formatDateRange(experience.startDate, experience.endDate)}
                    {experience.isCurrent ? ' — Present' : ''}
                  </p>
                  <p className="font-medium">{experience.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {experience.company}
                    {experience.location ? ` · ${experience.location}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </QueryState>
      </Container>
    </Section>
  )
}
