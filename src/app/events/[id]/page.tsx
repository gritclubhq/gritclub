'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Users, Radio, Lock, Globe,
  Check, Loader2, ChevronLeft, Tag,
  Clock, MapPin, Zap, Crown, Share2
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)',
  text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
}

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'Host'
const fmt = (cents: number) => cents === 0 ? 'Free' : `$${(cents/100).toFixed(0)}`

function ConfirmModal({ event, onClose }: { event: any; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:400, margin:'0 16px', borderRadius:24, padding:28, background:C.card, border:`1px solid ${C.greenDim}`, boxShadow:'0 20px 60px rgba(16,185,129,0.15)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:C.greenDim, border:`2px solid ${C.green}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Check style={{ width:30, height:30, color:C.green }} />
          </div>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:8 }}>Seat Confirmed! 🎉</h2>
          <p style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', lineHeight:1.6, marginBottom:20 }}>
            You're registered for <strong style={{ color:C.text }}>{event?.title}</strong>. See you there!
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <Link href="/dashboard/tickets" style={{ flex:1, textDecoration:'none' }}>
              <button style={{ width:'100%', padding:'11px', borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, color:C.textMuted, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14 }}>
                My Tickets
              </button>
            </Link>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:C.green, color:'#fff', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14 }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const { id }  = useParams()
  const router  = useRouter()
  const eventId = id as string

  const [event,       setEvent]       = useState<any>(null)
  const [user,        setUser]        = useState<any>(null)
  const [hasTicket,   setHasTicket]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [claiming,    setClaiming]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: ev } = await supabase
        .from('events')
        .select('*, users(id, full_name, email, photo_url, role)')
        .eq('id', eventId)
        .single()
      setEvent(ev)

      if (u && ev) {
        if (isHostUser) {
          setHasTicket(true)
        } else {
          const { data: ticket } = await supabase
            .from('tickets')
            .select('id')
            .eq('user_id', u.id)
            .eq('event_id', eventId)
            .maybeSingle()
          setHasTicket(!!ticket)
        }
      }
      setLoading(false)
    }
    init()
  }, [eventId])

  // ── Send confirmation email (fire-and-forget, never blocks UI) ──
  const sendConfirmationEmail = async (type: 'free_ticket' | 'paid_ticket', ticketId: string, amount?: number) => {
    try {
      const { data: prof } = await supabase.from('users').select('full_name').eq('id', user.id).single()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live'
      const host   = event?.users || {}

      await fetch('/api/email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          to:   user.email,
          data: {
            eventTitle: event?.title || '',
            eventDate:  event?.start_time ? new Date(event.start_time).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) : '',
            eventTime:  event?.start_time ? new Date(event.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) : '',
            hostName:   host.full_name || host.email?.split('@')[0] || 'GritClub Host',
            userName:   prof?.full_name || user.email?.split('@')[0] || 'there',
            ticketId,
            amount,
            appUrl,
          },
        }),
      })
    } catch (e) {
      // Email is non-critical — log but never break the ticket flow
      console.warn('Email send failed (non-critical):', e)
    }
  }

  const claimFreeTicket = async () => {
    if (!user) { router.push('/auth/login'); return }
    setClaiming(true); setError('')
    try {
      const { data, error: rpcErr } = await supabase.rpc('claim_free_ticket', {
        p_user_id:  user.id,
        p_event_id: eventId,
      })
      if (rpcErr) throw rpcErr
      const result = data?.[0]
      if (result?.status === 'success' || result?.status === 'already_registered') {
        setHasTicket(true)
        setShowConfirm(true)
        // Refresh event to update seat count
        const { data: ev } = await supabase.from('events').select('*, users(id, full_name, email, photo_url, role)').eq('id', eventId).single()
        if (ev) setEvent(ev)
        // Send confirmation email (non-blocking)
        sendConfirmationEmail('free_ticket', result.ticket_id || '')
      } else {
        setError(result?.message || 'Could not claim ticket')
      }
    } catch (err: any) {
      // Fallback: direct insert if RPC not available
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('tickets')
          .insert({ user_id: user.id, event_id: eventId, amount: 0, status: 'free', ticket_type: 'general' })
          .select('id')
          .single()
        if (insertErr && insertErr.code !== '23505') throw insertErr
        setHasTicket(true)
        setShowConfirm(true)
        // Send confirmation email (non-blocking)
        sendConfirmationEmail('free_ticket', inserted?.id || '')
      } catch (e: any) {
        setError('Failed to claim ticket: ' + e.message)
      }
    }
    setClaiming(false)
  }

  const buyPaidTicket = async () => {
    if (!user) { router.push('/auth/login'); return }
    setClaiming(true); setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          userId:    user.id,
          userEmail: user.email,
          amount:    event.price,
          eventName: event.title,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Checkout failed')
      }
      const { url } = await res.json()
      // Note: paid ticket email is sent from Stripe webhook after payment succeeds
      // See src/app/api/stripe/webhook/route.ts
      if (url) window.location.href = url
    } catch (err: any) {
      setError('Payment error: ' + err.message)
    }
    setClaiming(false)
  }

  const joinLive = () => { router.push(`/live/${eventId}`) }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
      <Loader2 style={{ width:32, height:32, color:C.blueLight, animation:'spin 1s linear infinite' }} />
    </div>
  )

  if (!event) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:18, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Event not found</p>
        <Link href="/dashboard" style={{ color:C.blueLight }}>← Back to Discover</Link>
      </div>
    </div>
  )

  const isFree     = event.is_free || event.price === 0 || !event.price
  const isLive     = event.status === 'live'
  const host       = event.users || {}
  const fillPct    = event.capacity > 0 ? Math.round((COALESCE(event.current_attendees, event.total_sold, 0) / event.capacity) * 100) : 0
  const spotsLeft  = event.capacity > 0 ? Math.max(event.capacity - (event.current_attendees || event.total_sold || 0), 0) : null
  const soldOut    = spotsLeft !== null && spotsLeft === 0

  function COALESCE(...vals: any[]) { return vals.find(v => v !== null && v !== undefined) || 0 }

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {showConfirm && <ConfirmModal event={event} onClose={() => setShowConfirm(false)} />}

      {/* Nav */}
      <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.back()} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:14 }}>
          <ChevronLeft style={{ width:16, height:16 }} /> Back
        </button>
        <span style={{ color:C.textDim }}>·</span>
        <span style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event.title}</span>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 16px' }}>
        <style>{`
          @media (max-width: 640px) {
            .event-grid { grid-template-columns: 1fr !important; }
            .event-ticket-panel { position: static !important; width: 100% !important; }
          }
        `}</style>
        <div className="event-grid" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'start' }}>

          {/* Left — Event details */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Banner */}
            {event.banner_url && (
              <div style={{ borderRadius:20, overflow:'hidden', aspectRatio:'16/7' }}>
                <img src={event.banner_url} alt={event.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}

            {/* Title + badges */}
            <div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                {isLive && (
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:20, background:C.redDim, color:C.red }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:C.red, animation:'pulse 1s infinite' }} /> LIVE NOW
                  </span>
                )}
                {isFree && (
                  <span style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:20, background:C.greenDim, color:C.green }}>FREE</span>
                )}
                {event.category && (
                  <span style={{ fontSize:12, padding:'4px 10px', borderRadius:20, background:C.blueDim, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>{event.category}</span>
                )}
              </div>
              <h1 style={{ fontSize:'clamp(20px, 5vw, 28px)', fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em', marginBottom:12 }}>{event.title}</h1>
              {event.description && (
                <p style={{ fontSize:15, color:C.textMuted, fontFamily:'DM Sans,sans-serif', lineHeight:1.75 }}>{event.description}</p>
              )}
            </div>

            {/* Event meta */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                event.start_time && { icon: Calendar, label: new Date(event.start_time).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) },
                event.start_time && { icon: Clock,    label: new Date(event.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) },
                event.location   && { icon: MapPin,   label: event.location },
                { icon: Globe, label: 'Online Event · Join from anywhere' },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <item.icon style={{ width:16, height:16, color:C.blueLight, flexShrink:0 }} />
                  <span style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Host */}
            <div style={{ padding:16, borderRadius:16, background:C.card, border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:12 }}>Hosted by</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', background:avatarColor(host.id||'')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:avatarColor(host.id||''), fontFamily:'Syne,sans-serif', flexShrink:0 }}>
                  {host.photo_url ? <img src={host.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getName(host).slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif' }}>{getName(host)}</p>
                  <p style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Host · GritClub</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Ticket box */}
          <div className="event-ticket-panel" style={{ position:'sticky', top:24 }}>
            <div style={{ borderRadius:20, padding:20, background:C.card, border:`1px solid ${isLive?'rgba(239,68,68,0.3)':C.border}`, display:'flex', flexDirection:'column', gap:16 }}>

              {/* Price */}
              <div>
                <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:6 }}>
                  {hasTicket ? 'Your Ticket' : 'Ticket Price'}
                </p>
                <p style={{ fontSize:32, fontWeight:800, color:isFree?C.green:C.gold, fontFamily:'Syne,sans-serif', letterSpacing:'-0.03em' }}>
                  {isFree ? 'Free' : fmt(event.price || 0)}
                </p>
                {!isFree && <p style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginTop:2 }}>per ticket · secure payment</p>}
              </div>

              {/* Capacity bar */}
              {event.capacity > 0 && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
                      {soldOut ? 'Sold out' : spotsLeft !== null ? `${spotsLeft} spots left` : 'Open registration'}
                    </span>
                    <span style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>{fillPct}% full</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, width:`${Math.min(fillPct,100)}%`, background:soldOut?C.red:fillPct>80?C.gold:`linear-gradient(to right, ${C.blue}, ${C.blueLight})`, transition:'width 0.3s' }} />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding:'10px 12px', borderRadius:10, background:C.redDim, border:'1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ fontSize:13, color:C.red, fontFamily:'DM Sans,sans-serif' }}>{error}</p>
                </div>
              )}

              {/* CTA button */}
              {hasTicket ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderRadius:12, background:C.greenDim, border:`1px solid rgba(16,185,129,0.3)` }}>
                    <Check style={{ width:18, height:18, color:C.green }} />
                    <span style={{ fontSize:14, fontWeight:700, color:C.green, fontFamily:'DM Sans,sans-serif' }}>Seat Confirmed ✓</span>
                  </div>
                  {isLive && (
                    <button onClick={joinLive}
                      style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', cursor:'pointer', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <Radio style={{ width:18, height:18 }} /> Join Live Now →
                    </button>
                  )}
                </div>
              ) : soldOut ? (
                <button disabled style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:C.border, color:C.textDim, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:16, cursor:'not-allowed' }}>
                  Sold Out
                </button>
              ) : isFree ? (
                <button onClick={claimFreeTicket} disabled={claiming}
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', cursor:claiming?'wait':'pointer', background:`linear-gradient(135deg, ${C.green}, #059669)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:claiming?0.7:1, boxShadow:'0 4px 20px rgba(16,185,129,0.3)' }}>
                  {claiming ? <><Loader2 style={{ width:18, height:18, animation:'spin 1s linear infinite' }} /> Confirming...</> : <><Check style={{ width:18, height:18 }} /> Confirm Seat — Free</>}
                </button>
              ) : (
                <button onClick={buyPaidTicket} disabled={claiming}
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', cursor:claiming?'wait':'pointer', background:`linear-gradient(135deg, ${C.gold}, #F97316)`, color:'#0A0F1E', fontFamily:'DM Sans,sans-serif', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:claiming?0.7:1, boxShadow:'0 4px 20px rgba(245,158,11,0.3)' }}>
                  {claiming ? <><Loader2 style={{ width:18, height:18, animation:'spin 1s linear infinite' }} /> Redirecting...</> : <>Get Ticket — {fmt(event.price || 0)}</>}
                </button>
              )}

              {!hasTicket && !user && (
                <p style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif', textAlign:'center' }}>
                  <Link href="/auth/login" style={{ color:C.blueLight }}>Sign in</Link> to register
                </p>
              )}

              {/* Share */}
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:13 }}>
                <Share2 style={{ width:14, height:14 }} /> Share Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
