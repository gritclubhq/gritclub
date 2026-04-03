import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED = ['/dashboard', '/host', '/admin', '/onboarding', '/groups', '/profile']
const AUTH_ONLY = ['/auth/login']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          // Write to request first, then build a new response with cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates JWT with Supabase AND refreshes session if needed
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Logged-in user hitting login page → send to dashboard
  if (user && AUTH_ONLY.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Logged-out user hitting protected page → send to login
  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // CRITICAL: exclude auth/callback so the PKCE code exchange runs
    // BEFORE any session exists — middleware would block it otherwise
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|logo.png|hero-bg|hero-meeting|hero-aerial|api/stripe|auth/callback).*)',
  ],
}
