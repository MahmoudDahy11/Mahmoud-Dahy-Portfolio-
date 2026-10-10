import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  title: string
  description?: string
  /** Rendered as the section's accessible name. */
  id?: string
  align?: 'left' | 'center'
  className?: string
  children?: ReactNode
}

/**
 * Standard heading block for a section.
 *
 * The title renders as an `h2` by default. Pages that need a different level pass
 * `headingLevel` so the document outline stays correct — heading order is a real
 * accessibility requirement, not a styling choice.
 */
export function SectionHeading({
  title,
  description,
  id,
  align = 'left',
  className,
  headingLevel: Heading = 'h2',
  children,
}: SectionHeadingProps & { headingLevel?: 'h1' | 'h2' | 'h3' }) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-2 sm:mb-10',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <Heading id={id} className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </Heading>
      {description ? (
        <p className="text-muted-foreground max-w-2xl text-base">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
