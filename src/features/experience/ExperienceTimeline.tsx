import { MapPin } from 'lucide-react'
import { formatDateRange } from '@/utils/formatDate'
import type { Experience } from '@/types/entities'

/** One role in the employment timeline. */
export function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <li className="border-l-2 pl-4">
      <p className="text-muted-foreground text-sm">
        {formatDateRange(experience.startDate, experience.endDate)}
        {/*
          `is_current` is a separate column from `end_date`, so the database can require an
          end date for a finished role. That means the two can disagree, and this label is
          what resolves it for the reader.
        */}
        {experience.isCurrent ? ' — Present' : ''}
      </p>

      <h3 className="font-medium">{experience.title}</h3>

      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
        <span>{experience.company}</span>
        {experience.employmentType ? <span>· {experience.employmentType}</span> : null}
        {experience.location ? (
          <span className="inline-flex items-center gap-1">
            · <MapPin className="size-3.5" aria-hidden="true" />
            {experience.location}
          </span>
        ) : null}
      </p>

      {experience.description ? (
        <p className="mt-2 text-sm whitespace-pre-line">{experience.description}</p>
      ) : null}
    </li>
  )
}

/** The full employment timeline, as an ordered list for screen readers. */
export function ExperienceTimeline({ experiences }: { experiences: Experience[] }) {
  return (
    <ol className="space-y-6">
      {experiences.map((experience) => (
        <ExperienceItem key={experience.id} experience={experience} />
      ))}
    </ol>
  )
}
