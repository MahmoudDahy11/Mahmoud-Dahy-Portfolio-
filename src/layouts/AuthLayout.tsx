import { Outlet } from 'react-router-dom'
import { Logo } from '@/components/common/Navigation'

/**
 * Chrome for the login page.
 *
 * Deliberately minimal: a centred card with no navigation, so there is nothing to
 * accidentally click through to while signing in.
 */
export function AuthLayout() {
  return (
    <div className="editorial bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo />
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
