import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  if (!raw.startsWith('/')) return '/dashboard'
  if (ALLOWED_NEXT_PREFIXES.some(p => raw.startsWith(p))) return raw
  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const url  = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))

  // CRITICAL FIX: Always use the canonical production URL.
  // NEVER use url.origin — on Vercel preview deployments url.origin
  // can be a .vercel.app URL that is NOT listed in Supabase's allowed
  // redirect URLs, causing Supabase to reject the exchange → auth_failed.
  //
  // Set NEXT_PUBLIC_APP_URL=https://gritclub.live in Vercel env vars.
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live'

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
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context — cookies set via middleware
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session set successfully — send to app
      return NextResponse.redirect(`${siteUrl}${next}`)
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
  }

  // No code param or exchange failed
  return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
}
