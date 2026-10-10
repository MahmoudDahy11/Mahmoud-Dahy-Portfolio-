import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextField } from '@/components/common/FormField'
import { NumberField, SelectField } from '@/components/common/FormControls'
import { skillSchema, type SkillValues } from '@/schemas'
import type { SkillCategory } from '@/types/entities'
import type { SkillWithCategory } from '@/services/skills'

export const EMPTY_SKILL: SkillValues = {
  name: '',
  categoryId: '',
  proficiency: undefined,
  iconPath: '',
  sortOrder: 0,
  isPublished: false,
}

/** A stored skill as the form wants it. See `ExperienceDialog` for the same rule. */
export function skillToFormValues(skill: SkillWithCategory | null): SkillValues {
  if (!skill) return EMPTY_SKILL

  return {
    name: skill.name,
    // The dropdown's "no category" option is the empty string; the row stores NULL.
    categoryId: skill.categoryId ?? '',
    proficiency: skill.proficiency ?? undefined,
    iconPath: skill.iconPath ?? '',
    sortOrder: skill.sortOrder,
    isPublished: skill.isPublished,
  }
}

type SkillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: SkillWithCategory | null
  categories: SkillCategory[]
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
  isSubmitting,
  onSubmit,
}: SkillDialogProps) {
  const isEditing = skill !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit skill' : 'New skill'}
      description="Skills are grouped by category on the public site."
      schema={skillSchema}
      defaultValues={skillToFormValues(skill)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add skill'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" required autoComplete="off" />

        <SelectField
          name="categoryId"
          label="Category"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          placeholder="No category"
          description="A skill with no category is grouped under “Other” rather than hidden."
        />

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
