import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextField } from '@/components/common/FormField'
import { NumberField, SelectField } from '@/components/common/FormControls'
import { FIELD_LABELS, FIELD_OPTIONS, type FieldOption } from '@/constants/fields'
import { skillSchema, type SkillValues } from '@/schemas'
import type { SkillCategory } from '@/types/entities'
import type { SkillWithCategory } from '@/services/skills'

export const EMPTY_SKILL: SkillValues = {
  name: '',
  field: 'software',
  categoryId: '',
  proficiency: undefined,
  iconPath: '',
  sortOrder: 0,
  isPublished: false,
}

const FIELD_SELECT_OPTIONS = FIELD_OPTIONS.map((option) => ({
  value: option,
  label: FIELD_LABELS[option],
}))

/**
 * A stored skill as the form wants it.
 *
 * `defaultField` is the field currently shown in the admin table, so a new skill starts in
 * the field the owner is looking at rather than always in Software.
 */
export function skillToFormValues(
  skill: SkillWithCategory | null,
  defaultField: FieldOption,
): SkillValues {
  if (!skill) return { ...EMPTY_SKILL, field: defaultField }

  return {
    name: skill.name,
    field: skill.field,
    // The dropdown's "no category" option is the empty string; the row stores NULL.
    categoryId: skill.categoryId ?? '',
    proficiency: skill.proficiency ?? undefined,
    iconPath: skill.iconPath ?? '',
    sortOrder: skill.sortOrder,
    isPublished: skill.isPublished,
  }
}

/**
 * The categories that belong to one field.
 *
 * A category carries its own field, so the skill form and the admin tables all narrow the
 * category list the same way. Exported so the rule is defined once and can be tested
 * without rendering the dialog.
 */
export function categoriesForField(
  categories: SkillCategory[],
  field: FieldOption,
): SkillCategory[] {
  return categories.filter((category) => category.field === field)
}

/**
 * The category dropdown, limited to the categories of the field chosen in the form.
 *
 * It reads the form's own `field` value rather than a prop, so switching Software to ELV
 * re-lists the categories immediately. When the field changes, a category left over from
 * the previous field no longer belongs with the skill, so it is cleared — the database has
 * no way to express "an ELV skill in a Software category", and this keeps the two from
 * drifting apart silently.
 */
function CategorySelect({ categories }: { categories: SkillCategory[] }) {
  const { watch, getValues, setValue } = useFormContext<SkillValues>()
  const field = watch('field')

  const options = categoriesForField(categories, field).map((category) => ({
    value: category.id,
    label: category.name,
  }))

  useEffect(() => {
    const categoryId = getValues('categoryId')
    if (!categoryId) return

    const selected = categories.find((category) => category.id === categoryId)
    if (selected && selected.field !== field) setValue('categoryId', '')
  }, [field, categories, getValues, setValue])

  return (
    <SelectField
      name="categoryId"
      label="Category"
      options={options}
      placeholder="No category"
      description="Only categories from the selected field are listed. A skill with no category is grouped under “Other” rather than hidden."
    />
  )
}

type SkillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: SkillWithCategory | null
  categories: SkillCategory[]
  /** Field a new skill is assigned to. Ignored when editing, which keeps the row's own field. */
  defaultField: FieldOption
  isSubmitting: boolean
  onSubmit: (values: SkillValues) => void
}

/**
 * Create and edit dialog for a skill.
 *
 * `proficiency` starts as `undefined` rather than zero, because "no rating" and "rated zero"
 * are different: the first is stored as NULL and renders as no bar, the second as an empty
 * one.
 */
export function SkillDialog({
  open,
  onOpenChange,
  skill,
  categories,
  defaultField,
  isSubmitting,
  onSubmit,
}: SkillDialogProps) {
  const isEditing = skill !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit skill' : 'New skill'}
      description="Skills are grouped by field and category on the public site."
      schema={skillSchema}
      defaultValues={skillToFormValues(skill, defaultField)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add skill'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" required autoComplete="off" />

        <SelectField
          name="field"
          label="Field"
          options={FIELD_SELECT_OPTIONS}
          description="The Software or ELV track this skill belongs to."
        />

        <CategorySelect categories={categories} />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            name="proficiency"
            label="Proficiency"
            min={0}
            max={100}
            description="0–100. Leave empty for no rating."
          />
          <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
        </div>

        <TextField name="iconPath" label="Icon path" description="Optional." />

        <SwitchField
          name="isPublished"
          label="Published"
          description="A draft stays out of the public skills list."
        />
      </div>
    </EntityDialog>
  )
}
