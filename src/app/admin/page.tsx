'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { Users, Shield, Radio, DollarSign, Bell, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, pendingHosts: 0, liveEvents: 0, revenue: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [pendingApps, setPendingApps] = useState<any[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 5))
    setTimeout(() => setNotifications(prev => prev.filter(n => n !== msg)), 5000)
  }

  const loadData = useCallback(async () => {
    try {
      const [usersRes, appsRes, eventsRes, ticketsRes, recentRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('host_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('status', 'live'),
        supabase.from('tickets').select('amount').eq('status', 'paid'),
        supabase.from('users').select('id, email, role, photo_url, created_at').order('created_at', { ascending: false }).limit(10)
      ])

      const revenue = ticketsRes.data?.reduce((s: number, t: any) => s + t.amount, 0) || 0
      setStats({
        users: usersRes.count || 0,
        pendingHosts: appsRes.data?.length || 0,
        liveEvents: eventsRes.data?.length || 0,
        revenue
      })
      setPendingApps(appsRes.data || [])
      setRecentUsers(recentRes.data || [])
      setInitialized(true)
    } catch (err) {
      console.error('loadData error:', err)
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    loadData()

    const ch1 = supabase.channel('admin-rt-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (p) => {
        addNotification(`🆕 New member joined: ${p.new.email}`)
        loadData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => loadData())
      .subscribe()

    const ch2 = supabase.channel('admin-rt-apps')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'host_applications' }, (p) => {
        addNotification(`🎤 Host application from: ${p.new.email}`)
        loadData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'host_applications' }, () => loadData())
      .subscribe()

    const ch3 = supabase.channel('admin-rt-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => loadData())
      .subscribe()

    const ch4 = supabase.channel('admin-rt-tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (p) => {
        addNotification(`💰 Ticket sold: $${(p.new.amount / 100).toFixed(2)}`)
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
      supabase.removeChannel(ch3)
      supabase.removeChannel(ch4)
    }
  }, [loadData])

  const approve = async (app: any) => {
    const { error: e1 } = await supabase.from('users').update({ role: 'host', host_approved: true }).eq('id', app.user_id)
    const { error: e2 } = await supabase.from('host_applications').update({ status: 'approved' }).eq('id', app.id)
    if (e1 || e2) { alert('Approve failed: ' + (e1?.message || e2?.message)); return }
    addNotification(`✅ ${app.email} approved as host!`)
    loadData()
  }

  const reject = async (app: any) => {
    await supabase.from('host_applications').update({ status: 'rejected' }).eq('id', app.id)
    loadData()
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const roleStyle = (role: string) => ({
    background: role === 'admin' ? 'rgba(239,68,68,0.15)' : role === 'host' ? 'rgba(255,215,0,0.15)' : 'rgba(56,189,248,0.1)',
    color: role === 'admin' ? '#F87171' : role === 'host' ? '#FFD700' : '#38BDF8'
  })

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">

        {/* Live notifications */}
        {notifications.map((n, i) => (
          <div key={i} className="mb-2 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <Bell className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-sm text-sky-300 font-medium">{n}</span>
          </div>
        ))}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin HQ</h1>
            <p className="text-slate-400 text-sm mt-0.5">Live platform overview — updates automatically</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            LIVE
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Members', value: stats.users, icon: Users, color: '#38BDF8' },
            { label: 'Pending Hosts', value: stats.pendingHosts, icon: Shield, color: '#FFD700', alert: stats.pendingHosts > 0 },
            { label: 'Live Now', value: stats.liveEvents, icon: Radio, color: '#EF4444' },
            { label: 'Total Revenue', value: fmt(stats.revenue), icon: DollarSign, color: '#4ADE80' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 relative"
              style={{ background: '#1E293B', border: (s as any).alert ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent' }}>
              {(s as any).alert && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />}
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {initialized ? s.value : '...'}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Pending Applications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Host Applications ({pendingApps.length})
              </h2>
              <Link href="/admin/hosts" className="text-xs text-sky-400 hover:underline">View all →</Link>
            </div>
            {!initialized ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />)}
              </div>
            ) : pendingApps.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#1E293B' }}>
                <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-slate-500 text-sm">No pending applications</p>
                <p className="text-slate-600 text-xs mt-1">New ones will appear here instantly</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApps.map(app => (
                  <div key={app.id} className="rounded-xl p-4"
                    style={{ background: '#1E293B', border: '1px solid rgba(255,215,0,0.25)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{app.email}</div>
                        <div className="text-xs text-slate-400">{app.expertise}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{app.reason}</div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => approve(app)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}>
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => reject(app)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Recent Members
              </h2>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#1E293B' }}>
              {!initialized ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: '#334155' }} />)}
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-500 text-sm">No members yet</p>
                </div>
              ) : (
                recentUsers.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < recentUsers.length - 1 ? '1px solid #334155' : 'none' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                      {u.photo_url
                        ? <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                        : u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{u.email.split('@')[0]}</div>
                      <div className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={roleStyle(u.role)}>
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/admin/hosts', label: 'Host Approvals', icon: Shield, color: '#FFD700' },
            { href: '/admin/events', label: 'All Events', icon: Radio, color: '#38BDF8' },
            { href: '/admin/revenue', label: 'Revenue', icon: DollarSign, color: '#4ADE80' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="rounded-xl p-4 flex items-center gap-3 transition-all hover:opacity-80"
              style={{ background: '#1E293B' }}>
              <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
