'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { Search, Lock, Radio, X, Calendar, Users, ChevronRight } from 'lucide-react'

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  border: 'rgba(255,255,255,0.07)', borderHover: 'rgba(145,70,255,0.3)',
  text: '#F0F0FF', textMuted: '#8888A0', textDim: '#55556A',
  purple: '#9146FF', purpleLight: '#B07FFF', purpleDim: 'rgba(145,70,255,0.12)',
  gold: '#FCD34D', goldDim: 'rgba(252,211,77,0.1)',
  red: '#FF4444', redDim: 'rgba(255,68,68,0.1)',
  sky: '#38BDF8', skyDim: 'rgba(56,189,248,0.1)',
  green: '#4ADE80',
}

const CATEGORIES = ['All', 'AI & Tech', 'Growth', 'Fundraising', 'Product', 'HealthTech', 'Climate', 'SaaS']

const MOCK_EVENTS = [
  { id: '1', title: 'Scaling to $1M ARR: A Masterclass', description: 'Growth strategies from 0 to $1M ARR in 18 months. Acquisition, pricing, retention tactics.', host: 'David Kim', group: 'SaaS Growth Hackers', category: 'Growth', date: '2026-03-20', time: '18:00', price: 49, maxSpots: 50, spotsLeft: 18, isLinkOnly: false, live: false, tags: ['Growth', 'SaaS', 'Revenue'] },
  { id: '2', title: 'AI Product Development Workshop', description: 'Hands-on: prompt engineering, model selection, and integration strategies for founders.', host: 'Sarah Chen', group: 'AI Founders Circle', category: 'AI & Tech', date: '2026-03-22', time: '19:00', price: 79, maxSpots: 30, spotsLeft: 12, isLinkOnly: true, live: true, tags: ['AI', 'Product', 'Workshop'] },
  { id: '3', title: 'Pitch Deck Teardown Session', description: 'Live review of pitch decks. Learn what investors actually want to see.', host: 'Marcus Johnson', group: 'Fundraising Masters', category: 'Fundraising', date: '2026-03-25', time: '17:00', price: 99, maxSpots: 20, spotsLeft: 5, isLinkOnly: true, live: false, tags: ['Fundraising', 'Pitch', 'Investors'] },
  { id: '4', title: 'Product-Market Fit Workshop', description: 'Finding and validating PMF. Real case studies and frameworks you can apply immediately.', host: 'Emily Rodriguez', group: 'Product Builders Guild', category: 'Product', date: '2026-03-28', time: '18:30', price: 59, maxSpots: 40, spotsLeft: 12, isLinkOnly: false, live: false, tags: ['PMF', 'Product', 'Strategy'] },
  { id: '5', title: 'Climate Tech Investment Landscape', description: 'Where the money is going in climate. Frameworks for building fundable climate companies.', host: 'Priya Patel', group: 'Climate Tech Pioneers', category: 'Climate', date: '2026-04-01', time: '17:00', price: 39, maxSpots: 60, spotsLeft: 45, isLinkOnly: false, live: false, tags: ['Climate', 'Investment', 'Impact'] },
  { id: '6', title: 'HealthTech Go-To-Market Strategies', description: 'Navigate hospital procurement, insurance reimbursements, and direct-to-consumer.', host: 'Marcus Johnson', group: 'HealthTech Innovators', category: 'HealthTech', date: '2026-04-03', time: '19:30', price: 69, maxSpots: 25, spotsLeft: 8, isLinkOnly: false, live: false, tags: ['HealthTech', 'GTM', 'Sales'] },
]

