import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // No custom auth config — use Supabase defaults which handle
    // both implicit (OAuth hash) and PKCE (email) correctly
  )
}

export const supabase = createClient()
