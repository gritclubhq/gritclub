'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Radio, StopCircle, Calendar } from 'lucide-react'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadEvents()
    const channel = supabase.channel('admin-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  const endStream = async (id: string) => {
    await supabase.from('events').update({ status: 'ended' }).eq('id', id)
    loadEvents()
  }

  const statusColor: Record<string, string> = {
    live: '#EF4444', scheduled: '#38BDF8', ended: '#64748B', draft: '#A855F7'
  }

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter)

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.15)' }}>
            <Calendar className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">All Events</h1>
            <p className="text-slate-400 text-sm">{events.length} total events</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'live', 'scheduled', 'ended', 'draft'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
              style={{
                background: filter === f ? 'rgba(56,189,248,0.15)' : '#1E293B',
                color: filter === f ? '#38BDF8' : '#64748B',
                border: filter === f ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent'
              }}
            >
              {f === 'all' ? `All (${events.length})` : `${f} (${events.filter(e => e.status === f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#1E293B' }}>
            <Radio className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">No events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(event => (
              <div key={event.id} className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: '#1E293B' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor[event.status]}22` }}>
                    <Radio className="w-5 h-5" style={{ color: statusColor[event.status] }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs text-slate-500">{event.users?.email} · ${(event.price / 100).toFixed(2)} · {event.total_sold} sold</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${statusColor[event.status]}22`, color: statusColor[event.status] }}>
                    {event.status.toUpperCase()}
                  </span>
                  {event.status === 'live' && (
                    <button onClick={() => endStream(event.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
                      <StopCircle className="w-3.5 h-3.5" /> End Stream
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
