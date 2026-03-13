'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        supabase.from('users').select('role').eq('id', session.user.id).single().then(({ data }) => {
          if (data?.role === 'admin') router.push('/admin')
          else if (data?.role === 'host') router.push('/host')
          else router.push('/dashboard')
        })
      }
    })
  }, [router])

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const handleMagicLink = async () => {
    if (!email) return
    setLoading(true)
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            🎙️
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>
            Grit<span style={{ color: '#FFD700' }}>Club</span>
          </div>
          <div style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>Join 2,400+ founders</div>
        </div>

        {/* Card */}
        <div style={{ background: '#1E293B', borderRadius: '16px', padding: '32px', border: '1px solid #334155' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
            Sign in to GritClub
          </h2>

          {/* Google Button - Twitch style */}
          <button
            onClick={handleGoogle}
            style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: '600', color: '#1E293B', marginBottom: '20px', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
            <span style={{ color: '#475569', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
          </div>

          {/* Magic Link */}
          {!sent ? (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '13px 16px', borderRadius: '8px', background: '#0F172A', border: '1px solid #334155', color: 'white', fontSize: '15px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleMagicLink}
                disabled={loading || !email}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#38BDF8', border: 'none', cursor: email ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: '700', color: '#0F172A', opacity: email ? 1 : 0.5, transition: 'opacity 0.2s' }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(56,189,248,0.1)', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📬</div>
              <div style={{ color: '#38BDF8', fontWeight: '600', marginBottom: '4px' }}>Check your email!</div>
              <div style={{ color: '#64748B', fontSize: '13px' }}>Magic link sent to {email}</div>
            </div>
          )}

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '20px', lineHeight: 1.5 }}>
            By signing in, you agree to our{' '}
            <a href="#" style={{ color: '#38BDF8', textDecoration: 'none' }}>Terms</a>
            {' & '}
            <a href="#" style={{ color: '#38BDF8', textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
