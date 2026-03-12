import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Exchange error:', error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${error.message}`)
    }

    if (!data.user) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role || 'audience'

    if (role === 'admin') return NextResponse.redirect(`${origin}/admin`)
    if (role === 'host') return NextResponse.redirect(`${origin}/host`)
    return NextResponse.redirect(`${origin}/dashboard`)

  } catch (err: any) {
    console.error('Callback error:', err)
    return NextResponse.redirect(`${origin}/auth/login?error=${err.message}`)
  }
}
