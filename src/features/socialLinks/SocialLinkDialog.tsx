import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { socialLinkSchema, type SocialLinkValues } from '@/schemas'
import type { SocialLink } from '@/types/entities'

export const EMPTY_SOCIAL_LINK: SocialLinkValues = {
  platform: '',
  label: '',
  url: '',
  iconPath: '',
  sortOrder: 0,
  isPublished: false,
}

/**
 * A stored link as the form wants it.
 *
 * `platform` and `label` are separate because two links to the same platform are normal — a
 * work profile and a personal one, or code and writing. `label` is the visible text, and
 * `platform` is what the footer picks an icon from.
 */
export function socialLinkToFormValues(link: SocialLink | null): SocialLinkValues {
  if (!link) return EMPTY_SOCIAL_LINK

  return {
    platform: link.platform,
    label: link.label,
    url: link.url,
    iconPath: link.iconPath ?? '',
    sortOrder: link.sortOrder,
    isPublished: link.isPublished,
  }
}

type SocialLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: SocialLink | null
  isSubmitting: boolean
  onSubmit: (values: SocialLinkValues) => void
}

/** Create and edit dialog for a social link. */
export function SocialLinkDialog({
  open,
  onOpenChange,
  link,
  isSubmitting,
  onSubmit,
}: SocialLinkDialogProps) {
  const isEditing = link !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit link' : 'New link'}
      description="Links appear in the header, the hero, and the footer of the public site."
      schema={socialLinkSchema}
      defaultValues={socialLinkToFormValues(link)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add link'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="platform"
            label="Platform"
            required
            description="Used to pick the icon, e.g. GitHub."
          />
          <TextField name="label" label="Label" required description="The visible link text." />
        </div>

        <TextField
          name="url"
          label="URL"
          type="url"
          required
          placeholder="https://github.com/…"
          autoComplete="off"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="iconPath"
            label="Icon path"
            description="Optional. A generic icon is used when empty."
          />
          <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
        </div>

        <SwitchField
          name="isPublished"
          label="Published"
          description="A draft is saved but not shown on the public site."
        />
      </div>
    </EntityDialog>
  )
}
