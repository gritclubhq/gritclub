'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send,
  Users, Radio, Shield, Volume2, VolumeX, Monitor,
  MonitorOff, PenLine, Eraser, Minus, Square, Circle,
  Trash2, ChevronDown, Heart, Loader2, Crown
} from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:      '#0A0F1E', surface: '#0D1428', card: '#111827',
  border:  'rgba(255,255,255,0.06)', text: '#F0F4FF',
  textMuted:'#7B8DB0', textDim: '#3D4F6E',
  blue:    '#2563EB', blueLight: '#3B82F6', blueDim: 'rgba(37,99,235,0.12)',
  gold:    '#F59E0B', goldDim: 'rgba(245,158,11,0.1)',
  red:     '#EF4444', redDim:  'rgba(239,68,68,0.1)',
  green:   '#10B981',
}

type BoardBg   = { name: string; value: string }
type BoardColor= { name: string; value: string }
type Tool      = 'pen' | 'marker' | 'eraser' | 'line' | 'rect' | 'circle'
type Mode      = 'camera' | 'screen' | 'whiteboard'

const BOARD_BGS: BoardBg[] = [
  { name: 'White',  value: '#F8FAFC' },
  { name: 'Black',  value: '#0A0A0F' },
  { name: 'Green',  value: '#14532D' },
]
const BOARD_COLORS: BoardColor[] = [
  { name: 'Black',  value: '#0A0A0F' },
  { name: 'White',  value: '#FFFFFF' },
  { name: 'Red',    value: '#EF4444' },
  { name: 'Blue',   value: '#3B82F6' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Green',  value: '#10B981' },
]
const BRUSH_SIZES = [2, 4, 8, 14, 22]

const getName     = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInitials = (u: any) => getName(u).slice(0, 2).toUpperCase()
const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const formatTime  = (ts: number) => {
  const d = Date.now() - ts
  const m = Math.floor(d/60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  return `${Math.floor(m/60)}h`
}

// ─── Whiteboard ─────────────────────────────────────────────────────────────
function Whiteboard({ boardBg }: { boardBg: string }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [tool,     setTool]    = useState<Tool>('pen')
  const [color,    setColor]   = useState('#FFFFFF')
  const [size,     setSize]    = useState(4)
  const [showBgPick, setShowBgPick] = useState(false)
  const [bg,       setBg]      = useState(boardBg)
  const drawing    = useRef(false)
  const last       = useRef<{ x: number; y: number } | null>(null)
  const snapshot   = useRef<ImageData | null>(null)

  // Sync bg prop
  useEffect(() => { setBg(boardBg) }, [boardBg])

  // Fill bg when it changes
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, c.width, c.height)
  }, [bg])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) return { x: (e.touches[0].clientX - rect.left)*sx, y: (e.touches[0].clientY - rect.top)*sy }
    return { x: ((e as React.MouseEvent).clientX - rect.left)*sx, y: ((e as React.MouseEvent).clientY - rect.top)*sy }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const pos = getPos(e, c)
    drawing.current = true
    last.current = pos
    snapshot.current = ctx.getImageData(0, 0, c.width, c.height)
    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const pos = getPos(e, c)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'

    if (tool === 'pen') {
      ctx.lineWidth = size; ctx.strokeStyle = color
      ctx.lineTo(pos.x, pos.y); ctx.stroke()
    } else if (tool === 'marker') {
      ctx.lineWidth = size * 3; ctx.strokeStyle = color + '99'
      ctx.lineTo(pos.x, pos.y); ctx.stroke()
    } else if (tool === 'eraser') {
      ctx.lineWidth = size * 5; ctx.strokeStyle = bg
      ctx.lineTo(pos.x, pos.y); ctx.stroke()
    } else if (snapshot.current && last.current) {
      ctx.putImageData(snapshot.current, 0, 0)
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = size
      if (tool === 'line') {
        ctx.moveTo(last.current.x, last.current.y)
        ctx.lineTo(pos.x, pos.y); ctx.stroke()
      } else if (tool === 'rect') {
        ctx.strokeRect(last.current.x, last.current.y, pos.x - last.current.x, pos.y - last.current.y)
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - last.current.x) / 2
        const ry = Math.abs(pos.y - last.current.y) / 2
        const cx = last.current.x + (pos.x - last.current.x) / 2
        const cy = last.current.y + (pos.y - last.current.y) / 2
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke()
      }
    }
  }

  const stopDraw = () => { drawing.current = false; last.current = null }

  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height)
  }

  const TOOLS: { id: Tool; icon: any; label: string }[] = [
    { id: 'pen',    icon: PenLine,  label: 'Pen' },
    { id: 'marker', icon: PenLine,  label: 'Marker' },
    { id: 'eraser', icon: Eraser,   label: 'Eraser' },
    { id: 'line',   icon: Minus,    label: 'Line' },
    { id: 'rect',   icon: Square,   label: 'Rect' },
    { id: 'circle', icon: Circle,   label: 'Circle' },
  ]

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap flex-shrink-0"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>

        {/* Tools */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: C.surface }}>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
              style={{ background: tool === t.id ? C.blue : 'transparent', color: tool === t.id ? '#fff' : C.textDim }}>
              <t.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="w-px h-6" style={{ background: C.border }} />

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {BOARD_COLORS.map(col => (
            <button key={col.value} onClick={() => setColor(col.value)} title={col.name}
              className="rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{
                width:   color === col.value ? 20 : 16,
                height:  color === col.value ? 20 : 16,
                background: col.value,
                outline: color === col.value ? `2px solid ${col.value}` : `1px solid ${C.border}`,
                outlineOffset: color === col.value ? '2px' : '0px',
              }} />
          ))}
        </div>

        <div className="w-px h-6" style={{ background: C.border }} />

        {/* Brush sizes */}
        <div className="flex items-center gap-1.5">
          {BRUSH_SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)}
              className="flex items-center justify-center rounded-full transition-all"
              style={{
                width:  Math.max(s + 6, 12),
                height: Math.max(s + 6, 12),
                background: size === s ? color : C.border,
              }} />
          ))}
        </div>

        <div className="flex-1" />

        {/* Board background picker */}
        <div className="relative">
          <button onClick={() => setShowBgPick(p => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: C.surface, color: C.textMuted }}>
            <div className="w-3.5 h-3.5 rounded-sm border" style={{ background: bg, borderColor: C.border }} />
            Board <ChevronDown className="w-3 h-3" />
          </button>
          {showBgPick && (
            <div className="absolute right-0 top-full mt-1 p-2 rounded-xl flex gap-2 z-20"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              {BOARD_BGS.map(b => (
                <button key={b.value} onClick={() => { setBg(b.value); setShowBgPick(false) }} title={b.name}
                  className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                  style={{ background: b.value, borderColor: bg === b.value ? C.blueLight : C.border }} />
              ))}
            </div>
          )}
        </div>

        <button onClick={clearCanvas}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
          style={{ background: C.redDim, color: C.red }}>
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none', background: bg }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const eventId  = id as string

  const [event,       setEvent]       = useState<any>(null)
  const [user,        setUser]        = useState<any>(null)
  const [profile,     setProfile]     = useState<any>(null)
  const [isHost,      setIsHost]      = useState(false)
  const [isCohost,    setIsCohost]    = useState(false)
  const [messages,    setMessages]    = useState<any[]>([])
  const [newMsg,      setNewMsg]      = useState('')
  const [viewers,     setViewers]     = useState(1)
  const [micOn,       setMicOn]       = useState(true)
  const [camOn,       setCamOn]       = useState(true)
  const [muted,       setMuted]       = useState(false)
  const [streaming,   setStreaming]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [accessDenied,setAccessDenied]= useState(false)
  const [mode,        setMode]        = useState<Mode>('camera')
  const [boardBg,     setBoardBg]     = useState('#0A0A0F')
  const [reactions,   setReactions]   = useState(0)
  const [liked,       setLiked]       = useState(false)
  const [earnings,    setEarnings]    = useState(0)
  const [sendingMsg,  setSendingMsg]  = useState(false)

  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const screenStreamRef= useRef<MediaStream | null>(null)
  const chatBottomRef  = useRef<HTMLDivElement>(null)
  const channelRef     = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)

      const { data: ev } = await supabase
        .from('events')
        .select('*, users(id, email, full_name, photo_url)')
        .eq('id', eventId)
        .single()
      if (!ev) { router.push('/dashboard'); return }
      setEvent(ev)

      // Host check
      const isEventHost = ev.host_id === u.id || prof?.role === 'admin'
      setIsHost(isEventHost)

      // Co-host check
      const { data: cohostRow } = await supabase
        .from('event_cohosts')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', u.id)
        .maybeSingle()
      const isCo = !!cohostRow
      setIsCohost(isCo)

      const canControl = isEventHost || isCo

      // Access: host/cohost always in; free events always in; else check ticket
      if (!canControl && (ev.price > 0 || !ev.is_free)) {
        const { data: ticket } = await supabase
          .from('tickets')
          .select('id')
          .eq('user_id', u.id)
          .eq('event_id', eventId)
          .in('status', ['paid', 'free', 'confirmed', 'active'])
          .maybeSingle()
        if (!ticket) { setAccessDenied(true); setLoading(false); return }
      }

      // Reaction count
      const { count: rc } = await supabase
        .from('event_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
      setReactions(rc || 0)

      // Did I already like?
      const { data: myReaction } = await supabase
        .from('event_reactions')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', u.id)
        .maybeSingle()
      if (myReaction) setLiked(true)

      // Earnings for host
      if (isEventHost) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount')
          .eq('event_id', eventId)
          .eq('status', 'paid')
        const total = (tickets || []).reduce((s: number, t: any) => s + Math.floor(t.amount * 0.8), 0)
        setEarnings(total)
      }

      setLoading(false)

      // Realtime channel for chat + presence
      const ch = supabase.channel(`live-${eventId}`, { config: { presence: { key: u.id } } })
        .on('broadcast', { event: 'chat' }, ({ payload }) => {
          setMessages(prev => [...prev, payload])
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        })
        .on('broadcast', { event: 'reaction' }, () => {
          setReactions(prev => prev + 1)
        })
        .on('presence', { event: 'sync' }, () => {
          const state = ch.presenceState()
          setViewers(Object.keys(state).length)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') await ch.track({ user_id: u.id })
        })

      channelRef.current = ch

      // Realtime earnings ticker for host
      if (isEventHost) {
        supabase.channel('earnings-ticker')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets', filter: `event_id=eq.${eventId}` },
            (payload: any) => {
              setEarnings(prev => prev + Math.floor(payload.new.amount * 0.8))
            })
          .subscribe()
      }
    }
    init()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [eventId])

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        // NOT mirrored
        localVideoRef.current.style.transform = 'scaleX(1)'
      }
      setStreaming(true)
      setMode('camera')
      await supabase.from('events').update({ status: 'live' }).eq('id', eventId)
    } catch {
      alert('Could not access camera/microphone. Please allow permissions.')
    }
  }

  const stopStream = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    setStreaming(false)
    await supabase.from('events').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', eventId)
    router.push(isHost ? '/host' : '/dashboard')
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(p => !p)
  }

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(p => !p)
  }

  const startScreenShare = async () => {
    try {
      const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = screen
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screen
        localVideoRef.current.style.transform = 'scaleX(1)'
      }
      setMode('screen')
      screen.getVideoTracks()[0].onended = () => {
        if (streamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = streamRef.current
          localVideoRef.current.style.transform = 'scaleX(1)'
        }
        setMode('camera')
        screenStreamRef.current = null
      }
    } catch {}
  }

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    if (streamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = streamRef.current
      localVideoRef.current.style.transform = 'scaleX(1)'
    }
    setMode('camera')
  }

  const switchToWhiteboard = (bg: string) => {
    setBoardBg(bg)
    setMode('whiteboard')
  }

  const backToCamera = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
    }
    if (streamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = streamRef.current
      localVideoRef.current.style.transform = 'scaleX(1)'
    }
    setMode('camera')
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !channelRef.current || sendingMsg) return
    setSendingMsg(true)
    const msg = {
      id:      Date.now().toString(),
      user_id: user.id,
      name:    getName(profile || user),
      avatar:  profile?.photo_url || user.user_metadata?.avatar_url || '',
      text:    newMsg.trim().slice(0, 500),
      ts:      Date.now(),
      isHost:  isHost || isCohost,
    }
    setMessages(prev => [...prev, msg])
    setNewMsg('')
    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg })
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    setSendingMsg(false)
  }

  const handleLike = async () => {
    if (!user || liked) return
    setLiked(true)
    setReactions(p => p + 1)
    await supabase.from('event_reactions').insert({ event_id: eventId, user_id: user.id })
    await channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: {} })
  }

  const canControl = isHost || isCohost
  const initials   = getInitials(profile || user)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: C.blueLight }} />
          <p className="text-sm" style={{ color: C.textMuted }}>Joining room...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
        <div className="rounded-2xl p-8 text-center max-w-sm w-full" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: C.red }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>Ticket Required</h2>
          <p className="text-sm mb-6" style={{ color: C.textMuted }}>You need a ticket to join this event.</p>
          <button onClick={() => router.push(`/events/${eventId}`)}
            className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: C.gold, color: '#0A0F1E' }}>
            Get Ticket →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: C.bg }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          {event?.status === 'live' && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: C.redDim, color: C.red }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
          <h1 className="font-bold text-sm truncate max-w-[160px] md:max-w-sm" style={{ color: C.text }}>
            {event?.title}
          </h1>
          {(isHost || isCohost) && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: C.goldDim, color: C.gold }}>
              <Crown className="w-3 h-3" />
              {isHost ? 'Host' : 'Co-host'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Earnings ticker — host only */}
          {isHost && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-bold"
              style={{ color: C.gold }}>
              ${(earnings / 100).toFixed(2)}
              <span className="text-xs font-normal" style={{ color: C.textDim }}>earned</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm" style={{ color: C.textMuted }}>
            <Users className="w-4 h-4" />{viewers}
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ background: C.surface, color: C.textMuted }}>
            Leave
          </button>
        </div>
      </div>

      {/* ── Body: 70% video + 30% chat ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── VIDEO / BOARD AREA (70%) ── */}
        <div className="flex flex-col" style={{ width: '70%', background: '#000', minWidth: 0 }}>

          {/* Content area */}
          <div className="flex-1 relative overflow-hidden">

            {/* Camera video — always rendered, shown in camera mode */}
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{
                display: mode === 'camera' && streaming ? 'block' : 'none',
                transform: 'scaleX(1)', // NOT mirrored
              }}
            />

            {/* Whiteboard */}
            {mode === 'whiteboard' && <Whiteboard boardBg={boardBg} />}

            {/* Placeholder when not streaming */}
            {mode === 'camera' && !streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: avatarColor(user?.id||'')+'22', color: avatarColor(user?.id||'') }}>
                  {canControl ? initials : (
                    event?.users?.photo_url
                      ? <img src={event.users.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      : getInitials(event?.users)
                  )}
                </div>
                <div className="text-center px-4">
                  {canControl ? (
                    <>
                      <p className="text-white font-semibold mb-1">You're the {isHost ? 'host' : 'co-host'}</p>
                      <p className="text-sm mb-5" style={{ color: C.textMuted }}>Click Go Live to start streaming</p>
                      <button onClick={startStream}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm mx-auto"
                        style={{ background: C.red, color: 'white' }}>
                        <Radio className="w-4 h-4" /> Go Live
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold">{getName(event?.users)}</p>
                      <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                        {event?.status === 'live' ? 'Stream starting...' : 'Waiting for host'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cam off overlay */}
            {canControl && streaming && !camOn && mode === 'camera' && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: C.surface }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2"
                    style={{ background: avatarColor(user?.id||'')+'22', color: avatarColor(user?.id||'') }}>
                    {initials}
                  </div>
                  <p className="text-xs" style={{ color: C.textMuted }}>Camera off</p>
                </div>
              </div>
            )}

            {/* Screen share badge */}
            {mode === 'screen' && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(37,99,235,0.2)', color: C.blueLight, border: `1px solid rgba(37,99,235,0.3)` }}>
                <Monitor className="w-3.5 h-3.5" /> Screen Sharing
              </div>
            )}
          </div>

          {/* ── Host / Co-host controls ── */}
          {canControl && (
            <div className="flex-shrink-0 px-4 py-3" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>

              {/* Mode switcher — only when streaming */}
              {streaming && (
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  {/* Camera */}
                  <button onClick={backToCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: mode === 'camera' ? C.blueDim : 'rgba(51,65,85,0.5)',
                      color:      mode === 'camera' ? C.blueLight : C.textDim,
                      border:     `1px solid ${mode === 'camera' ? 'rgba(37,99,235,0.3)' : 'transparent'}`,
                    }}>
                    <Video className="w-3.5 h-3.5" /> Camera
                  </button>

                  {/* Screen share */}
                  <button onClick={mode === 'screen' ? stopScreenShare : startScreenShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: mode === 'screen' ? C.blueDim : 'rgba(51,65,85,0.5)',
                      color:      mode === 'screen' ? C.blueLight : C.textDim,
                      border:     `1px solid ${mode === 'screen' ? 'rgba(37,99,235,0.3)' : 'transparent'}`,
                    }}>
                    <Monitor className="w-3.5 h-3.5" />
                    {mode === 'screen' ? 'Stop Share' : 'Screen Share'}
                  </button>

                  {/* Board pickers */}
                  {BOARD_BGS.map(b => (
                    <button key={b.value}
                      onClick={() => switchToWhiteboard(b.value)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: mode === 'whiteboard' && boardBg === b.value ? 'rgba(124,58,237,0.15)' : 'rgba(51,65,85,0.5)',
                        color:      mode === 'whiteboard' && boardBg === b.value ? '#A78BFA' : C.textDim,
                        border:     `1px solid ${mode === 'whiteboard' && boardBg === b.value ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
                      }}>
                      <div className="w-3 h-3 rounded-sm border" style={{ background: b.value, borderColor: C.border }} />
                      {b.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Mic / Cam / End */}
              <div className="flex items-center justify-center gap-3">
                <button onClick={toggleMic}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: micOn ? C.card : C.redDim, color: micOn ? C.text : C.red, border: `1px solid ${micOn ? C.border : C.red+'44'}` }}>
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleCam}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: camOn ? C.card : C.redDim, color: camOn ? C.text : C.red, border: `1px solid ${camOn ? C.border : C.red+'44'}` }}>
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                {streaming ? (
                  <button onClick={stopStream}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                    style={{ background: C.red, color: 'white' }}>
                    <PhoneOff className="w-4 h-4" /> End Stream
                  </button>
                ) : (
                  <button onClick={startStream}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                    style={{ background: C.red, color: 'white' }}>
                    <Radio className="w-4 h-4" /> Go Live
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Audience controls ── */}
          {!canControl && (
            <div className="flex items-center justify-center gap-4 py-3 flex-shrink-0"
              style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => setMuted(m => !m)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: C.card, color: muted ? C.red : C.text }}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-xs" style={{ color: C.textMuted }}>{muted ? 'Unmute stream' : 'Mute stream'}</span>
              {/* Like button — audience only */}
              <button onClick={handleLike} disabled={liked}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-70"
                style={{ background: liked ? C.redDim : C.card, color: liked ? C.red : C.textMuted, border: `1px solid ${liked ? C.red+'44' : C.border}` }}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
                {reactions > 0 ? reactions : 'Like'}
              </button>
            </div>
          )}
        </div>

        {/* ── CHAT AREA (30%) ── */}
        <div className="flex flex-col" style={{ width: '30%', borderLeft: `1px solid ${C.border}`, minWidth: 0 }}>

          {/* Chat header */}
          <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
            <span className="text-sm font-semibold" style={{ color: C.text }}>Live Chat</span>
            <div className="flex items-center gap-3">
              {/* Reaction count */}
              {reactions > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: C.red }}>
                  <Heart className="w-3 h-3 fill-red-500" /> {reactions}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textMuted }}>
                <Users className="w-3.5 h-3.5" />{viewers}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-8">
                <p className="text-xs" style={{ color: C.textDim }}>Chat is live — say hello! 👋</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{
                    background: msg.isHost
                      ? `linear-gradient(135deg, ${C.gold}, #F97316)`
                      : `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
                    color: '#fff',
                  }}>
                  {msg.avatar
                    ? <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
                    : msg.name?.[0]?.toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: msg.isHost ? C.gold : C.blueLight }}>
                      {msg.name}
                    </span>
                    {msg.isHost && (
                      <span className="text-xs px-1 py-0.5 rounded font-bold"
                        style={{ background: C.goldDim, color: C.gold, fontSize: '9px' }}>
                        HOST
                      </span>
                    )}
                    <span className="text-xs" style={{ color: C.textDim }}>{formatTime(msg.ts)}</span>
                  </div>
                  <p className="text-sm break-words leading-snug" style={{ color: '#D4DBEE' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input — everyone can chat */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Say something..."
                maxLength={500}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button onClick={sendMessage} disabled={!newMsg.trim() || sendingMsg}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{ background: C.blue, color: '#fff' }}>
                {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {!canControl && (
              <p className="text-xs mt-1.5 text-center" style={{ color: C.textDim }}>
                Chat only · Use ❤️ to react to the stream
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
