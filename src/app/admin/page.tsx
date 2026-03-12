'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { formatCurrency } from '@/lib/utils'
import { Shield, DollarSign, Users, Radio, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, hosts: 0, events: 0, tickets: 0 })
  const [applications, setApplications] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    // Realtime activity feed
    const channel = supabase
      .channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (p: any) => {
        setActivity(prev => [{
          type: 'ticket',
          message: `New ticket sold — ${formatCurrency(p.new.amount)}`,
          time: new Date().toLocaleTimeString(),
        }, ...prev.slice(0, 19)])
        setStats(s => ({ ...s, revenue: s.revenue + Math.floor(p.new.amount * 0.5), tickets: s.tickets + 1 }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'host_applications' }, () => {
        loadApplications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadData = async () => {
    await Promise.all([loadStats(), loadApplications(), loadLiveEvents()])
    setLoading(false)
  }

  const loadStats = async () => {
    const [tickets, hosts, events] = await Promise.all([
      supabase.from('tickets').select('amount').eq('status', 'paid'),
      supabase.from('users').select('id').eq('role', 'host'),
      supabase.from('events').select('id'),
    ])
    const revenue = (tickets.data || []).reduce((s: number, t: any) => s + Math.floor(t.amount * 0.5), 0)
    setStats({
      revenue,
      hosts: hosts.data?.length || 0,
      events: events.data?.length || 0,
      tickets: tickets.data?.length || 0,
    })
  }

  const loadApplications = async () => {
    const { data } = await supabase
      .from('host_applications')
      .select('*, users(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setApplications(data || [])
  }

  const loadLiveEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'live')
    setLiveEvents(data || [])
  }

  const approveHost = async (appId: string, userId: string) => {
    await supabase.from('users').update({ role: 'host', host_approved: true }).eq('id', userId)
    await supabase.from('host_applications').update({ status: 'approved' }).eq('id', appId)
    setApplications(prev => prev.filter(a => a.id !== appId))
    setStats(s => ({ ...s, hosts: s.hosts + 1 }))
    setActivity(prev => [{ type: 'approval', message: 'Host approved', time: new Date().toLocaleTimeString() }, ...prev])
  }

  const rejectHost = async (appId: string) => {
    await supabase.from('host_applications').update({ status: 'rejected' }).eq('id', appId)
    setApplications(prev => prev.filter(a => a.id !== appId))
  }

  const terminateStream = async (eventId: string) => {
    if (confirm('Terminate this live stream?')) {
      await supabase.from('events').update({ status: 'ended' }).eq('id', eventId)
      setLiveEvents(prev => prev.filter(e => e.id !== eventId))
    }
  }

  const adminStats = [
    { label: 'Platform Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
    { label: 'Active Hosts', value: stats.hosts.toString(), icon: Shield, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    { label: 'Total Events', value: stats.events.toString(), icon: Radio, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Tickets Sold', value: stats.tickets.toString(), icon: Users, color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-red-400" />
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Admin HQ</h1>
          </div>
          <p className="text-slate-400 text-sm">Platform oversight and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {adminStats.map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold mb-1 earnings-tick" style={{ fontFamily: 'Space Grotesk', color: s.color }}>
                {loading ? '...' : s.value}
              </div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Host applications */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                Host Applications
                {applications.length > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#EF4444', color: 'white' }}>
                    {applications.length}
                  </span>
                )}
              </h2>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="text-slate-400 text-sm">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="flex items-center justify-between gap-4 p-3 rounded-xl" style={{ background: '#0F172A', border: '1px solid #334155' }}>
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{app.users?.email || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{app.reason || 'No reason provided'}</div>
                      <div className="text-xs text-slate-600 mt-1">{new Date(app.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approveHost(app.id, app.user_id)}
                        className="p-2 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectHost(app.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Live streams monitor */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" />
                Live Streams
                <span className="w-2 h-2 rounded-full bg-red-400 live-dot" />
              </h2>
              {liveEvents.length === 0 ? (
                <p className="text-slate-500 text-sm">No active streams</p>
              ) : (
                <div className="space-y-2">
                  {liveEvents.map(evt => (
                    <div key={evt.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{evt.title}</div>
                        <div className="text-xs text-slate-500">{evt.viewer_peak} viewers</div>
                      </div>
                      <button onClick={() => terminateStream(evt.id)} className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-400/10 flex-shrink-0 transition-colors">
                        Terminate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                Live Activity
              </h2>
              {activity.length === 0 ? (
                <p className="text-slate-500 text-sm">No recent activity</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs chat-message">
                      <AlertCircle className="w-3 h-3 text-sky-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-slate-300">{a.message}</div>
                        <div className="text-slate-600">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
