import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FileUpload } from '@/components/common/FileUpload'
import { uploadMedia } from '@/services/media'
import { toErrorMessage } from '@/lib/errors'
import { STORAGE_BUCKETS } from '@/constants/storage'

type FileUploadFieldProps = {
  /** Form field that holds the storage path, not a full URL. */
  name: string
  label: string
  description?: string
  /** Object key prefix inside the files bucket. */
  folder: string
}

/**
 * A document picker that is part of a form — currently the resume.
 *
 * Stores a Storage *path* rather than a URL, for the same reason as `ImageUploadField`: a URL
 * would bake the Supabase project address into a database row, so moving projects would mean
 * rewriting data instead of changing one environment variable.
 *
 * The upload happens as soon as a file is chosen rather than on save, because the form needs
 * a path to store and the file has to exist before the record is written. An abandoned
 * upload leaves an unreferenced object in the bucket, which is harmless and can be removed
 * from the media library — preferable to discovering an invalid record after uploading.
 */
export function FileUploadField({ name, label, description, folder }: FileUploadFieldProps) {
  const { control, setValue } = useFormContext()
  const [isUploading, setIsUploading] = useState(false)
  const descriptionId = `${name}-file-description`

  // Subscribed rather than read once, so the filename updates when the path changes.
  const path = useWatch({ control, name }) as string | null | undefined

  async function handleSelect(file: File) {
    setIsUploading(true)

    try {
      const stored = await uploadMedia({ file, folder, bucket: STORAGE_BUCKETS.files })
      setValue(name, stored.path, { shouldDirty: true, shouldValidate: true })
      toast.success('File uploaded.')
    } catch (error) {
      toast.error(toErrorMessage(error, 'The file could not be uploaded.'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2" aria-describedby={description ? descriptionId : undefined}>
      <FileUpload
        label={label}
        fileName={path ?? null}
        isUploading={isUploading}
        onSelect={handleSelect}
        // Cleared to an empty string, not `null`: the schemas type optional text as a string
        // because that is the only thing an input can produce, and `toDatabaseRow` turns `''`
        // into `NULL` on the way to Postgres.
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
