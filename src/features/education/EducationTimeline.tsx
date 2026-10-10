import { imageUrl } from '@/services/mediaUrls'
import { formatDateRange } from '@/utils/formatDate'
import type { Education } from '@/types/entities'

/** One entry in the education timeline. */
export function EducationItem({ education }: { education: Education }) {
  return (
    <li className="border-l-2 pl-4">
      <p className="text-muted-foreground text-sm">
        {formatDateRange(education.startDate, education.endDate)}
      </p>
      <h3 className="font-medium">{education.degree}</h3>
      <p className="text-muted-foreground text-sm">
        {education.institution}
        {education.fieldOfStudy ? ` · ${education.fieldOfStudy}` : null}
      </p>

      {education.grade ? (
        <p className="text-muted-foreground mt-1 text-sm">Grade: {education.grade}</p>
      ) : null}

      {education.logoPath ? (
        <img
          src={imageUrl(education.logoPath) ?? undefined}
          alt={`${education.institution} logo`}
          className="border-border bg-card mt-3 size-12 rounded border object-contain p-1"
          loading="lazy"
        />
      ) : null}

      {education.description ? (
        <p className="mt-2 text-sm whitespace-pre-line">{education.description}</p>
      ) : null}
    </li>
  )
}

/** The full education timeline, as an ordered list for screen readers. */
export function EducationTimeline({ education }: { education: Education[] }) {
  return (
    <ol className="space-y-6">
      {education.map((entry) => (
        <EducationItem key={entry.id} education={entry} />
      ))}
    </ol>
  )
}
