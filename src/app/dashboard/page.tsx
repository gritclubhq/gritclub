'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Radio, Clock, Users, Play, Search, Filter, Zap } from 'lucide-react'

interface Event {
  id: string
  title: string
  host_name: string
  host_photo?: string
  price: number
  capacity?: number
  start_time: string
  status: 'draft' | 'scheduled' | 'live' | 'ended'
  total_sold: number
  viewer_peak: number
  poster_url?: string
  description?: string
}

function EventCard({ event }: { event: Event }) {
  const isLive = event.status === 'live'
  
  return (
    <Link href={`/events/${event.id}`}>
      <div className="glass-card rounded-2xl overflow-hidden event-card cursor-pointer">
        {/* Poster */}
        <div className="relative h-40 bg-gradient-to-br" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}>
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio className="w-10 h-10 text-slate-600" />
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {isLive ? (
              <span className="badge-live px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />
                LIVE
              </span>
            ) : (
              <span className="badge-upcoming px-3 py-1 rounded-full text-xs font-medium">
                UPCOMING
              </span>
            )}
          </div>

          {/* Price */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)' }}>
              {event.price === 0 ? 'FREE' : formatCurrency(event.price)}
            </span>
          </div>

          {isLive && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-slate-300">
              <Users className="w-3 h-3" />
              {event.viewer_peak}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-snug">{event.title}</h3>
          <p className="text-xs text-slate-500 mb-3">{event.host_name}</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isLive ? 'Live now' : formatDate(event.start_time)}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {event.total_sold} sold
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function AudienceDashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [liveEvents, setLiveEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'upcoming' | 'live'>('live')

  useEffect(() => {
    loadEvents()
    
    // Realtime subscription
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadEvents()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadEvents = async () => {
    const { data: live } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'live')
      .order('viewer_peak', { ascending: false })
    
    const { data: upcoming } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20)

    setLiveEvents(live || [])
    setEvents(upcoming || [])
    setLoading(false)
  }

  const filtered = (tab === 'live' ? liveEvents : events).filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.host_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>Discover Events</h1>
          <p className="text-slate-400 text-sm">Live business events from top founders</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or hosts..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
            style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'live', label: 'Live Now', count: liveEvents.length },
            { key: 'upcoming', label: 'Upcoming', count: events.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? 'rgba(56,189,248,0.15)' : 'transparent',
                color: tab === t.key ? '#38BDF8' : '#64748B',
                border: tab === t.key ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
              }}
            >
              {t.key === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 live-dot" />}
              {t.label}
              {t.count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Events grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium mb-2">
              {tab === 'live' ? 'No live events right now' : 'No upcoming events'}
            </h3>
            <p className="text-slate-500 text-sm">Check back soon or explore the community</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
