'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, Radio, Users, PlusCircle, TrendingUp, Play, Edit, BarChart2, Clock } from 'lucide-react'

export default function HostDashboard() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [earnings, setEarnings] = useState(0)
  const [totalTickets, setTotalTickets] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        loadData(user.id)

        // Realtime: new ticket sold
        const channel = supabase
          .channel('host-tickets')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload: any) => {
            setEarnings(prev => prev + Math.floor(payload.new.amount * 0.5))
            setTotalTickets(prev => prev + 1)
          })
          .subscribe()

        return () => { supabase.removeChannel(channel) }
      }
    })
  }, [])

  const loadData = async (userId: string) => {
    const { data: evts } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false })
    
    setEvents(evts || [])

    // Calculate earnings from tickets
    const eventIds = (evts || []).map((e: any) => e.id)
    if (eventIds.length > 0) {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('amount')
        .in('event_id', eventIds)
        .eq('status', 'paid')
      
      const total = (tickets || []).reduce((sum: number, t: any) => sum + Math.floor(t.amount * 0.5), 0)
      setEarnings(total)
      setTotalTickets((tickets || []).length)
    }
    
    setLoading(false)
  }

  const liveEvent = events.find(e => e.status === 'live')

  const stats = [
    { label: 'Total Earnings', value: formatCurrency(earnings), icon: DollarSign, color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
    { label: 'Tickets Sold', value: totalTickets.toString(), icon: Users, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    { label: 'Total Events', value: events.length.toString(), icon: Radio, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Live Events', value: events.filter(e => e.status === 'live').length.toString(), icon: TrendingUp, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Host Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your events and earnings</p>
          </div>
          <Link href="/host/create" className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            New Event
          </Link>
        </div>

        {/* Live event CTA */}
        {liveEvent && (
          <div className="mb-6 p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 live-dot" />
              <div>
                <div className="font-semibold text-sm">{liveEvent.title}</div>
                <div className="text-xs text-slate-400">{liveEvent.viewer_peak} viewers</div>
              </div>
            </div>
            <Link href={`/live/${liveEvent.id}`} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ background: '#EF4444', color: 'white' }}>
              <Play className="w-3 h-3" />
              Go Live
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1 earnings-tick" style={{ fontFamily: 'Space Grotesk', color: s.color }}>
                {loading ? '...' : s.value}
              </div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Events</h2>
            <Link href="/host/create" className="text-sm text-sky-400 hover:text-sky-300">+ Create new</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Radio className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-slate-500 text-sm mb-5">Create your first event and start earning</p>
              <Link href="/host/create" className="btn-gold px-6 py-3 rounded-xl text-sm inline-block">
                Create First Event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                      background: event.status === 'live' ? 'rgba(239,68,68,0.15)' : event.status === 'scheduled' ? 'rgba(56,189,248,0.15)' : 'rgba(100,116,139,0.15)'
                    }}>
                      <Radio className="w-5 h-5" style={{
                        color: event.status === 'live' ? '#EF4444' : event.status === 'scheduled' ? '#38BDF8' : '#64748B'
                      }} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {event.status === 'live' ? 'Live now' : event.start_time ? formatDate(event.start_time) : 'Draft'}
                        {' · '}{formatCurrency(event.price)} · {event.total_sold || 0} sold
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden sm:block text-sm font-semibold" style={{ color: '#FFD700' }}>
                      {formatCurrency(Math.floor((event.total_sold || 0) * event.price * 0.5))}
                    </span>
                    {event.status === 'live' ? (
                      <Link href={`/live/${event.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#EF4444', color: 'white' }}>
                        Go Live
                      </Link>
                    ) : event.status === 'scheduled' ? (
                      <Link href={`/live/${event.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#1E293B', color: '#38BDF8', border: '1px solid #334155' }}>
                        Start
                      </Link>
                    ) : null}
                    <Link href={`/host/events/${event.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors" style={{ background: '#1E293B' }}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
