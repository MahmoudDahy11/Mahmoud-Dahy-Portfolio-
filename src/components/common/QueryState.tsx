import type { ReactNode } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/LoadingState'
import { toErrorMessage } from '@/lib/errors'
import type { LucideIcon } from 'lucide-react'

/**
 * Renders the three states every data-backed page has to handle, in one place.
 *
 * Without this, each page grows its own slightly different version of "if loading …
 * else if error … else if empty …", and the site ends up inconsistent: one page shows a
 * spinner, another shows three grey boxes, a third shows nothing at all. Here the loading
 * state is a skeleton that matches the final layout, so nothing jumps when data arrives.
 *
 * `retry` is passed straight to TanStack Query's `refetch`, so the button actually
 * re-runs the request rather than only re-rendering.
 */
export function QueryState<T>({
  isLoading,
  isError,
  error,
  data,
  skeletonRows = 3,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRetry,
  children,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  data: T[] | null | undefined
  skeletonRows?: number
  emptyTitle: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
  emptyAction?: ReactNode
  onRetry?: () => void
  children: (data: NonNullable<T[]>) => ReactNode
}) {
  if (isLoading) return <SkeletonList rows={skeletonRows} />

  if (isError) {
    return <ErrorState message={toErrorMessage(error, 'Failed to load this content.')} onRetry={onRetry} />
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }

  /*
    The content fades in once, when it replaces the skeleton. A hard swap from grey boxes
    to live content is a visible jump; this is the single motion beat the public site uses
    to say "the data arrived". The reduced-motion query in `index.css` collapses it to
    nothing, so no user who opts out sees it.
  */
  return (
    <div className="animate-fade-in">
      {children(data)}
    </div>
  )
}

/**
 * The same three states for a single record, used by `profile` and `site_settings`.
 *
 * Separate from `QueryState` because those tables hold one row: "empty" means the owner
 * has not filled the record in yet, which is a different message from a list that has no
 * items, and it should not be phrased as a list.
 */
export function QueryValue<T>({
  isLoading,
  isError,
  error,
  data,
  onRetry,
  children,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  data: T | null | undefined
  onRetry?: () => void
  children: (data: NonNullable<T>) => ReactNode
}) {
  if (isLoading) return <SkeletonList rows={2} />

  if (isError) {
    return <ErrorState message={toErrorMessage(error, 'Failed to load this content.')} onRetry={onRetry} />
  }

  if (data === null || data === undefined) return null

  return <>{children(data)}</>
}
