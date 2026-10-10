import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useTechnologies, useTechnologyMutations } from '@/features/projects/hooks'
import { TechnologyDialog } from '@/features/skills/TechnologyDialog'
import type { Technology } from '@/types/entities'

/**
 * The technology catalogue.
 *
 * Lives on the Skills page because a technology is the same kind of thing as a skill — a
 * named tool — and separating them into two admin sections would be a distinction without a
 * difference for the owner. What differs is what they are used for, and the dialog says so:
 * these are the filter chips on the public projects page.
 *
 * Deleting a technology removes its links from every project, because
 * `project_technologies` cascades. The projects themselves are untouched, which is what the
 * confirmation says.
 */
export function TechnologiesTable() {
  const technologies = useTechnologies()
  const dialogs = useCrudDialogs<Technology>()
  const { create, update, remove, isPending } = useTechnologyMutations()

  const rows = useMemo(() => technologies.data ?? [], [technologies.data])

  const columns: Column<Technology>[] = [
    {
      id: 'name',
      header: 'Technology',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="text-muted-foreground truncate text-xs">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      id: 'sortOrder',
      header: 'Order',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">{row.original.sortOrder}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions
          recordName={row.original.name}
          onEdit={() => dialogs.openEdit(row.original)}
          onDelete={() => dialogs.openDelete(row.original)}
          isPending={isPending}
        />
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="technologies"
        isLoading={technologies.isPending}
        error={technologies.error}
        onRetry={() => void technologies.refetch()}
        emptyTitle="No technologies yet"
        emptyDescription="Add the tools your projects are built with. They become the filter chips on the public projects page."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a technology" />}
        hideBelow={{ sortOrder: 'md' }}
      />

      <div className="mt-4">
        <Button type="button" size="sm" onClick={dialogs.openCreate}>
          New technology
        </Button>
      </div>

      <TechnologyDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        technology={dialogs.editing}
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
        title={`Delete ${dialogs.deleting?.name ?? 'this technology'}?`}
        description="It is removed from the filter chips and from every project it is linked to. The projects themselves are kept."
        confirmLabel="Delete technology"
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
