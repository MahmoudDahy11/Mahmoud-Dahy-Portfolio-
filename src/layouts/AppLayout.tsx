import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { FullPageSpinner } from '@/components/common/LoadingState'
import { TooltipProvider } from '@/components/ui/tooltip'
import { isSupabaseConfigured } from '@/lib/env'

/**
 * Root layout.
 *
 * Holds the pieces that must exist exactly once for the whole application: the tooltip
 * context, the suspense fallback that wraps lazily loaded pages, and the Supabase setup
 * notice.
 *
 * Keeping this separate from the router means a page can be swapped without touching
 * anything global.
 */
export function AppLayout() {
  return (
    <TooltipProvider>
      <Suspense fallback={<FullPageSpinner />}>
        {/*
          Without an anon key every query fails with a confusing network error. Saying so
          plainly here turns a hard-to-diagnose problem into an obvious one. Phase 2 fills
          in the real values, after which this banner never renders.
        */}
        {!isSupabaseConfigured() ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 border-b px-4 py-3 text-sm"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Supabase is not configured</p>
              <p className="text-sm">
                Copy <code className="font-mono text-xs">.env.example</code> to{' '}
                <code className="font-mono text-xs">.env</code> and add your project URL and anon key. Without
                them, no content can load and sign-in is disabled.
              </p>
            </div>
          </div>
        ) : null}
        <Outlet />
      </Suspense>
    </TooltipProvider>
  )
}
