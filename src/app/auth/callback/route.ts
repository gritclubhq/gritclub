import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle PKCE code exchange (email magic links, email+password confirmation)
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  // For implicit flow OAuth (Google) — Supabase sets session via URL hash client-side
  // Just redirect to dashboard; the client will pick up the session from the hash
  return NextResponse.redirect(`${origin}${next}`)
}
