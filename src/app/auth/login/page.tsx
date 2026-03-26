'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Loader2, Check, ArrowRight, Chrome } from 'lucide-react'

const C = {
  bg:'#070B14', card:'#0F1A2E', surface:'#0D1420',
  border:'rgba(255,255,255,0.07)', borderFocus:'rgba(255,59,59,0.5)',
  text:'#E8EAF0', textMuted:'#8A9BBF', textDim:'#3D4F6E',
  red:'#FF3B3B', redLight:'#FF5555', redDim:'rgba(255,59,59,0.12)',
  gold:'#FFD700', goldDim:'rgba(255,215,0,0.10)',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
}

export default function LoginPage() {
  const [email,       setEmail]       = useState('')
  const [magicSent,   setMagicSent]   = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [googleLoad,  setGoogleLoad]  = useState(false)
  const [error,       setError]       = useState('')
  const [agreed,      setAgreed]      = useState(false)

  const handleGoogle = async () => {
    if (!agreed) { setError('Please agree to the Terms & Privacy Policy first'); return }
    setGoogleLoad(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
        },
      },
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
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400, textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,59,59,0.12)', border:'2px solid rgba(255,59,59,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
          <Mail style={{ width:28, height:28, color:C.red }} />
        </div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:10 }}>Check your email</h2>
        <p style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', lineHeight:1.7, marginBottom:20 }}>
          We sent a magic link to <strong style={{ color:C.text }}>{email}</strong>. Click it to sign in.
        </p>
        <button onClick={() => setMagicSent(false)}
          style={{ fontSize:13, color:C.blueLight, background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          Use a different email
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' }}>
      {/* Background grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,59,59,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,59,0.04) 1px, transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }} />
      {/* Red glow top */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'600px', height:'300px', background:'radial-gradient(ellipse, rgba(255,59,59,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ width:'100%', maxWidth:420, position:'relative' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, background:'#FF3B3B', clipPath:'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'#fff' }}>G</div>
            <span style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em' }}>
              GRIT<span style={{ color:'#FF3B3B' }}>CLUB</span>
            </span>
          </div>
          <p style={{ fontSize:15, color:C.textMuted, fontFamily:'DM Sans,sans-serif', margin:0 }}>
            Where high-performers level up
          </p>
        </div>

        {/* Card */}
        <div style={{ borderRadius:24, padding:32, background:C.card, border:`1px solid ${C.border}` }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', textAlign:'center', marginBottom:6 }}>
            Sign in to GritClub
          </h1>
          <p style={{ fontSize:13, color:C.textDim, fontFamily:'DM Sans,sans-serif', textAlign:'center', marginBottom:28 }}>
            Join thousands of high-performers already inside
          </p>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
              <p style={{ fontSize:13, color:'#EF4444', fontFamily:'DM Sans,sans-serif', margin:0 }}>{error}</p>
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoad}
            style={{ width:'100%', padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, cursor:googleLoad?'wait':'pointer', background:C.surface, color:C.text, fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20, opacity:googleLoad?0.7:1, transition:'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='rgba(255,59,59,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor=C.border}>
            {googleLoad ? (
              <Loader2 style={{ width:18, height:18, animation:'spin 1s linear infinite' }} />
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
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>or use email</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          {/* Magic Link */}
          <form onSubmit={handleMagicLink} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ position:'relative' }}>
              <Mail style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:C.textDim }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width:'100%', padding:'13px 14px 13px 42px', borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }}
                onFocus={e => (e.target.style.borderColor = C.borderFocus)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>
            <button type="submit" disabled={loading || !email.trim()}
              style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', cursor:loading||!email.trim()?'not-allowed':'pointer', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading||!email.trim()?0.5:1 }}>
              {loading ? <Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }} /> : <ArrowRight style={{ width:16, height:16 }} />}
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          {/* Terms */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginTop:20, padding:'12px 14px', borderRadius:10, background:C.surface, border:`1px solid ${agreed?'rgba(255,59,59,0.3)':C.border}`, cursor:'pointer' }}
            onClick={() => setAgreed(!agreed)}>
            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${agreed?C.red:C.textDim}`, background:agreed?C.red:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
              {agreed && <Check style={{ width:11, height:11, color:'#fff' }} />}
            </div>
            <p style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif', lineHeight:1.5, margin:0 }}>
              I agree to GritClub's{' '}
              <Link href="/terms" target="_blank" style={{ color:C.redLight, textDecoration:'none' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" style={{ color:C.redLight, textDecoration:'none' }}>Privacy Policy</Link>
            </p>
          </div>
        </div>

        {/* Fix note for Google branding */}
        <p style={{ textAlign:'center', fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginTop:20 }}>
          © 2026 GritClub · Where high-performers level up
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
