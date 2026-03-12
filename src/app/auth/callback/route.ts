import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`)
    }

    if (!data.user) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
    }

    // Check role from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role || 'audience'
    
    if (role === 'admin') return NextResponse.redirect(`${origin}/admin`)
    if (role === 'host') return NextResponse.redirect(`${origin}/host`)
    return NextResponse.redirect(`${origin}/dashboard`)

  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
  }
}
