'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { Ticket, Calendar, Clock, Radio, Check, Loader2, ExternalLink } from 'lucide-react'

const C = {
  bg:'#070B14', surface:'#0D1420', card:'#0F1A2E',
  border:'rgba(255,255,255,0.06)',
  text:'#E8EAF0', textMuted:'#8A9BBF', textDim:'#8A8A8F',
  blue:'#FF3B3B', blueLight:'#FF5555', blueDim:'rgba(255,59,59,0.12)',
  gold:'#C7C7CC', goldDim:'rgba(255,215,0,0.1)',
  red:'#EF4444', green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
}

const AVATAR_COLORS = ['#FF3B3B','#C7C7CC','#DB2777','#D97706','#059669']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'Host'
const formatDate = (ts: string) => ts ? new Date(ts).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' }) : 'Date TBD'
const formatTime = (ts: string) => ts ? new Date(ts).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) : ''
const fmt = (cents: number) => cents === 0 ? 'Free' : `$${(cents/100).toFixed(0)}`

export default function TicketsPage() {
  const [tickets,  setTickets]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [user,     setUser]     = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setUser(u)

      const { data } = await supabase
        .from('tickets')
        .select(`
          id, status, amount, ticket_type, created_at,
          events (
            id, title, description, start_time, status, banner_url, price, is_free,
            users ( id, full_name, email, photo_url )
          )
        `)
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })

      setTickets(data || [])
      setLoading(false)
    })
  }, [])

  const upcoming = tickets.filter(t => t.events?.status !== 'ended')
  const past     = tickets.filter(t => t.events?.status === 'ended')

  const TicketCard = ({ ticket }: { ticket: any }) => {
    const event  = ticket.events || {}
    const host   = event.users  || {}
    const isLive = event.status === 'live'
    const isFree = ticket.amount === 0

    return (
      <div style={{ borderRadius:20, overflow:'hidden', background:C.card, border:`1px solid ${isLive ? 'rgba(239,68,68,0.3)' : C.border}` }}>
        {/* Banner */}
        {event.banner_url ? (
          <div style={{ height:120, overflow:'hidden' }}>
            <img src={event.banner_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        ) : (
          <div style={{ height:6, background: isFree ? `linear-gradient(to right,${C.green},#059669)` : `linear-gradient(to right,${C.gold},#F97316)` }} />
        )}

        <div style={{ padding:20 }}>
          {/* Status badges */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {isLive && (
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(239,68,68,0.12)', color:C.red }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.red, display:'inline-block' }} />
                LIVE NOW
              </span>
            )}
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:isFree?C.greenDim:C.goldDim, color:isFree?C.green:C.gold }}>
              {isFree ? '✓ FREE TICKET' : `✓ PAID · ${fmt(ticket.amount)}`}
            </span>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:C.blueDim, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>
              #{ticket.id.slice(0,8).toUpperCase()}
            </span>
          </div>

          {/* Title */}
          <h3 style={{ fontSize:17, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.01em', marginBottom:10 }}>
            {event.title || 'Event'}
          </h3>

          {/* Meta */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
            {event.start_time && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Calendar style={{ width:14, height:14, color:C.blueLight, flexShrink:0 }} />
                <span style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </span>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', overflow:'hidden', background:avatarColor(host.id||'')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:avatarColor(host.id||''), flexShrink:0 }}>
                {host.photo_url ? <img src={host.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getName(host).slice(0,2).toUpperCase()}
              </div>
              <span style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Hosted by {getName(host)}</span>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display:'flex', gap:10 }}>
            {isLive ? (
              <Link href={`/live/${event.id}`} style={{ textDecoration:'none', flex:1 }}>
                <button style={{ width:'100%', padding:'11px', borderRadius:12, border:'none', cursor:'pointer', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Radio style={{ width:16, height:16 }} /> Join Live Now →
                </button>
              </Link>
            ) : (
              <Link href={`/events/${event.id}`} style={{ textDecoration:'none', flex:1 }}>
                <button style={{ width:'100%', padding:'11px', borderRadius:12, border:`1px solid ${C.border}`, cursor:'pointer', background:'transparent', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <ExternalLink style={{ width:14, height:14 }} /> View Event
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:C.bg, minHeight:'100%' }}>
        <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:24 }}>

          {/* Header */}
          <div>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:C.blueLight, fontFamily:'DM Sans,sans-serif', marginBottom:4 }}>Account</p>
            <h1 style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em', marginBottom:4 }}>My Tickets</h1>
            <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
              {loading ? '...' : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} total`}
            </p>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <Loader2 style={{ width:28, height:28, color:C.blueLight, animation:'spin 1s linear infinite' }} />
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ borderRadius:20, padding:56, textAlign:'center', background:C.card, border:`1px solid ${C.border}` }}>
              <div style={{ width:64, height:64, borderRadius:20, background:C.blueDim, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Ticket style={{ width:28, height:28, color:C.blueLight }} />
              </div>
              <p style={{ fontSize:16, fontWeight:700, color:C.textMuted, marginBottom:8, fontFamily:'Syne,sans-serif' }}>No tickets yet</p>
              <p style={{ fontSize:13, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:20 }}>Browse events and claim your first seat</p>
              <Link href="/dashboard" style={{ textDecoration:'none' }}>
                <button style={{ padding:'10px 24px', borderRadius:12, border:'none', cursor:'pointer', background:C.blue, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14 }}>
                  Browse Events →
                </button>
              </Link>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.textMuted, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>
                    Upcoming · {upcoming.length}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
                    {upcoming.map(t => <TicketCard key={t.id} ticket={t} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.textDim, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>
                    Past Events · {past.length}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16, opacity:0.6 }}>
                    {past.map(t => <TicketCard key={t.id} ticket={t} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
