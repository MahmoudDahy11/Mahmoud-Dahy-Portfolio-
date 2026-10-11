import { useMemo, useState } from 'react'
import type { Column } from '@/components/common/DataTable'
import { DataTable, TableEmptyAction } from '@/components/common/DataTable'
import { FieldSelector } from '@/components/common/FieldSelector'
import { PublishBadge } from '@/components/common/PublishBadge'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { FIELD_LABELS, type FieldOption } from '@/constants/fields'
import { useCrudDialogs } from '@/hooks/useCrudDialogs'
import { useAllSkills, useSkillCategories, useSkillMutations } from '@/features/skills/hooks'
import { SkillDialog } from '@/features/skills/SkillDialog'
import type { SkillWithCategory } from '@/services/skills'

/**
 * The skills table, with its own create/edit/delete dialogs.
 *
 * Skills, categories, and technologies share this page but not a component: each has its own
 * columns and its own form, and merging them behind a generic table would mean passing a
 * column builder and a form as props for the sake of three tables that share only a wrapper.
 * The genuinely shared parts — the table, the dialog, the row actions, the mutations — are
 * already shared, so what remains here is just the arrangement.
 */
export function SkillsTable() {
  const skills = useAllSkills()
  const categories = useSkillCategories()
  const dialogs = useCrudDialogs<SkillWithCategory>()
  const { create, update, remove, isPending } = useSkillMutations()

  // The table shows one field at a time. The filter is local state because it is a view of
  // the list already loaded, not a second query.
  const [field, setField] = useState<FieldOption>('software')

  const rows = useMemo(
    () => (skills.data ?? []).filter((skill) => skill.field === field),
    [skills.data, field],
  )

  const columns: Column<SkillWithCategory>[] = [
    {
      id: 'name',
      header: 'Skill',
      cell: ({ row }) => <p className="truncate font-medium">{row.original.name}</p>,
    },
    {
      id: 'field',
      header: 'Field',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{FIELD_LABELS[row.original.field]}</span>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {/* An uncategorised skill is a supported state, not a missing value, so it is
              named rather than left blank. */}
          {row.original.skillCategories?.name ?? 'Uncategorised'}
        </span>
      ),
    },
    {
      id: 'proficiency',
      header: 'Proficiency',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {row.original.proficiency === null ? '—' : `${row.original.proficiency}%`}
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
        ariaLabel="Filter skills by field"
        className="mb-4"
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        caption="skills"
        isLoading={skills.isPending}
        error={skills.error}
        onRetry={() => void skills.refetch()}
        emptyTitle={`No ${FIELD_LABELS[field]} skills yet`}
        emptyDescription="Add the technologies you work with. Each stays a draft until published."
        emptyAction={<TableEmptyAction onClick={dialogs.openCreate} label="Add a skill" />}
        hideBelow={{ field: 'sm', proficiency: 'md', status: 'sm' }}
      />

      <div className="mt-4">
        <Button type="button" size="sm" onClick={dialogs.openCreate}>
          New skill
        </Button>
      </div>

      <SkillDialog
        open={dialogs.isCreateOpen || dialogs.editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeCreate()
            dialogs.closeEdit()
          }
        }}
        skill={dialogs.editing}
        categories={categories.data ?? []}
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
        title={`Delete ${dialogs.deleting?.name ?? 'this skill'}?`}
        description="This removes it from the public skills list. It cannot be undone."
        confirmLabel="Delete skill"
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
