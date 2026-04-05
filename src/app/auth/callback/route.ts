import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * /auth/callback — server-side PKCE code exchange
 *
 * With flowType: 'pkce' on the browser client, Google OAuth redirects back
 * with ?code= in the URL (not #access_token= in the hash).
 * This route handler runs on the server, exchanges the code for a session,
 * and stores the session in HTTP-only cookies that the middleware can read.
 *
 * This is why the loop was happening before: the old client-side page
 * stored tokens in localStorage only — invisible to server-side middleware.
 */
export async function GET(request: NextRequest) {
  const url  = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/dashboard'

  // Canonicalize the site origin — always use the real production domain,
  // not url.origin which can be a Vercel preview URL.
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
              )
            } catch {
              // Called from Server Component — middleware handles cookie refresh
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session is now in cookies — middleware will see it and allow access
      const safeNext = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(`${siteUrl}${safeNext}`)
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
  }

  // No code or exchange failed → back to login
  return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
}
