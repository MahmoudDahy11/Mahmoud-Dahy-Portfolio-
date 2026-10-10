import { useState } from 'react'
import { ImageOff, Trash2, Upload } from 'lucide-react'
import { ACCEPTED_IMAGE_EXTENSIONS, IMAGE_MAX_SIZE_BYTES } from '@/constants/storage'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/utils/formatBytes'
import { cn } from '@/lib/utils'

type ImageUploadProps = {
  /**
   * The image to display, as a URL ready for `src`, or `null` when there is none.
   *
   * A URL rather than a Storage path, because this component only draws. Turning a path
   * into a URL is `imageUrl`'s job, and the caller is the only one that knows which bucket
   * the file is in.
   */
  value: string | null
  onSelect: (file: File) => void
  onClear?: () => void
  isUploading?: boolean
  label?: string
  className?: string
}

/**
 * Image picker with preview, validation, and replace/remove.
 *
 * Presentation and client-side validation only. The file itself goes to the parent, which
 * decides what to do with it — `ImageUploadField` uploads it and writes the resulting path
 * into a form, while the media library uploads it and records it as an asset. Keeping the
 * upload out of here is what lets the same control serve both.
 *
 * Validation here is a courtesy that produces a readable message. The real restriction is
 * the Storage bucket's allowed MIME types and size limit, which the server enforces.
 */
export function ImageUpload({
  value,
  onSelect,
  onClear,
  isUploading = false,
  label = 'Image',
  className,
}: ImageUploadProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const inputId = `image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`

  const validate = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Choose an image file.'
    }
    if (file.size > IMAGE_MAX_SIZE_BYTES) {
      return `Image must be ${formatBytes(IMAGE_MAX_SIZE_BYTES)} or smaller. This one is ${formatBytes(file.size)}.`
    }
    return null
  }

  const handleChange = (file: File | undefined) => {
    if (!file) return

    const error = validate(file)
    if (error) {
      setLocalError(error)
      return
    }

    setLocalError(null)
    onSelect(file)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-sm font-medium">{label}</p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="bg-muted/40 flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageOff className="text-muted-foreground size-6" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_EXTENSIONS}
            className="sr-only"
            onChange={(event) => handleChange(event.target.files?.[0])}
          />

          <div className="flex flex-wrap gap-2">
            {/*
              The button renders as a <label> pointing at the hidden file input, so a
              single click opens the file picker. A separate "browse" button would need
              its own click handler and duplicate this behaviour.
            */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<label htmlFor={inputId} className="cursor-pointer" />}
            >
              <Upload aria-hidden="true" />
              {isUploading ? 'Uploading…' : value ? 'Replace' : 'Choose image'}
            </Button>

            {value && onClear ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={isUploading}>
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>

          <p className="text-muted-foreground text-xs">
            JPG, PNG, WebP, GIF or AVIF. Up to {formatBytes(IMAGE_MAX_SIZE_BYTES)}.
          </p>

          {localError ? (
            <p role="alert" className="text-destructive text-xs">
              {localError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
