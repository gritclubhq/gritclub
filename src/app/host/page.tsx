'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DollarSign, Radio, Users, PlusCircle, TrendingUp,
  Play, Edit, BarChart2, Clock, ArrowUpRight, Zap,
  Calendar, Eye, ChevronRight, Flame
} from 'lucide-react'

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

        const channel = supabase
          .channel('host-tickets')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload: any) => {
            setEarnings(prev => prev + Math.floor(payload.new.amount * 0.8))
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

    const eventIds = (evts || []).map((e: any) => e.id)
    if (eventIds.length > 0) {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('amount')
        .in('event_id', eventIds)
        .eq('status', 'paid')

      const total = (tickets || []).reduce((sum: number, t: any) => sum + Math.floor(t.amount * 0.8), 0)
      setEarnings(total)
      setTotalTickets((tickets || []).length)
    }

    setLoading(false)
  }

  const liveEvent = events.find(e => e.status === 'live')
  const scheduledEvents = events.filter(e => e.status === 'scheduled')
  const pastEvents = events.filter(e => e.status === 'ended')

  const conversionRate = events.length > 0
    ? Math.round((totalTickets / Math.max(events.reduce((s, e) => s + (e.capacity || 50), 0), 1)) * 100)
    : 0

  const stats = [
    {
      label: 'Total Earnings',
      value: loading ? '...' : formatCurrency(earnings),
      sub: 'You keep 80%',
      icon: DollarSign,
      color: '#A67C52',
      bg: 'rgba(255,215,0,0.08)',
      border: 'rgba(255,215,0,0.2)',
      trend: '+12%',
    },
    {
      label: 'Tickets Sold',
      value: loading ? '...' : totalTickets.toString(),
      sub: `${conversionRate}% conversion`,
      icon: Users,
      color: '#38BDF8',
      bg: 'rgba(56,189,248,0.08)',
      border: 'rgba(56,189,248,0.2)',
      trend: '+8%',
    },
    {
      label: 'Total Events',
      value: loading ? '...' : events.length.toString(),
      sub: `${scheduledEvents.length} upcoming`,
      icon: Calendar,
      color: '#8A817C',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
      trend: null,
    },
    {
      label: 'Live Now',
      value: loading ? '...' : events.filter(e => e.status === 'live').length.toString(),
      sub: liveEvent ? liveEvent.title : 'No active stream',
      icon: Flame,
      color: '#F97316',
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.2)',
      trend: null,
      pulse: events.filter(e => e.status === 'live').length > 0,
    },
  ]

  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    live: { label: 'Live', color: '#F87171', bg: 'rgba(239,68,68,0.12)', dot: '#EF4444' },
    scheduled: { label: 'Scheduled', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', dot: '#38BDF8' },
    draft: { label: 'Draft', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', dot: '#64748B' },
    ended: { label: 'Ended', color: '#64748B', bg: 'rgba(100,116,139,0.12)', dot: '#475569' },
  }

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">Host Dashboard</p>
              <h1 className="text-2xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
                {loading ? 'Loading...' : `Hey, ${user?.user_metadata?.full_name?.split(' ')[0] || 'Host'} 👋`}
              </h1>
            </div>
            <Link
              href="/host/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#A67C52', color: '#0F172A' }}
            >
              <PlusCircle className="w-4 h-4" />
              New Event
            </Link>
          </div>

          {/* ── Live banner ── */}
          {liveEvent && (
            <div
              className="relative overflow-hidden rounded-2xl p-4 flex items-center justify-between"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              {/* Glow */}
              <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: '#EF4444' }} />
              <div className="flex items-center gap-3 relative">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.2)' }}>
                    <Radio className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2" style={{ borderColor: '#0F172A' }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider">You're Live</p>
                  <p className="text-[#F5F5F5] font-semibold text-sm">{liveEvent.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{liveEvent.viewer_peak || 0} peak viewers</p>
                </div>
              </div>
              <Link
                href={`/live/${liveEvent.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold relative"
                style={{ background: '#EF4444', color: 'white' }}
              >
                <Play className="w-3.5 h-3.5" />
                Return to Stream
              </Link>
            </div>
          )}

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(s => (
              <div
                key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden group"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.6)' }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  {s.trend && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#4ADE80' }}>
                      <ArrowUpRight className="w-3 h-3" />
                      {s.trend}
                    </span>
                  )}
                  {s.pulse && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold mb-0.5" style={{ color: s.color, fontFamily: "'Sora', system-ui, sans-serif" }}>
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 truncate">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Events section ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#F5F5F5]">Your Events</h2>
              <Link href="/host/create" className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                <PlusCircle className="w-3.5 h-3.5" />
                Create new
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: '#1E293B', border: '1px solid #334155' }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(56,189,248,0.08)' }}>
                  <Radio className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-base font-semibold text-[#F5F5F5] mb-1">No events yet</h3>
                <p className="text-slate-500 text-sm mb-6">Create your first event and start earning 80% of every ticket</p>
                <Link
                  href="/host/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#A67C52', color: '#0F172A' }}
                >
                  <Zap className="w-4 h-4" />
                  Create First Event
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map(event => {
                  const cfg = statusConfig[event.status] || statusConfig.draft
                  const eventEarnings = Math.floor((event.total_sold || 0) * event.price * 0.8)
                  return (
                    <div
                      key={event.id}
                      className="group rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-slate-600"
                      style={{ background: '#1E293B', border: '1px solid #334155' }}
                    >
                      {/* Status indicator */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg }}
                      >
                        <Radio className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {event.start_time ? formatDate(event.start_time) : 'No date set'}
                          </span>
                        </div>
                        <p className="text-[#F5F5F5] font-medium text-sm truncate">{event.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.total_sold || 0} sold
                          </span>
                          <span className="text-slate-500 text-xs">·</span>
                          <span className="text-slate-500 text-xs">
                            {formatCurrency(event.price)} / ticket
                          </span>
                        </div>
                      </div>

                      {/* Earnings */}
                      <div className="hidden sm:block text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: '#A67C52' }}>
                          {formatCurrency(eventEarnings)}
                        </p>
                        <p className="text-xs text-slate-600">earned</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {event.status === 'live' && (
                          <Link
                            href={`/live/${event.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: '#EF4444', color: 'white' }}
                          >
                            <Play className="w-3 h-3" />
                            Go Live
                          </Link>
                        )}
                        {event.status === 'scheduled' && (
                          <Link
                            href={`/live/${event.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}
                          >
                            <Radio className="w-3 h-3" />
                            Start
                          </Link>
                        )}
                        <Link
                          href={`/host/events/${event.id}/edit`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#F5F5F5] transition-colors"
                          style={{ background: 'rgba(51,65,85,0.5)' }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Quick links ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/host/earnings', label: 'Earnings', icon: BarChart2, color: '#A67C52' },
              { href: '/host/payouts', label: 'Payouts', icon: DollarSign, color: '#4ADE80' },
              { href: '/host/network', label: 'Network', icon: Users, color: '#38BDF8' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl group transition-all hover:border-slate-600"
                style={{ background: '#1E293B', border: '1px solid #334155' }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  <span className="text-sm font-medium text-[#F5F5F5]">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
