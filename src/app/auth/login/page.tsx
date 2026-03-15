'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react'

const C = {
  bg:      '#0A0F1E',
  card:    '#111827',
  border:  'rgba(255,255,255,0.08)',
  text:    '#F0F4FF',
  muted:   '#7B8DB0',
  dim:     '#3D4F6E',
  blue:    '#2563EB',
  blueL:   '#3B82F6',
  gold:    '#F59E0B',
  red:     '#EF4444',
}

export default function LoginPage() {
  const [email,       setEmail]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [googleLoad,  setGoogleLoad]  = useState(false)
  const [sent,        setSent]        = useState(false)
  const [error,       setError]       = useState('')
  const [agreed,      setAgreed]      = useState(false)

  const handleGoogle = async () => {
    if (!agreed) { setError('Please agree to the Terms & Privacy Policy first'); return }
    setGoogleLoad(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) { setError(error.message); setGoogleLoad(false) }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the Terms & Privacy Policy first'); return }
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: C.bg }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}>
            {/* GritClub G icon */}
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff' }}>G</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Grit<span style={{ color: C.gold }}>Club</span>
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: C.muted }}>
            Join 2,400+ founders building the future
          </p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: C.text, textAlign: 'center', marginBottom: 20 }}>
            Sign in to GritClub
          </h2>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle style={{ width: 48, height: 48, color: '#10B981', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>
                Check your email!
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                We sent a magic link to<br />
                <strong style={{ color: C.text }}>{email}</strong>
              </p>
              <button onClick={() => setSent(false)}
                style={{ marginTop: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.blueL, background: 'none', border: 'none', cursor: 'pointer' }}>
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoad}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '13px 16px', borderRadius: 12, cursor: googleLoad ? 'not-allowed' : 'pointer',
                  background: '#fff', color: '#1F2937', border: 'none',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15,
                  opacity: googleLoad ? 0.7 : 1, transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { if (!googleLoad) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)' }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
              >
                {googleLoad ? (
                  <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.dim }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* Magic link */}
              <form onSubmit={handleMagicLink}>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: C.dim }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="your@email.com"
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                      color: C.text, fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                  }}
                >
                  {loading ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Magic Link'}
                </button>
              </form>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle style={{ width: 14, height: 14, color: C.red, flexShrink: 0 }} />
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.red }}>{error}</p>
                </div>
              )}
            </>
          )}

          {/* Terms checkbox */}
          {!sent && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setAgreed(p => !p)}
                style={{
                  width: 18, height: 18, borderRadius: 5, border: `2px solid ${agreed ? C.blue : C.border}`,
                  background: agreed ? C.blue : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, cursor: 'pointer', marginTop: 1, transition: 'all 0.15s',
                }}
              >
                {agreed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                By signing in, you agree to our{' '}
                <Link href="/terms" style={{ color: C.blueL, textDecoration: 'none' }}>Terms of Service</Link>
                {' '}&amp;{' '}
                <Link href="/privacy" style={{ color: C.blueL, textDecoration: 'none' }}>Privacy Policy</Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.dim }}>
          © 2026 GritClub · Built for founders
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: ${C.dim}; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #111827 inset !important; -webkit-text-fill-color: ${C.text} !important; }
      `}</style>
    </div>
  )
}
