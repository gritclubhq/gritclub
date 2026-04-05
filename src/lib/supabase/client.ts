import { createBrowserClient } from '@supabase/ssr'

// Single shared instance — no custom auth options.
// The default Supabase client handles both implicit (OAuth hash) and
// PKCE (email confirmation code) automatically.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
