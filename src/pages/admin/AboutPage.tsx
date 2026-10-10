import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllAboutSections, useAboutSectionMutations } from '@/features/about/hooks'
import { AboutSectionDialog } from '@/features/about/AboutSectionDialog'
import type { AboutSection } from '@/types/entities'

/**
 * The blocks that make up the About page, for the admin.
 *
 * Same shared pieces as every other section. The order column is the one that matters most
 * here, because the About page is these blocks read top to bottom.
 */
export default function AboutPage() {
  const sections = useAllAboutSections()
  const dialogs = useCrudDialogs<AboutSection>()
  const { create, update, remove, isPending } = useAboutSectionMutations()

  const rows = useMemo(() => sections.data ?? [], [sections.data])

  const columns: Column<AboutSection>[] = [
    {
      id: 'title',
      header: 'Section',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground line-clamp-2 text-xs">{row.original.content}</p>
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
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <PublishBadge isPublished={row.original.isPublished} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions
          recordName={row.original.title}
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
        title="About"
        description="The blocks on your About page, in the order visitors read them."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New section
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="about sections"
        isLoading={sections.isPending}
        error={sections.error}
        onRetry={() => void sections.refetch()}
        emptyTitle="No about sections yet"
        emptyDescription="Add a block of text. The About page is built from these, in order."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a section" />}
        hideBelow={{ sortOrder: 'md', status: 'sm' }}
      />

      <AboutSectionDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        section={dialogs.editing}
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
        title={`Delete ${dialogs.deleting?.title ?? 'this section'}?`}
        description="This removes the block from your About page. It cannot be undone."
        confirmLabel="Delete section"
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
