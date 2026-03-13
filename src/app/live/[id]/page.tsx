'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send,
  Users, Radio, Crown, Shield, Volume2, VolumeX, Maximize2
} from 'lucide-react'

interface ChatMsg {
  id: string
  user_id: string
  name: string
  avatar: string
  text: string
  ts: number
  isHost?: boolean
}

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

      const { data: ev } = await supabase.from('events').select('*, users(email, photo_url, profile_bio)').eq('id', id).single()
      if (!ev) { router.push('/dashboard'); return }
      setEvent(ev)

      const hostUser = ev.host_id === u.id || prof?.role === 'admin'
      setIsHost(hostUser)

      // Check access: host/admin always in, free events always in, else check ticket
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

      // Realtime chat channel
      const ch = supabase.channel(`live-room-${id}`)
        .on('broadcast', { event: 'chat' }, ({ payload }) => {
          setMessages(prev => [...prev, payload])
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        })
        .on('broadcast', { event: 'viewers' }, ({ payload }) => {
          setViewers(payload.count)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await ch.track({ user_id: u.id, online_at: new Date().toISOString() })
          }
        })

      channelRef.current = ch

      // Update viewer count on presence change
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        setViewers(Object.keys(state).length)
      })
    }
    init()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
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
      await supabase.from('events').update({ status: 'live' }).eq('id', id)
    } catch (err) {
      alert('Could not access camera/microphone. Please allow permissions.')
    }
  }

  const stopStream = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    setStreaming(false)
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

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !channelRef.current) return
    const msg: ChatMsg = {
      id: Date.now().toString(),
      user_id: user.id,
      name: profile?.profile_bio ? user.email.split('@')[0] : user.email.split('@')[0],
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
          <button onClick={() => router.push(`/events/${id}`)}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: '#FFD700', color: '#0F172A' }}>
            Get Your Ticket →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0F172A' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: '#1E293B', borderBottom: '1px solid #334155' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {event?.status === 'live' && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                LIVE
              </span>
            )}
            <h1 className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-none text-white">
              {event?.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>{viewers}</span>
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
            style={{ background: '#334155' }}>
            Leave
          </button>
        </div>
      </div>

      {/* Main: 70% video + 30% chat */}
      <div className="flex flex-1 overflow-hidden">

        {/* VIDEO AREA — 70% */}
        <div className="flex flex-col" style={{ width: '70%', background: '#000' }}>

          {/* Video */}
          <div className="flex-1 relative flex items-center justify-center">
            {isHost ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: streaming ? 'block' : 'none' }}
                />
                {!streaming && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                      {initials}
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold mb-1">You're the host</p>
                      <p className="text-slate-400 text-sm mb-4">Click Go Live to start streaming</p>
                      <button onClick={startStream}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm mx-auto"
                        style={{ background: '#EF4444', color: 'white' }}>
                        <Radio className="w-4 h-4" />
                        Go Live
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                  {event?.users?.photo_url
                    ? <img src={event.users.photo_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold">{event?.users?.email?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{event?.users?.email?.split('@')[0]}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {event?.status === 'live' ? 'Stream starting...' : 'Waiting for host to go live'}
                  </p>
                  {event?.status === 'live' && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-red-400 text-sm font-semibold">LIVE</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cam off overlay */}
            {isHost && streaming && !camOn && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: '#0F172A' }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                    {initials}
                  </div>
                  <p className="text-slate-400 text-sm">Camera off</p>
                </div>
              </div>
            )}
          </div>

          {/* Host controls */}
          {isHost && (
            <div className="flex items-center justify-center gap-3 py-4 flex-shrink-0"
              style={{ background: '#0F172A', borderTop: '1px solid #1E293B' }}>
              <button onClick={toggleMic}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: micOn ? '#1E293B' : 'rgba(239,68,68,0.2)', color: micOn ? 'white' : '#F87171' }}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={toggleCam}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: camOn ? '#1E293B' : 'rgba(239,68,68,0.2)', color: camOn ? 'white' : '#F87171' }}>
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              {streaming && (
                <button onClick={stopStream}
                  className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm"
                  style={{ background: '#EF4444', color: 'white' }}>
                  <PhoneOff className="w-4 h-4" />
                  End Stream
                </button>
              )}
              {!streaming && (
                <button onClick={startStream}
                  className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm"
                  style={{ background: '#EF4444', color: 'white' }}>
                  <Radio className="w-4 h-4" />
                  Go Live
                </button>
              )}
            </div>
          )}

          {/* Audience mute control */}
          {!isHost && (
            <div className="flex items-center justify-center gap-3 py-3 flex-shrink-0"
              style={{ background: '#0F172A', borderTop: '1px solid #1E293B' }}>
              <button onClick={() => setMuted(m => !m)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#1E293B', color: muted ? '#F87171' : 'white' }}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-slate-400 text-xs">{muted ? 'Unmute' : 'Mute'} stream</span>
            </div>
          )}
        </div>

        {/* CHAT AREA — 30% */}
        <div className="flex flex-col" style={{ width: '30%', borderLeft: '1px solid #334155' }}>

          {/* Chat header */}
          <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderBottom: '1px solid #334155', background: '#1E293B' }}>
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
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{
                    background: msg.isHost
                      ? 'linear-gradient(135deg, #FFD700, #F59E0B)'
                      : 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
                    color: '#0F172A'
                  }}>
                  {msg.avatar
                    ? <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
                    : msg.name[0].toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: msg.isHost ? '#FFD700' : '#38BDF8' }}>
                      {msg.name}
                    </span>
                    {msg.isHost && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', fontSize: '9px' }}>
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
              <button onClick={sendMessage} disabled={!newMsg.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                style={{ background: '#38BDF8', color: '#0F172A' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
