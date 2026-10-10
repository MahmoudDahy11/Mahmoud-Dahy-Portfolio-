import { cn } from '@/lib/utils'

/**
 * Placeholder shown while page content loads.
 *
 * A block with the final height prevents the layout from jumping when the real content
 * replaces it.
 */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} />
}

/**
 * Standard list of skeleton rows. Used by every page that renders a collection, so the
 * loading experience is identical everywhere.
 */
export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonBlock key={index} className="h-24 w-full" />
      ))}
    </div>
  )
}

/** Indeterminate spinner for actions and full-page waits. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('border-muted-foreground/30 border-t-primary inline-block size-5 animate-spin rounded-full border-2', className)}
    />
  )
}

/**
 * Full-page loading state.
 *
 * `role="status"` plus `aria-live` means a screen reader announces the wait instead of
 * silently rendering an empty page.
 */
export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex min-h-[50vh] flex-col items-center justify-center gap-3"
    >
      <Spinner className="size-6" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
