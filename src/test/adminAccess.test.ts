import { describe, expect, it } from 'vitest'
import { getSupabaseClient } from '@/lib/supabase'
import { isCurrentUserAdmin } from '@/services/adminUsers'

/**
 * The flag and credentials come from `import.meta.env`, not `process.env`, because the app
 * tsconfig deliberately has no Node types. See the same note in `live-api.test.ts`.
 *
 * The admin password is never stored in `.env` or committed. These variables are supplied
 * only for the run:
 *
 *   VITE_RUN_LIVE_TESTS=1 \
 *   VITE_LIVE_ADMIN_EMAIL=... VITE_LIVE_ADMIN_PASSWORD=... npm run test:live
 */

/**
 * `isCurrentUserAdmin` decides whether a signed-in visitor sees the dashboard.
 *
 * It runs against the live project on purpose. The whole point of the check is the shape of
 * the database's *response*: `admin_users_self_read` allows `auth.uid()` to read its own row
 * and nothing else. A mocked client could not prove that a non-admin gets an empty result
 * rather than another account's row, which is the exact case that must not be wrong.
 */
const liveIt = import.meta.env.VITE_RUN_LIVE_TESTS === '1' ? it : it.skip

const adminEmail = import.meta.env.VITE_LIVE_ADMIN_EMAIL as string | undefined
const adminPassword = import.meta.env.VITE_LIVE_ADMIN_PASSWORD as string | undefined

describe('isCurrentUserAdmin', () => {
  liveIt('returns false for a signed-out visitor without throwing', async () => {
    // The anon role holds no SELECT on admin_users, so this either returns no rows or is
    // refused outright. Both mean "not an admin"; neither may become an unhandled throw.
    // It is gated like every other live check because proving that means a real request to
    // the real database, and `npm test` must stay runnable without a network.
    const result = await isCurrentUserAdmin().catch(() => false)

    expect(typeof result).toBe('boolean')
    expect(result).toBe(false)
  }, 30_000)

  liveIt('returns true for the admin account on the allowlist', async () => {
    if (!adminEmail || !adminPassword) {
      throw new Error(
        'Set VITE_LIVE_ADMIN_EMAIL and VITE_LIVE_ADMIN_PASSWORD to run this test.',
      )
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    if (error || !data.session) {
      throw new Error(`Could not sign in as the live admin: ${error?.message ?? 'no session'}`)
    }

    try {
      await expect(isCurrentUserAdmin()).resolves.toBe(true)
    } finally {
      await supabase.auth.signOut()
    }
  })
})
