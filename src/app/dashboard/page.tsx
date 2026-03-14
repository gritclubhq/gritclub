'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  Calendar, Users, Zap, Radio, ChevronRight,
  Plus, Lock, TrendingUp, UserPlus, MessageCircle
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
// Dark professional: obsidian bg + violet/gold accents (Figma v2 + screenshots)
const C = {
  bg: '#0A0A0F',
  surface: '#13131A',
  surfaceHover: '#1A1A24',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(145,70,255,0.35)',
  text: '#F0F0FF',
  textMuted: '#8888A0',
  textDim: '#55556A',
  purple: '#9146FF',
  purpleLight: '#B07FFF',
  purpleDim: 'rgba(145,70,255,0.12)',
  gold: '#FCD34D',
  goldDim: 'rgba(252,211,77,0.12)',
  red: '#FF4444',
  redDim: 'rgba(255,68,68,0.12)',
  green: '#4ADE80',
  sky: '#38BDF8',
  skyDim: 'rgba(56,189,248,0.1)',
}

// ─── Mock data (Supabase replaces these) ─────────────────────────────────────
const MOCK_EVENTS = [
  { id: '1', title: 'Scaling to $1M ARR: A Masterclass', host: 'David Kim', group: 'SaaS Growth Hackers', date: '2026-03-20', time: '18:00', price: 49, spotsLeft: 18, maxSpots: 50, live: false },
  { id: '2', title: 'AI Product Development Workshop', host: 'Sarah Chen', group: 'AI Founders Circle', date: '2026-03-22', time: '19:00', price: 79, spotsLeft: 12, maxSpots: 30, live: true },
  { id: '3', title: 'Pitch Deck Teardown Session', host: 'Marcus Johnson', group: 'Fundraising Masters', date: '2026-03-25', time: '17:00', price: 99, spotsLeft: 5, maxSpots: 20, live: false },
]

const MOCK_GROUPS = [
  { id: '1', name: 'AI Founders Circle', category: 'AI & Tech', members: 12, paid: true },
  { id: '2', name: 'SaaS Growth Hackers', category: 'Growth', members: 8, paid: true },
  { id: '3', name: 'Fundraising Masters', category: 'Fundraising', members: 4, paid: false },
]

const MOCK_PEOPLE = [
  { id: '1', name: 'Sarah Chen', role: 'CEO & Founder', industry: 'FinTech', mutual: 3, initials: 'SC', color: '#9146FF' },
  { id: '2', name: 'Marcus Johnson', role: 'Co-Founder & CTO', industry: 'HealthTech', mutual: 1, initials: 'MJ', color: '#38BDF8' },
  { id: '3', name: 'Emily Rodriguez', role: 'Founder', industry: 'EdTech', mutual: 2, initials: 'ER', color: '#4ADE80' },
  { id: '4', name: 'David Kim', role: 'Serial Entrepreneur', industry: 'E-commerce', mutual: 5, initials: 'DK', color: '#FCD34D' },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: string | number; icon: any; accent: string; sub?: string
}) {
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden transition-all duration-200"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent + '40' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}
    >
      {/* Glow orb */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: accent }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: accent, fontFamily: 'var(--font-space-grotesk, inherit)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p className="text-xs font-medium tracking-widest uppercase" style={{ color: C.textDim }}>
        {label}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: accent + 'CC' }}>{sub}</p>}
    </div>
  )
}

