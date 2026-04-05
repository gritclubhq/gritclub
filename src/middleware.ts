import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED = ['/dashboard', '/host', '/admin', '/onboarding']
const AUTH_ONLY  = ['/auth/login']

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
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (user && AUTH_ONLY.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // CRITICAL: auth/callback MUST be excluded — it sets session cookies itself.
    // If middleware runs on this path before cookies are written, it sees no session.
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|logo\\.png|hero-bg|hero-meeting|hero-aerial|api/stripe|auth/callback).*)',
  ],
}
