import { createBrowserClient } from '@supabase/ssr'

// PKCE flow: OAuth returns ?code= in URL (not #access_token= hash).
// The server-side route handler /auth/callback exchanges the code for a
// session stored in cookies — which the middleware can then read.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
    },
  }
)
