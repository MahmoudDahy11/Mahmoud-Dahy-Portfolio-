import type { ColumnDef } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonBlock } from '@/components/common/LoadingState'

export type Column<TData> = ColumnDef<TData, unknown> & {
  /** Rendered as the column header. Optional for purely decorative columns. */
  header: ReactNode
}

type DataTableProps<TData> = {
  columns: Column<TData>[]
  data: TData[]
  getRowId?: (row: TData) => string
  caption: string
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  /** Column keys to hide on small screens, where a wide table would need scrolling. */
  hideBelow?: Record<string, 'sm' | 'md' | 'lg'>
}

/**
 * Reads a column header as a displayable node.
 *
 * TanStack types `header` as either a node or a render function, but this table only
 * accepts nodes (see `Column`). Narrowing here keeps that contract in one place instead
 * of casting at every call site.
 */
function columnHeader<TData>(column: Column<TData>): ReactNode {
  const header = column.header
  return typeof header === 'function' ? null : header
}

const HIDE_CLASS: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

/**
 * The one table used by every admin section.
 *
 * Centralising it is what makes the dashboard consistent: loading, empty, error, and
 * row rendering behave identically everywhere, so the owner learns the pattern once.
 *
 * Responsive behaviour is deliberate. Below `md`, secondary columns are hidden rather
 * than horizontally scrolled, and a "no rows" or "failed" state replaces the table
 * entirely, because a three-column table squeezed onto a phone is unreadable.
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  caption,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  hideBelow,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  })

  if (error) {
    return <ErrorState message="Failed to load this list." onRetry={onRetry} />
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading {caption}</span>
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonBlock key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className="min-h-64"
      />
    )
  }

  const hasHiddenColumns = hideBelow !== undefined

  return (
    <>
      {/* Wide screens get the full table. */}
      <div className={hasHiddenColumns ? 'hidden md:block' : undefined}>
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const breakpoint = hideBelow?.[cell.column.id]

                  return (
                  <TableCell
                    key={cell.id}
                    className={breakpoint ? HIDE_CLASS[breakpoint] : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Narrow screens get stacked cards using the same column renderers. */}
      {hasHiddenColumns ? (
        <ul className="space-y-3 md:hidden">
          {table.getRowModel().rows.map((row) => (
            <li key={row.id} className="space-y-2 rounded-lg border p-4">
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {/* Column headers are plain nodes, not render functions, so no header context is needed. */}
                    {columnHeader(cell.column.columnDef as Column<TData>)}
                  </span>
                  <span className="text-right text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

/** Convenience wrapper for the "add" button in an empty admin table. */
export function TableEmptyAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" size="sm" onClick={onClick}>
      {label}
    </Button>
  )
}
