import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { toErrorMessage } from '@/lib/errors'

/**
 * Sign-out control for the admin header.
 *
 * `signOut` clears the query cache before calling Supabase, so a failure here cannot leave
 * the previous admin's cached data for whoever signs in next. This component only has to
 * call it, disable itself while it runs, and report a failure — the redirect to the sign-in
 * page happens on its own, because the route guard sees the session disappear.
 */
export function SignOutButton() {
  const { signOut } = useAuth()
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    setIsPending(true)

    try {
      await signOut()
    } catch (error) {
      toast.error(toErrorMessage(error, 'Could not sign out. Please try again.'))
      setIsPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isPending}
    >
      <LogOut aria-hidden="true" />
      {isPending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