// ─── Event Row ────────────────────────────────────────────────────────────────
function EventRow({ event }: { event: typeof MOCK_EVENTS[0] }) {
  const fill = Math.round(((event.maxSpots - event.spotsLeft) / event.maxSpots) * 100)
  const almostFull = event.spotsLeft <= 5
  const d = new Date(event.date)

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer group"
        style={{ border: `1px solid ${event.live ? 'rgba(255,68,68,0.25)' : C.border}`, background: event.live ? 'rgba(255,68,68,0.04)' : 'transparent' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = event.live ? 'rgba(255,68,68,0.07)' : C.surfaceHover; (e.currentTarget as HTMLElement).style.borderColor = event.live ? 'rgba(255,68,68,0.4)' : C.borderHover }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = event.live ? 'rgba(255,68,68,0.04)' : 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = event.live ? 'rgba(255,68,68,0.25)' : C.border }}
      >
        {/* Date badge */}
        <div className="flex-shrink-0 w-12 text-center rounded-lg py-2" style={{ background: event.live ? 'rgba(255,68,68,0.15)' : C.purpleDim }}>
          {event.live ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold tracking-widest" style={{ color: C.red }}>LIVE</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          ) : (
            <>
              <span className="block text-lg font-bold leading-none" style={{ color: C.purpleLight }}>{d.getDate()}</span>
              <span className="block text-xs font-medium tracking-wider" style={{ color: C.textDim }}>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate mb-0.5" style={{ color: C.text }}>{event.title}</p>
          <p className="text-xs truncate mb-2" style={{ color: C.textMuted }}>{event.host} · {event.group}</p>
          {/* Progress */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: fill + '%', background: almostFull ? C.red : `linear-gradient(to right, ${C.purple}, ${C.sky})` }} />
          </div>
          <p className="text-xs mt-1" style={{ color: almostFull ? C.red : C.textDim }}>
            {event.spotsLeft} spots left
          </p>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-bold" style={{ color: C.gold }}>${event.price}</p>
        </div>
      </div>
    </Link>
  )
}

// ─── Group Card ───────────────────────────────────────────────────────────────
function GroupCard({ group }: { group: typeof MOCK_GROUPS[0] }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div
        className="p-4 rounded-xl transition-all duration-200 cursor-pointer"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHover; (e.currentTarget as HTMLElement).style.background = C.surfaceHover }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.surface }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: C.goldDim }}>⬡</div>
          {group.paid && (
            <span className="text-xs font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: C.goldDim, color: C.gold }}>PAID</span>
          )}
        </div>
        <p className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>{group.name}</p>
        <p className="text-xs mb-2 font-medium tracking-wider uppercase" style={{ color: C.textDim }}>{group.category}</p>
        <p className="text-xs flex items-center gap-1" style={{ color: C.textMuted }}>
          <Users className="w-3 h-3" /> {group.members} members
        </p>
      </div>
    </Link>
  )
}

