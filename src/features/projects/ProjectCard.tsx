import { Link } from 'react-router-dom'
import { ArrowUpRight, CodeXml } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FIELD_LABELS } from '@/constants/fields'
import { projectDetailPath } from '@/constants/routes'
import { imageUrl } from '@/services/mediaUrls'
import type { ProjectWithRelations } from '@/types/entities'

/**
 * One project in a grid.
 *
 * The whole card is a single link. Overlaying a second link on top would create two
 * tab stops for one destination and confuse a screen reader, so the external links inside
 * are the only nested interactive elements and they sit visibly apart from the card link.
 *
 * `layout` only changes presentation: "horizontal" spreads one card across two columns
 * so a featured section can lead with a larger composition instead of identical cards.
 */
export function ProjectCard({
  project,
  layout = 'vertical',
}: {
  project: ProjectWithRelations
  layout?: 'vertical' | 'horizontal'
}) {
  const cover = imageUrl(project.coverImagePath)
  // Already sorted by the service; copied before sorting so the array in the query cache
  // is not reordered in place.
  const technologies = [...project.technologies].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )

  return (
    <article
      className={
        layout === 'horizontal'
          ? 'border-border bg-card group relative grid h-full overflow-hidden rounded-lg border transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 sm:grid-cols-[1.15fr_1fr]'
          : 'border-border bg-card group relative flex h-full flex-col overflow-hidden rounded-lg border transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40'
      }
    >
      <div
        className={
          layout === 'horizontal'
            ? 'bg-muted relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-72'
            : 'bg-muted relative aspect-[16/10] overflow-hidden'
        }
      >
        {cover ? (
          <img
            src={cover}
            alt={`${project.title} cover`}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
            No cover image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            {FIELD_LABELS[project.field]}
          </p>
          {project.isFeatured ? <Badge>Featured</Badge> : null}
        </div>

        <h3
          className={
            layout === 'horizontal'
              ? 'font-display text-2xl leading-snug font-semibold tracking-tight'
              : 'font-display text-xl leading-snug font-semibold tracking-tight'
          }
        >
          <Link
            to={projectDetailPath(project.slug)}
            className="after:absolute after:inset-0 after:content-[''] decoration-primary decoration-2 underline-offset-4 group-hover:underline"
          >
            {project.title}
          </Link>
        </h3>

        {project.summary ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{project.summary}</p>
        ) : null}

        {technologies.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Technologies used">
            {technologies.map((technology) => (
              <li key={technology.id}>
                <Badge variant="secondary">{technology.name}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/*
        Positioned above the card's stretched link, so these remain clickable. `relative`
        puts them in the same stacking context as that `::after`, and the explicit z-index
        keeps them clickable without a negative offset hack.
      */}
      <div className="relative z-10 mt-auto flex gap-4 border-t px-5 py-3 text-sm">
        {project.repositoryUrl ? (
          <a
            href={project.repositoryUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <CodeXml className="size-4" aria-hidden="true" />
            Source
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
            Live demo
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  )
}
