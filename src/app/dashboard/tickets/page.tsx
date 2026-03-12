'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Ticket, Play, Clock, CheckCircle, RadioIcon } from 'lucide-react'

export default function MyTickets() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('tickets')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      setTickets(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>My Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} purchased</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
            <p className="text-slate-500 text-sm mb-5">Discover and buy tickets to founder events</p>
            <Link href="/dashboard" className="btn-sky px-6 py-3 rounded-xl text-sm inline-block">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => {
              const event = ticket.events
              const isLive = event?.status === 'live'
              return (
                <div key={ticket.id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                      background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.1)'
                    }}>
                      <RadioIcon className="w-6 h-6" style={{ color: isLive ? '#EF4444' : '#38BDF8' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{event?.title || 'Event'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(ticket.amount)} · {ticket.replay_access ? 'VIP (Lifetime)' : 'Basic (7d replay)'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                        <Clock className="w-3 h-3" />
                        {event?.start_time ? formatDate(event.start_time) : 'TBD'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Paid
                    </div>
                    {event && (isLive || event.status === 'scheduled') && (
                      <Link
                        href={`/live/${event.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: isLive ? '#EF4444' : 'rgba(56,189,248,0.15)',
                          color: isLive ? 'white' : '#38BDF8'
                        }}
                      >
                        <Play className="w-3 h-3" />
                        {isLive ? 'Join Live' : 'Enter Room'}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
