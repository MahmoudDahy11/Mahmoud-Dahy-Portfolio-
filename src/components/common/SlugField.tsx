import { useFormContext, useWatch } from 'react-hook-form'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/FormField'
import { slugify } from '@/utils/slugify'

type SlugFieldProps = {
  /** Form field holding the slug. */
  name: string
  /** Form field whose text the slug is generated from. */
  titleField: string
  label?: string
  description?: string
  required?: boolean
}

/**
 * A URL slug, with a button that derives it from the title.
 *
 * Three forms need this — projects, skill categories, and technologies — and the reason for
 * the button is the same in all of them. `slug` is unique and part of a published URL, so it
 * should not silently change when a title is edited: once a slug has been set by hand, a
 * later title change must not overwrite it, because other people's links already point at
 * it. So the button is offered only while the slug is still empty, and it is the owner who
 * decides when the address is fixed.
 *
 * The label is kept out of the button's accessible name deliberately: the field is
 * self-explanatory to a screen-reader user hearing "Use the title as the slug" next to the
 * slug input it affects.
 */
export function SlugField({
  name,
  titleField,
  label = 'Slug',
  description = 'The address of this page. Lowercase letters, numbers, and single hyphens.',
  required = true,
}: SlugFieldProps) {
  const { control, setValue } = useFormContext()

  const title = useWatch({ control, name: titleField }) as string | undefined
  const slug = useWatch({ control, name }) as string | undefined

  return (
    <div className="space-y-2">
      <TextField name={name} label={label} description={description} required={required} autoComplete="off" />

      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="-mt-1"
        disabled={!title || slug !== ''}
        onClick={() => setValue(name, slugify(title ?? ''), { shouldDirty: true, shouldValidate: true })}
      >
        <Wand2 aria-hidden="true" />
        Use the title as the slug
      </Button>
    </div>
  )
}
