'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Search, UserPlus, Check, UserCheck, Users, X,
  Loader2, ChevronDown, UserMinus, Zap, Crown,
  MessageCircle, Star, Clock
} from 'lucide-react'

const C = {
  bg:'#141010', surface:'#1C1410', card:'#291C0E', cardHover:'#352318',
  border:'rgba(167,141,120,0.15)', borderHover:'rgba(167,141,120,0.35)',
  text:'#E1D4C2', textMuted:'#BEB5A9', textDim:'#715451',
  blue:'#A78D78', blueLight:'#BEB5A9', blueDim:'rgba(167,141,120,0.15)',
  gold:'#C4956A', goldDim:'rgba(196,149,106,0.15)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#8FAF8A', greenDim:'rgba(143,175,138,0.15)',
  purple:'#6E473B', purpleDim:'rgba(124,58,237,0.1)',
}

const AVATAR_COLORS = ['#A78D78','#6E473B','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInitials = (u: any) => getName(u).slice(0,2).toUpperCase()
const timeAgo = (ts: string) => {
  const d = Date.now()-new Date(ts).getTime(), m=Math.floor(d/60000)
  if (m<1) return 'just now'; if (m<60) return `${m}m ago`
  const h=Math.floor(m/60); if (h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function Avatar({ u, size=40 }: { u: any; size?: number }) {
  const color = avatarColor(u?.id||'')
  return (
    <div style={{ width:size, height:size, minWidth:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:color+'22', color, fontSize:size*0.33, fontWeight:700, fontFamily:'Syne,sans-serif', border:`1.5px solid ${color}33` }}>
      {u?.photo_url ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getInitials(u)}
    </div>
  )
}

// ─── Connection Suggestion Card ───────────────────────────────────────────────
function SuggestionCard({ user, onConnect, onDismiss, actionState }: any) {
  return (
    <div style={{ borderRadius:16, padding:16, background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:12 }}>
        <a href={`/profile/${user.id}`} style={{ textDecoration:'none', flexShrink:0 }}>
          <Avatar u={user} size={48} />
        </a>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <a href={`/profile/${user.id}`} style={{ textDecoration:'none' }}>
              <p style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget.style.color=C.blueLight)} onMouseLeave={e=>(e.currentTarget.style.color=C.text)}>
                {getName(user)}
              </p>
            </a>
            {user.role === 'host' && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:5, background:C.goldDim, color:C.gold, fontFamily:'DM Sans,sans-serif', fontWeight:700, flexShrink:0 }}>HOST</span>}
          </div>
          {user.username && <p style={{ fontSize:12, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>@{user.username}</p>}
          {user.bio && <p style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{user.bio}</p>}
        </div>
        <button onClick={() => onDismiss(user.id)} style={{ width:24, height:24, borderRadius:6, border:'none', cursor:'pointer', background:'transparent', color:C.textDim, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X style={{ width:13, height:13 }} />
        </button>
      </div>

      {/* Reason */}
      {user.suggestion_reason && (
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, background:C.blueDim, border:'1px solid rgba(37,99,235,0.15)' }}>
          <Zap style={{ width:12, height:12, color:C.blueLight, flexShrink:0 }} />
          <p style={{ fontSize:11, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>{user.suggestion_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <a href={`/profile/${user.id}`} style={{ textDecoration:'none' }}>
          <button style={{ padding:'9px 14px', borderRadius:10, border:`1px solid ${C.border}`, cursor:'pointer', background:'transparent', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13 }}>
            View Profile
          </button>
        </a>
        <button onClick={() => onConnect(user.id)} disabled={actionState === 'loading' || actionState === 'sent'}
          style={{ flex:1, padding:'9px', borderRadius:10, border:`1px solid ${actionState==='sent' ? C.green : C.blue}`, cursor:actionState==='sent'?'default':'pointer', background:actionState==='sent'?C.greenDim:C.blueDim, color:actionState==='sent'?C.green:C.blueLight, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity:actionState==='loading'?0.6:1 }}>
          {actionState==='loading' ? <Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }} /> : actionState==='sent' ? <><Check style={{ width:13, height:13 }} /> Sent!</> : <><UserPlus style={{ width:13, height:13 }} /> Connect</>}
        </button>
      </div>
    </div>
  )
}

// ─── People Card (Discover tab) ───────────────────────────────────────────────
function PeopleCard({ user, currentUserId, onAction }: any) {
  const [status, setStatus] = useState(user.connection_status || 'none')
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (loading) return
    setLoading(true)
    if (status === 'none') {
      const { error } = await supabase.from('connections').insert({ user1_id: currentUserId, user2_id: user.id, status: 'requested' })
      if (!error) setStatus('requested')
    } else if (status === 'requested') {
      await supabase.from('connections').delete().match({ user1_id: currentUserId, user2_id: user.id })
      setStatus('none')
    }
    setLoading(false)
    onAction?.()
  }

  const handleFollow = async () => {
    if (loading) return
    setLoading(true)
    if (!user.is_following) {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: user.id })
    } else {
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: user.id })
    }
    setLoading(false)
    onAction?.()
  }

  return (
    <div style={{ borderRadius:16, padding:16, background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:12, transition:'all 0.2s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.borderHover}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border}}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <a href={`/profile/${user.id}`} style={{ textDecoration:'none', flexShrink:0 }}>
          <Avatar u={user} size={44} />
        </a>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <a href={`/profile/${user.id}`} style={{ textDecoration:'none' }}>
              <p style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget.style.color=C.blueLight)} onMouseLeave={e=>(e.currentTarget.style.color=C.text)}>
                {getName(user)}
              </p>
            </a>
            {user.role==='host' && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:5, background:C.goldDim, color:C.gold, fontFamily:'DM Sans,sans-serif', fontWeight:700 }}>HOST</span>}
            {user.role==='admin' && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:5, background:C.redDim, color:C.red, fontFamily:'DM Sans,sans-serif', fontWeight:700 }}>ADMIN</span>}
          </div>
          {user.username && <p style={{ fontSize:12, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>@{user.username}</p>}
          {user.bio && <p style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginTop:3, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{user.bio}</p>}
          {user.mutual_events > 0 && (
            <p style={{ fontSize:11, color:C.gold, fontFamily:'DM Sans,sans-serif', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
              <Star style={{ width:10, height:10 }} /> {user.mutual_events} shared event{user.mutual_events>1?'s':''}
            </p>
          )}
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={handleConnect} disabled={loading || status==='accepted'}
          style={{ flex:2, padding:'8px', borderRadius:10, border:`1px solid ${status==='accepted'?C.green:status==='requested'?C.border:C.blue}`, cursor:status==='accepted'?'default':'pointer', background:status==='accepted'?C.greenDim:status==='requested'?C.surface:C.blueDim, color:status==='accepted'?C.green:status==='requested'?C.textMuted:C.blueLight, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          {loading?<Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }}/>:status==='accepted'?<><Check style={{ width:13, height:13 }}/>Connected</>:status==='requested'?'Pending':'Connect'}
        </button>
        <button onClick={handleFollow}
          style={{ flex:1, padding:'8px', borderRadius:10, border:`1px solid ${user.is_following?C.purple:C.border}`, cursor:'pointer', background:user.is_following?C.purpleDim:'transparent', color:user.is_following?C.purple:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13 }}>
          {user.is_following?'Following':'Follow'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tab,         setTab]         = useState<'suggestions'|'discover'|'connections'|'pending'>('suggestions')
  const [search,      setSearch]      = useState('')
  const [people,      setPeople]      = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [pending,     setPending]     = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [dismissed,   setDismissed]   = useState<Set<string>>(new Set())
  const [actionStates, setActionStates] = useState<Record<string, string>>({})
  const debounce = useRef<NodeJS.Timeout>()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setCurrentUser(u)
      await Promise.all([
        loadSuggestions(u.id),
        loadConnections(u.id),
        loadPending(u.id),
        loadDiscover(u.id, ''),
      ])
      setLoading(false)
    })
  }, [])

  // ── Suggestions: shared events + 2nd degree + everyone else ──
  const loadSuggestions = async (uid: string) => {
    // Try RPC first (requires feed_algorithm.sql to have been run)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_connection_suggestions', { p_user_id: uid, p_limit: 20 })
    if (!rpcErr && rpcData && rpcData.length > 0) {
      setSuggestions(rpcData)
      return
    }

    // Fallback: simple query — all users not yet connected
    const { data: connected } = await supabase
      .from('connections')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
    const connectedIds = new Set((connected||[]).flatMap((c:any) => [c.user1_id, c.user2_id]).filter((id:string) => id !== uid))
    connectedIds.add(uid)

    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email, photo_url, username, role, bio')
      .not('id', 'in', `(${[...connectedIds].join(',')})`)
      .neq('role', 'admin')
      .limit(20)

    const enriched = (users||[]).map((u:any) => ({ ...u, suggestion_reason: 'New member on GritClub' }))
    setSuggestions(enriched)
  }

  const loadConnections = async (uid: string) => {
    // Fetch connections with both user records using separate queries for reliability
    const { data } = await supabase
      .from('connections')
      .select('id, user1_id, user2_id, status, created_at')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .eq('status', 'accepted')
    if (!data?.length) { setConnections([]); return }

    // Get all unique user IDs that are the "other" person
    const otherIds = data.map((c:any) => c.user1_id === uid ? c.user2_id : c.user1_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email, photo_url, username, role, bio')
      .in('id', otherIds)
      .neq('role', 'admin')
    const userMap = Object.fromEntries((users||[]).map((u:any) => [u.id, u]))

    const enriched = data.map((c:any) => {
      const friendId = c.user1_id === uid ? c.user2_id : c.user1_id
      return { ...c, friend: userMap[friendId] || {} }
    })
    setConnections(enriched)
  }

  const loadPending = async (uid: string) => {
    const { data } = await supabase
      .from('connections')
      .select('id, user1_id, status, users!connections_user1_id_fkey(id, full_name, email, photo_url, username, bio, role)')
      .eq('user2_id', uid)
      .eq('status', 'requested')
    setPending(data||[])
  }

  const loadDiscover = async (uid: string, q: string) => {
    const { data: connected } = await supabase
      .from('connections')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
    const connectedIds = new Set((connected||[]).flatMap((c:any) => [c.user1_id, c.user2_id]))
    connectedIds.add(uid)

    let query = supabase.from('users').select('id, full_name, email, photo_url, username, role, bio').neq('id', uid).neq('role', 'admin').limit(50)
    if (q.trim()) {
      query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`)
    }
    const { data: users } = await query

    // Check follows
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', uid)
    const followingIds = new Set((follows||[]).map((f:any) => f.following_id))

    const enriched = (users||[]).map((u:any) => ({
      ...u,
      connection_status: connectedIds.has(u.id) ? 'accepted' : 'none',
      is_following: followingIds.has(u.id),
    }))
    setPeople(enriched)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { if (currentUser) loadDiscover(currentUser.id, val) }, 400)
  }

  const handleConnect = async (targetId: string) => {
    if (!currentUser) return
    setActionStates(p => ({ ...p, [targetId]: 'loading' }))
    await supabase.from('connections').insert({ user1_id: currentUser.id, user2_id: targetId, status: 'requested' })
    setActionStates(p => ({ ...p, [targetId]: 'sent' }))
  }

  const handleDismiss = (id: string) => setDismissed(p => new Set([...p, id]))

  const handleAccept = async (connectionId: string, senderId: string) => {
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId)
    setPending(p => p.filter(c => c.id !== connectionId))
    if (currentUser) { loadConnections(currentUser.id); loadSuggestions(currentUser.id) }
  }

  const handleDecline = async (connectionId: string) => {
    await supabase.from('connections').delete().eq('id', connectionId)
    setPending(p => p.filter(c => c.id !== connectionId))
  }

  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id))

  const TABS = [
    { id: 'suggestions', label: 'Suggestions', count: visibleSuggestions.length },
    { id: 'discover',    label: 'Find People', count: null },
    { id: 'connections', label: 'Connections', count: connections.length },
    { id: 'pending',     label: 'Requests',    count: pending.length },
  ]

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:C.bg, minHeight:'100%' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Header */}
          <div>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:C.blueLight, fontFamily:'DM Sans,sans-serif', marginBottom:4 }}>Network</p>
            <h1 style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em', marginBottom:4 }}>Your Network</h1>
            <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Connect and follow anyone on GritClub — not just founders</p>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:12, border:`1px solid ${tab===t.id?C.blue:C.border}`, cursor:'pointer', background:tab===t.id?C.blue:'transparent', color:tab===t.id?'#fff':C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:600 }}>
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span style={{ padding:'1px 7px', borderRadius:10, background:tab===t.id?'rgba(167,141,120,0.3)':C.border, fontSize:11, fontWeight:700, color:tab===t.id?'#fff':t.id==='pending'?C.gold:C.textDim }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
              {[...Array(6)].map((_,i) => <div key={i} style={{ height:160, borderRadius:16, background:C.card }} />)}
            </div>
          ) : (
            <>
              {/* ── SUGGESTIONS TAB ── */}
              {tab === 'suggestions' && (
                <div>
                  {visibleSuggestions.length === 0 ? (
                    <div style={{ borderRadius:20, padding:48, textAlign:'center', background:C.card, border:`1px solid ${C.border}` }}>
                      <Users style={{ width:40, height:40, color:C.textDim, margin:'0 auto 12px' }} />
                      <p style={{ fontWeight:600, color:C.textMuted, marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>No suggestions right now</p>
                      <p style={{ fontSize:13, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>Try the Find People tab to search for anyone</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginBottom:14 }}>
                        People you may know — based on shared events and connections
                      </p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
                        {visibleSuggestions.map(u => (
                          <SuggestionCard
                            key={u.id}
                            user={u}
                            onConnect={handleConnect}
                            onDismiss={handleDismiss}
                            actionState={actionStates[u.id] || 'idle'}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── FIND PEOPLE TAB ── */}
              {tab === 'discover' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ position:'relative' }}>
                    <Search style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:C.textDim }} />
                    <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by name, @handle, or email..."
                      style={{ width:'100%', padding:'12px 14px 12px 42px', borderRadius:14, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }}
                      onFocus={e=>(e.target.style.borderColor='rgba(167,141,120,0.5)')} onBlur={e=>(e.target.style.borderColor=C.border)} />
                    {search && <button onClick={()=>{setSearch('');if(currentUser)loadDiscover(currentUser.id,'')}} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.textDim }}><X style={{ width:14, height:14 }} /></button>}
                  </div>
                  {people.length === 0 ? (
                    <div style={{ textAlign:'center', padding:40, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>No users found</div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
                      {people.map(u => (
                        <PeopleCard key={u.id} user={u} currentUserId={currentUser?.id} onAction={() => { if(currentUser) loadDiscover(currentUser.id, search) }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── CONNECTIONS TAB ── */}
              {tab === 'connections' && (
                <div>
                  {connections.length === 0 ? (
                    <div style={{ borderRadius:20, padding:48, textAlign:'center', background:C.card, border:`1px solid ${C.border}` }}>
                      <UserCheck style={{ width:40, height:40, color:C.textDim, margin:'0 auto 12px' }} />
                      <p style={{ fontWeight:600, color:C.textMuted, marginBottom:6, fontFamily:'DM Sans,sans-serif' }}>No connections yet</p>
                      <button onClick={() => setTab('suggestions')} style={{ marginTop:8, padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer', background:C.blue, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:13 }}>See Suggestions →</button>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
                      {connections.map(c => {
                        const friend = c.friend || {}
                        return (
                          <div key={c.id} style={{ borderRadius:16, padding:16, background:C.card, border:`1px solid ${C.greenDim}`, display:'flex', gap:12, alignItems:'center' }}>
                          <a href={`/profile/${friend.id}`} style={{ textDecoration:'none', flexShrink:0 }}>
                            <Avatar u={friend} size={44} />
                          </a>
                            <div style={{ flex:1, minWidth:0 }}>
                            <a href={`/profile/${friend.id}`} style={{ textDecoration:'none' }}>
                              <p style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }}
                                onMouseEnter={e=>(e.currentTarget.style.color=C.blueLight)} onMouseLeave={e=>(e.currentTarget.style.color=C.text)}>
                                {getName(friend)}
                              </p>
                            </a>
                              {friend.username && <p style={{ fontSize:12, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>@{friend.username}</p>}
                              <p style={{ fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginTop:2 }}>Connected · {timeAgo(c.created_at)}</p>
                            </div>
                            <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:C.greenDim, color:C.green, fontFamily:'DM Sans,sans-serif', fontWeight:700 }}>✓</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── PENDING TAB ── */}
              {tab === 'pending' && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {pending.length === 0 ? (
                    <div style={{ borderRadius:20, padding:48, textAlign:'center', background:C.card, border:`1px solid ${C.border}` }}>
                      <Clock style={{ width:40, height:40, color:C.textDim, margin:'0 auto 12px' }} />
                      <p style={{ fontWeight:600, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>No pending requests</p>
                    </div>
                  ) : pending.map(c => {
                    const sender = c['users!connections_user1_id_fkey'] || c.users || {}
                    return (
                      <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:16, borderRadius:16, background:C.card, border:`1px solid rgba(245,158,11,0.2)` }}>
                        <a href={`/profile/${c.user1_id}`} style={{ textDecoration:'none', flexShrink:0 }}>
                          <Avatar u={sender} size={44} />
                        </a>
                        <div style={{ flex:1, minWidth:0 }}>
                          <a href={`/profile/${c.user1_id}`} style={{ textDecoration:'none' }}>
                            <p style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', cursor:'pointer' }}
                              onMouseEnter={e=>(e.currentTarget.style.color=C.blueLight)} onMouseLeave={e=>(e.currentTarget.style.color=C.text)}>
                              {getName(sender)}
                            </p>
                          </a>
                          {sender.username && <p style={{ fontSize:12, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>@{sender.username}</p>}
                          <p style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Wants to connect with you</p>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => handleAccept(c.id, c.user1_id)} style={{ padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer', background:C.green, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13 }}>Accept</button>
                          <button onClick={() => handleDecline(c.id)} style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${C.border}`, cursor:'pointer', background:'transparent', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13 }}>Ignore</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
