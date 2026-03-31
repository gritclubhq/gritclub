import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Use origin from the request URL — always correct regardless of env vars
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Auth exchange error:', error.message)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
