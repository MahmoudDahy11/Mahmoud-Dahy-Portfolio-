import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/queryKeys'
import { toErrorMessage } from '@/lib/errors'
import { deleteMediaAsset, getMediaAssets, updateMediaAsset } from '@/services/media'
import { getMediaUsage } from '@/services/mediaUsage'
import { deleteUnrecordedObject, getUnrecordedObjects } from '@/services/mediaOrphans'
import type { MediaAsset } from '@/types/entities'
import type { Patch } from '@/services/base'
import type { UnrecordedObject } from '@/services/mediaOrphans'

/** Everything in the media library, newest first. */
export function useMediaAssets() {
  return useQuery({
    queryKey: queryKeys.media.list(),
    queryFn: getMediaAssets,
  })
}

/**
 * Where each stored file is referenced.
 *
 * A separate query from the asset list because the two reads have different lifetimes: the
 * library changes when a file is uploaded, while the usage map changes when any content row
 * is saved. Keeping them apart means saving a project refreshes the usage map without
 * refetching every file's metadata.
 */
export function useMediaUsage() {
  return useQuery({
    queryKey: queryKeys.media.usage(),
    queryFn: getMediaUsage,
  })
}

/** Records a change to a stored file's details, such as its alt text. */
export function useUpdateMediaAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Patch<'media'> }) =>
      updateMediaAsset(id, values),
    onSuccess: async () => {
      toast.success('File details saved.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.media.all() })
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not save the file details.')),
  })
}

/** Removes a file from the bucket and from the library. */
export function useDeleteMediaAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asset: Pick<MediaAsset, 'id' | 'bucket' | 'path'>) => deleteMediaAsset(asset),
    onSuccess: async () => {
      toast.success('File deleted.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.media.all() })
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not delete the file.')),
  })
}

/**
 * A scan of the buckets for objects no record points at.
 *
 * `enabled: false` rather than a boolean the caller flips: the scan costs a walk of both
 * buckets, so it runs only when the owner asks for it, and `refetch()` is the single way to
 * trigger or repeat it. A successful deletion invalidates this key alongside the library,
 * so a scan result never lists a file that was just removed.
 */
export function useUnrecordedObjects() {
  return useQuery({
    queryKey: queryKeys.media.unrecorded(),
    queryFn: getUnrecordedObjects,
    enabled: false,
  })
}

/** Removes one unrecorded object from its bucket. */
export function useDeleteUnrecordedObject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (object: Pick<UnrecordedObject, 'bucket' | 'path'>) =>
      deleteUnrecordedObject(object),
    onSuccess: async () => {
      toast.success('File removed from storage.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.media.all() })
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not remove the file.')),
  })
}
