import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EntityDialog } from '@/components/common/EntityDialog'
import { TextField } from '@/components/common/FormField'
import { FullPageSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import {
  MEDIA_FOLDERS,
  uploadMedia,
  useDeleteMediaAsset,
  useMediaAssets,
  useMediaUsage,
  useUpdateMediaAsset,
  UnrecordedFilesPanel,
} from '@/features/media'
import { MediaAssetCard, referenceLabels } from '@/features/media/MediaAssetCard'
import { mediaUsageKey } from '@/services/mediaUsage'
import { mediaDetailsSchema } from '@/schemas'
import { toErrorMessage } from '@/lib/errors'
import type { MediaAsset } from '@/types/entities'

/**
 * The media library.
 *
 * Everything uploaded through the admin dashboard lands in the `media` table, which is what
 * makes this a library rather than a bucket browser: each entry carries the alt text the
 * public site needs and the record of who uploaded it.
 *
 * This screen never edits a file's contents. The only editable field is alt text, because
 * that is the one thing about an existing upload that can be wrong and is cheap to correct.
 * Replacing an image is done from the form it belongs to, which knows which record to
 * repoint.
 *
 * Each file also shows whether any content row points at it. A file nothing references can
 * be deleted without consequence; deleting one that is in use breaks a public image, so the
 * references are named in the confirmation rather than left as a warning.
 */
export default function MediaPage() {
  const assets = useMediaAssets()
  const usage = useMediaUsage()
  const update = useUpdateMediaAsset()
  const remove = useDeleteMediaAsset()

  const fileInput = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showUnusedOnly, setShowUnusedOnly] = useState(false)
  const [editing, setEditing] = useState<MediaAsset | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null)

  /** The references for one asset, or `undefined` while the usage map is unavailable. */
  function referencesFor(asset: MediaAsset) {
    if (!usage.data) return undefined

    return usage.data.get(mediaUsageKey(asset.bucket, asset.path)) ?? []
  }

  async function handleUpload(file: File) {
    setIsUploading(true)

    try {
      // A generic folder: the library is browsed as a whole, and the object key is not
      // something the owner needs to choose. Files they upload from a form go to that
      // form's folder instead.
      await uploadMedia({ file, folder: MEDIA_FOLDERS.misc })
      toast.success('File uploaded.')
    } catch (error) {
      toast.error(toErrorMessage(error, 'The file could not be uploaded.'))
    } finally {
      setIsUploading(false)
    }
  }

  if (assets.isPending) {
    return <FullPageSpinner label="Loading the media library…" />
  }

  if (assets.error) {
    return <ErrorState message="Could not load the media library." onRetry={() => void assets.refetch()} />
  }

  const isEmpty = assets.data.length === 0
  const usageKnown = usage.data !== undefined
  const visibleAssets = showUnusedOnly
    ? assets.data.filter((asset) => referencesFor(asset)?.length === 0)
    : assets.data
  const unusedCount = assets.data.filter((asset) => referencesFor(asset)?.length === 0).length
  const pendingReferences = pendingDelete ? referencesFor(pendingDelete) : undefined

  return (
    <>
      <PageHeader
        title="Media"
        description="Every file uploaded through the dashboard. Images uploaded from a form appear here too."
        action={
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''

                if (file) void handleUpload(file)
              }}
            />
            <Button type="button" onClick={() => fileInput.current?.click()} disabled={isUploading}>
              <Upload aria-hidden="true" />
              {isUploading ? 'Uploading…' : 'Upload file'}
            </Button>
          </>
        }
      />

      <UnrecordedFilesPanel />

      {isEmpty ? (
        <EmptyState
          title="No files yet"
          description="Upload an image or a PDF, or add one from any of the content forms — a project cover, an avatar, a certificate badge."
          action={
            <Button type="button" onClick={() => fileInput.current?.click()}>
              Upload a file
            </Button>
          }
        />
      ) : (
        <>
          {/*
            The filter exists so orphaned uploads — files abandoned after a form was
            closed — can be found and removed without scanning every thumbnail. The count
            is shown even when the filter is off, so the owner knows there is something to
            look for. It is withheld while the usage map is unavailable, because claiming
            a file is unused when that is unknown is how a used image gets deleted.
          */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {usageKnown ? (
              <Button
                type="button"
                variant={showUnusedOnly ? 'default' : 'outline'}
                size="sm"
                aria-pressed={showUnusedOnly}
                onClick={() => setShowUnusedOnly((current) => !current)}
              >
                {showUnusedOnly ? 'Showing unused only' : `Show unused only (${unusedCount})`}
              </Button>
            ) : null}

            <p className="text-muted-foreground text-sm" role="status">
              {visibleAssets.length} {visibleAssets.length === 1 ? 'file' : 'files'}
            </p>
          </div>

          {visibleAssets.length === 0 ? (
            <EmptyState
              title="No unused files"
              description="Every file in the library is referenced by content. Nothing to clean up."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  references={referencesFor(asset)}
                  isPending={update.isPending || remove.isPending}
                  onEdit={() => setEditing(asset)}
                  onDelete={() => setPendingDelete(asset)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {editing ? (
        <EntityDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title="File details"
          description={editing.fileName}
          schema={mediaDetailsSchema}
          defaultValues={{ altText: editing.altText ?? '' }}
          onSubmit={async (values) => {
            await update.mutateAsync({ id: editing.id, values })
            setEditing(null)
          }}
          submitLabel="Save details"
          isBusy={update.isPending}
        >
          <TextField
            name="altText"
            label="Alt text"
            description="Describes the image for screen-reader users and when it fails to load. Leave blank for files that are not images."
          />
        </EntityDialog>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.fileName ?? 'this file'}?`}
        description={
          pendingReferences && pendingReferences.length > 0
            ? `This file is used by: ${referenceLabels(pendingReferences)}. Deleting it will break those.`
            : 'The file is removed from storage as well as this list. Nothing currently uses it.'
        }
        confirmLabel="Delete file"
        destructive
        isPending={remove.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return

          await remove.mutateAsync(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
