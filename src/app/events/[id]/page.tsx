'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { Search, Radio, Lock, Globe, X, Loader2, Calendar, Users, Tag, ChevronRight, Zap } from 'lucide-react'

const C = {
  bg:         '#0A0F1E', surface:    '#0D1428', card:       '#111827', cardHover:  '#141E35',
  border:     'rgba(255,255,255,0.06)', borderHover: 'rgba(37,99,235,0.3)',
  text:       '#F0F4FF', textMuted:  '#7B8DB0', textDim:    '#3D4F6E',
  blue:       '#2563EB', blueLight:  '#3B82F6', blueDim:    'rgba(37,99,235,0.12)',
  gold:       '#F59E0B', goldDim:    'rgba(245,158,11,0.1)',
  red:        '#EF4444', redDim:     'rgba(239,68,68,0.1)',
  green:      '#10B981', greenDim:   'rgba(16,185,129,0.1)',
}

const CATEGORIES = ['All','AI & Tech','SaaS','FinTech','HealthTech','EdTech','E-commerce','Climate','Fundraising','Growth','Product']

const formatDate = (d: string, t: string) => {
  const date = new Date(d)
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${t}`
}

function EventCard({ event, currentUserId }: { event: any; currentUserId: string | null }) {
  const total    = event.capacity || event.max_attendees || 50
  const sold     = event.total_sold || event.current_attendees || 0
  const left     = Math.max(total - sold, 0)
  const fill     = Math.round((sold / Math.max(total, 1)) * 100)
  const almostFull = left <= 5 && left > 0
  const soldOut    = left === 0
  const isLive     = event.status === 'live'
  const isFree     = event.is_free || event.price === 0

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer"
        style={{ background: C.card, border: `1px solid ${isLive ? 'rgba(239,68,68,0.25)' : C.border}` }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = isLive ? 'rgba(239,68,68,0.5)' : C.borderHover; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 32px ${isLive ? 'rgba(239,68,68,0.08)' : 'rgba(37,99,235,0.08)'}` }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = isLive ? 'rgba(239,68,68,0.25)' : C.border; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
      >
        {/* Banner */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/7' }}>
          {event.banner_url
            ? <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.card})` }}>
                <Radio className="w-8 h-8" style={{ color: C.textDim }} />
              </div>
            )
          }
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: isLive ? C.red : `linear-gradient(to right, ${C.blue}, ${C.blueLight}, transparent)` }} />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.75)', color: C.red }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </span>
            )}
            {event.is_link_only && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.75)', color: C.gold }}>
                <Lock className="w-2.5 h-2.5" /> Invite Only
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            {soldOut
              ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.75)', color: C.red }}>Sold Out</span>
              : almostFull
                ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.75)', color: C.gold }}>⚡ {left} left</span>
                : null
            }
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Group + category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: C.blueDim, color: C.blueLight }}>
              {event.group_name || event.category || 'General'}
            </span>
            {event.tags?.slice(0,2).map((tag: string) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ background: C.border, color: C.textDim }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Title + host */}
          <div>
            <h3 className="text-sm font-bold leading-snug mb-1" style={{ color: C.text }}>{event.title}</h3>
            <p className="text-xs" style={{ color: C.textMuted }}>
              {event.host_name || event.users?.full_name || event.users?.email?.split('@')[0] || 'Host'}
              {event.start_time || event.date
                ? ` · ${formatDate(event.start_time || event.date, event.time || '')}`
                : ''
              }
            </p>
          </div>

          {/* Capacity bar */}
          <div>
            <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${fill}%`, background: soldOut ? C.red : almostFull ? `linear-gradient(to right, ${C.gold}, #FCD34D)` : `linear-gradient(to right, ${C.blue}, ${C.blueLight})` }} />
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: C.textDim }}>
              <span>
                {soldOut ? 'Sold out'
                  : almostFull ? `Only ${left} spots left!`
                  : `${left} of ${total} spots remaining`}
              </span>
              <span>{fill}% full</span>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
            <div>
              {isFree
                ? <span className="text-base font-bold" style={{ color: C.green }}>Free</span>
                : <span className="text-base font-bold" style={{ color: C.gold }}>
                    ${((event.price || 0) / 100).toFixed(0)}
                    <span className="text-xs font-normal ml-1" style={{ color: C.textDim }}>/ ticket</span>
                  </span>
              }
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isLive ? C.red     : soldOut ? C.border   : C.blueDim,
                color:      isLive ? '#fff'    : soldOut ? C.textDim  : C.blueLight,
                border:     `1px solid ${isLive ? C.red : soldOut ? C.border : 'rgba(37,99,235,0.2)'}`,
              }}>
              {isLive ? 'Join Now →' : soldOut ? 'Sold Out' : 'Get Ticket →'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function EventsPage() {
  const [currentUser,  setCurrentUser]  = useState<any>(null)
  const [profile,      setProfile]      = useState<any>(null)
  const [events,       setEvents]       = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [category,     setCategory]     = useState('All')
  const [liveOnly,     setLiveOnly]     = useState(false)
  const [freeOnly,     setFreeOnly]     = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
        setCurrentUser(u)
        const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
        setProfile(prof)
      }
      const { data } = await supabase
        .from('events')
        .select('*, users(id, email, full_name, photo_url)')
        .in('status', ['scheduled','live'])
        .order('start_time', { ascending: true })
      setEvents(data || [])
      setLoading(false)
    })

    // Realtime — new events appear
    const ch = supabase.channel('events-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        supabase.from('events')
          .select('*, users(id, email, full_name, photo_url)')
          .in('status', ['scheduled','live'])
          .order('start_time', { ascending: true })
          .then(({ data }) => setEvents(data || []))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.title?.toLowerCase().includes(q) ||
      (e.users?.full_name || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
    const matchCat  = category === 'All' || e.category === category || e.group_name === category
    const matchLive = !liveOnly || e.status === 'live'
    const matchFree = !freeOnly || e.is_free || e.price === 0
    return matchSearch && matchCat && matchLive && matchFree
  })

  const liveCount = events.filter(e => e.status === 'live').length
  const isHost    = profile?.role === 'host' || profile?.role === 'admin'

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Header — NO create button for audience */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.blueLight }}>Discover</p>
              <h1 className="text-2xl font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
                Live Sessions & Events
              </h1>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                Attend live sessions from top founders
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {liveCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: C.redDim, border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold" style={{ color: C.red }}>{liveCount} Live</span>
                </div>
              )}
              {/* Only hosts see create button */}
              {isHost && (
                <Link href="/host/create">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: C.gold, color: '#0A0F1E' }}>
                    <Zap className="w-4 h-4" /> Create Event
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textDim }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, hosts, topics..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
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
            <button onClick={() => setLiveOnly(l => !l)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: liveOnly ? C.redDim : C.card, color: liveOnly ? C.red : C.textMuted, border: `1px solid ${liveOnly ? 'rgba(239,68,68,0.3)' : C.border}` }}>
              <Radio className="w-3 h-3" /> Live Only
            </button>
            <button onClick={() => setFreeOnly(f => !f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: freeOnly ? C.greenDim : C.card, color: freeOnly ? C.green : C.textMuted, border: `1px solid ${freeOnly ? 'rgba(16,185,129,0.3)' : C.border}` }}>
              <Tag className="w-3 h-3" /> Free Only
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: category === cat ? C.blue : C.card, color: category === cat ? '#fff' : C.textMuted, border: `1px solid ${category === cat ? C.blue : C.border}` }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: C.textDim }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
            </p>
            {(search || category !== 'All' || liveOnly || freeOnly) && (
              <button onClick={() => { setSearch(''); setCategory('All'); setLiveOnly(false); setFreeOnly(false) }}
                className="flex items-center gap-1 text-xs font-medium" style={{ color: C.red }}>
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: C.card }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
              <p className="font-semibold" style={{ color: C.textMuted }}>No events found</p>
              <p className="text-sm mt-1" style={{ color: C.textDim }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(e => (
                <EventCard key={e.id} event={e} currentUserId={currentUser?.id || null} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
