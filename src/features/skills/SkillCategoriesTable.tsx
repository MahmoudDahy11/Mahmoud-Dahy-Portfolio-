import { useMemo, useState } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { FieldSelector } from '@/components/common/FieldSelector'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { FIELD_LABELS, type FieldOption } from '@/constants/fields'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllSkills, useSkillCategories, useSkillCategoryMutations } from '@/features/skills/hooks'
import { SkillCategoryDialog } from '@/features/skills/SkillCategoryDialog'
import type { SkillCategory } from '@/types/entities'

/**
 * The skill category table.
 *
 * Shown as its own tab because a category is edited on its own terms, and because the delete
 * confirmation has to say something the skills table's does not: deleting a category does
 * not delete its skills, it leaves them uncategorised. That is a consequence of
 * `on delete set null` on `skills.category_id`, and the owner needs to know it before
 * clicking, not after.
 */
export function SkillCategoriesTable() {
  const categories = useSkillCategories()
  const skills = useAllSkills()
  const dialogs = useCrudDialogs<SkillCategory>()
  const { create, update, remove, isPending } = useSkillCategoryMutations()

  const [field, setField] = useState<FieldOption>('software')

  const rows = useMemo(
    () => (categories.data ?? []).filter((category) => category.field === field),
    [categories.data, field],
  )

  // Counting here rather than in the table keeps the "used by N skills" wording accurate as
  // soon as a skill is reassigned, because the skills query is refreshed by the same write.
  const skillCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()

    for (const skill of skills.data ?? []) {
      if (!skill.categoryId) continue
      counts.set(skill.categoryId, (counts.get(skill.categoryId) ?? 0) + 1)
    }

    return counts
  }, [skills.data])

  const columns: Column<SkillCategory>[] = [
    {
      id: 'name',
      header: 'Category',
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="text-muted-foreground truncate text-xs">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      id: 'field',
      header: 'Field',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{FIELD_LABELS[row.original.field]}</span>
      ),
    },
    {
      id: 'skills',
      header: 'Skills',
      cell: ({ row }) => {
        const count = skillCountByCategory.get(row.original.id) ?? 0

        return (
          <span className="text-muted-foreground text-sm tabular-nums">
            {count === 0 ? 'None yet' : `${count} skill${count === 1 ? '' : 's'}`}
          </span>
        )
      },
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
      <FieldSelector
        value={field}
        onChange={setField}
        ariaLabel="Filter categories by field"
        className="mb-4"
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="skill categories"
        isLoading={categories.isPending}
        error={categories.error}
        onRetry={() => void categories.refetch()}
        emptyTitle={`No ${FIELD_LABELS[field]} categories yet`}
        emptyDescription="Categories become the headings on the public skills section. A skill with no category is still shown, under “Other”."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a category" />}
        hideBelow={{ field: 'sm', sortOrder: 'md' }}
      />

      <div className="mt-4">
        <Button type="button" size="sm" onClick={dialogs.openCreate}>
          New category
        </Button>
      </div>

      <SkillCategoryDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        category={dialogs.editing}
        defaultField={field}
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
        title={`Delete ${dialogs.deleting?.name ?? 'this category'}?`}
        description="The skills in it are not deleted. They become uncategorised and appear under “Other” on the public site."
        confirmLabel="Delete category"
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
