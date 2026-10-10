import { FileText, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mediaUrl } from '@/services/mediaUrls'
import { formatBytes } from '@/utils/formatBytes'
import { formatDate } from '@/utils/formatDate'
import type { MediaAsset } from '@/types/entities'
import type { MediaReference } from '@/services/mediaUsage'

/** Whether a stored object is an image this grid can draw a thumbnail for. */
function isImage(asset: MediaAsset) {
  return asset.mimeType.startsWith('image/')
}

type MediaAssetCardProps = {
  asset: MediaAsset
  /**
   * The places this file is referenced. An empty array means it is unused; `undefined`
   * means the usage map could not be read, in which case nothing is claimed either way —
   * showing "Unused" for a file that is in fact used would invite deleting it.
   */
  references: MediaReference[] | undefined
  onEdit: () => void
  onDelete: () => void
  isPending: boolean
}

/** One file in the library: a thumbnail, its details, and its two actions. */
export function MediaAssetCard({
  asset,
  references,
  onEdit,
  onDelete,
  isPending,
}: MediaAssetCardProps) {
  const href = mediaUrl(asset.path, asset.bucket)
  const image = isImage(asset) ? href : null
  const isUsed = references !== undefined && references.length > 0

  return (
    <li className="bg-card flex flex-col overflow-hidden rounded-lg border">
      <div className="bg-muted/40 flex aspect-video items-center justify-center">
        {image ? (
          <img src={image} alt={asset.altText ?? ''} className="size-full object-cover" />
        ) : (
          <FileText className="text-muted-foreground size-8" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-sm font-medium" title={asset.fileName}>
          {asset.fileName}
        </p>

        <p className="text-muted-foreground text-xs">
          {formatBytes(asset.sizeBytes)}
          {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
        </p>

        <p className="text-muted-foreground text-xs">{formatDate(asset.createdAt)}</p>

        {asset.altText ? (
          <p className="line-clamp-2 text-xs">{asset.altText}</p>
        ) : (
          /*
            Alt text is not decoration. A missing description of an image is invisible in
            the grid and is exactly the failure this column exists to prevent, so an asset
            without one is called out rather than left to be discovered on the public site.
          */
          <Badge variant="outline" className="w-fit text-xs">
            No alt text
          </Badge>
        )}

        {references === undefined ? null : isUsed ? (
          <p
            className="text-muted-foreground line-clamp-2 text-xs"
            title={referenceLabels(references)}
          >
            Used by {referenceLabels(references)}
          </p>
        ) : (
          <Badge variant="outline" className="text-muted-foreground w-fit text-xs">
            Unused
          </Badge>
        )}

        <div className="mt-auto flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            disabled={isPending}
            aria-label={`Edit details for ${asset.fileName}`}
          >
            <Pencil aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={isPending}
            aria-label={`Delete ${asset.fileName}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  )
}

/** The reference labels joined for display, shared by the card text and its tooltip. */
export function referenceLabels(references: MediaReference[]) {
  return references.map((reference) => reference.label).join(', ')
}
