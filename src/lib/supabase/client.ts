import { createBrowserClient } from '@supabase/ssr'

// PKCE flow: Google OAuth returns ?code= in the URL (not #access_token= in hash)
// The server route /auth/callback exchanges code → session → writes to cookies
// Middleware reads those cookies to authenticate requests — no more redirect loop
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
)
