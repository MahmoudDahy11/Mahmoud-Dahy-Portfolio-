import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/queryKeys'
import { toErrorMessage } from '@/lib/errors'
import {
  deleteContactMessage,
  getContactMessages,
  getMessageCounts,
  updateContactMessage,
  type MessageFilter,
} from '@/services/contactMessages'

/** One view of the inbox. */
export function useContactMessages(filter: MessageFilter) {
  return useQuery({
    queryKey: queryKeys.messages.list(filter),
    queryFn: () => getContactMessages(filter),
  })
}

/** Unread and total counts, for the tab labels. Separate from the list so the badges do not
 *  wait on the list query, and so they are counted by the database rather than by counting
 *  the rows already in memory. */
export function useMessageCounts() {
  return useQuery({
    queryKey: queryKeys.messages.counts(),
    queryFn: getMessageCounts,
  })
}

type TriageInput = {
  id: string
  isRead?: boolean
  isArchived?: boolean
}

/**
 * Marking, archiving, and deleting messages.
 *
 * Not `useCrudMutations`: an inbox has no create and no edit, and each action deserves its
 * own confirmation wording — "Archived" and "Deleted" are very different outcomes and a
 * shared message would blur that.
 *
 * Every action invalidates the counts as well as the list, because moving a message between
 * views changes the tab badges. Invalidating only the list would leave a stale unread count
 * sitting next to an inbox that no longer contains the message.
 */
export function useMessageMutations() {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.messages.all() })
    // The dashboard's unread count and its recent-messages list are built from the same
    // table, so they have to move with the inbox.
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview() })
  }

  const triage = useMutation({
    mutationFn: ({ id, ...values }: TriageInput) =>
      updateContactMessage(id, { isRead: values.isRead, isArchived: values.isArchived }),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.isArchived === true
          ? 'Message archived.'
          : variables.isArchived === false
            ? 'Message moved back to the inbox.'
            : 'Message updated.',
      )
      await refresh()
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not update the message.')),
  })

  const remove = useMutation({
    mutationFn: deleteContactMessage,
    onSuccess: async () => {
      toast.success('Message deleted.')
      await refresh()
    },
    onError: (error) => toast.error(toErrorMessage(error, 'Could not delete the message.')),
  })

  return { triage, remove, isPending: triage.isPending || remove.isPending }
}
