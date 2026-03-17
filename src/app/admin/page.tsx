'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  Users, Shield, Radio, DollarSign, Bell, CheckCircle, XCircle,
  TrendingUp, Trash2, Ban, UserCheck, Activity, ChevronRight,
  AlertTriangle, Eye, Search, X, Loader2, Send, Globe, Settings,
  BarChart2, FileText, Clock, Check
} from 'lucide-react'

const C = {
  bg:       '#0A0F1E', surface:  '#0D1428', card:     '#111827', cardHover: '#141E35',
  border:   'rgba(255,255,255,0.06)', borderHover: 'rgba(37,99,235,0.3)',
  text:     '#F0F4FF', textMuted:'#7B8DB0', textDim:  '#3D4F6E',
  blue:     '#2563EB', blueLight:'#3B82F6', blueDim:  'rgba(37,99,235,0.12)',
  gold:     '#F59E0B', goldDim:  'rgba(245,158,11,0.1)',
  red:      '#EF4444', redDim:   'rgba(239,68,68,0.1)',
  green:    '#10B981', greenDim: 'rgba(16,185,129,0.1)',
  purple:   '#7C3AED', purpleDim:'rgba(124,58,237,0.1)',
}

type AdminTab = 'overview'|'users'|'hosts'|'events'|'revenue'|'content'|'audit'

const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const timeAgo = (ts: string) => {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}
const fmt = (cents: number) => `$${(cents/100).toFixed(2)}`

