import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllEducations, useEducationMutations } from '@/features/education/hooks'
import { EducationDialog } from '@/features/education/EducationDialog'
import { imageUrl } from '@/services/mediaUrls'
import { formatDateRange } from '@/utils/formatDate'
import { ImageOff } from 'lucide-react'
import type { Education } from '@/types/entities'

/** Education history, for the admin. Same shared pieces as every other section. */
export default function EducationPage() {
  const entries = useAllEducations()
  const dialogs = useCrudDialogs<Education>()
  const { create, update, remove, isPending } = useEducationMutations()

  const rows = useMemo(() => entries.data ?? [], [entries.data])

  const columns: Column<Education>[] = [
    {
      id: 'logo',
      header: 'Logo',
      cell: ({ row }) => {
        const logo = imageUrl(row.original.logoPath)

        return logo ? (
          <img src={logo} alt="" className="size-10 rounded object-cover" />
        ) : (
          <span className="bg-muted/40 text-muted-foreground flex size-10 items-center justify-center rounded">
            <ImageOff className="size-4" aria-hidden="true" />
            <span className="sr-only">No logo</span>
          </span>
        )
      },
    },
    {
      id: 'qualification',
      header: 'Qualification',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.degree}</p>
          <p className="text-muted-foreground truncate text-xs">{row.original.institution}</p>
        </div>
      ),
    },
    {
      id: 'dates',
      header: 'Period',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {formatPeriod(row.original.startDate, row.original.endDate)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <PublishBadge isPublished={row.original.isPublished} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions
          recordName={`${row.original.degree} at ${row.original.institution}`}
          onEdit={() => dialogs.openEdit(row.original)}
          onDelete={() => dialogs.openDelete(row.original)}
          isPending={isPending}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Education"
        description="Your qualifications, most recent first. Drafts stay hidden from the public site."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New entry
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="education"
        isLoading={entries.isPending}
        error={entries.error}
        onRetry={() => void entries.refetch()}
        emptyTitle="No education entries yet"
        emptyDescription="Add a degree, course, or certification you studied for."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add an entry" />}
        hideBelow={{ dates: 'md', status: 'sm' }}
      />

      <EducationDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        entry={dialogs.editing}
        isSubmitting={isPending}
        onSubmit={async (values) => {
          if (dialogs.editing) {
            await update.mutateAsync({ id: dialogs.editing.id, values })
            dialogs.closeEdit()
            return
          }

          await create.mutateAsync(values)
          dialogs.closeCreate()
        }}
      />

      <ConfirmDialog
        open={dialogs.deleting !== null}
        onOpenChange={(open) => {
          if (!open) dialogs.closeDelete()
        }}
        title={`Delete ${dialogs.deleting?.degree ?? 'this entry'}?`}
        description={
          dialogs.deleting
            ? `This removes ${dialogs.deleting.degree} at ${dialogs.deleting.institution} from the timeline.`
            : ''
        }
        confirmLabel="Delete entry"
        destructive
        isPending={isPending}
        onConfirm={async () => {
          if (!dialogs.deleting) return

          await remove.mutateAsync(dialogs.deleting.id)
          dialogs.closeDelete()
        }}
      />
    </>
  )
}

/**
 * A period, which here can legitimately be open at both ends.
 *
 * `formatDateRange` is for the employment timeline, where a start date is required. Education
 * allows no dates at all, so this shows what it has rather than rendering an empty cell.
 */
function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return 'No dates'

  return formatDateRange(start, end) || (start ? '' : 'No start date')
}
