import { useState } from 'react'
import { FileSearch, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/utils/formatBytes'
import { useDeleteUnrecordedObject, useUnrecordedObjects } from '@/features/media'
import type { UnrecordedObject } from '@/services/mediaOrphans'

/**
 * Finds and removes objects that live in the buckets but have no `media` record.
 *
 * Such a file is usually an upload whose `media` insert failed — the object landed, the row
 * did not — and it can never be reached from the library grid, because the grid is built
 * from the table. The scan is opt-in: it walks both buckets, which costs more than the
 * library's own reads, and it is only worth running when the owner suspects something is
 * missing or when storage usage looks high.
 */
export function UnrecordedFilesPanel() {
  const scan = useUnrecordedObjects()
  const remove = useDeleteUnrecordedObject()
  const [pendingDelete, setPendingDelete] = useState<UnrecordedObject | null>(null)

  const isScanning = scan.isPending

  return (
    <section className="rounded-lg border p-4" aria-labelledby="unrecorded-files-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="unrecorded-files-heading" className="text-sm font-medium">
            Unrecorded storage files
          </h2>
          <p className="text-muted-foreground text-xs">
            Files that exist in the buckets but have no media-library record. They cannot be
            deleted from the grid, so they are listed here instead.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void scan.refetch()}
          disabled={isScanning}
        >
          <FileSearch aria-hidden="true" />
          {isScanning ? 'Scanning…' : 'Scan buckets'}
        </Button>
      </div>

      {scan.error ? (
        <p className="text-destructive mt-3 text-xs" role="alert">
          The scan failed: {String(scan.error.message ?? scan.error)}
        </p>
      ) : scan.data ? (
        scan.data.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-xs">
            No unrecorded files found. Every object in the buckets has a media record.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {scan.data.map((object) => (
              <li key={mediaOrphanKey(object)} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{object.path}</p>
                  <p className="text-muted-foreground text-xs">
                    {object.bucket}
                    {object.sizeBytes !== null ? ` · ${formatBytes(object.sizeBytes)}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setPendingDelete(object)}
                  disabled={remove.isPending}
                  aria-label={`Remove ${object.path}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-muted-foreground mt-3 text-xs">Run a scan to check.</p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Remove ${pendingDelete?.path ?? 'this file'}?`}
        description="The file is removed from storage. It has no media record and is not referenced by any content, so nothing should depend on it."
        confirmLabel="Remove file"
        destructive
        isPending={remove.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return

          await remove.mutateAsync(pendingDelete)
          setPendingDelete(null)
          await scan.refetch()
        }}
      />
    </section>
  )
}

/** A stable key for a scan result row. */
function mediaOrphanKey(object: UnrecordedObject) {
  return `${object.bucket}::${object.path}`
}
