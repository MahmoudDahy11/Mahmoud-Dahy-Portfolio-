import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  /** Primary action, usually "Add" or "Save". */
  action?: ReactNode
}

/**
 * Title block for admin pages.
 *
 * Every admin section uses this so the layout of a content page is always the same: the
 * owner learns one structure and can work with any of them.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
