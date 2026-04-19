'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Users, Radio, Globe,
  Check, Loader2, ChevronLeft,
  Clock, MapPin, Share2, Zap, Tag,
  ArrowRight, CheckCircle
} from 'lucide-react'

const C = {
  bg:      '#0B0B0C',
  surface: '#111113',
  card:    '#1A1A1D',
  border:  'rgba(255,255,255,0.07)',
  text:    '#FFFFFF',
  muted:   '#A0A0A8',
  dim:     '#5A5A62',
  red:     '#FF453A',
  redDim:  'rgba(255,69,58,0.12)',
  green:   '#32D74B',
  greenDim:'rgba(50,215,75,0.12)',
  gold:    '#FFD700',
  goldDim: 'rgba(255,215,0,0.1)',
}

const getName  = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'Host'
const fmt      = (cents: number) => cents === 0 ? 'Free' : `$${(cents / 100).toFixed(0)}`
const coalesce = (...vals: any[]) => vals.find(v => v !== null && v !== undefined) || 0

// ── Poster placeholder when no banner ────────────────────────────────────────
function EventPoster({ event }: { event: any }) {
  const isLive = event.status === 'live'
  const isFree = event.is_free || event.price === 0 || !event.price

  if (event.banner_url) {
    return (
      <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: 16, overflow: 'hidden' }}>
        <img src={event.banner_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }

  // Beautiful generated poster when no image
  const catColors: Record<string, string> = {
    'AI & Tech': '#38BDF8', 'SaaS': '#A78BFA', 'FinTech': '#22C55E',
    'Growth': '#FB923C', 'Fundraising': C.gold, 'Product': '#34D399',
    'HealthTech': '#F472B6', 'EdTech': '#60A5FA', 'default': C.red,
  }
  const accent = catColors[event.category || ''] || catColors.default

  return (
    <div style={{
      width: '100%', aspectRatio: '16/7', borderRadius: 16, overflow: 'hidden',
      background: `linear-gradient(135deg, #0F0F12 0%, #1A1A1F 50%, #0F0F12 100%)`,
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${C.border}`,
    }}>
      {/* Glow orb */}
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      {/* Grid lines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      {/* Content */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: accent + '22', border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {isLive ? <Radio style={{ width: 24, height: 24, color: accent }} /> : <Zap style={{ width: 24, height: 24, color: accent }} />}
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: accent, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Syne,sans-serif', marginBottom: 8 }}>
          {isLive ? '● Live Now' : event.category || 'GritClub Event'}
        </p>
        <h2 style={{ fontSize: 'clamp(18px, 4vw, 28px)', fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {event.title}
        </h2>
      </div>
      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
    </div>
  )
}

// ── Success modal ─────────────────────────────────────────────────────────────
function SuccessModal({ event, onClose }: { event: any; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 24, padding: '36px 28px', background: '#111113', border: `1px solid rgba(50,215,75,0.25)`, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.greenDim, border: `2px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle style={{ width: 34, height: 34, color: C.green }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 8, letterSpacing: '-0.02em' }}>
          You're In! 🎉
        </h2>
        <p style={{ fontSize: 14, color: C.muted, fontFamily: 'Inter,sans-serif', lineHeight: 1.65, marginBottom: 6 }}>
          Seat confirmed for
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 28 }}>
          {event?.title}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard/tickets" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14 }}>
              My Tickets
            </button>
          </Link>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: C.green, color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14 }}>
            Done
          </button>
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
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      const { data: ev } = await supabase.from('events').select('*, users(id,full_name,email,photo_url,role)').eq('id', eventId).single()
      setEvent(ev)
      if (u && ev) {
        if (ev.host_id === u.id) { setHasTicket(true) }
        else {
          const { data: ticket } = await supabase.from('tickets').select('id').eq('user_id', u.id).eq('event_id', eventId).maybeSingle()
          setHasTicket(!!ticket)
        }
      }
      setLoading(false)
    })()
  }, [eventId])

  const sendEmail = async (type: string, ticketId: string, amount?: number) => {
    try {
      const { data: prof } = await supabase.from('users').select('full_name').eq('id', user.id).single()
      const host = event?.users || {}
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, to: user.email, data: { eventTitle: event?.title, eventDate: event?.start_time ? new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '', eventTime: event?.start_time ? new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '', hostName: host.full_name || 'GritClub Host', userName: prof?.full_name || user.email?.split('@')[0] || 'there', ticketId, amount, appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://gritclub.live' } }) })
    } catch {}
  }

  const claimFreeTicket = async () => {
    if (!user) { router.push('/auth/login'); return }
    setClaiming(true); setError('')
    try {
      const { data, error: rpcErr } = await supabase.rpc('claim_free_ticket', { p_user_id: user.id, p_event_id: eventId })
      if (rpcErr) throw rpcErr
      const result = data?.[0]
      if (result?.status === 'success' || result?.status === 'already_registered') {
        setHasTicket(true); setShowConfirm(true)
        const { data: ev } = await supabase.from('events').select('*, users(id,full_name,email,photo_url,role)').eq('id', eventId).single()
        if (ev) setEvent(ev)
        sendEmail('free_ticket', result.ticket_id || '')
      } else { setError(result?.message || 'Could not claim ticket') }
    } catch {
      try {
        const { data: ins, error: ie } = await supabase.from('tickets').insert({ user_id: user.id, event_id: eventId, amount: 0, status: 'free', ticket_type: 'general' }).select('id').single()
        if (ie && ie.code !== '23505') throw ie
        setHasTicket(true); setShowConfirm(true)
        sendEmail('free_ticket', ins?.id || '')
      } catch (e: any) { setError('Failed to claim ticket: ' + e.message) }
    }
    setClaiming(false)
  }

  const buyPaidTicket = async () => {
    if (!user) { router.push('/auth/login'); return }
    setClaiming(true); setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, userId: user.id, userEmail: user.email, amount: event.price, eventName: event.title }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Checkout failed') }
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: any) { setError('Payment error: ' + err.message) }
    setClaiming(false)
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <Loader2 style={{ width: 32, height: 32, color: C.red, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, color: C.muted, fontFamily: 'Inter,sans-serif', marginBottom: 12 }}>Event not found</p>
        <Link href="/dashboard" style={{ color: C.red, fontFamily: 'Inter,sans-serif', fontSize: 14 }}>← Back to Discover</Link>
      </div>
    </div>
  )

  const isFree    = event.is_free || event.price === 0 || !event.price
  const isLive    = event.status === 'live'
  const host      = event.users || {}
  const total     = event.capacity || 0
  const sold      = coalesce(event.current_attendees, event.total_sold, 0)
  const spotsLeft = total > 0 ? Math.max(total - sold, 0) : null
  const fillPct   = total > 0 ? Math.round((sold / total) * 100) : 0
  const soldOut   = spotsLeft !== null && spotsLeft === 0

  const eventDate = event.start_time ? new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null
  const eventTime = event.start_time ? new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 680px) { .ev-grid { grid-template-columns: 1fr !important; } .ev-sticky { position: static !important; } }
      `}</style>
      {showConfirm && <SuccessModal event={event} onClose={() => setShowConfirm(false)} />}

      {/* Nav bar */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, background: C.surface, position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontFamily: 'Inter,sans-serif', fontSize: 14, padding: '5px 8px', borderRadius: 8, transition: 'color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = C.text)} onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back
        </button>
        <span style={{ color: C.dim }}>·</span>
        <span style={{ fontSize: 14, color: C.muted, fontFamily: 'Inter,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{event.title}</span>
        {isLive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: C.redDim, color: C.red, fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'pulse 1s infinite' }} /> LIVE
          </span>
        )}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 16px 60px' }}>
        <div className="ev-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Poster / banner — always shows something */}
            <EventPoster event={event} />

            {/* Title + badges */}
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {isFree && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: C.greenDim, color: C.green, fontFamily: 'Syne,sans-serif' }}>FREE</span>}
                {event.category && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: C.muted, fontFamily: 'Inter,sans-serif' }}>{event.category}</span>}
                {hasTicket && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: C.greenDim, color: C.green, fontFamily: 'Syne,sans-serif' }}><Check style={{ width: 10, height: 10 }} /> Registered</span>}
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 14 }}>{event.title}</h1>
              {event.description && (
                <p style={{ fontSize: 15, color: C.muted, fontFamily: 'Inter,sans-serif', lineHeight: 1.75 }}>{event.description}</p>
              )}
            </div>

            {/* Meta info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                eventDate && { icon: Calendar, label: eventDate, sublabel: eventTime || '' },
                event.location && { icon: MapPin, label: event.location },
                { icon: Globe, label: 'Online Event', sublabel: 'Join from anywhere' },
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: i === 0 ? C.card : 'transparent', borderRadius: 12, border: `1px solid ${i === 0 ? C.border : 'transparent'}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon style={{ width: 16, height: 16, color: C.muted }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: C.text, fontFamily: 'Inter,sans-serif', fontWeight: 500, margin: 0 }}>{item.label}</p>
                    {item.sublabel && <p style={{ fontSize: 12, color: C.dim, fontFamily: 'Inter,sans-serif', margin: 0, marginTop: 1 }}>{item.sublabel}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Host card */}
            <div style={{ padding: '16px', borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: C.red + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: C.red, fontFamily: 'Syne,sans-serif', flexShrink: 0 }}>
                {host.photo_url ? <img src={host.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getName(host).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.dim, fontFamily: 'Inter,sans-serif', marginBottom: 4 }}>Hosted by</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif' }}>{getName(host)}</p>
                <p style={{ fontSize: 12, color: C.muted, fontFamily: 'Inter,sans-serif' }}>Host · GritClub</p>
              </div>
            </div>
          </div>

          {/* ── Right column — Ticket box ── */}
          <div className="ev-sticky" style={{ position: 'sticky', top: 72 }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', background: C.card, border: `1px solid ${isLive ? 'rgba(255,69,58,0.4)' : C.border}`, boxShadow: isLive ? '0 0 40px rgba(255,69,58,0.08)' : 'none' }}>

              {/* Price header */}
              <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.dim, fontFamily: 'Inter,sans-serif', marginBottom: 6 }}>
                  {hasTicket ? 'Your Ticket' : 'Ticket Price'}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <p style={{ fontSize: 36, fontWeight: 800, color: isFree ? C.green : C.gold, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.03em', margin: 0 }}>
                    {isFree ? 'Free' : fmt(event.price || 0)}
                  </p>
                  {!isFree && <span style={{ fontSize: 12, color: C.dim, fontFamily: 'Inter,sans-serif' }}>/ ticket</span>}
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Capacity bar */}
                {total > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.muted, fontFamily: 'Inter,sans-serif' }}>
                        {soldOut ? '🔴 Sold out' : spotsLeft !== null ? `${spotsLeft} of ${total} spots remaining` : 'Open registration'}
                      </span>
                      <span style={{ fontSize: 11, color: C.dim, fontFamily: 'Inter,sans-serif' }}>{fillPct}% full</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(fillPct, 100)}%`, background: soldOut ? C.red : fillPct > 80 ? C.gold : C.green, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: C.redDim, border: '1px solid rgba(255,69,58,0.2)' }}>
                    <p style={{ fontSize: 13, color: C.red, fontFamily: 'Inter,sans-serif', margin: 0 }}>{error}</p>
                  </div>
                )}

                {/* CTA */}
                {hasTicket ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 14, background: C.greenDim, border: `1px solid rgba(50,215,75,0.25)` }}>
                      <CheckCircle style={{ width: 20, height: 20, color: C.green, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: 'Syne,sans-serif', margin: 0 }}>Seat Confirmed ✓</p>
                        <p style={{ fontSize: 11, color: C.dim, fontFamily: 'Inter,sans-serif', margin: 0 }}>You're registered for this event</p>
                      </div>
                    </div>
                    {isLive && (
                      <button onClick={() => router.push(`/live/${eventId}`)}
                        style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: 'pointer', background: C.red, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(255,69,58,0.35)' }}>
                        <Radio style={{ width: 17, height: 17 }} /> Join Live Now →
                      </button>
                    )}
                  </div>
                ) : soldOut ? (
                  <button disabled style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.05)', color: C.dim, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'not-allowed' }}>
                    Sold Out
                  </button>
                ) : isFree ? (
                  <button onClick={claimFreeTicket} disabled={claiming}
                    style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: claiming ? 'wait' : 'pointer', background: `linear-gradient(135deg, ${C.green} 0%, #059669 100%)`, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: claiming ? 0.7 : 1, boxShadow: '0 4px 24px rgba(50,215,75,0.3)', transition: 'opacity .2s' }}>
                    {claiming ? <><Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} /> Confirming...</> : <><Check style={{ width: 17, height: 17 }} /> Confirm Seat — Free</>}
                  </button>
                ) : (
                  <button onClick={buyPaidTicket} disabled={claiming}
                    style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: claiming ? 'wait' : 'pointer', background: `linear-gradient(135deg, ${C.gold} 0%, #F97316 100%)`, color: '#0B0B0C', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: claiming ? 0.7 : 1, boxShadow: '0 4px 24px rgba(255,215,0,0.25)', transition: 'opacity .2s' }}>
                    {claiming ? <><Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} /> Redirecting...</> : <>Get Ticket — {fmt(event.price || 0)} <ArrowRight style={{ width: 16, height: 16 }} /></>}
                  </button>
                )}

                {!hasTicket && !user && (
                  <p style={{ fontSize: 12, color: C.dim, fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>
                    <Link href="/auth/login" style={{ color: C.red, textDecoration: 'none' }}>Sign in</Link> to register
                  </p>
                )}

                {/* Share */}
                <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: copied ? C.green : C.muted, cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 13, transition: 'all .15s' }}>
                  {copied ? <><Check style={{ width: 13, height: 13 }} /> Link copied!</> : <><Share2 style={{ width: 13, height: 13 }} /> Share Event</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
