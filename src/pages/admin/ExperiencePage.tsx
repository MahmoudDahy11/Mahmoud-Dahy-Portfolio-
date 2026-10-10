import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllExperiences, useExperienceMutations } from '@/features/experience/hooks'
import { ExperienceDialog } from '@/features/experience/ExperienceDialog'
import { formatDateRange } from '@/utils/formatDate'
import type { Experience } from '@/types/entities'

/**
 * Work experience, for the admin.
 *
 * Arranged from the same shared pieces as every other section: `DataTable` for the four
 * states a list can be in, `RowActions` for the row buttons, `EntityDialog` for the form, and
 * `ConfirmDialog` for deletion. Nothing here is unique to experience, and nothing here would
 * need changing if another section were added.
 */
export default function ExperiencePage() {
  const roles = useAllExperiences()
  const dialogs = useCrudDialogs<Experience>()
  const { create, update, remove, isPending } = useExperienceMutations()

  const rows = useMemo(() => roles.data ?? [], [roles.data])

  const columns: Column<Experience>[] = [
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground truncate text-xs">{row.original.company}</p>
        </div>
      ),
    },
    {
      id: 'dates',
      header: 'Period',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {formatDateRange(row.original.startDate, row.original.endDate)}
          {/* `is_current` and `end_date` are separate columns, so the table shows the same
              "Present" marker the public timeline does. */}
          {row.original.isCurrent ? ' — Present' : ''}
        </span>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.location || '—'}</span>
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
          recordName={`${row.original.title} at ${row.original.company}`}
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
        title="Experience"
        description="Your roles, newest first. Drafts stay hidden from the public site."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New role
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="work experience"
        isLoading={roles.isPending}
        error={roles.error}
        onRetry={() => void roles.refetch()}
        emptyTitle="No roles yet"
        emptyDescription="Add the role you are in now. It stays a draft until you publish it."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a role" />}
        hideBelow={{ location: 'md', status: 'sm' }}
      />

      <ExperienceDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        role={dialogs.editing}
        isSubmitting={isPending}
        // A rejected write leaves the dialog open with the entered values, so nothing the
        // owner typed is lost. `useCrudMutations` has already shown the error as a toast.
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
        title={`Delete ${dialogs.deleting?.title ?? 'this role'}?`}
        description={
          dialogs.deleting
            ? `This removes the role at ${dialogs.deleting.company} from the timeline.`
            : ''
        }
        confirmLabel="Delete role"
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
