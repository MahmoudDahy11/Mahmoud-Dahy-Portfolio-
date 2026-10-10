import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toErrorMessage } from '@/lib/errors'

/**
 * Saving a single-row configuration: the profile and the site settings.
 *
 * These tables have no create or delete in the admin. There is one row, the owner edits it,
 * and a "new profile" button would be meaningless. So `useCrudMutations` does not apply, but
 * the three things it guarantees still do: the saved value is reflected everywhere it is
 * read, success is confirmed, and failure is reported rather than swallowed.
 *
 * Kept separate from `useCrudMutations` rather than loosened to allow missing operations,
 * because a helper where two of the three callbacks are optional invites call sites that
 * quietly forget one.
 */
type SaveMutationConfig<TValues> = {
  /** Root query key for the entity, invalidated after a successful save. */
  queryKey: readonly unknown[]
  /**
   * Additional keys to refresh. The profile and settings rows are read by the public header,
   * footer, hero, and `usePageSeo`, so saving changes what several components display.
   */
  relatedKeys?: readonly (readonly unknown[])[]
  save: (values: TValues) => Promise<unknown>
  successMessage: string
  errorMessage: string
}

export function useSaveMutation<TValues>({
  queryKey,
  relatedKeys = [],
  save,
  successMessage,
  errorMessage,
}: SaveMutationConfig<TValues>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: save,
    onSuccess: async () => {
      toast.success(successMessage)
      await queryClient.invalidateQueries({ queryKey })

      for (const key of relatedKeys) {
        await queryClient.invalidateQueries({ queryKey: key })
      }
    },
    onError: (error) => toast.error(toErrorMessage(error, errorMessage)),
  })
}
