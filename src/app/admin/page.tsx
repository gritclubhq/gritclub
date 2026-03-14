'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  Users, Shield, Radio, DollarSign, Bell,
  CheckCircle, XCircle, TrendingUp, ChevronRight,
  ArrowUpRight, Activity, Clock, AlertTriangle
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats {
  users: number
  pendingHosts: number
  liveEvents: number
  revenue: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  admin: { bg: 'rgba(239,68,68,0.12)', color: '#F87171' },
  host: { bg: 'rgba(255,215,0,0.12)', color: '#FFD700' },
  audience: { bg: 'rgba(56,189,248,0.08)', color: '#38BDF8' },
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, bg, border, sub, pulse, alert,
}: {
  label: string; value: string | number; icon: React.ElementType
  color: string; bg: string; border: string
  sub?: string; pulse?: boolean; alert?: boolean
}) {
  return (
    <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
      {alert && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {pulse && (
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            LIVE
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color, fontFamily: 'Space Grotesk' }}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, pendingHosts: 0, liveEvents: 0, revenue: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [pendingApps, setPendingApps] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [notifications, setNotifications] = useState<{ id: number; msg: string; type: 'info' | 'success' | 'warn' }[]>([])
  const [initialized, setInitialized] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const addNotif = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const id = Date.now()
    setNotifications(prev => [{ id, msg, type }, ...prev].slice(0, 4))
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000)
  }

  const loadData = useCallback(async () => {
    try {
      const [usersRes, appsRes, eventsRes, ticketsRes, recentRes, liveRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('host_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('status', 'live'),
        supabase.from('tickets').select('amount').eq('status', 'paid'),
        supabase.from('users').select('id, email, role, photo_url, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('events').select('*, users(email)').eq('status', 'live').limit(5),
      ])

      const revenue = ticketsRes.data?.reduce((s: number, t: any) => s + t.amount, 0) || 0
      setStats({
        users: usersRes.count || 0,
        pendingHosts: appsRes.data?.length || 0,
        liveEvents: eventsRes.data?.length || 0,
        revenue,
      })
      setPendingApps(appsRes.data || [])
      setRecentUsers(recentRes.data || [])
      setLiveEvents(liveRes.data || [])
      setInitialized(true)
    } catch (err) {
      console.error('Admin loadData error:', err)
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    loadData()

    const channels = [
      supabase.channel('admin-users')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, p => {
          addNotif(`🆕 New member: ${p.new.email}`, 'info')
          loadData()
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => loadData())
        .subscribe(),

      supabase.channel('admin-apps')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'host_applications' }, p => {
          addNotif(`🎤 Host application: ${p.new.email}`, 'warn')
          loadData()
        })
        .subscribe(),

      supabase.channel('admin-events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => loadData())
        .subscribe(),

      supabase.channel('admin-tickets')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, p => {
          addNotif(`💰 Ticket sold: ${fmt(p.new.amount)}`, 'success')
          loadData()
        })
        .subscribe(),
    ]

    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [loadData])

  const approve = async (app: any) => {
    setApprovingId(app.id)
    const [r1, r2] = await Promise.all([
      supabase.from('users').update({ role: 'host', host_approved: true }).eq('id', app.user_id),
      supabase.from('host_applications').update({ status: 'approved' }).eq('id', app.id),
    ])
    if (r1.error || r2.error) {
      alert('Approval failed: ' + (r1.error?.message || r2.error?.message))
    } else {
      addNotif(`✅ ${app.email} approved as host!`, 'success')
    }
    setApprovingId(null)
    loadData()
  }

  const reject = async (app: any) => {
    await supabase.from('host_applications').update({ status: 'rejected' }).eq('id', app.id)
    addNotif(`❌ ${app.email} rejected`, 'warn')
    loadData()
  }

  const notifColors = {
    info: { bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)', color: '#38BDF8' },
    success: { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ADE80' },
    warn: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', color: '#FCD34D' },
  }

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* ── Notifications ── */}
          <div className="space-y-2">
            {notifications.map(n => {
              const c = notifColors[n.type]
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                >
                  <Bell className="w-4 h-4 flex-shrink-0" />
                  {n.msg}
                </div>
              )
            })}
          </div>

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">Platform</p>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Admin HQ</h1>
            </div>
            <div
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-bold"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Members" icon={Users}
              value={initialized ? stats.users : '...'}
              color="#38BDF8" bg="rgba(56,189,248,0.06)" border="rgba(56,189,248,0.15)"
            />
            <StatCard
              label="Pending Hosts" icon={Shield}
              value={initialized ? stats.pendingHosts : '...'}
              color="#FCD34D" bg="rgba(252,211,77,0.06)" border="rgba(252,211,77,0.15)"
              alert={stats.pendingHosts > 0}
              sub={stats.pendingHosts > 0 ? `${stats.pendingHosts} need review` : undefined}
            />
            <StatCard
              label="Live Now" icon={Radio}
              value={initialized ? stats.liveEvents : '...'}
              color="#F87171" bg="rgba(239,68,68,0.06)" border="rgba(239,68,68,0.15)"
              pulse={stats.liveEvents > 0}
            />
            <StatCard
              label="Total Revenue" icon={DollarSign}
              value={initialized ? fmt(stats.revenue) : '...'}
              color="#4ADE80" bg="rgba(74,222,128,0.06)" border="rgba(74,222,128,0.15)"
              sub="All time"
            />
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Pending Applications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  Host Applications
                  {pendingApps.length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(252,211,77,0.15)', color: '#FCD34D' }}
                    >
                      {pendingApps.length}
                    </span>
                  )}
                </h2>
                <Link href="/admin/hosts" className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                  View all →
                </Link>
              </div>

              {!initialized ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />
                  ))}
                </div>
              ) : pendingApps.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: '#1E293B', border: '1px solid #334155' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(100,116,139,0.15)' }}>
                    <Shield className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">All clear</p>
                  <p className="text-slate-600 text-xs mt-1">No pending host applications</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingApps.map(app => (
                    <div
                      key={app.id}
                      className="rounded-2xl p-4"
                      style={{ background: '#1E293B', border: '1px solid rgba(252,211,77,0.2)' }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700' }}
                        >
                          {app.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{app.email}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{app.expertise}</p>
                          {app.reason && (
                            <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                              "{app.reason}"
                            </p>
                          )}
                          <p className="text-slate-600 text-xs mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(app.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approve(app)}
                          disabled={approvingId === app.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {approvingId === app.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => reject(app)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Recent Members</h2>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#1E293B', border: '1px solid #334155' }}
              >
                {!initialized ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: '#334155' }} />
                    ))}
                  </div>
                ) : recentUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-slate-500 text-sm">No members yet</p>
                  </div>
                ) : (
                  recentUsers.map((u, i) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      style={{ borderBottom: i < recentUsers.length - 1 ? '1px solid #334155' : 'none' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}
                      >
                        {u.photo_url
                          ? <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                          : u.email[0].toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.email.split('@')[0]}</p>
                        <p className="text-xs text-slate-500">{timeAgo(u.created_at)}</p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={ROLE_STYLE[u.role] || ROLE_STYLE.audience}
                      >
                        {u.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Live Events */}
          {liveEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Live Right Now
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {liveEvents.map(ev => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                      <Radio className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{ev.title}</p>
                      <p className="text-slate-500 text-xs">{ev.users?.email?.split('@')[0]}</p>
                    </div>
                    <Link href={`/live/${ev.id}`} className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick nav ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/admin/hosts', label: 'Host Approvals', icon: Shield, color: '#FCD34D' },
              { href: '/admin/events', label: 'All Events', icon: Radio, color: '#38BDF8' },
              { href: '/admin/revenue', label: 'Revenue', icon: DollarSign, color: '#4ADE80' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl group transition-all hover:border-slate-600"
                style={{ background: '#1E293B', border: '1px solid #334155' }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  <span className="text-sm font-medium text-white">{item.label}</span>
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
