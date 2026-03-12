'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Mic, Chrome, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F172A' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }}>
            <Mic className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            Grit<span style={{ color: '#FFD700' }}>Club</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Join 2,400+ founders</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: '#38BDF8' }} />
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm">We sent a magic link to <strong>{email}</strong></p>
              <button onClick={() => setSent(false)} className="mt-4 text-sm text-sky-400 hover:text-sky-300">
                Try different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-5">Sign in to GritClub</h2>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:bg-slate-600 disabled:opacity-50"
                style={{ background: '#334155', color: '#E2E8F0' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: '#334155' }} />
                <span className="text-xs text-slate-500">or</span>
                <div className="flex-1 h-px" style={{ background: '#334155' }} />
              </div>

              {/* Magic Link */}
              <form onSubmit={handleMagicLink}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none focus:ring-2 focus:ring-sky-500"
                  style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
                />
                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-sky w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-4">
                By signing in, you agree to our Terms & Privacy Policy
              </p>
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
