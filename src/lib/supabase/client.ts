import { createBrowserClient } from '@supabase/ssr'

// Single shared instance for the entire browser session.
// NOTE: Do NOT set flowType: 'pkce' here — PKCE is handled server-side
// in the callback route. Setting it on the browser client breaks
// email/password sign-in (signInWithPassword ignores PKCE but the
// option interferes with session detection and causes "Sign in failed").
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
