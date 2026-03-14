'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send,
  Users, Radio, Shield, Volume2, VolumeX,
  PenLine, Eraser, Square, Circle, Minus,
  Monitor, ChevronDown, Trash2, Palette, LayoutPanelLeft
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMsg {
  id: string
  user_id: string
  name: string
  avatar: string
  text: string
  ts: number
  isHost?: boolean
}

type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle'
type BoardColor = { name: string; value: string }

const BOARD_COLORS: BoardColor[] = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Yellow', value: '#FFD700' },
  { name: 'Sky', value: '#38BDF8' },
  { name: 'Green', value: '#4ADE80' },
  { name: 'Red', value: '#F87171' },
  { name: 'Orange', value: '#FB923C' },
]

const BOARD_SIZES = [2, 4, 8, 14, 22]
const BOARD_BACKGROUNDS = [
  { name: 'Black', value: '#0F172A' },
  { name: 'Dark Green', value: '#052e16' },
  { name: 'White', value: '#F8FAFC' },
  { name: 'Navy', value: '#1E293B' },
]

// ─── Whiteboard ──────────────────────────────────────────────────────────────
function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#FFFFFF')
  const [size, setSize] = useState(4)
  const [bg, setBg] = useState('#0F172A')
  const [drawing, setDrawing] = useState(false)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const snapshot = useRef<ImageData | null>(null)

  // Fill background when bg changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Redraw existing content on top — simplified: just clear for now
  }, [bg])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    setDrawing(true)
    last.current = pos
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height)

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)

    ctx.lineWidth = tool === 'eraser' ? size * 4 : size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = tool === 'eraser' ? bg : color

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (snapshot.current && last.current) {
      ctx.putImageData(snapshot.current, 0, 0)
      ctx.beginPath()
      ctx.strokeStyle = color
      if (tool === 'line') {
        ctx.moveTo(last.current.x, last.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      } else if (tool === 'rect') {
        ctx.strokeRect(last.current.x, last.current.y, pos.x - last.current.x, pos.y - last.current.y)
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - last.current.x) / 2
        const ry = Math.abs(pos.y - last.current.y) / 2
        const cx = last.current.x + (pos.x - last.current.x) / 2
        const cy = last.current.y + (pos.y - last.current.y) / 2
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  const stopDraw = () => {
    setDrawing(false)
    last.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
    { id: 'pen', icon: PenLine, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Ellipse' },
  ]

  return (
    <div className="flex flex-col w-full h-full" style={{ background: '#0A0F1C' }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-wrap flex-shrink-0"
        style={{ background: '#1E293B', borderBottom: '1px solid #334155' }}
      >
        {/* Tools */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#0F172A' }}>
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
              style={{
                background: tool === t.id ? '#38BDF8' : 'transparent',
                color: tool === t.id ? '#0F172A' : '#94A3B8',
              }}
            >
              <t.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#334155' }} />

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {BOARD_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              title={c.name}
              className="rounded-full transition-transform hover:scale-110"
              style={{
                width: color === c.value ? '20px' : '16px',
                height: color === c.value ? '20px' : '16px',
                background: c.value,
                outline: color === c.value ? `2px solid ${c.value}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#334155' }} />

        {/* Pen size */}
        <div className="flex items-center gap-1.5">
          {BOARD_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="flex items-center justify-center rounded-full transition-all hover:opacity-80"
              style={{
                width: Math.max(s * 1.5 + 6, 12) + 'px',
                height: Math.max(s * 1.5 + 6, 12) + 'px',
                background: size === s ? color : '#334155',
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#334155' }} />

        {/* Background */}
        <div className="relative">
          <button
            onClick={() => setShowBgPicker(p => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
            style={{ background: '#0F172A' }}
          >
            <div className="w-4 h-4 rounded-full border border-slate-600" style={{ background: bg }} />
            Board
            <ChevronDown className="w-3 h-3" />
          </button>
          {showBgPicker && (
            <div
              className="absolute top-full left-0 mt-1 p-2 rounded-xl flex gap-2 z-20"
              style={{ background: '#1E293B', border: '1px solid #334155' }}
            >
              {BOARD_BACKGROUNDS.map(b => (
                <button
                  key={b.value}
                  onClick={() => { setBg(b.value); setShowBgPicker(false) }}
                  title={b.name}
                  className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    background: b.value,
                    borderColor: bg === b.value ? '#38BDF8' : '#475569',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear */}
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { id } = useParams()
  const router = useRouter()

  const [event, setEvent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [viewers, setViewers] = useState(1)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [muted, setMuted] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  // 'camera' | 'screen' | 'whiteboard'
  const [mode, setMode] = useState<'camera' | 'screen' | 'whiteboard'>('camera')
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)

      const { data: ev } = await supabase
        .from('events')
        .select('*, users(email, photo_url, profile_bio)')
        .eq('id', id)
        .single()
      if (!ev) { router.push('/dashboard'); return }
      setEvent(ev)

      const hostUser = ev.host_id === u.id || prof?.role === 'admin'
      setIsHost(hostUser)

      if (!hostUser && ev.price > 0) {
        const { data: ticket } = await supabase
          .from('tickets')
          .select('id')
          .eq('user_id', u.id)
          .eq('event_id', id)
          .eq('status', 'paid')
          .maybeSingle()
        if (!ticket) { setAccessDenied(true); setLoading(false); return }
      }

      setLoading(false)

      const ch = supabase.channel(`live-room-${id}`)
        .on('broadcast', { event: 'chat' }, ({ payload }) => {
          setMessages(prev => [...prev, payload])
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await ch.track({ user_id: u.id, online_at: new Date().toISOString() })
          }
        })

      channelRef.current = ch

      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        setViewers(Object.keys(state).length)
      })
    }
    init()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      screenStream?.getTracks().forEach(t => t.stop())
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [id])

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
      }
      setStreaming(true)
      setMode('camera')
      await supabase.from('events').update({ status: 'live' }).eq('id', id)
    } catch {
      alert('Could not access camera/microphone. Please allow permissions.')
    }
  }

  const stopStream = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    screenStream?.getTracks().forEach(t => t.stop())
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    setStreaming(false)
    setScreenStream(null)
    await supabase.from('events').update({ status: 'ended' }).eq('id', id)
    router.push('/host')
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(prev => !prev)
  }

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(prev => !prev)
  }

  const startScreenShare = async () => {
    try {
      const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true })
      setScreenStream(screen)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screen
        localVideoRef.current.muted = true
      }
      setMode('screen')
      screen.getVideoTracks()[0].onended = () => {
        // User stopped share via browser UI
        if (streamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = streamRef.current
        }
        setMode('camera')
        setScreenStream(null)
      }
    } catch {
      // User cancelled
    }
  }

  const stopScreenShare = () => {
    screenStream?.getTracks().forEach(t => t.stop())
    setScreenStream(null)
    if (streamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = streamRef.current
    }
    setMode('camera')
  }

  const switchToWhiteboard = () => {
    setMode('whiteboard')
  }

  const switchToCamera = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop())
      setScreenStream(null)
    }
    if (streamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = streamRef.current
    }
    setMode('camera')
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !channelRef.current) return
    const msg: ChatMsg = {
      id: Date.now().toString(),
      user_id: user.id,
      name: user.email.split('@')[0],
      avatar: user.user_metadata?.avatar_url || '',
      text: newMsg.trim(),
      ts: Date.now(),
      isHost,
    }
    setMessages(prev => [...prev, msg])
    setNewMsg('')
    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg })
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Viewer'
  const initials = name.slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Joining room...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F172A' }}>
        <div className="rounded-2xl p-8 text-center max-w-sm w-full" style={{ background: '#1E293B' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Ticket Required</h2>
          <p className="text-slate-400 text-sm mb-6">You need a ticket to join this event.</p>
          <button
            onClick={() => router.push(`/events/${id}`)}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: '#FFD700', color: '#0F172A' }}
          >
            Get Your Ticket →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0F172A' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: '#1E293B', borderBottom: '1px solid #334155' }}
      >
        <div className="flex items-center gap-3">
          {event?.status === 'live' && (
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          )}
          <h1 className="font-bold text-sm text-white truncate max-w-[180px] md:max-w-xs">
            {event?.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>{viewers}</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            style={{ background: '#334155' }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* ── Body: video 70% + chat 30% ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* VIDEO / WHITEBOARD AREA */}
        <div className="flex flex-col" style={{ width: '70%', background: '#000' }}>

          {/* Main content area */}
          <div className="flex-1 relative overflow-hidden">

            {/* Camera video (always rendered, hidden when not in camera mode) */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: mode === 'camera' && streaming ? 'block' : 'none' }}
            />

            {/* Whiteboard */}
            {mode === 'whiteboard' && <Whiteboard />}

            {/* Not streaming placeholder */}
            {mode === 'camera' && !streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}
                >
                  {isHost ? initials : (event?.users?.photo_url
                    ? <img src={event.users.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                    : event?.users?.email?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="text-center">
                  {isHost ? (
                    <>
                      <p className="text-white font-semibold mb-1">You're the host</p>
                      <p className="text-slate-400 text-sm mb-5">Ready to go live?</p>
                      <button
                        onClick={startStream}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm mx-auto"
                        style={{ background: '#EF4444', color: 'white' }}
                      >
                        <Radio className="w-4 h-4" />
                        Go Live
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold">{event?.users?.email?.split('@')[0]}</p>
                      <p className="text-slate-400 text-sm mt-1">Waiting for host to go live</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cam off overlay when streaming */}
            {isHost && streaming && !camOn && mode === 'camera' && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0F172A' }}>
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}
                  >
                    {initials}
                  </div>
                  <p className="text-slate-400 text-sm">Camera off</p>
                </div>
              </div>
            )}

            {/* Screen share indicator badge */}
            {mode === 'screen' && (
              <div
                className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(56,189,248,0.2)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}
              >
                <Monitor className="w-3.5 h-3.5" />
                Screen Sharing
              </div>
            )}
          </div>

          {/* ── Host Controls ── */}
          {isHost && (
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{ background: '#0A0F1C', borderTop: '1px solid #1E293B' }}
            >
              {/* Mode switcher */}
              {streaming && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={switchToCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: mode === 'camera' ? 'rgba(56,189,248,0.15)' : 'rgba(51,65,85,0.5)',
                      color: mode === 'camera' ? '#38BDF8' : '#64748B',
                      border: mode === 'camera' ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
                    }}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Camera
                  </button>
                  <button
                    onClick={mode === 'screen' ? stopScreenShare : startScreenShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: mode === 'screen' ? 'rgba(56,189,248,0.15)' : 'rgba(51,65,85,0.5)',
                      color: mode === 'screen' ? '#38BDF8' : '#64748B',
                      border: mode === 'screen' ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
                    }}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    {mode === 'screen' ? 'Stop Share' : 'Share Screen'}
                  </button>
                  <button
                    onClick={mode === 'whiteboard' ? switchToCamera : switchToWhiteboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: mode === 'whiteboard' ? 'rgba(167,139,250,0.15)' : 'rgba(51,65,85,0.5)',
                      color: mode === 'whiteboard' ? '#A78BFA' : '#64748B',
                      border: mode === 'whiteboard' ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                    }}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    {mode === 'whiteboard' ? 'Close Board' : 'Whiteboard'}
                  </button>
                </div>
              )}

              {/* Mic / Cam / End */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleMic}
                  title={micOn ? 'Mute' : 'Unmute'}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: micOn ? '#1E293B' : 'rgba(239,68,68,0.2)',
                    color: micOn ? '#E2E8F0' : '#F87171',
                  }}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleCam}
                  title={camOn ? 'Turn off camera' : 'Turn on camera'}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: camOn ? '#1E293B' : 'rgba(239,68,68,0.2)',
                    color: camOn ? '#E2E8F0' : '#F87171',
                  }}
                >
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                {streaming ? (
                  <button
                    onClick={stopStream}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                    style={{ background: '#EF4444', color: 'white' }}
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Stream
                  </button>
                ) : (
                  <button
                    onClick={startStream}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                    style={{ background: '#EF4444', color: 'white' }}
                  >
                    <Radio className="w-4 h-4" />
                    Go Live
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Audience controls ── */}
          {!isHost && (
            <div
              className="flex items-center justify-center gap-3 py-3 flex-shrink-0"
              style={{ background: '#0A0F1C', borderTop: '1px solid #1E293B' }}
            >
              <button
                onClick={() => setMuted(m => !m)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#1E293B', color: muted ? '#F87171' : 'white' }}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-slate-500 text-xs">{muted ? 'Unmute' : 'Mute'} stream</span>
            </div>
          )}
        </div>

        {/* ── CHAT — 30% ── */}
        <div className="flex flex-col" style={{ width: '30%', borderLeft: '1px solid #334155' }}>
          {/* Chat header */}
          <div
            className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderBottom: '1px solid #334155', background: '#1E293B' }}
          >
            <span className="text-sm font-semibold text-white">Live Chat</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {viewers}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-8">
                <p className="text-slate-600 text-xs">Chat is live — say hello! 👋</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className="flex gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{
                    background: msg.isHost
                      ? 'linear-gradient(135deg, #FFD700, #F59E0B)'
                      : 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
                    color: '#0F172A',
                  }}
                >
                  {msg.avatar
                    ? <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
                    : msg.name[0].toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: msg.isHost ? '#FFD700' : '#38BDF8' }}
                    >
                      {msg.name}
                    </span>
                    {msg.isHost && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', fontSize: '9px' }}
                      >
                        HOST
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 break-words leading-snug">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #334155' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                style={{ background: '#38BDF8', color: '#0F172A' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
