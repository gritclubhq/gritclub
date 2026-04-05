import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require a logged-in user
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
        getAll() {
          return request.cookies.getAll()
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
          // Write to request so downstream server components see fresh cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Rebuild response so cookies flow to the browser
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with Supabase servers + refreshes the session
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Already logged in → skip login page
  if (user && AUTH_ONLY.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Not logged in → redirect to login with ?next= so we can come back
  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     *   - Next.js internals (_next/static, _next/image)
     *   - Static public files (favicon, manifest, images, logo)
     *   - Stripe webhook (must not be intercepted)
     * /auth/callback is intentionally NOT excluded so the session cookie
     * gets written to the response before the browser follows the redirect.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|logo\\.png|hero-bg|hero-meeting|hero-aerial|api/stripe).*)',
  ],
}
