import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const url      = new URL(request.url)
  const code     = url.searchParams.get('code')
  const next     = url.searchParams.get('next') ?? '/dashboard'
  const siteUrl  = process.env.NEXT_PUBLIC_APP_URL ?? url.origin
  const safeNext = next.startsWith('/') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/auth/login?error=no_code`)
  }

  // Build the redirect response BEFORE creating the Supabase client
  // so we can write session cookies directly onto the response
  const response = NextResponse.redirect(`${siteUrl}${safeNext}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
          // Write directly onto the response — this is what middleware will read
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
  }

  return response
}
