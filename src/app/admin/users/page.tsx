'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Search, X, Loader2, Check, Shield, Crown } from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)', text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
}

const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const timeAgo = (ts: string) => {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d/60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [actionId,setActionId]= useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, role, photo_url, created_at, is_suspended, is_premium, username')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const logAction = async (action: string, targetId: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('admin_audit_log').insert({ admin_id: user.id, action, target_type: 'user', target_id: targetId, details })
  }

  const suspend = async (u: any) => {
    if (!confirm(`${u.is_suspended ? 'Unsuspend' : 'Suspend'} ${u.email}?`)) return
    setActionId('s-'+u.id)
    await supabase.from('users').update({ is_suspended: !u.is_suspended }).eq('id', u.id)
    await logAction(u.is_suspended ? 'unsuspend' : 'suspend', u.id, { email: u.email })
    setActionId(null); load()
  }

  const togglePremium = async (u: any) => {
    setActionId('p-'+u.id)
    await supabase.from('users').update({ is_premium: !u.is_premium }).eq('id', u.id)
    await logAction(!u.is_premium ? 'grant_premium' : 'revoke_premium', u.id, { email: u.email })
    setActionId(null); load()
  }

  const changeRole = async (u: any, newRole: string) => {
    setActionId('r-'+u.id)
    await supabase.from('users').update({ role: newRole }).eq('id', u.id)
    await logAction('change_role', u.id, { email: u.email, new_role: newRole })
    setActionId(null); load()
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.email?.toLowerCase().includes(q) || (u.full_name||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q)
  })

  const ROLE_STYLE: Record<string,{bg:string;color:string}> = {
    admin:    { bg: C.redDim,   color: C.red       },
    host:     { bg: C.goldDim,  color: C.gold      },
    audience: { bg: C.blueDim,  color: C.blueLight },
  }

  return (
    <DashboardLayout>
      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: C.blueLight, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Admin</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>
              User Management
            </h1>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginTop: 4 }}>
              {users.length} total members
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: C.textDim }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or username..."
              style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.4)')}
              onBlur={e => (e.target.style.borderColor = C.border)} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textDim }}><X style={{ width: 14, height: 14 }} /></button>}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 style={{ width: 32, height: 32, color: C.blueLight, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 12, padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textDim, fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>

              {filtered.map((u, i) => (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 12, padding: '13px 20px', alignItems: 'center', borderBottom: i < filtered.length-1 ? `1px solid ${C.border}` : 'none', opacity: u.is_suspended ? 0.55 : 1, background: i%2===0?'transparent':'rgba(255,255,255,0.015)' }}>
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.blueLight, fontFamily: 'Syne,sans-serif' }}>
                      {u.photo_url ? <img src={u.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.email?.[0]||'U').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(u)}</p>
                      <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    </div>
                  </div>

                  {/* Role select */}
                  <select value={u.role || 'audience'} onChange={e => changeRole(u, e.target.value)}
                    disabled={actionId === 'r-'+u.id}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, background: ROLE_STYLE[u.role]?.bg || C.blueDim, color: ROLE_STYLE[u.role]?.color || C.blueLight }}>
                    <option value="audience">Member</option>
                    <option value="host">Host</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Joined */}
                  <span style={{ fontSize: 12, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>{timeAgo(u.created_at)}</span>

                  {/* Status */}
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, background: u.is_suspended ? C.redDim : u.is_premium ? C.goldDim : C.greenDim, color: u.is_suspended ? C.red : u.is_premium ? C.gold : C.green }}>
                    {u.is_suspended ? 'Suspended' : u.is_premium ? '⭐ Premium' : 'Active'}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => togglePremium(u)} disabled={actionId==='p-'+u.id}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, background: u.is_premium ? C.goldDim : C.border, color: u.is_premium ? C.gold : C.textDim }}>
                      {actionId==='p-'+u.id ? '...' : u.is_premium ? 'Revoke ⭐' : '+ Premium'}
                    </button>
                    <button onClick={() => suspend(u)} disabled={actionId==='s-'+u.id}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, background: u.is_suspended ? C.greenDim : C.redDim, color: u.is_suspended ? C.green : C.red }}>
                      {actionId==='s-'+u.id ? '...' : u.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
