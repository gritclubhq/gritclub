'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Search, UserPlus, Check, UserCheck, Users, X,
  MessageCircle, Loader2, ChevronDown, Bell, UserMinus
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#0A0F1E',
  surface:   '#0D1428',
  card:      '#111827',
  cardHover: '#141E35',
  border:    'rgba(255,255,255,0.06)',
  borderHover:'rgba(37,99,235,0.3)',
  text:      '#F0F4FF',
  textMuted: '#7B8DB0',
  textDim:   '#3D4F6E',
  blue:      '#2563EB',
  blueLight: '#3B82F6',
  blueDim:   'rgba(37,99,235,0.12)',
  gold:      '#F59E0B',
  goldDim:   'rgba(245,158,11,0.1)',
  red:       '#EF4444',
  redDim:    'rgba(239,68,68,0.1)',
  green:     '#10B981',
  greenDim:  'rgba(16,185,129,0.1)',
  purple:    '#7C3AED',
  purpleDim: 'rgba(124,58,237,0.1)',
}

const INDUSTRIES = ['All','FinTech','HealthTech','EdTech','E-commerce','Climate Tech','SaaS','AI & Tech','Web3','Media']

type ConnStatus = 'none' | 'requested_by_me' | 'requested_by_them' | 'connected'
type FollowStatus = 'not_following' | 'following'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getName     = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInitials = (u: any) => getName(u).slice(0, 2).toUpperCase()
const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 52 }: { user: any; size?: number }) {
  const color = avatarColor(user?.id || '')
  return (
    <div
      className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
      style={{ width: size, height: size, minWidth: size, background: color + '22', color, fontSize: size * 0.33, border: `2px solid ${color}25` }}
    >
      {user?.photo_url
        ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
        : getInitials(user)
      }
    </div>
  )
}

