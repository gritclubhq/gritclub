'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Users, Ticket, Mail, TrendingUp } from 'lucide-react'

export default function HostNetworkPage() {
  const [attendees, setAttendees] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, repeat: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: myEvents } = await supabase.from('events').select('id, title').eq('host_id', user.id)
      if (!myEvents?.length) { setLoading(false); return }
      const eventIds = myEvents.map((e: any) => e.id)
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*, users(id, email, profile_bio, photo_url), events(title)')
        .in('event_id', eventIds)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
      if (tickets) {
        const total = tickets.reduce((sum: number, t: any) => sum + t.amount, 0)
        const userIds = tickets.map((t: any) => t.user_id)
        const uniqueIds = Array.from(new Set(userIds))
        const repeatCount = userIds.length - uniqueIds.length
        const byUser: Record<string, any> = {}
        tickets.forEach((t: any) => {
          if (!byUser[t.user_id]) byUser[t.user_id] = { ...t.users, tickets: 0, spent: 0 }
          byUser[t.user_id].tickets++
          byUser[t.user_id].spent += t.amount
        })
        setAttendees(Object.values(byUser))
        setStats({ total: uniqueIds.length, repeat: repeatCount, revenue: Math.floor(total * 0.5) })
      }
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const getInitials = (email: string) => email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'GC'

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.15)' }}>
            <Users className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Audience</h1>
            <p className="text-slate-400 text-sm">People who attended your events</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Attendees', value: stats.total, icon: Users, color: '#38BDF8' },
            { label: 'Repeat Buyers', value: stats.repeat, icon: TrendingUp, color: '#4ADE80' },
            { label: 'Your Earnings', value: fmt(stats.revenue), icon: Ticket, color: '#C7C7CC' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: '#1C1C1F' }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Attendees</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1C1C1F' }} />)}</div>
        ) : attendees.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#1C1C1F' }}>
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500 mb-1">No attendees yet</p>
            <p className="text-slate-600 text-xs">Your audience will appear here after your first event</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendees.map((person: any, i: number) => (
              <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: '#1C1C1F' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#121214' }}>
                    {person.photo_url ? <img src={person.photo_url} alt="" className="w-full h-full object-cover" /> : getInitials(person.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{person.email?.split('@')[0]}</div>
                    <div className="text-xs text-slate-500 truncate">{person.profile_bio || 'Founder'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: '#4ADE80' }}>{fmt(person.spent)}</div>
                    <div className="text-xs text-slate-500">{person.tickets} ticket{person.tickets !== 1 ? 's' : ''}</div>
                  </div>
                  <a href={`mailto:${person.email}`} className="p-2 rounded-lg" style={{ color: '#38BDF8' }}>
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
