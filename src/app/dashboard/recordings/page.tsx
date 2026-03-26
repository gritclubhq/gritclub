'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Play, Lock, Crown, Clock, Users, Search,
  Loader2, Video, Calendar, ChevronRight
} from 'lucide-react'

const C = {
  bg:'#070B14', surface:'#0D1420', card:'#0F1A2E',
  border:'rgba(255,255,255,0.07)', text:'#E8EAF0',
  textMuted:'#8A9BBF', textDim:'#3D4F6E',
  blue:'#FF3B3B', blueL:'#FF5555', blueDim:'rgba(255,59,59,0.12)',
  gold:'#FFD700', goldDim:'rgba(255,215,0,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.12)',
  purple:'#7C3AED', purpleDim:'rgba(124,58,237,0.1)',
  green:'#10B981',
}

const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'Host'
const fmtDur  = (sec: number) => {
  if (!sec) return ''
  const m = Math.floor(sec / 60), s = sec % 60
  return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m ${s}s`
}
const fmtDate = (ts: string) =>
  ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

// ── Upgrade modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }} onClick={onClose}/>
      <div style={{ position:'relative', width:'100%', maxWidth:420, margin:'0 16px', borderRadius:24, padding:36, background:C.card, border:`1px solid rgba(124,58,237,0.35)`, textAlign:'center', boxShadow:'0 24px 64px rgba(124,58,237,0.2)' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:C.purpleDim, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', border:`2px solid rgba(124,58,237,0.3)` }}>
          <Lock style={{ width:28, height:28, color:C.purple }}/>
        </div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em', marginBottom:8 }}>
          Pro Members Only
        </h2>
        <p style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', lineHeight:1.7, marginBottom:24 }}>
          Session recordings are exclusive to <strong style={{ color:C.gold }}>GritClub Pro</strong> members.
          Upgrade to watch any past session within 30 days of it ending.
        </p>
        <div style={{ borderRadius:16, padding:16, background:C.surface, border:`1px solid ${C.border}`, marginBottom:24, textAlign:'left' }}>
          {[
            'Watch all session recordings (30 days)',
            'Full chat replay from every session',
            'Download recordings for offline viewing',
            'Exclusive Pro networking events',
            'Priority support',
          ].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:C.goldDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:9, color:C.gold, fontWeight:700 }}>✓</span>
              </div>
              <span style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { router.push('/pricing'); onClose() }}
          style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${C.purple},#6D28D9)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
          <Crown style={{ width:16, height:16 }}/> Upgrade to Pro →
        </button>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif' }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}

// ── Recording card ─────────────────────────────────────────────────────────────
function RecordingCard({ rec, isPremium, onWatch }: { rec: any; isPremium: boolean; onWatch: (rec: any) => void }) {
  const ev       = rec.events || {}
  const host     = ev.users   || {}
  const daysAgo  = rec.created_at
    ? Math.floor((Date.now() - new Date(rec.created_at).getTime()) / (1000*60*60*24))
    : 999
  const withinWindow = daysAgo <= 30
  const canWatch = isPremium && withinWindow
  const expired  = !withinWindow

  return (
    <div style={{ borderRadius:20, background:C.card, border:`1px solid ${C.border}`, overflow:'hidden', display:'flex', flexDirection:'column', transition:'border-color 0.15s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,59,59,0.3)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = C.border)}>

      {/* Thumbnail */}
      <div style={{ position:'relative', aspectRatio:'16/9', background:'linear-gradient(135deg,#0D1428,#0A0F1E)', overflow:'hidden', flexShrink:0 }}>
        {ev.poster_url
          ? <img src={ev.poster_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Video style={{ width:40, height:40, color:C.textDim }}/>
            </div>
        }
        {/* Duration badge */}
        {rec.duration_sec > 0 && (
          <div style={{ position:'absolute', bottom:8, right:8, padding:'3px 8px', borderRadius:6, background:'rgba(0,0,0,0.8)', fontSize:11, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>
            {fmtDur(rec.duration_sec)}
          </div>
        )}
        {/* Lock overlay */}
        {!canWatch && (
          <div style={{ position:'absolute', inset:0, background:'rgba(10,15,30,0.65)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(124,58,237,0.3)', border:'2px solid rgba(124,58,237,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {expired ? <Clock style={{ width:20, height:20, color:'#A78BFA' }}/> : <Lock style={{ width:20, height:20, color:'#A78BFA' }}/>}
            </div>
          </div>
        )}
        {canWatch && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0')}>
            <button onClick={() => onWatch(rec)}
              style={{ width:52, height:52, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(37,99,235,0.9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(255,59,59,0.5)' }}>
              <Play style={{ width:22, height:22, color:'#fff', marginLeft:2 }}/>
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', margin:0, lineHeight:1.3 }}>
          {ev.title || 'Untitled Event'}
        </h3>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:C.blueDim, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:C.blueL }}>
              {host.photo_url ? <img src={host.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : getName(host).slice(0,2).toUpperCase()}
            </div>
            <span style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>{getName(host)}</span>
          </div>
          <span style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:4 }}>
            <Calendar style={{ width:11, height:11 }}/>{fmtDate(rec.created_at)}
          </span>
        </div>

        {/* Status badges */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:'auto' }}>
          {expired ? (
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:'rgba(61,79,110,0.3)', color:C.textDim, fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>
              Expired
            </span>
          ) : (
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:C.purpleDim, color:'#A78BFA', fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>
              Pro Only
            </span>
          )}
          {canWatch && (
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:'rgba(16,185,129,0.1)', color:C.green, fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>
              ✓ Available
            </span>
          )}
          {!expired && !isPremium && (
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:C.goldDim, color:C.gold, fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>
              {30 - daysAgo}d left
            </span>
          )}
        </div>

        {/* Watch / Upgrade button */}
        <button onClick={() => onWatch(rec)}
          style={{ width:'100%', padding:'9px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            background: canWatch ? C.blueDim : expired ? 'rgba(61,79,110,0.2)' : C.purpleDim,
            color: canWatch ? C.blueL : expired ? C.textDim : '#A78BFA',
          }}>
          {canWatch
            ? <><Play style={{ width:13, height:13 }}/>Watch Recording</>
            : expired
            ? <><Clock style={{ width:13, height:13 }}/>Expired</>
            : <><Lock style={{ width:13, height:13 }}/>Upgrade to Watch</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecordingsPage() {
  const router = useRouter()
  const [recordings,  setRecordings]  = useState<any[]>([])
  const [isPremium,   setIsPremium]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }

      const { data: prof } = await supabase.from('users').select('is_premium, role').eq('id', u.id).single()
      const premium = prof?.is_premium === true || prof?.role === 'host' || prof?.role === 'admin'
      setIsPremium(premium)

      // Load all recordings with event + host info
      const { data: recs } = await supabase
        .from('event_recordings')
        .select('*, events(id, title, poster_url, ended_at, users(id, full_name, email, photo_url))')
        .order('created_at', { ascending: false })
        .limit(50)
      setRecordings(recs || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleWatch = async (rec: any) => {
    const daysAgo = rec.created_at
      ? Math.floor((Date.now() - new Date(rec.created_at).getTime()) / (1000*60*60*24))
      : 999
    if (!isPremium || daysAgo > 30) {
      setShowUpgrade(true)
      return
    }
    // Route to replay page which generates fresh signed URL
    router.push(`/events/${rec.event_id}/replay`)
  }

  const filtered = recordings.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const title = (r.events?.title || '').toLowerCase()
    const host  = (r.events?.users?.full_name || r.events?.users?.email || '').toLowerCase()
    return title.includes(q) || host.includes(q)
  })

  return (
    <DashboardLayout>
      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.blueL, fontFamily: 'DM Sans,sans-serif', marginBottom: 4 }}>Library</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em', marginBottom: 4 }}>Session Recordings</h1>
              <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>
                Watch past GritClub sessions. Available to Pro members within 30 days.
              </p>
            </div>
            {!isPremium && (
              <button onClick={() => setShowUpgrade(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${C.purple},#6D28D9)`, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                <Crown style={{ width: 14, height: 14 }}/> Upgrade to Pro
              </button>
            )}
            {isPremium && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: C.goldDim, border: `1px solid rgba(255,215,0,0.3)` }}>
                <Crown style={{ width: 14, height: 14, color: C.gold }}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: 'DM Sans,sans-serif' }}>Pro Access</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.textDim }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recordings by title or host..."
              style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,59,59,0.5)')}
              onBlur={e  => (e.target.style.borderColor = C.border)}/>
          </div>

          {/* Pro banner for non-premium */}
          {!isPremium && (
            <div style={{ borderRadius: 16, padding: '16px 20px', background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(109,40,217,0.08))', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.purpleDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock style={{ width: 18, height: 18, color: C.purple }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'DM Sans,sans-serif', marginBottom: 2 }}>Recordings are a Pro feature</p>
                <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Upgrade to GritClub Pro to watch any session within 30 days of it ending.</p>
              </div>
              <button onClick={() => setShowUpgrade(true)}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${C.purple},#6D28D9)`, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Crown style={{ width: 13, height: 13 }}/> Upgrade <ChevronRight style={{ width: 13, height: 13 }}/>
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ borderRadius: 20, background: C.card, aspectRatio: '16/10', opacity: 0.4 + i * 0.1 }}/>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ borderRadius: 20, padding: '60px 24px', textAlign: 'center', background: C.card, border: `1px solid ${C.border}` }}>
              <Video style={{ width: 40, height: 40, color: C.textDim, margin: '0 auto 12px' }}/>
              <p style={{ fontWeight: 600, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginBottom: 6 }}>
                {search ? 'No recordings match your search' : 'No recordings yet'}
              </p>
              <p style={{ fontSize: 13, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>
                Recordings appear here after a live event ends.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(rec => (
                <RecordingCard key={rec.id} rec={rec} isPremium={isPremium} onWatch={handleWatch}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)}/>}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