// ─── Person Card ──────────────────────────────────────────────────────────────
function PersonCard({ person, currentUserId, onStatusChange }: {
  person: any
  currentUserId: string
  onStatusChange: () => void
}) {
  const [connStatus,   setConnStatus]   = useState<ConnStatus>('none')
  const [followStatus, setFollowStatus] = useState<FollowStatus>('not_following')
  const [loading,      setLoading]      = useState(true)
  const [actionLoading,setActionLoading]= useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      // Check connection status
      const { data: conn } = await supabase
        .from('connections')
        .select('status, user1_id, user2_id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${person.id}),and(user1_id.eq.${person.id},user2_id.eq.${currentUserId})`)
        .maybeSingle()

      if (conn) {
        if (conn.status === 'accepted') {
          setConnStatus('connected')
        } else if (conn.status === 'requested') {
          setConnStatus(conn.user1_id === currentUserId ? 'requested_by_me' : 'requested_by_them')
        }
      }

      // Check follow status
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', person.id)
        .maybeSingle()

      if (follow) setFollowStatus('following')
      setLoading(false)
    }
    load()
  }, [currentUserId, person.id])

  // Send connection request
  const handleConnect = async () => {
    setActionLoading('connect')
    await supabase.from('connections').insert({
      user1_id: currentUserId,
      user2_id: person.id,
      status:   'requested',
    })
    setConnStatus('requested_by_me')
    setActionLoading(null)
    onStatusChange()
  }

  // Accept incoming connection request
  const handleAccept = async () => {
    setActionLoading('accept')
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('user1_id', person.id)
      .eq('user2_id', currentUserId)
    setConnStatus('connected')
    setActionLoading(null)
    onStatusChange()
  }

  // Remove/withdraw connection
  const handleRemoveConnection = async () => {
    setActionLoading('remove')
    await supabase
      .from('connections')
      .delete()
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${person.id}),and(user1_id.eq.${person.id},user2_id.eq.${currentUserId})`)
    setConnStatus('none')
    setActionLoading(null)
    onStatusChange()
  }

  // Toggle follow
  const handleFollow = async () => {
    setActionLoading('follow')
    if (followStatus === 'following') {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', person.id)
      setFollowStatus('not_following')
    } else {
      await supabase.from('follows').insert({
        follower_id:  currentUserId,
        following_id: person.id,
      })
      setFollowStatus('following')
    }
    setActionLoading(null)
  }

  const renderConnectButton = () => {
    if (loading) return <div className="w-20 h-7 rounded-lg animate-pulse" style={{ background: C.border }} />

    if (connStatus === 'connected') {
      return (
        <div className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: C.greenDim, color: C.green, border: `1px solid ${C.green}25` }}
          >
            <Check className="w-3 h-3" /> Connected
          </span>
          <button
            onClick={handleRemoveConnection}
            disabled={actionLoading === 'remove'}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: C.redDim, color: C.red }}
            title="Remove connection"
          >
            {actionLoading === 'remove' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
          </button>
        </div>
      )
    }

    if (connStatus === 'requested_by_me') {
      return (
        <button
          onClick={handleRemoveConnection}
          disabled={!!actionLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: C.border, color: C.textMuted }}
        >
          {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Pending
        </button>
      )
    }

    if (connStatus === 'requested_by_them') {
      return (
        <button
          onClick={handleAccept}
          disabled={actionLoading === 'accept'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background: C.green, color: '#fff' }}
        >
          {actionLoading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Accept
        </button>
      )
    }

    // none
    return (
      <button
        onClick={handleConnect}
        disabled={actionLoading === 'connect'}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{ background: C.blueDim, color: C.blueLight, border: `1px solid rgba(37,99,235,0.2)` }}
      >
        {actionLoading === 'connect' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
        Connect
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHover }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}
    >
      {/* Top: avatar + info */}
      <div className="flex items-start gap-3">
        <Avatar user={person} size={48} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: C.text }}>{getName(person)}</p>
          {person.username && (
            <p className="text-xs" style={{ color: C.blueLight }}>@{person.username}</p>
          )}
          <p className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>
            {person.role === 'host' ? '⚡ Host' : person.role === 'admin' ? '🛡 Admin' : '🧠 Founder'}
          </p>
        </div>
      </div>

      {/* Bio */}
      {person.bio && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: C.textMuted }}>
          {person.bio}
        </p>
      )}

      {/* Mutual + industry */}
      <div className="flex items-center gap-2 flex-wrap">
        {person.mutual > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: C.blueDim, color: C.blueLight }}
          >
            {person.mutual} mutual
          </span>
        )}
        {person.industry && (
          <span
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: C.border, color: C.textMuted }}
          >
            {person.industry}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
        {renderConnectButton()}

        {/* Follow */}
        <button
          onClick={handleFollow}
          disabled={actionLoading === 'follow'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: followStatus === 'following' ? C.purpleDim : C.border,
            color:      followStatus === 'following' ? '#A78BFA'   : C.textMuted,
            border:     `1px solid ${followStatus === 'following' ? 'rgba(124,58,237,0.2)' : 'transparent'}`,
          }}
        >
          {actionLoading === 'follow' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : followStatus === 'following' ? (
            <><Bell className="w-3 h-3" /> Following</>
          ) : (
            <>+ Follow</>
          )}
        </button>

        {/* Message (future) */}
        <button
          className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: C.border, color: C.textDim }}
          title="Message (coming soon)"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.blueDim; (e.currentTarget as HTMLElement).style.color = C.blueLight }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.border; (e.currentTarget as HTMLElement).style.color = C.textDim }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Pending request card ──────────────────────────────────────────────────────
function PendingCard({ request, currentUserId, onAction }: {
  request: any
  currentUserId: string
  onAction: () => void
}) {
  const [loading, setLoading] = useState(false)
  const isSender = request.user1_id === currentUserId
  const otherUser = isSender ? request.user2 : request.user1

  const handleAccept = async () => {
    setLoading(true)
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', request.id)
    setLoading(false)
    onAction()
  }

  const handleIgnore = async () => {
    setLoading(true)
    await supabase.from('connections').delete().eq('id', request.id)
    setLoading(false)
    onAction()
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <Avatar user={otherUser} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{getName(otherUser)}</p>
        <p className="text-xs" style={{ color: C.textMuted }}>
          {isSender ? 'Awaiting their response' : 'Wants to connect with you'}
        </p>
      </div>
      {!isSender && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: C.blue, color: '#fff' }}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept'}
          </button>
          <button
            onClick={handleIgnore}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: C.border, color: C.textMuted }}
          >
            Ignore
          </button>
        </div>
      )}
      {isSender && (
        <button
          onClick={handleIgnore}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: C.border, color: C.textMuted }}
        >
          Withdraw
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [currentUser,  setCurrentUser]  = useState<any>(null)
  const [activeTab,    setActiveTab]    = useState<'discover'|'connections'|'following'|'pending'>('discover')
  const [search,       setSearch]       = useState('')
  const [industry,     setIndustry]     = useState('All')
  const [people,       setPeople]       = useState<any[]>([])
  const [connections,  setConnections]  = useState<any[]>([])
  const [following,    setFollowing]    = useState<any[]>([])
  const [pending,      setPending]      = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [hasMore,      setHasMore]      = useState(true)
  const [connCount,    setConnCount]    = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const PAGE_SIZE = 12

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) { setCurrentUser(u); loadAll(u.id) }
    })
  }, [])

  const loadAll = async (uid: string) => {
    setLoading(true)
    await Promise.all([
      loadDiscover(uid, 0),
      loadConnections(uid),
      loadFollowing(uid),
      loadPending(uid),
    ])
    setLoading(false)
  }

  const loadDiscover = async (uid: string, offset: number) => {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, photo_url, role, username, bio')
      .neq('id', uid)
      .neq('is_suspended', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const enriched = (data || []).map(u => ({ ...u, mutual: Math.floor(Math.random() * 6), industry: 'SaaS' }))
    if (offset === 0) setPeople(enriched)
    else setPeople(prev => [...prev, ...enriched])
    setHasMore((data || []).length === PAGE_SIZE)
  }

  const loadConnections = async (uid: string) => {
    const { data } = await supabase
      .from('connections')
      .select(`
        id, status, user1_id, user2_id,
        user1:users!connections_user1_id_fkey(id, email, full_name, photo_url, username, role),
        user2:users!connections_user2_id_fkey(id, email, full_name, photo_url, username, role)
      `)
      .eq('status', 'accepted')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)

    setConnections(data || [])
    setConnCount((data || []).length)
  }

  const loadFollowing = async (uid: string) => {
    const { data } = await supabase
      .from('follows')
      .select('id, following_id, users!follows_following_id_fkey(id, email, full_name, photo_url, username, role)')
      .eq('follower_id', uid)

    setFollowing(data || [])
  }

  const loadPending = async (uid: string) => {
    const { data } = await supabase
      .from('connections')
      .select(`
        id, status, user1_id, user2_id,
        user1:users!connections_user1_id_fkey(id, email, full_name, photo_url, username),
        user2:users!connections_user2_id_fkey(id, email, full_name, photo_url, username)
      `)
      .eq('status', 'requested')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)

    setPending(data || [])
    setPendingCount((data || []).filter(r => r.user2_id === uid).length)
  }

  const handleLoadMore = async () => {
    if (!currentUser || loadingMore || !hasMore) return
    setLoadingMore(true)
    await loadDiscover(currentUser.id, people.length)
    setLoadingMore(false)
  }

  const filtered = people.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      getName(p).toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.bio || '').toLowerCase().includes(q)
    const matchIndustry = industry === 'All' || p.industry === industry
    return matchSearch && matchIndustry
  })

  const tabs = [
    { id: 'discover',     label: 'Discover',     count: null },
    { id: 'connections',  label: 'Connections',   count: connCount || null },
    { id: 'following',    label: 'Following',     count: following.length || null },
    { id: 'pending',      label: 'Pending',       count: pendingCount || null },
  ] as const

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Header */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.blueLight }}>Network</p>
            <h1 className="text-2xl font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
              Your Network
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>
              Connect with founders who share your mindset
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? C.blue   : 'transparent',
                  color:      activeTab === tab.id ? '#fff'   : C.textMuted,
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : tab.id === 'pending' ? C.red : C.blueDim,
                      color:      activeTab === tab.id ? '#fff' : tab.id === 'pending' ? C.red : C.blueLight,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Discover tab — search + filters + grid */}
          {activeTab === 'discover' && (
            <>
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textDim }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, username, or bio..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                    onFocus={e => (e.target.style.borderColor = C.borderHover)}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: C.textDim }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Industry filters */}
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: industry === ind ? C.blue    : C.card,
                      color:      industry === ind ? '#fff'    : C.textMuted,
                      border:     `1px solid ${industry === ind ? C.blue : C.border}`,
                    }}
                  >
                    {ind}
                  </button>
                ))}
              </div>

              {/* Results count */}
              <p className="text-xs font-medium" style={{ color: C.textDim }}>
                {filtered.length} founder{filtered.length !== 1 ? 's' : ''} found
              </p>

              {/* Grid */}
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: C.card }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <Users className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p className="font-semibold" style={{ color: C.textMuted }}>No founders found</p>
                  <p className="text-sm mt-1" style={{ color: C.textDim }}>Try adjusting your search</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map(p => (
                      <PersonCard
                        key={p.id}
                        person={p}
                        currentUserId={currentUser?.id || ''}
                        onStatusChange={() => loadPending(currentUser?.id || '')}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: C.card, color: C.textMuted, border: `1px solid ${C.border}` }}
                    >
                      {loadingMore
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                        : <><ChevronDown className="w-4 h-4" /> Load more</>
                      }
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Connections tab */}
          {activeTab === 'connections' && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                {connections.length} mutual connection{connections.length !== 1 ? 's' : ''}
              </p>
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: C.card }} />
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <UserCheck className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p className="font-semibold" style={{ color: C.textMuted }}>No connections yet</p>
                  <p className="text-sm mt-1" style={{ color: C.textDim }}>Discover founders and send connection requests</p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: C.blue, color: '#fff' }}
                  >
                    Discover Founders
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {connections.map(conn => {
                    const other = conn.user1_id === currentUser?.id ? conn.user2 : conn.user1
                    return (
                      <div key={conn.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                        <Avatar user={other} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{getName(other)}</p>
                          {other?.username && <p className="text-xs" style={{ color: C.blueLight }}>@{other.username}</p>}
                          <p className="text-xs mt-0.5" style={{ color: C.textDim }}>
                            {other?.role === 'host' ? '⚡ Host' : '🧠 Founder'}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: C.greenDim, color: C.green }}>
                          <Check className="w-3 h-3" /> Connected
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Following tab */}
          {activeTab === 'following' && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                Following {following.length} founder{following.length !== 1 ? 's' : ''}
              </p>
              {following.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p className="font-semibold" style={{ color: C.textMuted }}>Not following anyone yet</p>
                  <p className="text-sm mt-1" style={{ color: C.textDim }}>Follow founders to see their posts in your feed</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {following.map(f => {
                    const u = (f as any).users
                    return (
                      <div key={f.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                        <Avatar user={u} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{getName(u)}</p>
                          {u?.username && <p className="text-xs" style={{ color: C.blueLight }}>@{u.username}</p>}
                        </div>
                        <button
                          onClick={async () => {
                            await supabase.from('follows').delete().eq('follower_id', currentUser?.id).eq('following_id', f.following_id)
                            setFollowing(prev => prev.filter(x => x.id !== f.id))
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0"
                          style={{ background: C.purpleDim, color: '#A78BFA' }}
                        >
                          Unfollow
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending tab */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                {pending.length} pending request{pending.length !== 1 ? 's' : ''}
              </p>
              {pending.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <UserPlus className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p className="font-semibold" style={{ color: C.textMuted }}>No pending requests</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.map(req => (
                    <PendingCard
                      key={req.id}
                      request={req}
                      currentUserId={currentUser?.id || ''}
                      onAction={() => {
                        loadConnections(currentUser?.id || '')
                        loadPending(currentUser?.id || '')
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
