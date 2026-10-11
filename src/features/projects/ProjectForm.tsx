import { useFormContext, useWatch } from 'react-hook-form'
import { SwitchField, TextAreaField, TextField } from '@/components/common/FormField'
import { SlugField } from '@/components/common/SlugField'
import { NumberField, SelectField } from '@/components/common/FormControls'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { GalleryEditor } from '@/features/projects/ProjectGallery'
import { MEDIA_FOLDERS } from '@/features/media'
import { FIELD_LABELS, FIELD_OPTIONS } from '@/constants/fields'
import type { ProjectValues } from '@/schemas'
import type { Technology } from '@/types/entities'

const FIELD_SELECT_OPTIONS = FIELD_OPTIONS.map((option) => ({
  value: option,
  label: FIELD_LABELS[option],
}))

/**
 * The project form's fields.
 *
 * A controlled child of `EntityDialog`, so it reads and writes the dialog's form through
 * `useFormContext()` rather than owning state of its own. That is what lets the same field
 * components be shared by every admin form.
 */
export function ProjectForm({ technologies }: { technologies: Technology[] }) {
  const { setValue, control } = useFormContext<ProjectValues>()

  const gallery = useWatch({ control, name: 'gallery' }) ?? []

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <TextField name="title" label="Title" required autoComplete="off" />
        <SlugField name="slug" titleField="title" />
      </div>

      <TextAreaField
        name="summary"
        label="Summary"
        rows={2}
        description="One or two sentences. This is what a visitor reads on the project card."
      />
      <TextAreaField name="description" label="Description" rows={8} />

      <ImageUploadField
        name="coverImagePath"
        label="Cover image"
        folder={MEDIA_FOLDERS.projects}
        description="Shown on the project card and at the top of the project page."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="field"
          label="Field"
          options={FIELD_SELECT_OPTIONS}
          description="The Software or ELV track this project belongs to."
        />
        <TextField
          name="repositoryUrl"
          label="Repository URL"
          type="url"
          placeholder="https://github.com/…"
        />
        <TextField name="liveUrl" label="Live URL" type="url" placeholder="https://…" />
        <TextField name="role" label="Your role" />
        <TextField name="clientName" label="Client" />
        <TextField name="startedAt" label="Start date" type="date" />
        <TextField name="endedAt" label="End date" type="date" />
        <NumberField
          name="sortOrder"
          label="Sort order"
          min={0}
          description="Lower numbers appear first."
        />
      </div>

      <TechnologyPicker technologies={technologies} />

      <GalleryEditor
        gallery={gallery}
        onChange={(next) => setValue('gallery', next, { shouldDirty: true, shouldValidate: true })}
      />

      <SwitchField
        name="isFeatured"
        label="Feature on the home page"
        description="Shows this project in the home page highlights."
      />
      <SwitchField
        name="isPublished"
        label="Published"
        description="A draft stays out of the public site, the sitemap, and the project filter."
      />
    </div>
  )
}

/**
 * Technology selection as a list of checkboxes rather than a `<select multiple>`.
 *
 * A native multi-select needs a modifier key, which is undiscoverable and awkward on a
 * phone. A list of checkboxes is also directly readable, which matters because these
 * labels are exactly what a visitor will see in the public filter.
 *
 * The checked state comes from the form, not from `defaultChecked`: `EntityDialog` resets
 * the form when the dialog opens, and only the form knows which project is being edited.
 */
function TechnologyPicker({ technologies }: { technologies: Technology[] }) {
  const { register } = useFormContext<ProjectValues>()

  if (technologies.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No technologies yet. Add them in the Skills section, then they can be selected here.
      </p>
    )
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Technologies</legend>
      <p className="text-muted-foreground text-xs">
        Technologies used on this project.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {technologies.map((technology) => (
          <label key={technology.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              value={technology.id}
              {...register('technologyIds')}
              className="border-input size-4 rounded border"
            />
            {technology.name}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
