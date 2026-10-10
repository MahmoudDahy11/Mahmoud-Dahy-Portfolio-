import { useAuthContext } from '@/providers/AuthProvider'

/**
 * Auth state for components.
 *
 * A thin wrapper so components never import from `providers/` directly; the provider
 * folder stays an implementation detail.
 */
export function useAuth() {
  const { session, user, status, signIn, signOut } = useAuthContext()

  return {
    session,
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    signIn,
    signOut,
  }
}
