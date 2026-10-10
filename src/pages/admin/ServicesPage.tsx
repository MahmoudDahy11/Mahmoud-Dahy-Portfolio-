import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllServices, useServiceMutations } from '@/features/services/hooks'
import { ServiceDialog } from '@/features/services/ServiceDialog'
import type { Service } from '@/types/entities'

/** The services you offer, for the admin. Same shared pieces as every other section. */
export default function ServicesPage() {
  const services = useAllServices()
  const dialogs = useCrudDialogs<Service>()
  const { create, update, remove, isPending } = useServiceMutations()

  const rows = useMemo(() => services.data ?? [], [services.data])

  const columns: Column<Service>[] = [
    {
      id: 'title',
      header: 'Service',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground line-clamp-2 text-xs">{row.original.description}</p>
        </div>
      ),
    },
    {
      id: 'priceHint',
      header: 'Price hint',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.priceHint || '—'}</span>
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
        title="Services"
        description="What you offer. Drafts stay hidden from the public site."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New service
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="services"
        isLoading={services.isPending}
        error={services.error}
        onRetry={() => void services.refetch()}
        emptyTitle="No services yet"
        emptyDescription="Add what you offer so a visitor can see it on the services page."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a service" />}
        hideBelow={{ priceHint: 'lg', sortOrder: 'md', status: 'sm' }}
      />

      <ServiceDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        service={dialogs.editing}
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
        title={`Delete ${dialogs.deleting?.title ?? 'this service'}?`}
        description="This removes it from the public services page. It cannot be undone."
        confirmLabel="Delete service"
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
