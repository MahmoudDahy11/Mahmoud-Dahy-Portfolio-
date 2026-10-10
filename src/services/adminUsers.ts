import { fetchOne, getSupabaseClient } from './base'

/**
 * Whether the signed-in user is on the admin allowlist.
 *
 * There is deliberately no `.eq('user_id', ...)` filter here. The `admin_users_self_read`
 * policy already restricts the result to `auth.uid()`, so the database returns at most one
 * row and it is always the caller's own. Adding a client-side filter would be redundant, and
 * an anonymous caller simply gets no rows rather than someone else's.
 *
 * `false` here is a usability signal, not a security control. Every write is still rejected
 * by `private.is_admin()` inside the database policies, so someone who forces their way past
 * this check can read published content and nothing more. It exists so a non-admin is told
 * "you are not an admin" rather than shown a dashboard where every request fails.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const row = await fetchOne<'admin_users'>(
    () => getSupabaseClient().from('admin_users').select('id').limit(1),
    'Could not verify your admin access. Please try again.',
  )

  return row !== null
}
