'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock } from 'lucide-react'

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
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false) }
      else { setSuccess('Account created! Check your email to verify, then sign in.'); setLoading(false); setMode('signin') }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) { setError(error.message); setLoading(false) }
      // on success, Supabase redirects via auth callback
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#141010',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
    }}>
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(167,141,120,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(110,71,59,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
        {/* Subtle dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(167,141,120,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #6E473B, #A78D78, #E1D4C2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', margin: 0,
            }}>GRITCLUB</h1>
          </Link>
          <p style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 12, color: '#715451', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 8 }}>
            Where ambition meets action
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#291C0E',
          border: '1px solid rgba(167,141,120,0.15)',
          borderRadius: 8, padding: 32,
        }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#1C1410', borderRadius: 6, padding: 4, marginBottom: 24 }}>
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 13, fontWeight: 600,
                  letterSpacing: '0.05em',
                  background: mode === m ? '#A78D78' : 'transparent',
                  color: mode === m ? '#141010' : '#715451',
                  transition: 'all 0.2s',
                }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 700, color: '#E1D4C2',
            textAlign: 'center', marginBottom: 6,
          }}>
            {mode === 'signin' ? 'Welcome back' : 'Join GritClub'}
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 13, color: '#BEB5A9', textAlign: 'center', marginBottom: 24 }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Start your journey today'}
          </p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(143,175,138,0.1)', border: '1px solid rgba(143,175,138,0.25)', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#8FAF8A', margin: 0 }}>{success}</p>
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoad}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px', borderRadius: 6,
              border: '1px solid rgba(167,141,120,0.2)',
              background: 'rgba(167,141,120,0.06)',
              color: '#E1D4C2', cursor: googleLoad ? 'wait' : 'pointer',
              fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 600, fontSize: 14,
              marginBottom: 20, opacity: googleLoad ? 0.7 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,141,120,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(167,141,120,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,141,120,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(167,141,120,0.06)' }}
          >
            {googleLoad ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoad ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(167,141,120,0.15)' }} />
            <span style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 11, color: '#715451', letterSpacing: '0.1em', textTransform: 'uppercase' }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(167,141,120,0.15)' }} />
          </div>

          {/* Email + Password form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#715451', pointerEvents: 'none' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" autoComplete="email"
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', borderRadius: 6,
                  background: '#1C1410', border: '1px solid rgba(167,141,120,0.18)',
                  color: '#E1D4C2', fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(167,141,120,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(167,141,120,0.18)')}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#715451', pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={{
                  width: '100%', padding: '12px 44px 12px 40px', borderRadius: 6,
                  background: '#1C1410', border: '1px solid rgba(167,141,120,0.18)',
                  color: '#E1D4C2', fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(167,141,120,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(167,141,120,0.18)')}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#715451', padding: 2 }}>
                {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>

            <button type="submit" disabled={loading || !email.trim() || !password}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 6, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #6E473B, #A78D78)',
                color: '#141010', fontFamily: "'Outfit', system-ui, sans-serif",
                fontWeight: 800, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
                opacity: loading || !email.trim() || !password ? 0.5 : 1,
                transition: 'all 0.2s', marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <ArrowRight style={{ width: 16, height: 16 }} />}
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signin' && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#715451', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78D78', fontWeight: 600, fontSize: 12 }}>
                Create one free
              </button>
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 11, color: '#715451', marginTop: 24 }}>
          By signing in you agree to our{' '}
          <Link href="/terms" style={{ color: '#A78D78' }}>Terms</Link> and{' '}
          <Link href="/privacy" style={{ color: '#A78D78' }}>Privacy Policy</Link>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
