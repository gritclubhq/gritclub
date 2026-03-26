'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Clock, Search, Filter, Radio } from 'lucide-react'

const C = {
  bg:'#070B14', surface:'#0D1420', card:'#0F1A2E',
  border:'rgba(255,255,255,0.07)', text:'#E8EAF0',
  textMuted:'#8A9BBF', textDim:'#3D4F6E',
  blue:'#FF3B3B', blueL:'#FF5555', blueDim:'rgba(255,59,59,0.12)',
  gold:'#FFD700', goldDim:'rgba(255,215,0,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.12)',
  green:'#10B981',
}

const CATEGORIES = ['All','AI & Tech','SaaS','FinTech','Growth','Product','Fundraising','HealthTech','Web3','Media']

const fmt = (n: number) => n >= 100 ? `$${n}` : n === 0 ? 'Free' : `$${n}`
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, users(id, full_name, email, photo_url)')
      .in('status', ['upcoming', 'live'])
      .order('start_time', { ascending: true })
      .limit(50)
    setEvents(data || [])
    setLoading(false)
  }

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
    const matchCat = category === 'All' || e.category === category
    return matchSearch && matchCat
  })

  const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'Host'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>
      <style>{`* { box-sizing: border-box; } @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#FF3B3B', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff', fontFamily: 'Syne,sans-serif' }}>G</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: C.text }}>Grit<span style={{ color: '#FF3B3B' }}>Club</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          {isLoggedIn ? (
            <Link href="/dashboard">
              <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Dashboard</button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <button style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign In</button>
              </Link>
              <Link href="/auth/login">
                <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Join Free</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px clamp(16px,4vw,32px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.blueL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Live & Upcoming</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(24px,4vw,40px)', letterSpacing: '-0.02em', marginBottom: 8 }}>Events</h1>
          <p style={{ fontSize: 15, color: C.textMuted }}>Ticketed live sessions from founders and operators. Join free — or <Link href="/auth/login" style={{ color: C.blueL }}>sign in</Link> to register.</p>
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.textDim }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, outline: 'none', fontFamily: 'DM Sans,sans-serif' }} />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${category === cat ? C.blue : C.border}`, background: category === cat ? C.blueDim : 'transparent', color: category === cat ? C.blueL : C.textMuted, fontSize: 13, fontWeight: category === cat ? 700 : 400, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Events grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${C.blue}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 20, background: C.card, border: `1px solid ${C.border}` }}>
            <Calendar style={{ width: 40, height: 40, color: C.textDim, margin: '0 auto 12px' }} />
            <p style={{ color: C.textMuted, fontSize: 15, fontWeight: 600 }}>No events found</p>
            <p style={{ color: C.textDim, fontSize: 13, marginTop: 6 }}>Check back soon or try a different search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {filtered.map(ev => {
              const isLive = ev.status === 'live'
              const isFree = ev.is_free || !ev.price || ev.price === 0
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,59,59,0.3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = C.border }}>

                    {/* Banner */}
                    <div style={{ height: 140, background: 'linear-gradient(135deg,#0D1428,#111827)', position: 'relative', overflow: 'hidden' }}>
                      {ev.poster_url && <img src={ev.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      {isLive && (
                        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: C.redDim, border: `1px solid rgba(239,68,68,0.4)` }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'spin 0s' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.red }}>LIVE NOW</span>
                          <Radio style={{ width: 10, height: 10, color: C.red }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 10, background: isFree ? 'rgba(16,185,129,0.2)' : 'rgba(255,215,0,0.2)', border: `1px solid ${isFree ? 'rgba(16,185,129,0.4)' : 'rgba(255,215,0,0.4)'}` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isFree ? C.green : C.gold }}>{isFree ? 'Free' : fmt(ev.price)}</span>
                      </div>
                    </div>

                    <div style={{ padding: '16px 18px' }}>
                      <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>{ev.title}</h3>

                      {/* Host */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.blueL, overflow: 'hidden' }}>
                          {ev.users?.photo_url ? <img src={ev.users.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getName(ev.users).slice(0,2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, color: C.textMuted }}>{getName(ev.users)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        {ev.start_time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textDim }}>
                            <Clock style={{ width: 11, height: 11 }} />{fmtDate(ev.start_time)}
                          </div>
                        )}
                        {ev.capacity && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textDim }}>
                            <Users style={{ width: 11, height: 11 }} />{ev.current_attendees || 0}/{ev.capacity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA for non-logged-in */}
        {!isLoggedIn && filtered.length > 0 && (
          <div style={{ marginTop: 48, padding: '32px 24px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(255,59,59,0.08),rgba(124,58,237,0.06))', border: `1px solid rgba(255,59,59,0.2)`, textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Want to attend an event?</h3>
            <p style={{ fontSize: 15, color: C.textMuted, marginBottom: 24 }}>Sign up free in 30 seconds with Google. No credit card needed.</p>
            <Link href="/auth/login">
              <button style={{ padding: '12px 32px', borderRadius: 12, border: 'none', background: C.blue, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Join GritClub Free →</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
