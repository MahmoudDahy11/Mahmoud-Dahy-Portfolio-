import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ADMIN_ROUTES } from '@/constants/routes'
import { useAuthContext } from '@/providers/AuthProvider'
import { FullPageSpinner } from '@/components/common/LoadingState'
import { useIsAdmin } from '@/features/auth/hooks'

/**
 * Keeps visitors who are not admins out of the admin interface.
 *
 * Two separate questions are asked, because they fail differently:
 *
 * 1. Is there a session? If not, send them to sign in.
 * 2. Is that session an admin? A valid session is not enough — self-registration is
 *    disabled, but a user could still exist, and an admin allowlist means "authenticated"
 *    and "administrator" are different claims. Failing this check shows an explanation
 *    instead of a dashboard whose every request is rejected.
 *
 * This is a usability guard, not a security control. `private.is_admin()` in the database
 * rejects every unauthorised read and write regardless of what the browser does, so
 * bypassing this component yields published content and nothing else. Both layers are
 * required; only the database one is load-bearing.
 *
 * The session check must settle first. Without that wait, a page refresh would read the
 * restored session as "signed out" for one render and bounce a valid admin to sign-in.
 */
export function RequireAdmin() {
  const { status } = useAuthContext()
  const location = useLocation()

  const isAuthenticated = status === 'authenticated'
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin(isAuthenticated)

  useEffect(() => {
    document.title = 'Admin — Portfolio'
  }, [])

  if (status === 'loading') {
    return <FullPageSpinner label="Checking your session" />
  }

  if (!isAuthenticated) {
    // The attempted location is remembered so the admin lands back where they were after
    // signing in, instead of always returning to the dashboard.
    return <Navigate to={ADMIN_ROUTES.login} replace state={{ from: location.pathname }} />
  }

  if (isCheckingAdmin) {
    return <FullPageSpinner label="Verifying your access" />
  }

  if (isAdmin === false) {
    // Signing out rather than redirecting to sign in: the session is valid but the account
    // has no admin row, so leaving it active would bounce straight back to this page.
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">You are not an admin</h1>
        <p className="text-muted-foreground text-sm">
          This account is signed in, but it is not on the admin allowlist. Ask the portfolio
          owner to add it before trying again.
        </p>
        <a
          href={ADMIN_ROUTES.login}
          className="text-primary text-sm font-medium underline underline-offset-4"
        >
          Back to sign in
        </a>
      </div>
    )
  }

  return <Outlet />
}
