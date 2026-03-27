'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Loader2, Check, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email,      setEmail]      = useState('')
  const [magicSent,  setMagicSent]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error,      setError]      = useState('')
  const [agreed,     setAgreed]     = useState(false)

  const handleGoogle = async () => {
    if (!agreed) { setError('Please agree to the Terms & Privacy Policy first'); return }
    setGoogleLoad(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: 'offline' } },
    })
    if (error) { setError(error.message); setGoogleLoad(false) }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the Terms & Privacy Policy first'); return }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setMagicSent(true); setLoading(false) }
  }

  if (magicSent) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">Check your email</h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
          We sent a magic link to <strong className="text-foreground">{email}</strong>. Click it to sign in.
        </p>
        <button onClick={() => setMagicSent(false)} className="font-heading text-sm text-primary bg-transparent border-none cursor-pointer hover:underline">
          Use a different email
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <span className="font-display text-3xl font-bold text-gradient-brand tracking-wide">GRITCLUB</span>
          </Link>
          <p className="font-heading text-sm text-muted-foreground tracking-widest uppercase">
            Where ambition meets action
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg p-8 bg-card border border-border">
          <h1 className="font-display text-xl font-bold text-foreground text-center mb-1.5">
            Sign in to GritClub
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-7">
            Join thousands already on their way up
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded bg-destructive/8 border border-destructive/20">
              <p className="font-body text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded border border-border bg-secondary/30 text-foreground font-heading font-semibold text-sm hover:border-primary/40 hover:bg-secondary/50 transition-all duration-200 mb-5 disabled:opacity-60 cursor-pointer"
          >
            {googleLoad ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
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
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="font-heading text-xs text-muted-foreground">or use email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Magic Link form */}
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 rounded bg-secondary/40 border border-border text-foreground font-body text-sm outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded bg-gradient-brand text-primary-foreground font-heading font-bold text-sm tracking-wider uppercase hover:shadow-brand transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          {/* Terms */}
          <div
            className={`flex items-start gap-2.5 mt-5 p-3.5 rounded cursor-pointer bg-secondary/20 border transition-colors ${agreed ? 'border-primary/40' : 'border-border'}`}
            onClick={() => setAgreed(!agreed)}
          >
            <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${agreed ? 'bg-primary border-primary' : 'border-muted-foreground bg-transparent'}`}>
              {agreed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
            </div>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              I agree to GritClub&apos;s{' '}
              <Link href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>

        <p className="text-center font-body text-xs text-muted-foreground mt-6">
          © 2026 GritClub · Hosts keep 80%
        </p>
      </div>
    </div>
  )
}
