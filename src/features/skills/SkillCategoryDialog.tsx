import { EntityDialog } from '@/components/common/EntityDialog'
import { TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { SlugField } from '@/components/common/SlugField'
import { skillCategorySchema, type SkillCategoryValues } from '@/schemas'
import type { SkillCategory } from '@/types/entities'

export const EMPTY_SKILL_CATEGORY: SkillCategoryValues = {
  name: '',
  slug: '',
  sortOrder: 0,
}

/** A stored category as the form wants it. */
export function skillCategoryToFormValues(category: SkillCategory | null): SkillCategoryValues {
  if (!category) return EMPTY_SKILL_CATEGORY

  return {
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
  }
}

type SkillCategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: SkillCategory | null
  isSubmitting: boolean
  onSubmit: (values: SkillCategoryValues) => void
}

/**
 * Create and edit dialog for a skill category.
 *
 * A category has no published flag of its own — `skill_categories` has no such column. It
 * appears on the public site as soon as a published skill uses it, which is why there is no
 * switch on this form even though skills and projects both have one.
 */
export function SkillCategoryDialog({
  open,
  onOpenChange,
  category,
  isSubmitting,
  onSubmit,
}: SkillCategoryDialogProps) {
  const isEditing = category !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit category' : 'New category'}
      description="Categories become the headings on the public skills section."
      schema={skillCategorySchema}
      defaultValues={skillCategoryToFormValues(category)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add category'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" required autoComplete="off" />
        <SlugField name="slug" titleField="name" />
        <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
      </div>
    </EntityDialog>
  )
}
