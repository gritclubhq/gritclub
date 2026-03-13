'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { DollarSign, TrendingUp, Ticket, Calendar } from 'lucide-react'

export default function EarningsPage() {
  const [stats, setStats] = useState({ total: 0, payout: 0, tickets: 0, events: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: myEvents } = await supabase.from('events').select('id, title').eq('host_id', user.id)
      if (!myEvents?.length) { setLoading(false); return }

      const eventIds = myEvents.map(e => e.id)
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*, events(title)')
        .in('event_id', eventIds)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      if (ticketData) {
        const total = ticketData.reduce((sum, t) => sum + t.amount, 0)
        setStats({ total, payout: Math.floor(total * 0.5), tickets: ticketData.length, events: myEvents.length })
        setTransactions(ticketData)
      }
      setLoading(false)
    }
    load()

    const channel = supabase.channel('host-earnings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Earnings</h1>
            <p className="text-slate-400 text-sm">Your 50% revenue share · Realtime</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sales', value: fmt(stats.total), icon: DollarSign, color: '#38BDF8' },
            { label: 'Your Payout (50%)', value: fmt(stats.payout), icon: TrendingUp, color: '#4ADE80' },
            { label: 'Tickets Sold', value: stats.tickets, icon: Ticket, color: '#FFD700' },
            { label: 'Total Events', value: stats.events, icon: Calendar, color: '#A855F7' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: '#1E293B' }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Transaction History</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />)}</div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#1E293B' }}>
            <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500 mb-1">No sales yet</p>
            <p className="text-slate-600 text-xs">Create and promote your first event to start earning</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1E293B' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th className="text-left p-4 text-slate-400 font-medium">Event</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Sale</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Your Cut</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td className="p-4 text-slate-300 max-w-[180px] truncate">{t.events?.title}</td>
                    <td className="p-4 text-slate-300">{fmt(t.amount)}</td>
                    <td className="p-4 font-semibold" style={{ color: '#4ADE80' }}>{fmt(Math.floor(t.amount * 0.5))}</td>
                    <td className="p-4 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
