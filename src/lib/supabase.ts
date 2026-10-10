import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './env'
import type { Database } from '@/types/database'

/**
 * The single Supabase client for the whole application.
 *
 * A client is created once and reused. Creating one per component would open a new
 * connection and a new session listener for every instance, and sessions would stop
 * agreeing with each other.
 *
 * Components never import this directly. They go through a service in `src/services`,
 * which is called by a hook in the matching feature folder. That chain is what keeps
 * database queries out of the view layer.
 */
let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client

  const { url, anonKey } = getSupabaseConfig()

  client = createClient<Database>(url, anonKey, {
    auth: {
      // Supabase persists the session in localStorage and refreshes it automatically,
      // so the admin stays signed in across reloads without extra code here.
      persistSession: true,
      autoRefreshToken: true,
      // Needed so session refresh works when the app is served from a different origin
      // than the API, which is common in preview deployments.
      detectSessionInUrl: false,
    },
  })

  return client
}

/**
 * Test seam. Allows a test to inject a stub client, or to reset between tests.
 * Never called by application code.
 */
export function __setSupabaseClientForTests(next: SupabaseClient<Database> | null) {
  client = next
}
