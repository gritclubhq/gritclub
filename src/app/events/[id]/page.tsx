'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Search, Calendar, Users, Radio, Lock, Globe, Filter, X, ChevronRight, Zap } from 'lucide-react'

const FONT = { display: "'Syne', 'Space Grotesk', sans-serif", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace" }

const CATEGORIES = ['All', 'AI & Tech', 'Growth', 'Fundraising', 'Product', 'HealthTech', 'Climate', 'SaaS']

// ─── Mock events (Supabase in production) ────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: '1', title: 'Scaling to $1M ARR: A Masterclass',
    description: 'Growth strategies that helped scale from 0 to $1M ARR in 18 months. Acquisition, pricing, retention.',
    host: 'David Kim', group: 'SaaS Growth Hackers', category: 'Growth',
    date: '2026-03-20', time: '18:00', price: 49, maxSpots: 50, spotsLeft: 18,
    isLinkOnly: false, live: false,
    tags: ['Growth', 'SaaS', 'Revenue'],
  },
  {
    id: '2', title: 'AI Product Development Workshop',
    description: 'Hands-on: prompt engineering, model selection, and integration strategies for founders.',
    host: 'Sarah Chen', group: 'AI Founders Circle', category: 'AI & Tech',
    date: '2026-03-22', time: '19:00', price: 79, maxSpots: 30, spotsLeft: 12,
    isLinkOnly: true, live: true,
    tags: ['AI', 'Product', 'Workshop'],
  },
  {
    id: '3', title: 'Pitch Deck Teardown Session',
    description: 'Live review of pitch decks. Bring your deck and learn what investors actually want to see.',
    host: 'Marcus Johnson', group: 'Fundraising Masters', category: 'Fundraising',
    date: '2026-03-25', time: '17:00', price: 99, maxSpots: 20, spotsLeft: 5,
    isLinkOnly: true, live: false,
    tags: ['Fundraising', 'Pitch', 'Investors'],
  },
  {
    id: '4', title: 'Product-Market Fit Workshop',
    description: 'Finding and validating PMF. Real case studies and frameworks you can apply immediately.',
    host: 'Emily Rodriguez', group: 'Product Builders Guild', category: 'Product',
    date: '2026-03-28', time: '18:30', price: 59, maxSpots: 40, spotsLeft: 12,
    isLinkOnly: false, live: false,
    tags: ['PMF', 'Product', 'Strategy'],
  },
  {
    id: '5', title: 'Climate Tech Investment Landscape',
    description: 'Where the money is going in climate. Frameworks for building fundable climate companies.',
    host: 'Priya Patel', group: 'Climate Tech Pioneers', category: 'Climate',
    date: '2026-04-01', time: '17:00', price: 39, maxSpots: 60, spotsLeft: 45,
    isLinkOnly: false, live: false,
    tags: ['Climate', 'Investment', 'Impact'],
  },
  {
    id: '6', title: 'HealthTech Go-To-Market Strategies',
    description: 'How to navigate hospital procurement, insurance reimbursements, and direct-to-consumer.',
    host: 'Marcus Johnson', group: 'HealthTech Innovators', category: 'HealthTech',
    date: '2026-04-03', time: '19:30', price: 69, maxSpots: 25, spotsLeft: 8,
    isLinkOnly: false, live: false,
    tags: ['HealthTech', 'GTM', 'Sales'],
  },
]

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: typeof MOCK_EVENTS[0] }) {
  const fill = Math.round(((event.maxSpots - event.spotsLeft) / event.maxSpots) * 100)
  const isAlmostFull = event.spotsLeft <= 5
  const dateObj = new Date(event.date)

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="group relative cursor-pointer transition-all duration-200 overflow-hidden"
        style={{ background: '#0D1420', border: `1px solid ${event.live ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}` }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = event.live ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = event.live ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
      >
        {/* Top accent bar */}
        <div style={{ height: '2px', background: event.live ? '#EF4444' : `linear-gradient(to right, #38BDF8, transparent)` }} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Date */}
            <div className="flex-shrink-0 text-center" style={{ width: 52, background: event.live ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.06)', padding: '8px 6px', border: `1px solid ${event.live ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.1)'}` }}>
              {event.live ? (
                <>
                  <span className="block" style={{ fontFamily: FONT.mono, fontSize: '9px', color: '#EF4444', letterSpacing: '0.12em' }}>LIVE</span>
                  <span className="block w-2 h-2 rounded-full bg-red-500 mx-auto mt-1.5 animate-pulse" />
                </>
              ) : (
                <>
                  <span className="block" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: '22px', color: '#38BDF8', lineHeight: 1 }}>{dateObj.getDate()}</span>
                  <span className="block" style={{ fontFamily: FONT.mono, fontSize: '9px', color: 'rgba(56,189,248,0.6)', letterSpacing: '0.1em' }}>
                    {dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </span>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span style={{ fontFamily: FONT.mono, fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px' }}>
                  {event.group}
                </span>
                {event.isLinkOnly && (
                  <span style={{ fontFamily: FONT.mono, fontSize: '9px', letterSpacing: '0.1em', color: '#A78BFA', background: 'rgba(167,139,250,0.1)', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Lock style={{ width: 8, height: 8 }} /> LINK ONLY
                  </span>
                )}
              </div>
              <h3 style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '15px', color: '#E8EAF0', lineHeight: 1.3, marginBottom: '4px' }}>
                {event.title}
              </h3>
              <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.35)', letterSpacing: '0.06em' }}>
                {event.host} · {event.time}
              </p>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
              <p style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: '20px', color: '#FFD700', lineHeight: 1 }}>${event.price}</p>
              <p style={{ fontFamily: FONT.mono, fontSize: '9px', color: 'rgba(255,215,0,0.5)' }}>per ticket</p>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontFamily: FONT.body, fontWeight: 300, fontSize: '13px', color: 'rgba(232,234,240,0.5)', lineHeight: 1.6, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {event.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.tags.map(tag => (
              <span key={tag} style={{ fontFamily: FONT.mono, fontSize: '9px', letterSpacing: '0.08em', color: 'rgba(232,234,240,0.3)', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', border: '1px solid rgba(255,255,255,0.06)' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {/* Progress bar */}
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', marginBottom: '4px' }}>
                <div style={{ height: '100%', width: fill + '%', background: isAlmostFull ? '#EF4444' : '#38BDF8', transition: 'width 0.6s ease' }} />
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: FONT.mono, fontSize: '10px', color: isAlmostFull ? '#EF4444' : 'rgba(232,234,240,0.35)' }}>
                  {event.spotsLeft} {isAlmostFull ? 'SPOTS LEFT!' : 'spots remaining'}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: '10px', color: 'rgba(232,234,240,0.25)' }}>{fill}% full</span>
              </div>
            </div>
            <div style={{
              fontFamily: FONT.display, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em',
              padding: '8px 16px', background: event.live ? '#EF4444' : 'rgba(56,189,248,0.1)',
              color: event.live ? '#fff' : '#38BDF8', flexShrink: 0, whiteSpace: 'nowrap',
              clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
              border: event.live ? 'none' : '1px solid rgba(56,189,248,0.2)',
            }}>
              {event.live ? 'JOIN NOW →' : 'GET TICKET →'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showLiveOnly, setShowLiveOnly] = useState(false)

  const filtered = MOCK_EVENTS.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.host.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || e.category === category
    const matchLive = !showLiveOnly || e.live
    return matchSearch && matchCat && matchLive
  })

  const liveCount = MOCK_EVENTS.filter(e => e.live).length

  return (
    <DashboardLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div className="min-h-full" style={{ background: '#070B14' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ fontFamily: FONT.mono, fontSize: '10px', letterSpacing: '0.2em', color: '#38BDF8', marginBottom: '4px' }}>// EVENTS</p>
              <h1 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 'clamp(24px,3vw,40px)', letterSpacing: '-0.03em', color: '#E8EAF0', lineHeight: 1.1 }}>
                LIVE SESSIONS &<br /><span style={{ color: '#38BDF8' }}>WORKSHOPS</span>
              </h1>
            </div>
            {liveCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#EF4444', letterSpacing: '0.12em' }}>{liveCount} LIVE NOW</span>
              </div>
            )}
          </div>

          {/* ── Search + Filters ── */}
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(232,234,240,0.3)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="SEARCH EVENTS, HOSTS, TOPICS..."
                style={{
                  width: '100%', background: '#0D1420', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#E8EAF0', padding: '12px 12px 12px 40px',
                  fontFamily: FONT.mono, fontSize: '12px', letterSpacing: '0.08em', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(56,189,248,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,234,240,0.4)' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>

            {/* Categories + Live filter */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowLiveOnly(l => !l)}
                style={{
                  fontFamily: FONT.mono, fontSize: '10px', letterSpacing: '0.1em', padding: '6px 12px',
                  background: showLiveOnly ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                  color: showLiveOnly ? '#EF4444' : 'rgba(232,234,240,0.4)',
                  border: `1px solid ${showLiveOnly ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)',
                }}
              >
                <Radio style={{ width: 10, height: 10 }} /> LIVE ONLY
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    fontFamily: FONT.mono, fontSize: '10px', letterSpacing: '0.08em', padding: '6px 12px',
                    background: category === cat ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                    color: category === cat ? '#38BDF8' : 'rgba(232,234,240,0.4)',
                    border: `1px solid ${category === cat ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Results count ── */}
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: FONT.mono, fontSize: '11px', color: 'rgba(232,234,240,0.35)', letterSpacing: '0.08em' }}>
              {filtered.length} EVENT{filtered.length !== 1 ? 'S' : ''} FOUND
            </p>
            {(search || category !== 'All' || showLiveOnly) && (
              <button
                onClick={() => { setSearch(''); setCategory('All'); setShowLiveOnly(false) }}
                style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#FF3B3B', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <X style={{ width: 10, height: 10 }} /> CLEAR FILTERS
              </button>
            )}
          </div>

          {/* ── Events Grid ── */}
          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: FONT.mono, fontSize: '40px', color: 'rgba(232,234,240,0.1)', marginBottom: '12px' }}>◈</div>
              <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: '16px', color: 'rgba(232,234,240,0.4)' }}>NO EVENTS FOUND</p>
              <p style={{ fontFamily: FONT.mono, fontSize: '11px', color: 'rgba(232,234,240,0.25)', marginTop: '6px' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}

          {/* ── Host your own CTA ── */}
          <div className="relative p-6 overflow-hidden text-center" style={{ background: '#0D1420', border: '1px solid rgba(255,59,59,0.2)' }}>
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,59,59,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,59,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative">
              <p style={{ fontFamily: FONT.mono, fontSize: '10px', color: '#FF3B3B', letterSpacing: '0.2em', marginBottom: '8px' }}>// BECOME A HOST</p>
              <h3 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: '22px', color: '#E8EAF0', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                HAVE SOMETHING TO <span style={{ color: '#FF3B3B' }}>TEACH?</span>
              </h3>
              <p style={{ fontFamily: FONT.body, fontSize: '14px', color: 'rgba(232,234,240,0.5)', marginBottom: '20px', lineHeight: 1.6 }}>
                Host your own event. You keep 80% of every ticket. Screen share, whiteboard, invite-only — your rules.
              </p>
              <Link href="/host/create">
                <button style={{
                  fontFamily: FONT.display, fontWeight: 700, fontSize: '12px', letterSpacing: '0.12em',
                  padding: '12px 32px', background: '#FF3B3B', color: '#fff', border: 'none', cursor: 'pointer',
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}>
                  CREATE EVENT →
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
