import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'

/**
 * Composes every application-wide provider.
 *
 * Order matters: ThemeProvider only touches the document element so it is outermost, and
 * QueryClientProvider sits above AuthProvider so auth transitions can invalidate cached
 * queries.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
