'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0B0B0C',
  card:        '#121214',
  surface:     '#1C1C1F',
  border:      'rgba(255,255,255,0.08)',
  borderFocus: 'rgba(255,255,255,0.25)',
  text:        '#FFFFFF',
  textMuted:   '#C7C7CC',
  textDim:     '#8A8A8F',
  red:         '#FF453A',
  green:       '#32D74B',
  fs:          "'Sora', system-ui, sans-serif",
  fi:          "'Inter', system-ui, sans-serif",
}

// ── The actual form — needs Suspense because of useSearchParams ──────────────
function LoginForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [mode,       setMode]       = useState<'signin' | 'signup'>('signin')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  // Show error from callback redirect (?error=auth_failed) then clean the URL
  useEffect(() => {
    if (searchParams.get('error')) {
      setError('Sign in failed. Please try again.')
      const clean = new URL(window.location.href)
      clean.searchParams.delete('error')
      window.history.replaceState({}, '', clean.toString())
    }
  }, [searchParams])

  // Redirect on successful auth event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const next = searchParams.get('next') || '/dashboard'
        router.replace(next)
      }
    })
    return () => subscription.unsubscribe()
  }, [router, searchParams])

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoad(true)
    setError('')

    // Use canonical app URL so Supabase always redirects to the registered URL.
    // window.location.origin can differ on Vercel preview deployments.
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const next    = searchParams.get('next')
    const redirectTo = next
      ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
      : `${siteUrl}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoad(false)
    }
    // On success the browser navigates to Google — no further action needed
  }

  // ── Email / Password ──────────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6)        { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
        setPassword('')
      }
      setLoading(false)

    } else {
      // Email + password sign-in — simple, no PKCE needed
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          setError('Incorrect email or password.')
        } else if (msg.includes('email not confirmed')) {
          setError('Please confirm your email before signing in.')
        } else {
          setError('Sign in failed. Please try again.')
        }
        setLoading(false)
      }
      // On success → onAuthStateChange fires above → redirects
    }
  }

  // ── Shared input style ────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px 12px 42px',
    borderRadius: 10,
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontFamily: C.fi,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: C.fi,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dot grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      {/* Subtle top glow */}
      <div style={{
        position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 65%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontFamily: C.fs,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #D0D0D0 0%, #FFFFFF 50%, #B0B0B0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              GRITCLUB
            </h1>
          </Link>
          <p style={{
            fontFamily: C.fi, fontSize: 12, color: C.textDim,
            letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 10,
          }}>
            Build With People Who Refuse Average
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 32,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}>

          {/* Sign in / Sign up toggle */}
          <div style={{
            display: 'flex', background: C.bg, borderRadius: 11,
            padding: 3, marginBottom: 28, border: `1px solid ${C.border}`,
          }}>
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: 9, border: 'none',
                  cursor: 'pointer', fontFamily: C.fs, fontSize: 13, fontWeight: 600,
                  background: mode === m ? C.surface : 'transparent',
                  color: mode === m ? C.text : C.textDim,
                  transition: 'all 0.2s',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 style={{
            fontFamily: C.fs, fontSize: 21, fontWeight: 700,
            color: C.text, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.02em',
          }}>
            {mode === 'signin' ? 'Welcome back' : 'Join GritClub'}
          </h2>
          <p style={{
            fontFamily: C.fi, fontSize: 13, color: C.textDim,
            textAlign: 'center', marginBottom: 26,
          }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Start your journey today'}
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              padding: '11px 14px', borderRadius: 10, marginBottom: 18,
              background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.22)',
            }}>
              <AlertCircle style={{ width: 15, height: 15, color: C.red, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: C.red, margin: 0, fontFamily: C.fi, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              padding: '11px 14px', borderRadius: 10, marginBottom: 18,
              background: 'rgba(50,215,75,0.08)', border: '1px solid rgba(50,215,75,0.22)',
            }}>
              <CheckCircle style={{ width: 15, height: 15, color: C.green, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: C.green, margin: 0, fontFamily: C.fi, lineHeight: 1.5 }}>
                {success}
              </p>
            </div>
          )}

          {/* Google OAuth button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 11, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text,
              cursor: googleLoad ? 'wait' : 'pointer',
              fontFamily: C.fi, fontWeight: 500, fontSize: 14,
              marginBottom: 20, opacity: googleLoad ? 0.6 : 1,
              transition: 'border-color 0.2s, opacity 0.2s',
            }}
            onMouseEnter={e => { if (!googleLoad) (e.currentTarget as HTMLElement).style.borderColor = C.borderFocus }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}
          >
            {googleLoad
              ? <Loader2 style={{ width: 17, height: 17, animation: 'spin 0.8s linear infinite' }} />
              : (
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )
            }
            {googleLoad ? 'Opening Google…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontFamily: C.fi, fontSize: 11, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Email + Password form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail style={{
                position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                width: 15, height: 15, color: C.textDim, pointerEvents: 'none',
              }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                style={inp}
                onFocus={e => {
                  e.target.style.borderColor = C.borderFocus
                  e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.04)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = C.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock style={{
                position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                width: 15, height: 15, color: C.textDim, pointerEvents: 'none',
              }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={{ ...inp, paddingRight: 46 }}
                onFocus={e => {
                  e.target.style.borderColor = C.borderFocus
                  e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.04)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = C.border
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: C.textDim,
                  padding: 4, display: 'flex', alignItems: 'center',
                }}
              >
                {showPass
                  ? <EyeOff style={{ width: 14, height: 14 }} />
                  : <Eye   style={{ width: 14, height: 14 }} />
                }
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 11, border: 'none',
                cursor: loading || !email.trim() || !password ? 'not-allowed' : 'pointer',
                background: loading || !email.trim() || !password ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
                color: '#000000',
                fontFamily: C.fs, fontWeight: 700, fontSize: 14,
                opacity: loading || !email.trim() || !password ? 0.5 : 1,
                transition: 'all 0.2s', marginTop: 4,
              }}
              onMouseEnter={e => {
                if (!loading && email.trim() && password)
                  (e.currentTarget as HTMLElement).style.background = '#E8E8E8'
              }}
              onMouseLeave={e => {
                if (!loading && email.trim() && password)
                  (e.currentTarget as HTMLElement).style.background = '#FFFFFF'
              }}
            >
              {loading
                ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 0.8s linear infinite' }} />
                : <ArrowRight style={{ width: 15, height: 15 }} />
              }
              {loading ? 'Signing in…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Switch mode */}
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: C.textDim, fontFamily: C.fi }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.textMuted, fontWeight: 600, fontSize: 13, fontFamily: C.fi,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}
            >
              {mode === 'signin' ? 'Create one free' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontFamily: C.fi, fontSize: 11, color: C.textDim, marginTop: 24, lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <Link href="/terms"  style={{ color: C.textMuted, textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: C.textMuted, textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #1C1C1F inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
      `}</style>
    </div>
  )
}

// Suspense required because LoginForm uses useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#0B0B0C',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Loader2 style={{ width: 24, height: 24, color: '#6B7280', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