function EventCard({ event }: { event: typeof MOCK_EVENTS[0] }) {
  const fill = Math.round(((event.maxSpots - event.spotsLeft) / event.maxSpots) * 100)
  const almostFull = event.spotsLeft <= 5
  const d = new Date(event.date)

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
        style={{ background: C.surface, border: `1px solid ${event.live ? 'rgba(255,68,68,0.25)' : C.border}` }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = event.live ? 'rgba(255,68,68,0.5)' : C.borderHover; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 32px ${event.live ? 'rgba(255,68,68,0.08)' : 'rgba(145,70,255,0.08)'}` }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = event.live ? 'rgba(255,68,68,0.25)' : C.border; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
      >
        {/* Top accent */}
        <div className="h-0.5" style={{ background: event.live ? C.red : `linear-gradient(to right, ${C.purple}, ${C.sky}, transparent)` }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Date block */}
            <div className="flex-shrink-0 w-14 rounded-lg py-2.5 text-center" style={{ background: event.live ? C.redDim : C.purpleDim, border: `1px solid ${event.live ? 'rgba(255,68,68,0.2)' : 'rgba(145,70,255,0.2)'}` }}>
              {event.live ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold tracking-widest" style={{ color: C.red }}>LIVE</span>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.red }} />
                </div>
              ) : (
                <>
                  <span className="block text-xl font-bold leading-none" style={{ color: C.purpleLight }}>{d.getDate()}</span>
                  <span className="block text-xs font-semibold tracking-wider mt-0.5" style={{ color: C.textDim }}>
                    {d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </span>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: C.purpleDim, color: C.purpleLight }}>
                  {event.group}
                </span>
                {event.isLinkOnly && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(252,211,77,0.08)', color: C.gold }}>
                    <Lock className="w-2.5 h-2.5" /> Invite only
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold leading-snug mb-1" style={{ color: C.text }}>{event.title}</h3>
              <p className="text-xs" style={{ color: C.textMuted }}>{event.host} · {event.time}</p>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right pl-2">
              <p className="text-xl font-bold leading-none" style={{ color: C.gold }}>${event.price}</p>
              <p className="text-xs mt-0.5" style={{ color: C.textDim }}>/ ticket</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-4" style={{ color: C.textMuted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {event.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', color: C.textDim, border: `1px solid ${C.border}` }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: fill + '%', background: almostFull ? C.red : `linear-gradient(to right, ${C.purple}, ${C.sky})` }} />
              </div>
              <p className="text-xs font-medium" style={{ color: almostFull ? C.red : C.textDim }}>
                {almostFull ? `⚡ Only ${event.spotsLeft} spots left!` : `${event.spotsLeft} of ${event.maxSpots} spots remaining`}
              </p>
            </div>
            <div
              className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: event.live ? C.red : C.purpleDim,
                color: event.live ? '#fff' : C.purpleLight,
                border: `1px solid ${event.live ? C.red : 'rgba(145,70,255,0.3)'}`,
              }}
            >
              {event.live ? 'Join Now →' : 'Get Ticket →'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [liveOnly, setLiveOnly] = useState(false)

  const filtered = MOCK_EVENTS.filter(e => {
    const s = e.title.toLowerCase().includes(search.toLowerCase()) || e.host.toLowerCase().includes(search.toLowerCase())
    const c = category === 'All' || e.category === category
    const l = !liveOnly || e.live
    return s && c && l
  })

  const liveCount = MOCK_EVENTS.filter(e => e.live).length

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.sky }}>Discover</p>
              <h1 className="text-2xl font-bold" style={{ color: C.text }}>Live Sessions & Workshops</h1>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>Attend live sessions from top founders</p>
            </div>
            {liveCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0" style={{ background: C.redDim, border: '1px solid rgba(255,68,68,0.25)' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold tracking-wide" style={{ color: C.red }}>{liveCount} Live</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textDim }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, hosts, topics..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
              onFocus={e => (e.target.style.borderColor = C.borderHover)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.textDim }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLiveOnly(l => !l)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: liveOnly ? C.redDim : C.surface, color: liveOnly ? C.red : C.textMuted, border: `1px solid ${liveOnly ? 'rgba(255,68,68,0.3)' : C.border}` }}
            >
              <Radio className="w-3 h-3" /> Live Only
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: category === cat ? C.purpleDim : C.surface, color: category === cat ? C.purpleLight : C.textMuted, border: `1px solid ${category === cat ? 'rgba(145,70,255,0.3)' : C.border}` }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: C.textDim }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
            </p>
            {(search || category !== 'All' || liveOnly) && (
              <button onClick={() => { setSearch(''); setCategory('All'); setLiveOnly(false) }} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.red }}>
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
              <p className="font-semibold" style={{ color: C.textMuted }}>No events found</p>
              <p className="text-sm mt-1" style={{ color: C.textDim }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}
