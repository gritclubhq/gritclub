'use client'

import { Suspense } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Send, Search, X,
  Loader2, MessageCircle, ArrowLeft, Check, CheckCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const viewport = { themeColor: '#291C0E' }

const C = {
  bg:        '#291C0E',
  surface:   '#2F2115',
  card:      '#2F2115',
  border:    'rgba(225,212,194,0.08)',
  text:      '#E1D4C2',
  textMuted: '#BEB5A9',
  textDim:   '#A78D78',
  red:       '#C4956A',
  redDim:    'rgba(225,212,194,0.08)',
  gold:      '#A78D78',
  green:     '#6B9E7A',
}

const ACOLORS = ['#C4956A','#A78D78','#38BDF8','#A78D78','#6B9E7A','#F97316']
const aBg     = (id: string) => ACOLORS[(id?.charCodeAt(0) || 0) % ACOLORS.length]
const getName = (u: any)     => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInit = (u: any)     => getName(u).slice(0, 2).toUpperCase()
const fmtTime = (ts: string) => {
  const d = new Date(ts), now = new Date(), diff = now.getTime() - d.getTime()
  if (diff < 60000)     return 'now'
  if (diff < 3600000)   return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000)  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 36 }: { user: any; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700,
      color: '#fff', background: aBg(user?.id || ''), fontFamily: 'Sora,sans-serif',
    }}>
      {user?.photo_url
        ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : getInit(user)
      }
    </div>
  )
}

function RoleBadge({ role }: { role?: string }) {
  if (!role || role === 'audience') return null
  const map: Record<string, { bg: string; color: string }> = {
    host:  { bg: 'rgba(255,215,0,0.12)',  color: '#A78D78' },
    admin: { bg: 'rgba(225,212,194,0.08)', color: '#C4956A' },
  }
  const s = map[role]
  if (!s) return null
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
      fontFamily: 'Inter,sans-serif', letterSpacing: '0.07em',
      textTransform: 'uppercase', background: s.bg, color: s.color, flexShrink: 0,
    }}>
      {role}
    </span>
  )
}

