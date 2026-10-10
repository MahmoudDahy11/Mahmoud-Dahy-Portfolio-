import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import {
  createSocialLink,
  deleteSocialLink,
  getAllSocialLinks,
  getSocialLinks,
  updateSocialLink,
} from '@/services/socialLinks'
import type { SocialLinkValues } from '@/schemas/socialLink'

/** Published social links. Used by the hero, the contact page, and the footer. */
export function useSocialLinks() {
  return useQuery({
    queryKey: queryKeys.socialLinks.list(),
    queryFn: getSocialLinks,
  })
}

/** Every link, drafts included. The admin table is the only caller. */
export function useAllSocialLinks() {
  return useQuery({
    queryKey: queryKeys.socialLinks.all(),
    queryFn: getAllSocialLinks,
  })
}

/**
 * Create, update, and delete for social links.
 *
 * The published list is refreshed too, because these links appear in three places on the
 * public site at once — the header, the hero, and the footer.
 */
export function useSocialLinkMutations() {
  return useCrudMutations<SocialLinkValues, { id: string; values: SocialLinkValues }>({
    queryKey: queryKeys.socialLinks.all(),
    relatedKeys: [queryKeys.socialLinks.list()],
    create: createSocialLink,
    update: ({ id, values }) => updateSocialLink(id, values),
    remove: deleteSocialLink,
    messages: {
      created: 'Link added.',
      updated: 'Link saved.',
      deleted: 'Link deleted.',
    },
  })
}
