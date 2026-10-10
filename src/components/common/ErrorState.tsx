import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  /** Human-readable message. Technical detail stays in the console. */
  message?: string
  onRetry?: () => void
  className?: string
}

/**
 * Shown when a request failed.
 *
 * The message is written for a visitor, not a developer. The underlying error is logged
 * by the service that produced it, so debugging information is still available without
 * being displayed.
 *
 * `role="alert"` announces the failure immediately to screen readers.
 */
export function ErrorState({
  message = 'Failed to load this content.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-10 text-center ${className ?? ''}`}
    >
      <AlertCircle className="text-destructive size-7" aria-hidden="true" />
      <p className="text-sm">{message}</p>
      {onRetry ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
