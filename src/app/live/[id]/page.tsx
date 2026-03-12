'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Send, Users, LogOut, Mic, MicOff, Video, VideoOff,
  Monitor, Camera, Maximize2, Ban, VolumeX, Clock
} from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'

interface ChatMsg {
  id: string
  user_name: string
  user_photo?: string
  message: string
  is_host: boolean
  created_at: string
  is_muted?: boolean
}

function AutoModMessage(msg: ChatMsg, onMute?: (name: string) => void, onBan?: (name: string) => void, isHost?: boolean) {
  return (
    <div key={msg.id} className="chat-message flex gap-2.5 group">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: msg.is_host ? 'linear-gradient(135deg, #FFD700, #F59E0B)' : 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
        {getInitials(msg.user_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: msg.is_host ? '#FFD700' : '#38BDF8' }}>
            {msg.user_name}
          </span>
          {msg.is_host && <span className="text-xs px-1.5 rounded badge-host">HOST</span>}
          <span className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm text-slate-300 break-words">{msg.message}</p>
      </div>
      {isHost && !msg.is_host && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button onClick={() => onMute?.(msg.user_name)} className="p-1 rounded text-slate-500 hover:text-yellow-400 transition-colors" title="Mute 5 min">
            <VolumeX className="w-3 h-3" />
          </button>
          <button onClick={() => onBan?.(msg.user_name)} className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors" title="Ban">
            <Ban className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// Profanity filter (simple AutoMod)
const BAD_WORDS = ['spam', 'scam', 'fuck', 'shit', 'ass']
function autoModCheck(text: string): boolean {
  const lower = text.toLowerCase()
  return !BAD_WORDS.some(w => lower.includes(w))
}

export default function LiveRoom() {
  const { id } = useParams()
  const router = useRouter()
  
  const [event, setEvent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set())
  const [slowMode, setSlowMode] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)
  
  // Stream
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [streamTime, setStreamTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const streamTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: evt } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(evt)

      if (evt) {
        const hostCheck = evt.host_id === user.id
        setIsHost(hostCheck)

        if (hostCheck) {
          setHasAccess(true)
        } else {
          // Check for paid ticket
          const { data: ticket } = await supabase
            .from('tickets')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_id', id)
            .eq('status', 'paid')
            .single()
          setHasAccess(!!ticket)
        }
      }

      setLoading(false)
    }
    init()
  }, [id])

  // Load chat messages
  useEffect(() => {
    if (!hasAccess) return

    supabase.from('chat_messages')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data || []))

    // Realtime chat
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `event_id=eq.${id}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as ChatMsg])
      })
      .subscribe()

    // Viewer count subscription  
    const viewerChannel = supabase
      .channel(`viewers-${id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = viewerChannel.presenceState()
        setViewerCount(Object.keys(state).length)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await viewerChannel.track({ user_id: user?.id })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(viewerChannel)
    }
  }, [hasAccess, id])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  // Stream timer
  useEffect(() => {
    if (event?.status === 'live') {
      streamTimerRef.current = setInterval(() => {
        setStreamTime(prev => prev + 1)
      }, 1000)
    }
    return () => { if (streamTimerRef.current) clearInterval(streamTimerRef.current) }
  }, [event?.status])

  // Host camera setup
  useEffect(() => {
    if (isHost && hasAccess && localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        })
        .catch(console.error)
    }
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [isHost, hasAccess])

  const sendMessage = async () => {
    if (!chatInput.trim() || !user) return
    
    // Slow mode check (10s between messages)
    if (slowMode && !isHost) {
      const now = Date.now()
      if (now - lastMessageTime < 10000) {
        alert('Slow mode: wait 10 seconds between messages')
        return
      }
      setLastMessageTime(now)
    }

    // AutoMod
    if (!autoModCheck(chatInput)) {
      alert('Message blocked by AutoMod')
      setChatInput('')
      return
    }

    const msg = chatInput.trim()
    setChatInput('')

    await supabase.from('chat_messages').insert({
      event_id: id,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      message: msg,
      is_host: isHost,
    })
  }

  const handleMuteUser = async (userName: string) => {
    setMutedUsers(prev => new Set([...prev, userName]))
    // In production: update DB with muted_until
  }

  const handleBanUser = async (userName: string) => {
    if (confirm(`Ban ${userName} from this event?`)) {
      // In production: add to banned_users table
      setMessages(prev => prev.filter(m => m.user_name !== userName))
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted })
      setIsMuted(!isMuted)
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = isCameraOff })
      setIsCameraOff(!isCameraOff)
    }
  }

  const goLive = async () => {
    await supabase.from('events').update({ status: 'live' }).eq('id', id)
    setEvent((prev: any) => ({ ...prev, status: 'live' }))
  }

  const endStream = async () => {
    if (confirm('End the stream? This cannot be undone.')) {
      await supabase.from('events').update({ status: 'ended', viewer_peak: viewerCount }).eq('id', id)
      streamRef.current?.getTracks().forEach(t => t.stop())
      router.push('/host')
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0F172A' }}>
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <Ban className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Required</h2>
          <p className="text-slate-400 text-sm mb-6">You need a ticket to join this live stream.</p>
          <button onClick={() => router.push(`/events/${id}`)} className="btn-gold w-full py-3 rounded-xl font-semibold text-sm">
            Get Your Ticket
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0F172A' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b" style={{ background: '#0F172A', borderColor: '#1E293B' }}>
        <div className="flex items-center gap-3 min-w-0">
          {event?.status === 'live' && (
            <span className="badge-live px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />
              LIVE
            </span>
          )}
          <span className="font-medium text-sm truncate">{event?.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span className="earnings-tick">{viewerCount}</span>
          </div>
          {event?.status === 'live' && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{formatTime(streamTime)}</span>
            </div>
          )}
          <button onClick={() => router.back()} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area - 70% */}
        <div className="flex-1 flex flex-col">
          {/* Video */}
          <div className="flex-1 relative bg-black">
            {isHost ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#0A0F1A' }}>
                {event?.status === 'live' ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(56,189,248,0.15)' }}>
                      <Monitor className="w-8 h-8 text-sky-400" />
                    </div>
                    <p className="text-slate-400 text-sm">Stream connecting...</p>
                    <p className="text-slate-600 text-xs mt-1">WebRTC P2P (configure STUN servers)</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(56,189,248,0.1)' }}>
                      <Camera className="w-10 h-10 text-sky-400" />
                    </div>
                    <p className="text-lg font-medium mb-1">Stream hasn't started yet</p>
                    <p className="text-slate-400 text-sm">You'll see the live stream here when the host goes live</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Host controls */}
          {isHost && (
            <div className="flex items-center justify-between px-4 py-3 border-t flex-shrink-0" style={{ background: '#0F172A', borderColor: '#1E293B' }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className="p-2.5 rounded-xl transition-all"
                  style={{ background: isMuted ? 'rgba(239,68,68,0.2)' : '#1E293B', color: isMuted ? '#F87171' : '#94A3B8' }}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className="p-2.5 rounded-xl transition-all"
                  style={{ background: isCameraOff ? 'rgba(239,68,68,0.2)' : '#1E293B', color: isCameraOff ? '#F87171' : '#94A3B8' }}
                >
                  {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSlowMode(!slowMode)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: slowMode ? 'rgba(56,189,248,0.15)' : '#1E293B',
                    color: slowMode ? '#38BDF8' : '#94A3B8'
                  }}
                >
                  Slow Mode {slowMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {event?.status !== 'live' ? (
                  <button onClick={goLive} className="btn-gold px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Go Live
                  </button>
                ) : (
                  <button onClick={endStream} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    End Stream
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat - 30% */}
        <div className="w-72 flex flex-col border-l flex-shrink-0" style={{ background: '#0F172A', borderColor: '#1E293B' }}>
          {/* Chat header */}
          <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1E293B' }}>
            <span className="text-sm font-semibold">Live Chat</span>
            {slowMode && <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8' }}>Slow 10s</span>}
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages
              .filter(m => !mutedUsers.has(m.user_name))
              .map(msg => AutoModMessage(msg, handleMuteUser, handleBanUser, isHost))}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#1E293B' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Say something..."
                maxLength={200}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sky-500 min-w-0"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="p-2 rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
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
