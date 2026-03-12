import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Upsert user profile
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          role: 'audience',
          host_approved: false,
        }, { onConflict: 'id', ignoreDuplicates: true })

        // Get role and redirect
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role || 'audience'
        const redirectMap: Record<string, string> = {
          admin: '/admin',
          host: '/host',
          audience: '/dashboard',
        }

        return NextResponse.redirect(`${origin}${redirectMap[role] || '/dashboard'}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
