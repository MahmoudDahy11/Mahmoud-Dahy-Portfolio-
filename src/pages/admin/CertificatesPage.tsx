import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { ImageOff } from 'lucide-react'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllCertificates, useCertificateMutations } from '@/features/certificates/hooks'
import { CertificateDialog } from '@/features/certificates/CertificateDialog'
import { imageUrl } from '@/services/mediaUrls'
import { formatDate } from '@/utils/formatDate'
import type { Certificate } from '@/types/entities'

/** Certificates, for the admin. Same shared pieces as every other section. */
export default function CertificatesPage() {
  const certificates = useAllCertificates()
  const dialogs = useCrudDialogs<Certificate>()
  const { create, update, remove, isPending } = useCertificateMutations()

  const rows = useMemo(() => certificates.data ?? [], [certificates.data])

  const columns: Column<Certificate>[] = [
    {
      id: 'image',
      header: 'Badge',
      cell: ({ row }) => {
        const image = imageUrl(row.original.imagePath)

        return image ? (
          <img src={image} alt="" className="size-12 rounded object-cover" />
        ) : (
          <span className="bg-muted/40 text-muted-foreground flex size-12 items-center justify-center rounded">
            <ImageOff className="size-4" aria-hidden="true" />
            <span className="sr-only">No badge image</span>
          </span>
        )
      },
    },
    {
      id: 'title',
      header: 'Certificate',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.title}</p>
          {row.original.issuer ? (
            <p className="text-muted-foreground truncate text-xs">{row.original.issuer}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'issuedOn',
      header: 'Issued',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {formatDate(row.original.issuedOn, { year: 'numeric', month: 'short' }) || '—'}
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
        title="Certificates"
        description="Certifications and courses. Drafts stay hidden from the public site."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New certificate
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="certificates"
        isLoading={certificates.isPending}
        error={certificates.error}
        onRetry={() => void certificates.refetch()}
        emptyTitle="No certificates yet"
        emptyDescription="Add a certification, with its badge image and a link to the issuer's page if you have one."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a certificate" />}
        hideBelow={{ issuedOn: 'md', status: 'sm' }}
      />

      <CertificateDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        certificate={dialogs.editing}
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
        title={`Delete ${dialogs.deleting?.title ?? 'this certificate'}?`}
        description="This removes it from the public site. The uploaded badge image stays in the media library."
        confirmLabel="Delete certificate"
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