// ── Convo List — stable top-level component ───────────────────────────────────
function ConvoList({
  convos, activeConvoId, showSearch, searchQ, allUsers,
  onSelectConvo, onToggleSearch, onSearchChange, onStartConvo,
}: {
  convos: any[], activeConvoId: string | null, showSearch: boolean,
  searchQ: string, allUsers: any[],
  onSelectConvo: (c: any) => void,
  onToggleSearch: () => void,
  onSearchChange: (q: string) => void,
  onStartConvo: (u: any) => void,
}) {
  const filtered = convos.filter(c =>
    !searchQ.trim() || getName(c.partner).toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surface, borderRight: `1px solid ${C.border}` }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: 'Sora,sans-serif', margin: 0, letterSpacing: '-0.02em' }}>Messages</h2>
          <button
            onClick={onToggleSearch}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: showSearch ? C.redDim : C.card,
              color: showSearch ? C.red : C.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
            {showSearch ? <X style={{ width: 15, height: 15 }} /> : <Search style={{ width: 15, height: 15 }} />}
          </button>
        </div>

        {showSearch ? (
          <div>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.textDim }} />
              <input
                autoFocus
                value={searchQ}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Find people..."
                style={{
                  width: '100%', padding: '9px 12px 9px 30px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif',
                }}
              />
            </div>
            {allUsers.length > 0 && (
              <div style={{ marginTop: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {allUsers.map(u => (
                  <button key={u.id} onClick={() => onStartConvo(u)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar user={u} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'Inter,sans-serif', margin: 0 }}>{getName(u)}</p>
                        <RoleBadge role={u.role} />
                      </div>
                      <p style={{ fontSize: 11, color: C.textMuted, fontFamily: 'Inter,sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.textDim }} />
            <input
              value={searchQ}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: '100%', padding: '9px 12px 9px 30px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.card,
                color: C.text, fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif',
              }}
            />
          </div>
        )}
      </div>

      {/* Convo rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && !showSearch && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <MessageCircle style={{ width: 34, height: 34, color: C.textDim, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'Inter,sans-serif', marginBottom: 6 }}>No conversations yet</p>
            <p style={{ fontSize: 12, color: C.textDim, fontFamily: 'Inter,sans-serif' }}>Tap the search icon to message someone</p>
          </div>
        )}
        {filtered.map(conv => {
          const isActive = activeConvoId === conv.id
          return (
            <button key={conv.id} onClick={() => onSelectConvo(conv)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 16px', background: isActive ? C.redDim : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderLeft: `3px solid ${isActive ? C.red : 'transparent'}`,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isActive ? C.redDim : 'transparent' }}
            >
              <Avatar user={conv.partner} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: isActive ? C.red : C.text,
                      fontFamily: 'Inter,sans-serif',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {getName(conv.partner)}
                    </span>
                    <RoleBadge role={conv.partner?.role} />
                  </div>
                  <span style={{ fontSize: 10, color: C.textDim, flexShrink: 0, marginLeft: 6 }}>
                    {conv.last_message_at ? fmtTime(conv.last_message_at) : ''}
                  </span>
                </div>
                <p style={{
                  fontSize: 12, color: C.textMuted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'Inter,sans-serif', margin: 0,
                }}>
                  {conv.last_message || 'Start a conversation'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Chat Window — stable top-level component ──────────────────────────────────
function ChatWindow({
  activeConvo, messages, me, isMobile,
  onBack,
}: {
  activeConvo: any, messages: any[], me: any, isMobile: boolean,
  onBack: () => void,
}) {
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const chatBottom  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when conversation opens
  useEffect(() => {
    if (activeConvo) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [activeConvo?.id])

  const sendMessage = async () => {
    if (!text.trim() || !activeConvo || !me || sending) return
    const content = text.trim()
    setSending(true)
    setText('')

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const msg = {
      id:              crypto.randomUUID(),
      conversation_id: activeConvo.id,
      sender_id:       me.id,
      content,
      msg_type:        'text',
      created_at:      new Date().toISOString(),
      read_by:         [me.id],
    }

    // Optimistic update handled by parent via realtime
    await supabase.from('dm_messages').insert(msg)
    await supabase.from('dm_conversations').update({
      last_message:    content,
      last_message_at: new Date().toISOString(),
    }).eq('id', activeConvo.id)

    setSending(false)
    // Restore focus after send
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
        background: C.surface, flexShrink: 0,
      }}>
        {isMobile && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, display: 'flex' }}>
            <ArrowLeft style={{ width: 19, height: 19 }} />
          </button>
        )}
        <Avatar user={activeConvo?.partner} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'Sora,sans-serif', margin: 0 }}>
              {getName(activeConvo?.partner)}
            </p>
            <RoleBadge role={activeConvo?.partner?.role} />
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: 'Inter,sans-serif', margin: 0 }}>
            {activeConvo?.partner?.email}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <Avatar user={activeConvo?.partner} size={56} />
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12, fontFamily: 'Sora,sans-serif' }}>
              {getName(activeConvo?.partner)}
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6, fontFamily: 'Inter,sans-serif' }}>
              Say hello 👋
            </p>
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.sender_id === me?.id
          const isRead = (msg.read_by || []).filter((id: string) => id !== me?.id).length > 0
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: 7, alignItems: 'flex-end' }}>
              {!isOwn && <Avatar user={activeConvo?.partner} size={26} />}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 3 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isOwn ? C.red : 'rgba(225,212,194,0.08)',
                  color: isOwn ? '#fff' : C.text,
                  fontSize: 14, lineHeight: 1.55,
                  wordBreak: 'break-word',
                  fontFamily: 'Inter,sans-serif',
                }}>
                  {msg.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 10, color: C.textDim, fontFamily: 'Inter,sans-serif' }}>
                    {fmtTime(msg.created_at)}
                  </span>
                  {isOwn && (isRead
                    ? <CheckCheck style={{ width: 12, height: 12, color: C.red }} />
                    : <Check style={{ width: 12, height: 12, color: C.textDim }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={chatBottom} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: C.card, borderRadius: 12,
          border: `1px solid ${C.border}`, padding: '8px 12px',
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${getName(activeConvo?.partner)}...`}
            rows={1}
            maxLength={2000}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: C.text, fontSize: 14, fontFamily: 'Inter,sans-serif',
              outline: 'none', resize: 'none', lineHeight: 1.5,
              maxHeight: 120, overflowY: 'auto',
              caretColor: C.red,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: text.trim() ? C.red : 'rgba(255,255,255,0.05)',
              color: text.trim() ? '#fff' : C.textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: text.trim() ? 'pointer' : 'default',
              flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            {sending
              ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 0.8s linear infinite' }} />
              : <Send style={{ width: 15, height: 15 }} />
            }
          </button>
        </div>
        <p style={{ fontSize: 10, color: C.textDim, textAlign: 'center', marginTop: 5, fontFamily: 'Inter,sans-serif' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: C.bg, gap: 14 }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageCircle style={{ width: 30, height: 30, color: C.red }} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: 'Sora,sans-serif', margin: 0 }}>Your Messages</h3>
      <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 260, fontFamily: 'Inter,sans-serif', lineHeight: 1.65, margin: 0 }}>
        Connect privately with anyone on GritClub.
      </p>
      <button
        onClick={onNewChat}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 8, border: 'none',
          background: C.red, color: '#fff',
          fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
          letterSpacing: '0.05em', cursor: 'pointer',
        }}
      >
        <Search style={{ width: 15, height: 15 }} /> Start a conversation
      </button>
    </div>
  )
}

// ── Main DMPage ───────────────────────────────────────────────────────────────
function DMPage() {
  const router = useRouter()

  const [me,          setMe]          = useState<any>(null)
  const [convos,      setConvos]      = useState<any[]>([])
  const [activeConvo, setActiveConvo] = useState<any>(null)
  const [messages,    setMessages]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [searchQ,     setSearchQ]     = useState('')
  const [allUsers,    setAllUsers]    = useState<any[]>([])
  const [showSearch,  setShowSearch]  = useState(false)
  const [mobileView,  setMobileView]  = useState<'list' | 'chat'>('list')
  const [winW,        setWinW]        = useState(1200)

  const msgChannel = useRef<any>(null)
  const meRef      = useRef<any>(null)

  useEffect(() => {
    const h = () => setWinW(window.innerWidth)
    h(); window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  const isMobile = winW < 768

  // Boot
  useEffect(() => {
    const targetUserId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('user')
      : null

    ;(async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setMe(u); meRef.current = u
      await loadConvos(u.id)
      if (targetUserId) await openOrCreateConvo(u.id, targetUserId)
      setLoading(false)
    })()

    return () => { if (msgChannel.current) supabase.removeChannel(msgChannel.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConvos = async (uid: string) => {
    const { data } = await supabase
      .from('dm_conversations')
      .select(`*, user_a_data:users!dm_conversations_user_a_fkey(id,full_name,email,photo_url,role), user_b_data:users!dm_conversations_user_b_fkey(id,full_name,email,photo_url,role)`)
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order('last_message_at', { ascending: false })
    if (data) {
      setConvos(data.map(c => ({
        ...c,
        partner: c.user_a === uid ? c.user_b_data : c.user_a_data,
      })))
    }
  }

  const openOrCreateConvo = async (myId: string, partnerId: string) => {
    const { data: convId } = await supabase.rpc('get_or_create_dm', { uid_a: myId, uid_b: partnerId })
    if (convId) {
      const { data: conv } = await supabase
        .from('dm_conversations')
        .select(`*, user_a_data:users!dm_conversations_user_a_fkey(id,full_name,email,photo_url,role), user_b_data:users!dm_conversations_user_b_fkey(id,full_name,email,photo_url,role)`)
        .eq('id', convId).single()
      if (conv) {
        const enriched = { ...conv, partner: conv.user_a === myId ? conv.user_b_data : conv.user_a_data }
        await openConvo(enriched, myId)
        await loadConvos(myId)
      }
    }
  }

  const openConvo = useCallback(async (conv: any, uid?: string) => {
    const myId = uid || meRef.current?.id
    setActiveConvo(conv)
    setMobileView('chat')

    const { data: msgs } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages(msgs || [])

    // Mark as read
    if (msgs?.length && myId) {
      const unread = msgs.filter(m => m.sender_id !== myId && !(m.read_by || []).includes(myId))
      for (const m of unread) {
        await supabase.from('dm_messages').update({ read_by: [...(m.read_by || []), myId] }).eq('id', m.id)
      }
    }

    // Realtime
    if (msgChannel.current) supabase.removeChannel(msgChannel.current)
    const ch = supabase.channel(`dm-${conv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'dm_messages',
        filter: `conversation_id=eq.${conv.id}`,
      }, ({ new: msg }) => {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
      })
      .subscribe()
    msgChannel.current = ch
  }, [])

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setAllUsers([]); return }
    const { data } = await supabase
      .from('users')
      .select('id,full_name,email,photo_url,role')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', me?.id)
      .limit(10)
    setAllUsers(data || [])
  }

  const handleSearchChange = (q: string) => {
    setSearchQ(q)
    if (showSearch) searchUsers(q)
  }

  const handleToggleSearch = () => {
    setShowSearch(p => !p)
    setSearchQ('')
    setAllUsers([])
  }

  const startConvoWith = async (user: any) => {
    setShowSearch(false); setSearchQ(''); setAllUsers([])
    if (!me) return
    await openOrCreateConvo(me.id, user.id)
    await loadConvos(me.id)
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: C.bg }}>
        <Loader2 style={{ width: 32, height: 32, color: C.red, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <style>{`
        @keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {(!isMobile || mobileView === 'list') && (
          <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, height: '100%', overflow: 'hidden' }}>
            <ConvoList
              convos={convos}
              activeConvoId={activeConvo?.id || null}
              showSearch={showSearch}
              searchQ={searchQ}
              allUsers={allUsers}
              onSelectConvo={openConvo}
              onToggleSearch={handleToggleSearch}
              onSearchChange={handleSearchChange}
              onStartConvo={startConvoWith}
            />
          </div>
        )}
        {(!isMobile || mobileView === 'chat') && (
          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            {activeConvo
              ? <ChatWindow
                  activeConvo={activeConvo}
                  messages={messages}
                  me={me}
                  isMobile={isMobile}
                  onBack={() => setMobileView('list')}
                />
              : <EmptyState onNewChat={() => { setShowSearch(true); if (isMobile) setMobileView('list') }} />
            }
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#291C0E' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,77,45,0.25)', borderTopColor: '#C4956A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DMPage />
    </Suspense>
  )
}
