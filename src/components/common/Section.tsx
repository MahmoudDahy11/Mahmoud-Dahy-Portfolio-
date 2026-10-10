import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = {
  children: ReactNode
  id?: string
  className?: string
  /** Removes the default vertical padding for sections that manage their own. */
  flush?: boolean
}

/**
 * A page section with consistent vertical rhythm.
 *
 * Pages compose these rather than repeating padding and container classes, which is what
 * keeps spacing identical across the whole site.
 */
export function Section({ children, id, className, flush = false }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(flush ? undefined : 'py-16 sm:py-20', className)}
    >
      {children}
    </section>
  )
}

type ContainerProps = {
  children: ReactNode
  className?: string
}

/** Standard page-width container. Caps line length on very wide displays. */
export function Container({ children, className }: ContainerProps) {
  return <div className={cn('container-page', className)}>{children}</div>
}

/**
 * Narrower container for long-form text. Reading lines beyond roughly 75 characters
 * makes text noticeably harder to scan.
 */
export function ProseContainer({ children, className }: ContainerProps) {
  return <div className={cn('container-prose', className)}>{children}</div>
}
