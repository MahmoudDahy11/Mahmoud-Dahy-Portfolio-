import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  /** Any action area, typically an "Add …" button. */
  action?: ReactNode
  className?: string
}

/**
 * Shown when a request succeeded but returned nothing.
 *
 * Distinct from ErrorState on purpose: "you have no projects yet" is a normal state with
 * a clear next step, not a failure.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`border-border/60 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center ${className ?? ''}`}
    >
      {Icon ? <Icon className="text-muted-foreground size-8" aria-hidden="true" /> : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
