import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /auth/callback
 *
 * Exchanges the PKCE ?code= for a session and writes it into cookies
 * on the Response — so the middleware sees the session immediately.
 *
 * Key: We attach cookies to the NextResponse object (NOT next/headers cookies())
 * because in Next.js 14 Route Handlers, next/headers cookies() is read-only.
 */
export async function GET(request: NextRequest) {
  const url  = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin
  const safeNext = next.startsWith('/') ? next : '/dashboard'

  if (!code) {
    console.error('[auth/callback] No code in URL')
    return NextResponse.redirect(`${siteUrl}/auth/login?error=no_code`)
  }

  // Build the redirect response FIRST so we can attach cookies to it
  const response = NextResponse.redirect(`${siteUrl}${safeNext}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // Write cookies directly onto the response object (not next/headers)
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {})
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
  }

  // Cookies are set on response — middleware will see the session on next request
  return response
}
