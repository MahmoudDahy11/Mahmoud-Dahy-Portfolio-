import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { isCurrentUserAdmin } from '@/services/adminUsers'

/**
 * Whether the current session belongs to an admin.
 *
 * Only enabled once a session exists: without one the read is guaranteed to return no rows,
 * so running it would be a pointless request on every public page render.
 *
 * `staleTime: 0` is intentional. Admin status is checked on every admin route entry, and a
 * cached "yes" for a revoked admin would keep showing the dashboard until the cache was
 * cleared by hand. One small read per navigation is the right trade.
 */
export function useIsAdmin(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminAccess(),
    queryFn: isCurrentUserAdmin,
    enabled,
    staleTime: 0,
  })
}
