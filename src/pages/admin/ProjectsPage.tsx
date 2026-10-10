import { useMemo } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageOff } from 'lucide-react'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllProjects, useProjectMutations, useTechnologies } from '@/features/projects/hooks'
import { ProjectDialog } from '@/features/projects/ProjectDialog'
import { imageUrl } from '@/services/mediaUrls'
import type { ProjectWithRelations } from '@/types/entities'

/**
 * Projects, for the admin.
 *
 * This page is the pattern the other twelve sections follow, and it is deliberately a
 * composition of shared pieces rather than a reusable `<CrudPage>`: the projects table is
 * the most complicated one in the dashboard, with a cover image, a draft state, technologies,
 * and a nested gallery form. Abstracting the page itself would mean encoding the
 * complicated case and bending the eleven simple ones to match, so instead the shared
 * pieces — the table, the dialog, the row actions, the mutation feedback, the dialog state —
 * are shared, and each page is a short file that arranges them.
 *
 * The whole gallery lives inside the project form rather than in a separate screen, so the
 * one Save button means the project, its technologies, and its images all change together.
 */
export default function ProjectsPage() {
  const projects = useAllProjects()
  const technologies = useTechnologies()
  const dialogs = useCrudDialogs<ProjectWithRelations>()
  const { create, update, remove, isPending } = useProjectMutations()

  const rows = useMemo(() => projects.data ?? [], [projects.data])

  const columns: Column<ProjectWithRelations>[] = [
    {
      id: 'cover',
      header: 'Cover',
      cell: ({ row }) => {
        const cover = imageUrl(row.original.coverImagePath)

        return cover ? (
          <img src={cover} alt="" className="size-12 rounded object-cover" />
        ) : (
          <span className="bg-muted/40 text-muted-foreground flex size-12 items-center justify-center rounded">
            <ImageOff className="size-4" aria-hidden="true" />
            <span className="sr-only">No cover image</span>
          </span>
        )
      },
    },
    {
      id: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="text-muted-foreground truncate text-xs">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      id: 'technologies',
      header: 'Technologies',
      cell: ({ row }) =>
        row.original.technologies.length === 0 ? (
          <span className="text-muted-foreground text-sm">None</span>
        ) : (
          <ul className="flex flex-wrap gap-1">
            {row.original.technologies.slice(0, 3).map((technology) => (
              <li key={technology.id}>
                <Badge variant="secondary">{technology.name}</Badge>
              </li>
            ))}
            {row.original.technologies.length > 3 ? (
              <li>
                <Badge variant="outline">+{row.original.technologies.length - 3}</Badge>
              </li>
            ) : null}
          </ul>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1">
          <PublishBadge isPublished={row.original.isPublished} />
          {row.original.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions
          recordName={row.original.title}
          onEdit={() => dialogs.openEdit(row.original)}
          onDelete={() => dialogs.openDelete(row.original)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project, with images and technologies. Drafts stay hidden from the public site."
        action={
          <Button type="button" onClick={dialogs.openCreate}>
            New project
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="all projects"
        isLoading={projects.isPending}
        error={projects.error}
        onRetry={() => void projects.refetch()}
        emptyTitle="No projects yet"
        emptyDescription="Add your first project. It stays a draft until you publish it."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a project" />}
        hideBelow={{ technologies: 'lg', status: 'sm' }}
      />

      <ProjectDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        project={dialogs.editing}
        technologies={technologies.data ?? []}
        isSubmitting={isPending}
        // `mutateAsync` rejects when the write fails. Nothing is caught here on purpose:
        // the rejection propagates out of `handleSubmit`, which leaves the dialog open with
        // the entered values intact, and `useCrudMutations` has already shown the toast. A
        // try/catch that closed the dialog would discard the owner's work on a failure.
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
        title={`Delete ${dialogs.deleting?.title ?? 'this project'}?`}
        description={
          dialogs.deleting
            ? `This removes the project and its ${dialogs.deleting.images.length} gallery image${
                dialogs.deleting.images.length === 1 ? '' : 's'
              }. Images already uploaded to Storage stay in the media library.`
            : ''
        }
        confirmLabel="Delete project"
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
