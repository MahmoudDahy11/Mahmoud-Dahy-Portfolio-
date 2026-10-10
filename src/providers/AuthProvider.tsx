import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppError } from '@/lib/errors'
import { getSupabaseClient } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  session: Session | null
  user: User | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Holds the Supabase session and exposes sign-in and sign-out.
 *
 * `status` starts as 'loading' because on first render the browser may already hold a
 * saved session that has not been read yet. Protected routes wait for this to settle
 * before deciding, otherwise a refresh would bounce a signed-in admin to the login page.
 *
 * This provider controls the UI only. It is not a security boundary: authorization is
 * enforced by Row Level Security in the database, and a caller that bypasses this
 * provider still cannot write anything.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    // Supabase is not configured until Phase 2 provides values. Degrading to
    // "unauthenticated" keeps the public site usable while still allowing the error
    // boundary to show the setup notice.
    let supabase: ReturnType<typeof getSupabaseClient>
    try {
      supabase = getSupabaseClient()
    } catch {
      setStatus('unauthenticated')
      return
    }

    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'unauthenticated')
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Supabase returns the same message for an unknown email and a wrong password.
      // The generic message avoids telling an attacker which accounts exist.
      throw new AppError('Incorrect email or password.', error)
    }
  }, [])

  const signOut = useCallback(async () => {
    // Cleared *before* the network call. Admin status is cached by React Query, and a
    // failure here must not leave the previous admin's "is an admin: true" in the cache for
    // whoever signs in next.
    queryClient.clear()

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new AppError('Could not sign out. Please try again.', error)
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, status, signIn, signOut }),
    [session, status, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuthContext(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used inside <AuthProvider>.')
  }
  return context
}
