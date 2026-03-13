'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { DollarSign, TrendingUp, Users, Ticket } from 'lucide-react'

export default function AdminRevenuePage() {
  const [stats, setStats] = useState({ total: 0, platform: 0, hosts: 0, tickets: 0, users: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*, events(title), users(email)')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(50)

      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })

      if (ticketData) {
        const total = ticketData.reduce((sum, t) => sum + t.amount, 0)
        setStats({ total, platform: Math.floor(total * 0.5), hosts: Math.floor(total * 0.5), tickets: ticketData.length, users: userCount || 0 })
        setTransactions(ticketData)
      }
      setLoading(false)
    }
    load()

    const channel = supabase.channel('admin-revenue')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.15)' }}>
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
            <p className="text-slate-400 text-sm">50/50 platform split · Realtime</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: fmt(stats.total), icon: DollarSign, color: '#FFD700' },
            { label: 'Platform (50%)', value: fmt(stats.platform), icon: TrendingUp, color: '#38BDF8' },
            { label: 'Host Payouts (50%)', value: fmt(stats.hosts), icon: DollarSign, color: '#4ADE80' },
            { label: 'Total Members', value: stats.users, icon: Users, color: '#A855F7' },
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
        <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Recent Transactions</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />)}</div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#1E293B' }}>
            <Ticket className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">No transactions yet — revenue will appear here after first ticket sale</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1E293B' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th className="text-left p-4 text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Event</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Amount</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Platform Cut</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td className="p-4 text-slate-300">{t.users?.email?.split('@')[0] || 'User'}</td>
                    <td className="p-4 text-slate-300 max-w-[150px] truncate">{t.events?.title || 'Event'}</td>
                    <td className="p-4 font-semibold" style={{ color: '#4ADE80' }}>{fmt(t.amount)}</td>
                    <td className="p-4 text-sky-400">{fmt(Math.floor(t.amount * 0.5))}</td>
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
