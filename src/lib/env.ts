/**
 * Reads and validates Supabase configuration from Vite environment variables.
 *
 * The frontend only ever receives the publishable anon key. That key is not a secret:
 * it ships to every visitor and is safe to expose, because Row Level Security decides
 * what that key is actually allowed to do. The service role key must never appear in
 * this project.
 */

const SUPABASE_URL_KEY = 'VITE_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'VITE_SUPABASE_ANON_KEY'

function readEnv(key: string): string {
  const value = import.meta.env[key]
  if (typeof value !== 'string' || value.trim() === '') {
    // Failing here at startup is deliberate. A confusing Supabase network error later
    // is much harder to diagnose than a clear message on the first render.
    throw new Error(
      `Missing environment variable: ${key}. Copy .env.example to .env and fill in your Supabase project values.`,
    )
  }
  return value.trim()
}

export type SupabaseConfig = {
  url: string
  anonKey: string
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: readEnv(SUPABASE_URL_KEY),
    anonKey: readEnv(SUPABASE_ANON_KEY),
  }
}

/**
 * Reports whether configuration is present, without throwing. Used by the app shell to
 * show a setup notice instead of crashing when `.env` has not been filled in yet.
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env[SUPABASE_URL_KEY]
  const key = import.meta.env[SUPABASE_ANON_KEY]
  return typeof url === 'string' && url.trim() !== '' && typeof key === 'string' && key.trim() !== ''
}
