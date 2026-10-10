import { useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { ACCEPTED_FILE_EXTENSIONS, FILE_MAX_SIZE_BYTES } from '@/constants/storage'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/utils/formatBytes'
import { cn } from '@/lib/utils'

type FileUploadProps = {
  /**
   * The stored object's key, used to show what is currently attached, or `null` when there
   * is none. The key rather than a download URL because this component only reports state;
   * the caller decides how to build a link.
   */
  fileName: string | null
  onSelect: (file: File) => void
  onClear?: () => void
  isUploading?: boolean
  label?: string
  className?: string
}

/**
 * Document picker with replace, remove, and validation.
 *
 * The same split as `ImageUpload`: this validates and presents, the parent uploads. It is a
 * separate component rather than a mode of `ImageUpload` because a PDF has no thumbnail
 * worth rendering and a different size limit, so sharing one component would mean branching
 * on file kind in every part of the markup.
 *
 * Validation is a courtesy that produces a readable message. The bucket's MIME types and
 * size limit are what actually reject the file.
 */
export function FileUpload({
  fileName,
  onSelect,
  onClear,
  isUploading = false,
  label = 'File',
  className,
}: FileUploadProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const inputId = `file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`

  const validate = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Choose a PDF file.'
    }
    if (file.size > FILE_MAX_SIZE_BYTES) {
      return `File must be ${formatBytes(FILE_MAX_SIZE_BYTES)} or smaller. This one is ${formatBytes(file.size)}.`
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

      <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
        <FileText className="text-muted-foreground size-8 shrink-0" aria-hidden="true" />

        <p className="min-w-0 flex-1 truncate text-sm">
          {fileName ?? <span className="text-muted-foreground">No file attached</span>}
        </p>
      </div>

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="sr-only"
        // Cleared after reading so re-choosing the same file still fires a change event.
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''

          handleChange(file)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<label htmlFor={inputId} className="cursor-pointer" />}
          disabled={isUploading}
        >
          <Upload aria-hidden="true" />
          {isUploading ? 'Uploading…' : fileName ? 'Replace' : 'Choose file'}
        </Button>

        {fileName && onClear ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={isUploading}>
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">
        PDF, up to {formatBytes(FILE_MAX_SIZE_BYTES)}.
      </p>

      {localError ? (
        <p role="alert" className="text-destructive text-xs">
          {localError}
        </p>
      ) : null}
    </div>
  )
}
