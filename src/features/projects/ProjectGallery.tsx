import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ImageOff, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { errorMessage } from '@/components/common/FormField'
import { uploadMedia } from '@/services/media'
import { imageUrl } from '@/services/mediaUrls'
import { toErrorMessage } from '@/lib/errors'
import { MEDIA_FOLDERS } from '@/features/media'
import type { ProjectValues } from '@/schemas'

type GalleryEditorProps = {
  gallery: ProjectValues['gallery']
  onChange: (gallery: ProjectValues['gallery']) => void
}

/** The two things a gallery row can fail validation on. */
type GalleryRowErrors = {
  path?: { message?: string }
  altText?: { message?: string }
}

/**
 * The validation errors for one gallery row, or `undefined` when the row is valid.
 *
 * The schema rejects a row with no file and a row with no alt text, and both rejections
 * are invisible unless they are drawn here: `FieldShell` only knows about the flat fields
 * it renders, so nothing else in the form would ever show them. An error a form blocks on
 * but never displays is indistinguishable from a button that does nothing.
 */
function galleryRowErrors(errors: unknown, index: number): GalleryRowErrors | undefined {
  if (!Array.isArray(errors)) return undefined
  return errors[index] as GalleryRowErrors | undefined
}

/**
 * The project gallery: an ordered list of images, each with its own file and alt text.
 *
 * The two live together because the database requires them together —
 * `project_images.alt_text` has a non-empty CHECK constraint, so a saved image with no
 * description is rejected outright. Asking for the description in the same row as the
 * upload means that rejection cannot happen.
 *
 * Each row uploads independently rather than the form uploading everything at once, so
 * replacing one image does not re-upload the others. The alt text is held by the parent
 * form and validated with the rest of it; only the file is handled here, because a file
 * cannot be a form value.
 */
export function GalleryEditor({ gallery, onChange }: GalleryEditorProps) {
  const [pendingRemoval, setPendingRemoval] = useState<number | null>(null)
  const { formState } = useFormContext<ProjectValues>()
  const errors = formState.errors.gallery

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Gallery</legend>
      <p className="text-muted-foreground text-xs">
        Extra images for the project page. The first one is used when a project has no cover
        image. A description is optional; without one the image is treated as decorative.
      </p>

      {gallery.length === 0 ? (
        <p className="text-muted-foreground text-sm">No gallery images yet.</p>
      ) : (
        <ul className="space-y-3">
          {gallery.map((image, index) => (
            <GalleryRow
              key={index}
              index={index}
              image={image}
              pathError={errorMessage(galleryRowErrors(errors, index)?.path)}
              altError={errorMessage(galleryRowErrors(errors, index)?.altText)}
              onChange={(next) => {
                const updated = [...gallery]
                updated[index] = next
                onChange(updated)
              }}
              onRemove={() => setPendingRemoval(index)}
            />
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...gallery, { path: '', altText: '' }])}
      >
        Add gallery image
      </Button>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null)
        }}
        title="Remove this image?"
        description="It is taken off the project. The file itself stays in the media library, so nothing is lost if you change your mind."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (pendingRemoval !== null) {
            onChange(gallery.filter((_, index) => index !== pendingRemoval))
          }
          setPendingRemoval(null)
        }}
      />
    </fieldset>
  )
}

type GalleryRowProps = {
  index: number
  image: ProjectValues['gallery'][number]
  pathError?: string
  altError?: string
  onChange: (image: ProjectValues['gallery'][number]) => void
  onRemove: () => void
}

function GalleryRow({ index, image, pathError, altError, onChange, onRemove }: GalleryRowProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputId = `gallery-image-${index}`
  const preview = imageUrl(image.path)

  async function handleFile(file: File | undefined) {
    if (!file) return

    setIsUploading(true)
    setFileError(null)

    try {
      const stored = await uploadMedia({ file, folder: MEDIA_FOLDERS.projects })
      onChange({ ...image, path: stored.path })
    } catch (error) {
      setFileError(toErrorMessage(error, 'The image could not be uploaded.'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border p-3">
      <div className="bg-muted/40 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <ImageOff className="text-muted-foreground size-5" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <input
          id={inputId}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
          className="sr-only"
          aria-invalid={Boolean(pathError)}
          aria-describedby={pathError ? `${inputId}-path-error` : undefined}
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<label htmlFor={inputId} className="cursor-pointer" />}
        >
          <Upload aria-hidden="true" />
          {isUploading ? 'Uploading…' : image.path ? 'Replace' : 'Choose image'}
        </Button>

        {pathError ? (
          <p id={`${inputId}-path-error`} role="alert" className="text-destructive text-xs">
            {pathError}
          </p>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor={`${inputId}-alt`} className="text-xs">
            Alt text{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id={`${inputId}-alt`}
            value={image.altText}
            placeholder="Describe what this image shows"
            onChange={(event) => onChange({ ...image, altText: event.target.value })}
            aria-invalid={Boolean(altError)}
            aria-describedby={
              [altError ? `${inputId}-alt-error` : null, fileError ? `${inputId}-error` : null]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {altError ? (
            <p id={`${inputId}-alt-error`} role="alert" className="text-destructive text-xs">
              {altError}
            </p>
          ) : null}
        </div>

        {fileError ? (
          <p id={`${inputId}-error`} role="alert" className="text-destructive text-xs">
            {fileError}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-destructive/10"
        aria-label="Remove gallery image"
        onClick={onRemove}
        disabled={isUploading}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  )
}
