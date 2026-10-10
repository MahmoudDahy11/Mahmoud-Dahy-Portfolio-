import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Container } from '@/components/common/Section'
import { Badge } from '@/components/ui/badge'
import { PUBLIC_ROUTES } from '@/constants/routes'
import { useSkills } from './hooks'
import { QueryState } from '@/components/common/QueryState'
import { Sparkles } from 'lucide-react'

/** How many skills to preview. Enough to show range without crowding the page. */
const PREVIEW_LIMIT = 12

/**
 * Skills preview on the home page.
 *
 * A summary, not the full list: the About page holds the complete set. Fetching all of
 * them and slicing here would still transfer every row.
 */
export function SkillsPreview() {
  const skills = useSkills()

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Skills"
          description="The tools and technologies I work with day to day."
          headingLevel="h2"
        >
          <Link
            to={PUBLIC_ROUTES.about}
            className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            See all skills
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </SectionHeading>

        <QueryState
          isLoading={skills.isLoading}
          isError={skills.isError}
          error={skills.error}
          data={skills.data}
          skeletonRows={2}
          emptyTitle="No skills added yet"
          emptyDescription="Skills will appear here once they are published."
          emptyIcon={Sparkles}
          onRetry={() => void skills.refetch()}
        >
          {(data) => (
            <ul className="flex flex-wrap gap-2">
              {data.slice(0, PREVIEW_LIMIT).map((skill) => (
                <li key={skill.id}>
                  <Badge variant="secondary" className="text-sm">
                    {skill.name}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </Container>
    </Section>
  )
}
