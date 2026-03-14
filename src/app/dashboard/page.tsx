'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  Users, Calendar, TrendingUp, Radio, ArrowUpRight,
  Plus, ChevronRight, Zap, Lock, Globe, Clock
} from 'lucide-react'

// ─── Style constants ──────────────────────────────────────────────────────────
const FONT = { display: "'Syne', 'Space Grotesk', sans-serif", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace" }

// ─── Mock data (replaced by Supabase in production) ──────────────────────────
const MOCK_GROUPS = [
  { id: '1', name: 'AI Founders Circle', category: 'AI & Tech', members: 12, premium: true },
  { id: '2', name: 'SaaS Growth Hackers', category: 'Growth', members: 8, premium: true },
  { id: '3', name: 'Fundraising Masters', category: 'Fundraising', members: 4, premium: false },
]

const MOCK_EVENTS = [
  { id: '1', title: 'Scaling to $1M ARR: A Masterclass', host: 'David Kim', date: '2026-03-20', time: '18:00', price: 49, spots: 18, maxSpots: 50, group: 'SaaS Growth Hackers', live: false },
  { id: '2', title: 'AI Product Development Workshop', host: 'Sarah Chen', date: '2026-03-22', time: '19:00', price: 79, spots: 12, maxSpots: 30, group: 'AI Founders Circle', live: true },
  { id: '3', title: 'Pitch Deck Teardown Session', host: 'Marcus Johnson', date: '2026-03-25', time: '17:00', price: 99, spots: 5, maxSpots: 20, group: 'Fundraising Masters', live: false },
]

const MOCK_PEOPLE = [
  { id: '1', name: 'Sarah Chen', role: 'CEO & Founder', industry: 'FinTech', mutual: 3 },
  { id: '2', name: 'Marcus Johnson', role: 'Co-Founder & CTO', industry: 'HealthTech', mutual: 1 },
  { id: '3', name: 'Emily Rodriguez', role: 'Founder', industry: 'EdTech', mutual: 2 },
  { id: '4', name: 'David Kim', role: 'Serial Entrepreneur', industry: 'E-commerce', mutual: 5 },
]

// ─── Mini components ──────────────────────────────────────────────────────────

function SectionLabel({ color, text }: { color: string; text: string }) {
  return (
    <p style={{ fontFamily: FONT.mono, fontSize: '10px', letterSpacing: '0.2em', color, textTransform: 'uppercase', marginBottom: '4px' }}>
      // {text}
    </p>
  )
}

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div
      className="relative p-5 overflow-hidden"
      style={{ background: '#0D1420', border: `1px solid ${color}20` }}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10" style={{ background: color }} />
      <div className="flex items-start justify-between mb-4">
        <div style={{ width: 36, height: 36, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
          <Icon style={{ width: 16, height: 16, color }} />
        </div>
      </div>
      <p style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: '28px', color, lineHeight: 1, marginBottom: '4px' }}>{value}</p>
      <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
      {sub && <p style={{ fontFamily: FONT.body, fontSize: '12px', color: color + 'aa', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}

function GroupCard({ group }: { group: typeof MOCK_GROUPS[0] }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div
        className="group p-4 cursor-pointer transition-all"
        style={{ background: '#070B14', border: '1px solid rgba(255,255,255,0.06)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
      >
        <div className="flex items-start justify-between mb-3">
          <div style={{ width: 36, height: 36, background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
            <span style={{ color: '#FFD700', fontSize: '14px' }}>⬡</span>
          </div>
          {group.premium && (
            <span style={{ fontFamily: FONT.mono, fontSize: '9px', letterSpacing: '0.1em', color: '#FFD700', background: 'rgba(255,215,0,0.1)', padding: '2px 6px', border: '1px solid rgba(255,215,0,0.2)' }}>PAID</span>
          )}
        </div>
        <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '14px', color: '#E8EAF0', marginBottom: '2px' }}>{group.name}</p>
        <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.3)', letterSpacing: '0.08em', marginBottom: '8px' }}>{group.category}</p>
        <p style={{ fontFamily: FONT.body, fontSize: '12px', color: 'rgba(232,234,240,0.35)' }}>
          <Users style={{ display: 'inline', width: 10, height: 10, marginRight: 4 }} />
          {group.members} members
        </p>
      </div>
    </Link>
  )
}

function EventCard({ event }: { event: typeof MOCK_EVENTS[0] }) {
  const fill = ((event.maxSpots - event.spots) / event.maxSpots) * 100
  const dateStr = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="p-4 cursor-pointer transition-all"
        style={{ background: '#070B14', border: `1px solid ${event.live ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}` }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = event.live ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = event.live ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)')}
      >
        <div className="flex items-start gap-3">
          {/* Date block */}
          <div className="flex-shrink-0 text-center" style={{ width: 48, background: event.live ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.08)', padding: '6px 4px' }}>
            {event.live ? (
              <>
                <span className="block" style={{ fontFamily: FONT.mono, fontSize: '9px', color: '#EF4444', letterSpacing: '0.1em' }}>LIVE</span>
                <span className="block w-2 h-2 rounded-full bg-red-500 mx-auto mt-1 animate-pulse" />
              </>
            ) : (
              <>
                <span className="block" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: '18px', color: '#38BDF8', lineHeight: 1 }}>{new Date(event.date).getDate()}</span>
                <span className="block" style={{ fontFamily: FONT.mono, fontSize: '9px', color: 'rgba(56,189,248,0.6)', letterSpacing: '0.1em' }}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </span>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '13px', color: '#E8EAF0', marginBottom: '2px', lineHeight: 1.3 }}>
              {event.title}
            </p>
            <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.35)', marginBottom: '8px' }}>
              {event.host} · {event.group}
            </p>
            {/* Capacity bar */}
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', marginBottom: '4px' }}>
              <div style={{ height: '100%', width: fill + '%', background: fill > 80 ? '#EF4444' : '#38BDF8', transition: 'width 0.5s' }} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.35)' }}>{event.spots} spots left</span>
              <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '13px', color: '#FFD700' }}>${event.price}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PersonCard({ person }: { person: typeof MOCK_PEOPLE[0] }) {
  const [connected, setConnected] = useState(false)
  return (
    <div className="flex items-center gap-3 p-3" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 5 % 360}, 70%, 50%), hsl(${person.name.charCodeAt(1) * 5 % 360}, 70%, 40%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT.display, fontWeight: 800, fontSize: '13px', color: '#fff',
        }}
      >
        {person.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '13px', color: '#E8EAF0' }}>{person.name}</p>
        <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.35)', letterSpacing: '0.06em' }}>{person.industry}</p>
        {person.mutual > 0 && (
          <p style={{ fontFamily: FONT.body, fontSize: '11px', color: '#38BDF8', marginTop: '1px' }}>{person.mutual} mutual</p>
        )}
      </div>
      <button
        onClick={() => setConnected(c => !c)}
        style={{
          fontFamily: FONT.display, fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em',
          padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
          background: connected ? 'rgba(74,222,128,0.1)' : 'rgba(56,189,248,0.1)',
          color: connected ? '#4ADE80' : '#38BDF8',
          clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)',
        }}
      >
        {connected ? 'SENT' : 'CONNECT'}
      </button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AudienceDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [ticketCount, setTicketCount] = useState(0)
  const [connectionCount, setConnectionCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)

      const { data: evts } = await supabase.from('events').select('*').eq('status', 'scheduled').order('start_time').limit(5)
      setEvents(evts || [])

      const { count: tc } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('status', 'paid')
      setTicketCount(tc || 0)

      const { count: cc } = await supabase.from('connections').select('*', { count: 'exact', head: true }).or(`user1_id.eq.${u.id},user2_id.eq.${u.id}`).eq('status', 'accepted')
      setConnectionCount(cc || 0)

      setLoading(false)
    })
  }, [])

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Founder'
  const firstName = displayName.split(' ')[0]

  const liveEvent = MOCK_EVENTS.find(e => e.live)

  return (
    <DashboardLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div className="min-h-full" style={{ background: '#070B14' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-8">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <SectionLabel color="#FF3B3B" text="DASHBOARD" />
              <h1 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.03em', color: '#E8EAF0', lineHeight: 1.1 }}>
                WELCOME BACK,<br />
                <span style={{ color: '#FF3B3B' }}>{loading ? '...' : firstName.toUpperCase()}</span>
              </h1>
            </div>
            <Link href="/host/create">
              <button style={{
                fontFamily: FONT.display, fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em',
                padding: '10px 20px', background: '#FFD700', color: '#070B14', border: 'none', cursor: 'pointer',
                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Plus style={{ width: 14, height: 14 }} /> NEW EVENT
              </button>
            </Link>
          </div>

          {/* ── Live banner ── */}
          {liveEvent && (
            <Link href={`/events/${liveEvent.id}`}>
              <div className="relative p-4 overflow-hidden cursor-pointer" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div style={{ position: 'relative' }}>
                      <Radio style={{ width: 20, height: 20, color: '#EF4444' }} />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <div>
                      <span style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#EF4444', letterSpacing: '0.15em' }}>LIVE NOW</span>
                      <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '14px', color: '#E8EAF0' }}>{liveEvent.title}</p>
                      <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.4)' }}>Hosted by {liveEvent.host}</p>
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', padding: '8px 16px', background: '#EF4444', color: '#fff', clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)', flexShrink: 0 }}>
                    JOIN LIVE →
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="My Tickets" value={loading ? '...' : ticketCount} icon={Calendar} color="#38BDF8" />
            <StatCard label="Connections" value={loading ? '...' : connectionCount} icon={Users} color="#FFD700" />
            <StatCard label="My Groups" value={MOCK_GROUPS.length} icon={Zap} color="#A78BFA" sub="1 premium" />
            <StatCard label="Live Events" value={MOCK_EVENTS.filter(e => e.live).length} icon={Radio} color="#EF4444" sub="right now" />
          </div>

          {/* ── Main grid ── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left: Events + Groups */}
            <div className="lg:col-span-2 space-y-6">

              {/* Upcoming Events */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <SectionLabel color="#38BDF8" text="EVENTS" />
                    <h2 style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '16px', color: '#E8EAF0', letterSpacing: '-0.02em' }}>UPCOMING SESSIONS</h2>
                  </div>
                  <Link href="/dashboard/tickets" style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#38BDF8', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ALL <ChevronRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>
                <div className="space-y-2">
                  {MOCK_EVENTS.map(e => <EventCard key={e.id} event={e} />)}
                </div>
              </div>

              {/* Your Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <SectionLabel color="#FFD700" text="GROUPS" />
                    <h2 style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '16px', color: '#E8EAF0', letterSpacing: '-0.02em' }}>YOUR CIRCLES</h2>
                  </div>
                  <Link href="/groups" style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#FFD700', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ALL <ChevronRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {MOCK_GROUPS.map(g => <GroupCard key={g.id} group={g} />)}
                </div>
                <Link href="/groups/create">
                  <div className="mt-2 flex items-center justify-center gap-2 p-3 cursor-pointer transition-all" style={{ border: '1px dashed rgba(255,215,0,0.2)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.2)')}
                  >
                    <Plus style={{ width: 14, height: 14, color: '#FFD700' }} />
                    <span style={{ fontFamily: FONT.mono, fontSize: '11px', color: '#FFD700', letterSpacing: '0.1em' }}>CREATE NEW GROUP</span>
                    <span style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(255,215,0,0.5)' }}>· first 5 free</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Right: Network */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <SectionLabel color="#A78BFA" text="NETWORK" />
                    <h2 style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '16px', color: '#E8EAF0', letterSpacing: '-0.02em' }}>SUGGESTED</h2>
                  </div>
                  <Link href="/dashboard/network" style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#A78BFA', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ALL <ChevronRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>
                <div className="space-y-2">
                  {MOCK_PEOPLE.map(p => <PersonCard key={p.id} person={p} />)}
                </div>
              </div>

              {/* Become a host CTA */}
              <div
                className="relative p-5 overflow-hidden"
                style={{ background: '#0D1420', border: '1px solid rgba(255,59,59,0.2)' }}
              >
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10" style={{ background: '#FF3B3B' }} />
                <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#FF3B3B', letterSpacing: '0.15em', marginBottom: '8px' }}>// HOST</p>
                <h3 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: '18px', color: '#E8EAF0', marginBottom: '8px', letterSpacing: '-0.02em' }}>READY TO HOST?</h3>
                <p style={{ fontFamily: FONT.body, fontSize: '13px', color: 'rgba(232,234,240,0.5)', lineHeight: 1.6, marginBottom: '16px' }}>
                  Earn 80% from every ticket. Go live in seconds with screen share and whiteboard.
                </p>
                <Link href="/dashboard/become-host">
                  <button style={{
                    fontFamily: FONT.display, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em',
                    padding: '9px 16px', background: '#FF3B3B', color: '#fff', border: 'none', cursor: 'pointer', width: '100%',
                    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                  }}>
                    APPLY TO HOST →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
