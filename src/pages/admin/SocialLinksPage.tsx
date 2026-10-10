import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { ExternalLinkButton } from '@/components/ui/link-button'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllSocialLinks, useSocialLinkMutations } from '@/features/socialLinks/hooks'
import { SocialLinkDialog } from '@/features/socialLinks/SocialLinkDialog'
import type { SocialLink } from '@/types/entities'

/** Social and professional links, for the admin. Same shared pieces as every other section. */
export default function SocialLinksPage() {
  const links = useAllSocialLinks()
  const dialogs = useCrudDialogs<SocialLink>()
  const { create, update, remove, isPending } = useSocialLinkMutations()

  const rows = useMemo(() => links.data ?? [], [links.data])

  const columns: Column<SocialLink>[] = [
    {
      id: 'label',
      header: 'Link',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.label}</p>
          <p className="text-muted-foreground truncate text-xs">{row.original.url}</p>
        </div>
      ),
    },
    {
      id: 'platform',
      header: 'Platform',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.platform}</span>
      ),
    },
    {
      id: 'preview',
      header: 'Preview',
      cell: ({ row }) =>
        row.original.isPublished ? (
          <ExternalLinkButton href={row.original.url} size="sm" variant="ghost">
            Open
            <span className="sr-only"> {row.original.label} in a new tab</span>
          </ExternalLinkButton>
        ) : (
          <span className="text-muted-foreground text-sm">Not published</span>
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
          recordName={row.original.label}
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
        title="Social links"
        description="Links to your other profiles. These appear in the header, hero, and footer."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New link
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="social links"
        isLoading={links.isPending}
        error={links.error}
        onRetry={() => void links.refetch()}
        emptyTitle="No social links yet"
        emptyDescription="Add a link to your GitHub, LinkedIn, or any other profile."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a link" />}
        hideBelow={{ platform: 'lg', preview: 'md', status: 'sm' }}
      />

      <SocialLinkDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        link={dialogs.editing}
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
        title={`Delete ${dialogs.deleting?.label ?? 'this link'}?`}
        description="This removes it from the public site. It cannot be undone."
        confirmLabel="Delete link"
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