const ROLE_STYLE: Record<string, {bg:string;color:string}> = {
  admin:    { bg: C.redDim,    color: C.red       },
  host:     { bg: C.goldDim,   color: C.gold      },
  audience: { bg: C.blueDim,   color: C.blueLight },
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon:Icon, color, bg, border, sub, alert, pulse }: any) {
  return (
    <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
      {alert && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />}
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {pulse && <span className="flex items-center gap-1 text-xs font-bold" style={{ color }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />LIVE</span>}
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color, fontFamily:'Syne,sans-serif' }}>{value}</p>
      <p className="text-xs uppercase tracking-wider" style={{ color: C.textDim }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: color+'CC' }}>{sub}</p>}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [currentUser,  setCurrentUser]  = useState<any>(null)
  const [activeTab,    setActiveTab]    = useState<AdminTab>('overview')
  const [stats,        setStats]        = useState({ users:0, pendingHosts:0, liveEvents:0, revenue:0, posts:0, groups:0 })
  const [users,        setUsers]        = useState<any[]>([])
  const [pendingApps,  setPendingApps]  = useState<any[]>([])
  const [events,       setEvents]       = useState<any[]>([])
  const [posts,        setPosts]        = useState<any[]>([])
  const [auditLog,     setAuditLog]     = useState<any[]>([])
  const [notifications,setNotifications]= useState<{id:number;msg:string;type:string}[]>([])
  const [initialized,  setInitialized]  = useState(false)
  const [actionLoading,setActionLoading]= useState<string|null>(null)
  const [userSearch,   setUserSearch]   = useState('')
  // (announcements moved to Content page)
  const [annTitle,     setAnnTitle]     = useState('')
  const [annBody,      setAnnBody]      = useState('')
  const [annSaving,    setAnnSaving]    = useState(false)
  const [annSaved,     setAnnSaved]     = useState(false)
  const [announcements,setAnnouncements]= useState<any[]>([])

  const addNotif = (msg: string, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [{ id, msg, type }, ...prev].slice(0, 5))
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000)
  }

  const logAction = async (action: string, targetType: string, targetId: string | null, details = {}) => {
    if (!currentUser) return
    await supabase.from('admin_audit_log').insert({
      admin_id:    currentUser.id,
      action,
      target_type: targetType,
      target_id:   targetId,
      details,
    })
  }

  const loadData = useCallback(async () => {
    const [usersRes, appsRes, eventsRes, ticketsRes, postsRes, groupsRes, auditRes, annRes] = await Promise.all([
      supabase.from('users').select('id, email, full_name, role, photo_url, created_at, is_suspended, is_premium').order('created_at', { ascending: false }).limit(50),
      supabase.from('host_applications').select('*').eq('status','pending').order('created_at',{ascending:false}),
      supabase.from('events').select('*, users(email,full_name)').order('created_at',{ascending:false}).limit(30),
      supabase.from('tickets').select('amount').eq('status','paid'),
      supabase.from('posts').select('id, content, created_at, user_id, users(email,full_name)').order('created_at',{ascending:false}).limit(30),
      supabase.from('groups').select('*', { count:'exact', head:true }),
      supabase.from('admin_audit_log').select('*, users(email,full_name)').order('created_at',{ascending:false}).limit(20),
      supabase.from('announcements').select('*').order('created_at',{ascending:false}).limit(10),
    ])

    const revenue = (ticketsRes.data||[]).reduce((s:number,t:any)=>s+t.amount,0)
    const liveCount = (eventsRes.data||[]).filter((e:any)=>e.status==='live').length

    setStats({
      users:        usersRes.data?.length   || 0,
      pendingHosts: appsRes.data?.length    || 0,
      liveEvents:   liveCount,
      revenue,
      posts:        postsRes.data?.length   || 0,
      groups:       groupsRes.count         || 0,
    })
    setUsers(usersRes.data   || [])
    setPendingApps(appsRes.data || [])
    setEvents(eventsRes.data || [])
    setPosts(postsRes.data   || [])
    setAuditLog(auditRes.data || [])
    setAnnouncements(annRes.data || [])
    setInitialized(true)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setCurrentUser(u)
    })
    loadData()

    // Realtime listeners
    const channels = [
      supabase.channel('admin-users-rt')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'users'},p=>{
          addNotif(`🆕 New member: ${p.new.email}`,'info'); loadData()
        }).subscribe(),
      supabase.channel('admin-apps-rt')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'host_applications'},p=>{
          addNotif(`🎤 Host application: ${p.new.email}`,'warn'); loadData()
        }).subscribe(),
      supabase.channel('admin-tickets-rt')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'tickets'},p=>{
          addNotif(`💰 Ticket sold: ${fmt(p.new.amount)}`,'success'); loadData()
        }).subscribe(),
      supabase.channel('admin-events-rt')
        .on('postgres_changes',{event:'*',schema:'public',table:'events'},()=>loadData()).subscribe(),
    ]
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [loadData])

  // ── Host approval ──
  const approveHost = async (app: any) => {
    setActionLoading(app.id)
    await Promise.all([
      supabase.from('users').update({ role:'host', host_approved:true }).eq('id', app.user_id),
      supabase.from('host_applications').update({ status:'approved' }).eq('id', app.id),
    ])
    await logAction('approve_host', 'user', app.user_id, { email: app.email })
    addNotif(`✅ ${app.email} approved as host!`, 'success')
    setActionLoading(null)
    loadData()
  }

  const rejectHost = async (app: any) => {
    setActionLoading(app.id+'-reject')
    await supabase.from('host_applications').update({ status:'rejected' }).eq('id', app.id)
    await logAction('reject_host', 'user', app.user_id, { email: app.email })
    addNotif(`❌ ${app.email} rejected`, 'warn')
    setActionLoading(null)
    loadData()
  }

  // ── User management ──
  const suspendUser = async (user: any) => {
    if (!confirm(`${user.is_suspended ? 'Unsuspend' : 'Suspend'} ${user.email}?`)) return
    setActionLoading('suspend-'+user.id)
    await supabase.from('users').update({ is_suspended: !user.is_suspended }).eq('id', user.id)
    await logAction(user.is_suspended ? 'unsuspend_user' : 'suspend_user', 'user', user.id, { email: user.email })
    addNotif(`${user.is_suspended ? 'Unsuspended' : 'Suspended'}: ${user.email}`, 'warn')
    setActionLoading(null)
    loadData()
  }

  const changeRole = async (userId: string, email: string, newRole: string) => {
    setActionLoading('role-'+userId)
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    await logAction('change_role', 'user', userId, { email, new_role: newRole })
    addNotif(`Role updated: ${email} → ${newRole}`, 'info')
    setActionLoading(null)
    loadData()
  }

  const grantPremium = async (userId: string, email: string, current: boolean) => {
    setActionLoading('premium-'+userId)
    await supabase.from('users').update({ is_premium: !current }).eq('id', userId)
    await logAction(!current ? 'grant_premium' : 'revoke_premium', 'user', userId, { email })
    addNotif(`Premium ${!current ? 'granted' : 'revoked'}: ${email}`, 'success')
    setActionLoading(null)
    loadData()
  }

  // ── Content moderation ──
  const deletePost = async (postId: string, userId: string) => {
    if (!confirm('Delete this post?')) return
    setActionLoading('post-'+postId)
    await supabase.from('posts').delete().eq('id', postId)
    await logAction('delete_post', 'post', postId, { user_id: userId })
    addNotif('🗑 Post deleted', 'warn')
    setActionLoading(null)
    loadData()
  }

  const forceEndEvent = async (eventId: string, title: string) => {
    if (!confirm(`Force end event: "${title}"?`)) return
    await supabase.from('events').update({ status:'ended', ended_at: new Date().toISOString() }).eq('id', eventId)
    await logAction('force_end_event', 'event', eventId, { title })
    addNotif(`⏹ Event ended: ${title}`, 'warn')
    loadData()
  }

  // ── Announcement ──
  const sendAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) return
    setAnnSaving(true)
    await supabase.from('announcements').insert({
      title:      annTitle.trim().slice(0,200),
      body:       annBody.trim().slice(0,1000),
      is_active:  true,
      created_by: currentUser?.id,
    })
    await supabase.from('posts').insert({
      user_id:        currentUser?.id,
      content:        `📢 ${annTitle.trim()}\n\n${annBody.trim()}`,
      image_urls:     [],
      likes_count:    0,
      comments_count: 0,
    })
    await logAction('create_announcement', 'platform', null, { title: annTitle })
    addNotif('📢 Announcement posted to community feed!', 'success')
    setAnnTitle(''); setAnnBody('')
    setAnnSaved(true); setTimeout(() => setAnnSaved(false), 3000)
    setAnnSaving(false)
    loadData()
  }

  const deactivateAnn = async (id: string) => {
    await supabase.from('announcements').update({ is_active: false }).eq('id', id)
    loadData()
  }

  const notifColors: Record<string,(string)> = {
    info:    C.blueLight,
    success: C.green,
    warn:    C.gold,
  }

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return !q || u.email?.toLowerCase().includes(q) || (u.full_name||'').toLowerCase().includes(q)
  })

  const TABS: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',      icon: BarChart2 },
    { id: 'users',     label: 'Users',          icon: Users,    badge: stats.users },
    { id: 'hosts',     label: 'Host Approvals', icon: UserCheck,badge: stats.pendingHosts },
    { id: 'events',    label: 'Events',         icon: Radio },
    { id: 'content',   label: 'Content',        icon: FileText },
    { id: 'revenue',   label: 'Revenue',        icon: DollarSign },

    { id: 'audit',     label: 'Audit Log',      icon: Clock },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Notifications */}
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium animate-in slide-in-from-top-2"
                style={{ background: notifColors[n.type]+'15', border:`1px solid ${notifColors[n.type]}25`, color: notifColors[n.type] }}>
                <Bell className="w-4 h-4 flex-shrink-0" />{n.msg}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.red }}>Platform</p>
              <h1 className="text-2xl font-bold" style={{ color: C.text, fontFamily:'Syne,sans-serif' }}>Admin HQ</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: C.greenDim, color: C.green }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
                style={{ background: activeTab===tab.id ? C.blue : C.card, color: activeTab===tab.id ? '#fff' : C.textMuted, border:`1px solid ${activeTab===tab.id ? C.blue : C.border}` }}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: activeTab===tab.id ? 'rgba(255,255,255,0.2)' : tab.id==='hosts' ? C.goldDim : C.blueDim, color: activeTab===tab.id ? '#fff' : tab.id==='hosts' ? C.gold : C.blueLight }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard label="Total Members" value={initialized ? stats.users : '...'} icon={Users} color={C.blueLight} bg={C.blueDim} border="rgba(37,99,235,0.2)" />
                <StatCard label="Pending Hosts" value={initialized ? stats.pendingHosts : '...'} icon={Shield} color={C.gold} bg={C.goldDim} border="rgba(245,158,11,0.2)" alert={stats.pendingHosts>0} sub={stats.pendingHosts>0?`${stats.pendingHosts} need review`:undefined} />
                <StatCard label="Live Events" value={initialized ? stats.liveEvents : '...'} icon={Radio} color={C.red} bg={C.redDim} border="rgba(239,68,68,0.2)" pulse={stats.liveEvents>0} />
                <StatCard label="Total Revenue" value={initialized ? fmt(stats.revenue) : '...'} icon={DollarSign} color={C.green} bg={C.greenDim} border="rgba(16,185,129,0.2)" sub="All time" />
                <StatCard label="Total Posts" value={initialized ? stats.posts : '...'} icon={FileText} color={C.purple} bg={C.purpleDim} border="rgba(124,58,237,0.2)" />
                <StatCard label="Groups" value={initialized ? stats.groups : '...'} icon={Users} color={C.gold} bg={C.goldDim} border="rgba(245,158,11,0.2)" />
              </div>
              {/* Quick links */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TABS.filter(t=>t.id!=='overview').slice(0,4).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group"
                    style={{ background: C.card, border:`1px solid ${C.border}` }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.borderHover}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border}}>
                    <div className="flex items-center gap-2">
                      <tab.icon className="w-4 h-4" style={{ color: C.blueLight }} />
                      <span className="text-sm font-medium" style={{ color: C.text }}>{tab.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: C.textDim }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textDim }} />
                <input type="text" value={userSearch} onChange={e=>setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: C.card, border:`1px solid ${C.border}`, color: C.text }}
                  onFocus={e=>(e.target.style.borderColor=C.borderHover)}
                  onBlur={e=>(e.target.style.borderColor=C.border)} />
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border:`1px solid ${C.border}` }}>
                <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ background: C.surface, color: C.textDim, borderBottom:`1px solid ${C.border}` }}>
                  <div className="col-span-4">User</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Joined</div>
                  <div className="col-span-4">Actions</div>
                </div>
                {filteredUsers.map((u, i) => (
                  <div key={u.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 text-sm"
                    style={{ borderBottom: i < filteredUsers.length-1 ? `1px solid ${C.border}` : 'none', opacity: u.is_suspended ? 0.6 : 1 }}>
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                        style={{ background: C.blueDim, color: C.blueLight }}>
                        {u.photo_url ? <img src={u.photo_url} alt="" className="w-full h-full object-cover" /> : (u.email?.[0]||'U').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: C.text }}>{getName(u)}</p>
                        <p className="text-xs truncate" style={{ color: C.textDim }}>{u.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <select value={u.role} disabled={actionLoading === 'role-'+u.id}
                        onChange={e => changeRole(u.id, u.email, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                        style={{ background: ROLE_STYLE[u.role]?.bg || C.border, color: ROLE_STYLE[u.role]?.color || C.textMuted, border:'none' }}>
                        <option value="audience">Member</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-xs" style={{ color: C.textDim }}>
                      {timeAgo(u.created_at)}
                    </div>
                    <div className="col-span-4 flex items-center gap-1.5 flex-wrap">
                      {/* Premium toggle */}
                      <button onClick={() => grantPremium(u.id, u.email, u.is_premium)}
                        disabled={actionLoading === 'premium-'+u.id}
                        className="text-xs px-2 py-1 rounded-lg transition-all"
                        style={{ background: u.is_premium ? C.goldDim : C.border, color: u.is_premium ? C.gold : C.textDim }}>
                        {u.is_premium ? '⭐ Prem' : 'Free'}
                      </button>
                      {/* Suspend */}
                      <button onClick={() => suspendUser(u)}
                        disabled={actionLoading === 'suspend-'+u.id}
                        className="text-xs px-2 py-1 rounded-lg transition-all"
                        style={{ background: u.is_suspended ? C.greenDim : C.redDim, color: u.is_suspended ? C.green : C.red }}>
                        {actionLoading === 'suspend-'+u.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HOST APPROVALS ── */}
          {activeTab === 'hosts' && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                {pendingApps.length} pending application{pendingApps.length!==1?'s':''}
              </p>
              {pendingApps.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: C.card, border:`1px solid ${C.border}` }}>
                  <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p className="font-semibold" style={{ color: C.textMuted }}>No pending applications</p>
                </div>
              ) : (
                pendingApps.map(app => (
                  <div key={app.id} className="rounded-2xl p-4" style={{ background: C.card, border:`1px solid rgba(245,158,11,0.2)` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: C.goldDim, color: C.gold }}>
                        {app.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: C.text }}>{app.email}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{app.expertise}</p>
                        {app.reason && <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: C.textDim }}>"{app.reason}"</p>}
                        <p className="text-xs mt-1" style={{ color: C.textDim }}>{timeAgo(app.created_at)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approveHost(app)} disabled={actionLoading===app.id}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: C.greenDim, color: C.green, border:`1px solid rgba(16,185,129,0.25)` }}>
                          {actionLoading===app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button onClick={() => rejectHost(app)} disabled={actionLoading===app.id+'-reject'}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: C.redDim, color: C.red, border:`1px solid rgba(239,68,68,0.25)` }}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── EVENTS ── */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: C.card, border:`1px solid ${ev.status==='live'?'rgba(239,68,68,0.25)':C.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: ev.status==='live' ? C.redDim : C.blueDim }}>
                    <Radio className="w-4 h-4" style={{ color: ev.status==='live' ? C.red : C.blueLight }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{ev.title}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>
                      {getName(ev.users)} · {ev.status} · {ev.total_sold||0} tickets
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: C.gold }}>
                      {fmt((ev.price||0)*(ev.total_sold||0)*0.8)}
                    </span>
                    {ev.status === 'live' && (
                      <button onClick={() => forceEndEvent(ev.id, ev.title)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: C.redDim, color: C.red }}>
                        Force End
                      </button>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: ev.status==='live' ? C.redDim : C.border, color: ev.status==='live' ? C.red : C.textDim }}>
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CONTENT MODERATION ── */}
          {activeTab === 'content' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: C.textMuted }}>Recent Posts</p>
              {posts.map(post => (
                <div key={post.id} className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: C.card, border:`1px solid ${C.border}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: C.blueDim, color: C.blueLight }}>
                    {getName(post.users)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: C.blueLight }}>{getName(post.users)}</p>
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: C.textMuted }}>{post.content}</p>
                    <p className="text-xs mt-1" style={{ color: C.textDim }}>{timeAgo(post.created_at)}</p>
                  </div>
                  <button onClick={() => deletePost(post.id, post.user_id)}
                    disabled={actionLoading==='post-'+post.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                    style={{ background: C.redDim, color: C.red }}>
                    {actionLoading==='post-'+post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── REVENUE ── */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-5" style={{ background: C.card, border:`1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.textDim }}>Total Revenue</p>
                  <p className="text-3xl font-bold" style={{ color: C.green }}>{fmt(stats.revenue)}</p>
                  <p className="text-xs mt-1" style={{ color: C.textDim }}>Platform 20% cut included</p>
                </div>
                <div className="rounded-2xl p-5" style={{ background: C.card, border:`1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.textDim }}>Platform Earnings</p>
                  <p className="text-3xl font-bold" style={{ color: C.gold }}>{fmt(stats.revenue * 0.2)}</p>
                  <p className="text-xs mt-1" style={{ color: C.textDim }}>20% platform fee</p>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: C.card, border:`1px solid ${C.border}` }}>
                <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Revenue by Event</p>
                {events.filter(e => (e.total_sold||0) > 0).slice(0,10).map(ev => (
                  <div key={ev.id} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{ev.total_sold||0} tickets sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: C.gold }}>{fmt((ev.price||0)*(ev.total_sold||0))}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>gross</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AUDIT LOG ── */}
          {activeTab === 'audit' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border:`1px solid ${C.border}` }}>
              {auditLog.length === 0 ? (
                <div className="p-10 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p style={{ color: C.textMuted }}>No audit events yet</p>
                </div>
              ) : (
                auditLog.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i<auditLog.length-1?`1px solid ${C.border}`:'none' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: C.surface }}>
                      <Activity className="w-4 h-4" style={{ color: C.blueLight }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: C.text }}>
                        <span style={{ color: C.blueLight }}>{getName(entry.users)}</span>
                        {' '}{entry.action.replace(/_/g,' ')}
                        {entry.target_type && <span style={{ color: C.textDim }}> · {entry.target_type}</span>}
                      </p>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <p className="text-xs" style={{ color: C.textDim }}>
                          {Object.entries(entry.details).map(([k,v])=>`${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p className="text-xs flex-shrink-0" style={{ color: C.textDim }}>{timeAgo(entry.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
