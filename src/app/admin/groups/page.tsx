'use client'
// Admin Groups Page
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Loader2, Trash2, Users, Lock, Globe } from 'lucide-react'

const C = { bg:'#0A0F1E', card:'#111827', border:'rgba(255,255,255,0.06)', text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E', blue:'#3B82F6', blueDim:'rgba(37,99,235,0.12)', gold:'#F59E0B', red:'#EF4444', redDim:'rgba(239,68,68,0.1)', green:'#10B981' }
const timeAgo = (ts: string) => { const d = Date.now()-new Date(ts).getTime(), m = Math.floor(d/60000); if (m<1) return 'now'; if (m<60) return `${m}m`; const h=Math.floor(m/60); if (h<24) return `${h}h`; return `${Math.floor(h/24)}d` }

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase.from('groups').select('*, users!groups_created_by_fkey(email, full_name)').order('created_at', { ascending: false })
    setGroups(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete group "${name}"? This cannot be undone.`)) return
    await supabase.from('groups').delete().eq('id', id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('admin_audit_log').insert({ admin_id: user.id, action: 'delete_group', target_type: 'group', target_id: id, details: { name } })
    load()
  }

  return (
    <DashboardLayout>
      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
          <p style={{ fontSize: 11, color: C.blue, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Admin</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 4, letterSpacing: '-0.02em' }}>Groups</h1>
          <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginBottom: 24 }}>{groups.length} total groups</p>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 style={{ width: 28, height: 28, color: C.blue, animation: 'spin 1s linear infinite' }} /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
                  {g.banner_url ? (
                    <img src={g.banner_url} alt="" style={{ width: 48, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 36, borderRadius: 8, background: C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users style={{ width: 18, height: 18, color: C.blue }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>{g.name}</p>
                      {g.is_private ? <Lock style={{ width: 12, height: 12, color: C.gold }} /> : <Globe style={{ width: 12, height: 12, color: C.textDim }} />}
                    </div>
                    <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>
                      {g.category} · {g.member_count || 0} members · By {g.users?.full_name || g.users?.email || 'Unknown'} · {timeAgo(g.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: g.is_premium ? 'rgba(245,158,11,0.12)' : C.blueDim, color: g.is_premium ? C.gold : C.blue, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                      {g.is_premium ? '⭐ Premium' : `Free (${g.max_members} max)`}
                    </span>
                    <button onClick={() => deleteGroup(g.id, g.name)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: C.redDim, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 style={{ width: 14, height: 14 }} />
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
