import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that need a logged-in user
const PROTECTED = ['/dashboard', '/host', '/admin', '/onboarding']
// Routes only for logged-out users
const AUTH_ONLY  = ['/auth/login']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT server-side AND refreshes the session cookie
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Logged-in user hitting login page → send to dashboard
  if (user && AUTH_ONLY.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Logged-out user hitting protected route → send to login
  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT static files and Stripe webhooks
    // NOTE: Do NOT exclude /auth/callback — middleware must run there
    // so the session cookie gets set after the client processes the OAuth hash
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|logo\\.png|hero-bg|hero-meeting|hero-aerial|api/stripe).*)',
  ],
}
