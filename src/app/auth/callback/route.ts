import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * OAuth / Email callback handler.
 *
 * Supabase sends the user here after Google OAuth or email confirmation.
 * The URL contains a `code` query param (PKCE flow).
 * We exchange it for a session, set the cookies, and redirect.
 *
 * Security notes:
 * - We validate `next` against an allowlist to prevent open-redirect attacks.
 * - We never expose internal errors to the client.
 */

const ALLOWED_NEXT_PREFIXES = [
  '/dashboard',
  '/host',
  '/admin',
  '/onboarding',
  '/events',
  '/groups',
  '/profile',
]

function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard'
  // Must be a relative path starting with /
  if (!raw.startsWith('/')) return '/dashboard'
  // Must start with one of the allowed prefixes
  if (ALLOWED_NEXT_PREFIXES.some(p => raw.startsWith(p))) return raw
  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const url    = new URL(request.url)
  const code   = url.searchParams.get('code')
  const next   = safeNext(url.searchParams.get('next'))
  const origin = url.origin

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
              // Called from a Server Component — cookies set via middleware instead
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[auth/callback] code exchange failed:', error.message)
  }

  // No code or exchange failed — redirect to login with generic error
  // (never expose the real error to the browser)
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
