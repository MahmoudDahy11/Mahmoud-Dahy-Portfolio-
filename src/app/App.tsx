import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AppProviders } from './providers'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'

/**
 * Application entry point.
 *
 * Providers compose the cross-cutting concerns: query caching, theme, and auth session.
 * `ErrorBoundary` catches render-time failures before they unmount the entire tree.
 * `RouterProvider` renders the route tree, and `Toaster` mounts the global toast host.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
        <Toaster />
      </AppProviders>
    </ErrorBoundary>
  )
}
