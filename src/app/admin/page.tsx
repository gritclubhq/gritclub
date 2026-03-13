'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { Users, Shield, Radio, DollarSign, TrendingUp, Bell } from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, pendingHosts: 0, liveEvents: 0, revenue: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [pendingApps, setPendingApps] = useState<any[]>([])
  const [notification, setNotification] = useState('')

  const loadData = async () => {
    const [
      { count: userCount },
      { data: apps },
      { data: liveEvs },
      { data: tickets },
      { data: users }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('host_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('events').select('*').eq('status', 'live'),
      supabase.from('tickets').select('amount').eq('status', 'paid'),
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(8)
    ])

    const revenue = tickets?.reduce((s, t) => s + t.amount, 0) || 0
    setStats({ users: userCount || 0, pendingHosts: apps?.length || 0, liveEvents: liveEvs?.length || 0, revenue })
    setPendingApps(apps || [])
    setRecentUsers(users || [])
  }

  useEffect(() => {
    loadData()

    // Realtime: new user joins
    const userChannel = supabase.channel('admin-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        setNotification(`🆕 New member: ${payload.new.email}`)
        setTimeout(() => setNotification(''), 4000)
        loadData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => loadData())
      .subscribe()

    // Realtime: new host application
    const appChannel = supabase.channel('admin-apps')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'host_applications' }, (payload) => {
        setNotification(`🎤 New host application from ${payload.new.email}`)
        setTimeout(() => setNotification(''), 4000)
        loadData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'host_applications' }, () => loadData())
      .subscribe()

    // Realtime: events change
    const eventChannel = supabase.channel('admin-events-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(userChannel)
      supabase.removeChannel(appChannel)
      supabase.removeChannel(eventChannel)
    }
  }, [])

  const approve = async (app: any) => {
    await supabase.from('users').update({ role: 'host', host_approved: true }).eq('id', app.user_id)
    await supabase.from('host_applications').update({ status: 'approved' }).eq('id', app.id)
    loadData()
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const roleColor = (r: string) => r === 'admin' ? '#F87171' : r === 'host' ? '#FFD700' : '#38BDF8'
  const roleBg = (r: string) => r === 'admin' ? 'rgba(239,68,68,0.15)' : r === 'host' ? 'rgba(255,215,0,0.15)' : 'rgba(56,189,248,0.1)'

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Live notification banner */}
        {notification && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse"
            style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
            <Bell className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-sm text-sky-300 font-medium">{notification}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin HQ</h1>
            <p className="text-slate-400 text-sm mt-0.5">Live platform overview</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            LIVE
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Members', value: stats.users, icon: Users, color: '#38BDF8' },
            { label: 'Pending Hosts', value: stats.pendingHosts, icon: Shield, color: '#FFD700', alert: stats.pendingHosts > 0 },
            { label: 'Live Events', value: stats.liveEvents, icon: Radio, color: '#EF4444' },
            { label: 'Total Revenue', value: fmt(stats.revenue), icon: DollarSign, color: '#4ADE80' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 relative" style={{ background: '#1E293B', border: s.alert ? '1px solid rgba(255,215,0,0.4)' : 'none' }}>
              {s.alert && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />}
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pending Host Applications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Pending Host Applications ({pendingApps.length})
              </h2>
              <Link href="/admin/hosts" className="text-xs text-sky-400 hover:underline">View all →</Link>
            </div>
            {pendingApps.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#1E293B' }}>
                <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-slate-500 text-sm">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApps.slice(0, 3).map(app => (
                  <div key={app.id} className="rounded-xl p-4" style={{ background: '#1E293B', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{app.email}</div>
                        <div className="text-xs text-slate-500">{app.expertise}</div>
                      </div>
                      <button onClick={() => approve(app)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}>
                        Approve ✓
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{app.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Members — live */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Recent Members ({stats.users} total)
              </h2>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#1E293B' }}>
              {recentUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No members yet</div>
              ) : (
                recentUsers.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < recentUsers.length - 1 ? '1px solid #334155' : 'none' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                      {u.photo_url ? <img src={u.photo_url} alt="" className="w-full h-full object-cover" /> : u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{u.email.split('@')[0]}</div>
                      <div className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ background: roleBg(u.role), color: roleColor(u.role) }}>
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { href: '/admin/hosts', label: 'Host Approvals', icon: Shield, color: '#FFD700' },
            { href: '/admin/events', label: 'All Events', icon: Radio, color: '#38BDF8' },
            { href: '/admin/revenue', label: 'Revenue', icon: DollarSign, color: '#4ADE80' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-105"
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