// ─── Person Card ──────────────────────────────────────────────────────────────
function PersonCard({ person }: { person: typeof MOCK_PEOPLE[0] }) {
  const [sent, setSent] = useState(false)
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: person.color + '25', color: person.color }}>
        {person.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: C.text }}>{person.name}</p>
        <p className="text-xs" style={{ color: C.textMuted }}>{person.industry}</p>
        {person.mutual > 0 && (
          <p className="text-xs mt-0.5 font-medium" style={{ color: C.sky }}>{person.mutual} mutual</p>
        )}
      </div>
      <button
        onClick={() => setSent(true)}
        className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: sent ? 'rgba(74,222,128,0.1)' : C.purpleDim,
          color: sent ? C.green : C.purpleLight,
          border: `1px solid ${sent ? 'rgba(74,222,128,0.2)' : 'rgba(145,70,255,0.2)'}`,
        }}
      >
        {sent ? '✓ Sent' : 'Connect'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AudienceDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ticketCount, setTicketCount] = useState(0)
  const [connectionCount, setConnectionCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)

      const [{ count: tc }, { count: cc }] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('status', 'paid'),
        supabase.from('connections').select('*', { count: 'exact', head: true }).or(`user1_id.eq.${u.id},user2_id.eq.${u.id}`).eq('status', 'accepted'),
      ])
      setTicketCount(tc || 0)
      setConnectionCount(cc || 0)
      setLoading(false)
    })
  }, [])

  // ── ROLE CHECK: only hosts/admins see "+ New Event" ──
  const isHost = profile?.role === 'host' || profile?.role === 'admin'
  const firstName = (profile?.full_name || user?.user_metadata?.full_name || 'Founder').split(' ')[0]
  const liveEvent = MOCK_EVENTS.find(e => e.live)

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* ── Header — NO + NEW EVENT for audience ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: C.purple }}>Dashboard</p>
              <h1 className="font-bold leading-tight" style={{ fontSize: 'clamp(22px,3vw,32px)', color: C.text }}>
                Welcome back,{' '}
                <span style={{ color: C.red }}>{loading ? '...' : firstName}</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>Your hub for networking, growth, and success</p>
            </div>

            {/* ── ONLY hosts/admins see this ── */}
            {isHost && (
              <Link href="/host/create">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: C.gold, color: '#0A0A0F' }}>
                  <Plus className="w-4 h-4" /> New Event
                </button>
              </Link>
            )}
          </div>

          {/* ── Live event banner ── */}
          {liveEvent && (
            <Link href={`/events/${liveEvent.id}`}>
              <div className="relative flex items-center justify-between gap-4 px-5 py-4 rounded-xl overflow-hidden cursor-pointer transition-all" style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,68,68,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,68,68,0.2)' }}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Radio className="w-5 h-5" style={{ color: C.red }} />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: C.red }}>Live Now</p>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{liveEvent.title}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>Hosted by {liveEvent.host}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold" style={{ background: C.red, color: '#fff' }}>
                  Join Live →
                </div>
              </div>
            </Link>
          )}

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="My Tickets" value={loading ? '...' : ticketCount} icon={Calendar} accent={C.sky} />
            <StatCard label="Connections" value={loading ? '...' : connectionCount} icon={Users} accent={C.gold} />
            <StatCard label="My Groups" value={MOCK_GROUPS.length} icon={Zap} accent={C.purpleLight} sub="1 premium" />
            <StatCard label="Live Events" value={MOCK_EVENTS.filter(e => e.live).length} icon={Radio} accent={C.red} sub="right now" />
          </div>

          {/* ── Main 2-col grid ── */}
          <div className="grid lg:grid-cols-3 gap-5">

            {/* Left — Events + Groups */}
            <div className="lg:col-span-2 space-y-5">

              {/* Upcoming Events */}
              <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.sky }}>Events</p>
                    <h2 className="text-base font-bold" style={{ color: C.text }}>Upcoming Sessions</h2>
                  </div>
                  <Link href="/events" className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.sky }}>
                    All <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {MOCK_EVENTS.map(e => <EventRow key={e.id} event={e} />)}
                </div>
              </div>

              {/* Your Groups */}
              <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.gold }}>Groups</p>
                    <h2 className="text-base font-bold" style={{ color: C.text }}>Your Circles</h2>
                  </div>
                  <Link href="/groups" className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.gold }}>
                    All <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {MOCK_GROUPS.map(g => <GroupCard key={g.id} group={g} />)}
                  </div>
                  <Link href="/groups/create">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer mt-1"
                      style={{ border: `1px dashed rgba(252,211,77,0.25)`, color: C.gold }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(252,211,77,0.5)'; (e.currentTarget as HTMLElement).style.background = C.goldDim }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(252,211,77,0.25)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      <Plus className="w-3.5 h-3.5" /> Create New Group
                      <span style={{ color: 'rgba(252,211,77,0.5)' }}>· first 5 free</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — Network + Host CTA */}
            <div className="space-y-5">

              {/* Suggested Connections */}
              <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.purpleLight }}>Network</p>
                    <h2 className="text-base font-bold" style={{ color: C.text }}>Suggested</h2>
                  </div>
                  <Link href="/dashboard/network" className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.purpleLight }}>
                    All <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-5 pb-4">
                  {MOCK_PEOPLE.map(p => <PersonCard key={p.id} person={p} />)}
                </div>
              </div>

              {/* Become Host CTA — only for audience */}
              {!isHost && (
                <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: C.surface, border: '1px solid rgba(255,68,68,0.2)' }}>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-15" style={{ background: C.red }} />
                  <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: C.red }}>Host</p>
                  <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>Ready to Host?</h3>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: C.textMuted }}>
                    Earn 80% from every ticket. Go live in seconds with screen share and whiteboard.
                  </p>
                  <Link href="/dashboard/become-host">
                    <button className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: C.red, color: '#fff' }}>
                      Apply to Host →
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
