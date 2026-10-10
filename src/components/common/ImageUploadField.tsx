import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/common/ImageUpload'
import { uploadMedia } from '@/services/media'
import { imageUrl } from '@/services/mediaUrls'
import { toErrorMessage } from '@/lib/errors'
import { STORAGE_BUCKETS, type StorageBucket } from '@/constants/storage'

type ImageUploadFieldProps = {
  /** Form field that holds the storage path, not a full URL. */
  name: string
  label: string
  description?: string
  /** Object key prefix, from `STORAGE_FOLDERS`. */
  folder: string
  bucket?: StorageBucket
}

/**
 * An image picker that is part of a form.
 *
 * The form stores a Storage *path*, never a URL. A URL would embed the Supabase project
 * address into a database row, so moving to a different project would mean rewriting data
 * instead of changing one environment variable. `imageUrl` turns the path into a display
 * address at the moment of rendering.
 *
 * The upload happens the moment a file is chosen, not on save, because the row needs a path
 * to store and the file has to exist before the form is submitted. A file that is chosen
 * and then abandoned leaves an unreferenced object in the bucket; it is invisible on the
 * public site and can be removed from the media library. That trade is preferable to
 * uploading every file only to discover on save that the record was invalid.
 */
export function ImageUploadField({
  name,
  label,
  description,
  folder,
  bucket = STORAGE_BUCKETS.media,
}: ImageUploadFieldProps) {
  const { control, setValue } = useFormContext()
  const [isUploading, setIsUploading] = useState(false)
  const descriptionId = `${name}-upload-description`

  // Subscribed rather than read once, so the preview updates as soon as the path changes.
  const path = useWatch({ control, name }) as string | null | undefined
  const preview = imageUrl(path)

  async function handleSelect(file: File) {
    setIsUploading(true)

    try {
      const stored = await uploadMedia({ file, folder, bucket })
      setValue(name, stored.path, { shouldDirty: true, shouldValidate: true })
      toast.success('Image uploaded.')
    } catch (error) {
      toast.error(toErrorMessage(error, 'The image could not be uploaded.'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2" aria-describedby={description ? descriptionId : undefined}>
      <ImageUpload
        label={label}
        value={preview}
        isUploading={isUploading}
        onSelect={handleSelect}
        // Cleared to an empty string, not `null`: the schemas type optional text as a string
        // because that is the only thing an <input> can produce, and `toDatabaseRow` turns
        // `''` into `NULL` on the way to Postgres.
        onClear={() => setValue(name, '', { shouldDirty: true, shouldValidate: true })}
      />

      {description ? (
        <p id={descriptionId} className="text-muted-foreground text-xs">
          {description}
        </p>
      ) : null}
    </div>
  )
}
