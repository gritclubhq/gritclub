'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock } from 'lucide-react'

const C = {
  bg:        '#0B0B0C',
  card:      '#141416',
  surface:   '#1C1C1E',
  border:    'rgba(255,255,255,0.07)',
  borderFocus:'rgba(255,77,45,0.4)',
  text:      '#F5F5F5',
  textMuted: '#B0A8A3',
  textDim:   '#8A817C',
  ember:     '#FF4D2D',
  emberDim:  'rgba(255,77,45,0.1)',
  copper:    '#C24E2A',
  red:       '#EF4444',
  green:     '#6B9E6B',
  fontSora: "'Sora', system-ui, sans-serif",
  fontInter: "'Inter', system-ui, sans-serif",
}

export default function LoginPage() {
  const [mode,       setMode]       = useState<'signin' | 'signup'>('signin')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const handleGoogle = async () => {
    setGoogleLoad(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: 'offline' } },
    })
    if (error) { setError(error.message); setGoogleLoad(false) }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false) }
      else { setSuccess('Account created. Check your email to verify, then sign in.'); setLoading(false); setMode('signin') }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      })
      if (error) { setError(error.message); setLoading(false) }
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 12px 11px 40px', borderRadius: 8,
    background: C.surface, border: `1px solid ${C.border}`,
    color: C.text, fontFamily: C.fontInter, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
      fontFamily: C.fontInter,
    }}>
      {/* Ambient ember glow — top center */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 480, height: 300,
        background: 'radial-gradient(ellipse, rgba(255,77,45,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Dot grid — subtle depth */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontFamily: C.fontSora, fontSize: 32, fontWeight: 800,
              letterSpacing: '-0.03em', color: C.text, margin: 0,
              lineHeight: 1,
            }}>
              GRIT<span style={{ color: C.ember }}>CLUB</span>
            </h1>
          </Link>
          <p style={{
            fontFamily: C.fontInter, fontSize: 12, color: C.textDim,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8,
          }}>
            Where ambition meets action
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}>

          {/* Mode toggle */}
          <div style={{
            display: 'flex', background: C.bg,
            borderRadius: 8, padding: 3, marginBottom: 24,
            border: `1px solid ${C.border}`,
          }}>
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 6, border: 'none',
                  cursor: 'pointer', fontFamily: C.fontSora, fontSize: 13,
                  fontWeight: mode === m ? 600 : 400, letterSpacing: '-0.01em',
                  background: mode === m ? C.ember : 'transparent',
                  color:      mode === m ? '#fff' : C.textDim,
                  transition: 'all 0.2s',
                }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 style={{
            fontFamily: C.fontSora, fontSize: 20, fontWeight: 700,
            color: C.text, textAlign: 'center', marginBottom: 4,
            letterSpacing: '-0.02em',
          }}>
            {mode === 'signin' ? 'Welcome back' : 'Join GritClub'}
          </h2>
          <p style={{
            fontFamily: C.fontInter, fontSize: 13, color: C.textDim,
            textAlign: 'center', marginBottom: 22,
          }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Start your journey today'}
          </p>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 13px', borderRadius: 7, marginBottom: 14,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
            }}>
              <p style={{ fontSize: 13, color: C.red, margin: 0, fontFamily: C.fontInter }}>{error}</p>
            </div>
          )}
          {/* Success */}
          {success && (
            <div style={{
              padding: '10px 13px', borderRadius: 7, marginBottom: 14,
              background: 'rgba(107,158,107,0.08)', border: '1px solid rgba(107,158,107,0.2)',
            }}>
              <p style={{ fontSize: 13, color: C.green, margin: 0, fontFamily: C.fontInter }}>{success}</p>
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoad}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px', borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface, color: C.text,
              cursor: googleLoad ? 'wait' : 'pointer',
              fontFamily: C.fontInter, fontWeight: 500, fontSize: 14,
              marginBottom: 18, opacity: googleLoad ? 0.65 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.background = '#222224' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.background = C.surface }}
          >
            {googleLoad ? <Loader2 style={{ width: 17, height: 17, animation: 'spin 0.8s linear infinite' }} /> : (
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoad ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontFamily: C.fontInter, fontSize: 11, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              or email
            </span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.textDim, pointerEvents: 'none' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" autoComplete="email"
                style={inp}
                onFocus={e => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = '0 0 0 3px rgba(255,77,45,0.07)' }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.textDim, pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create password (min 6 chars)' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={{ ...inp, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = '0 0 0 3px rgba(255,77,45,0.07)' }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 3,
                display: 'flex', alignItems: 'center',
              }}>
                {showPass ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || !email.trim() || !password}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 8, border: 'none',
                cursor: loading || !email.trim() || !password ? 'not-allowed' : 'pointer',
                background: `linear-gradient(135deg, ${C.copper}, ${C.ember})`,
                color: '#fff', fontFamily: C.fontSora,
                fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em',
                opacity: loading || !email.trim() || !password ? 0.45 : 1,
                transition: 'all 0.2s', marginTop: 2,
                boxShadow: loading || !email.trim() || !password ? 'none' : '0 0 0 0 rgba(255,77,45,0)',
              }}
              onMouseEnter={e => { if (!loading && email.trim() && password) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 14px rgba(255,77,45,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              {loading
                ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 0.8s linear infinite' }} />
                : <ArrowRight style={{ width: 15, height: 15 }} />
              }
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signin' && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.textDim, fontFamily: C.fontInter }}>
              No account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ember, fontWeight: 500, fontSize: 12, fontFamily: C.fontInter }}>
                Create one free →
              </button>
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: C.fontInter, fontSize: 11, color: C.textDim, marginTop: 20, lineHeight: 1.6 }}>
          By signing in you agree to our{' '}
          <Link href="/terms" style={{ color: C.textMuted, textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: C.textMuted, textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
