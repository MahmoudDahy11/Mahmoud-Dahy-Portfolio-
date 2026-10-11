import { EntityDialog } from '@/components/common/EntityDialog'
import { TextField } from '@/components/common/FormField'
import { NumberField, SelectField } from '@/components/common/FormControls'
import { SlugField } from '@/components/common/SlugField'
import { FIELD_LABELS, FIELD_OPTIONS, type FieldOption } from '@/constants/fields'
import { skillCategorySchema, type SkillCategoryValues } from '@/schemas'
import type { SkillCategory } from '@/types/entities'

export const EMPTY_SKILL_CATEGORY: SkillCategoryValues = {
  name: '',
  field: 'software',
  slug: '',
  sortOrder: 0,
}

const FIELD_SELECT_OPTIONS = FIELD_OPTIONS.map((option) => ({
  value: option,
  label: FIELD_LABELS[option],
}))

/**
 * A stored category as the form wants it.
 *
 * A new category starts in the field currently shown in the admin table, matching the skill
 * dialog, so creating a category while viewing ELV does not land it in Software.
 */
export function skillCategoryToFormValues(
  category: SkillCategory | null,
  defaultField: FieldOption,
): SkillCategoryValues {
  if (!category) return { ...EMPTY_SKILL_CATEGORY, field: defaultField }

  return {
    name: category.name,
    field: category.field,
    slug: category.slug,
    sortOrder: category.sortOrder,
  }
}

type SkillCategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: SkillCategory | null
  /** Field a new category is assigned to. Ignored when editing. */
  defaultField: FieldOption
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
  defaultField,
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
      defaultValues={skillCategoryToFormValues(category, defaultField)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add category'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" required autoComplete="off" />
        <SelectField
          name="field"
          label="Field"
          options={FIELD_SELECT_OPTIONS}
          description="Categories belong to one field, and only its skills can use them."
        />
        <SlugField name="slug" titleField="name" />
        <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
      </div>
    </EntityDialog>
  )
}
