import { QueryClient } from '@tanstack/react-query'

/**
 * Default behaviour for all server state.
 *
 * Portfolio content changes rarely and is not personalised, so a single shared client
 * with these defaults keeps the setup small and avoids caching surprises.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Content is not user-specific, so it can be reused between admin and public
      // views. Reasonable default for a site whose content changes on the order of days.
      staleTime: 60_000,
      // One retry absorbs a dropped connection without making the user wait long on a
      // genuine failure.
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
