import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toErrorMessage } from '@/lib/errors'

/**
 * Create, update, and delete for one entity, with identical behaviour everywhere.
 *
 * Every admin section needs exactly these three operations, and each of them has three
 * things that must not vary between sections: refresh the affected queries so the table
 * shows what was just saved, confirm success, and report failure. Writing that at each of
 * thirteen call sites is how one section ends up silently not refreshing, or showing no
 * error when a write is rejected by RLS.
 *
 * So the behaviour lives here once. A service supplies the three functions — which are
 * where the actual Supabase calls live — and this hook supplies the feedback and the cache
 * refresh.
 *
 * Failures are reported with a toast rather than thrown at the call site, because the two
 * places a mutation runs are a dialog and a confirmation dialog, and both already have a
 * natural way to show that something went wrong without every page re-implementing it.
 * The mutation still rejects, so a caller that wants to react can `await` it and handle
 * the error itself.
 */
export type CrudMessages = {
  created: string
  updated: string
  deleted: string
}

type CrudMutationsConfig<TCreate, TUpdate> = {
  /**
   * Root query key for the entity. Invalidated after every successful change, which
   * re-runs the admin list and, because public pages read the same tables, keeps the
   * public site consistent with what the owner just saved.
   */
  queryKey: readonly unknown[]
  /**
   * Additional query keys to refresh. Needed when one entity is *shown* inside another:
   * renaming a technology changes the label on every project card, so the project queries
   * have to be refetched too.
   */
  relatedKeys?: readonly (readonly unknown[])[]
  create: (values: TCreate) => Promise<unknown>
  update: (values: TUpdate) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
  messages: CrudMessages
}

export function useCrudMutations<TCreate, TUpdate>({
  queryKey,
  relatedKeys = [],
  create,
  update,
  remove,
  messages,
}: CrudMutationsConfig<TCreate, TUpdate>) {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey })

    for (const key of relatedKeys) {
      await queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: async () => {
      toast.success(messages.created)
      await refresh()
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not save. Nothing was changed.')),
  })

  const updateMutation = useMutation({
    mutationFn: update,
    onSuccess: async () => {
      toast.success(messages.updated)
      await refresh()
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not save. Nothing was changed.')),
  })

  const removeMutation = useMutation({
    mutationFn: remove,
    onSuccess: async () => {
      toast.success(messages.deleted)
      await refresh()
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not delete. Nothing was changed.')),
  })

  return {
    create: createMutation,
    update: updateMutation,
    remove: removeMutation,
    /** True while any of the three is running, for disabling a section's controls. */
    isPending:
      createMutation.isPending || updateMutation.isPending || removeMutation.isPending,
  }
}
