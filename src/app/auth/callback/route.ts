import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Ensure user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create profile for new user
          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            role: 'audience',
            host_approved: false,
          })
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        const redirectMap: Record<string, string> = {
          admin: '/admin',
          host: '/host',
          audience: '/dashboard',
        }

        return NextResponse.redirect(`${origin}${redirectMap[profile.role] || '/dashboard'}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
