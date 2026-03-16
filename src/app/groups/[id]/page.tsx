'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  MessageSquare, Folder, Mic, Video, FileText,
  Send, Upload, Download, Trash2, Users, Crown,
  MicOff, VideoOff, PhoneOff, Monitor, MonitorOff,
  Settings, UserCheck, UserX, Check, X, Loader2,
  AlertCircle, Lock, Globe, ChevronLeft, MoreHorizontal,
  Hand, Shield, Zap
} from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:         '#0A0F1E',
  surface:    '#0D1428',
  card:       '#111827',
  cardHover:  '#141E35',
  border:     'rgba(255,255,255,0.06)',
  borderFocus:'rgba(37,99,235,0.5)',
  text:       '#F0F4FF',
  textMuted:  '#7B8DB0',
  textDim:    '#3D4F6E',
  blue:       '#2563EB',
  blueLight:  '#3B82F6',
  blueDim:    'rgba(37,99,235,0.12)',
  gold:       '#F59E0B',
  goldDim:    'rgba(245,158,11,0.1)',
  red:        '#EF4444',
  redDim:     'rgba(239,68,68,0.1)',
  green:      '#10B981',
  greenDim:   'rgba(16,185,129,0.1)',
  purple:     '#7C3AED',
  purpleDim:  'rgba(124,58,237,0.1)',
}

type Tab = 'chat' | 'files' | 'voice' | 'meet' | 'notes'
type MeetPermission = 'allow_all' | 'selected' | 'deny_all'

// ─── Helpers ────────────────────────────────────────────────────────────────
const getName     = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInitials = (u: any) => getName(u).slice(0, 2).toUpperCase()
const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const formatBytes = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`
const formatTime  = (ts: string) => {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m/60)}h ago`
}

function Avatar({ user, size = 36 }: { user: any; size?: number }) {
  const color = avatarColor(user?.id || '')
  return (
    <div className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
      style={{ width: size, height: size, minWidth: size, background: color+'22', color, fontSize: size*.33, border: `1.5px solid ${color}25` }}>
      {user?.photo_url
        ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
        : getInitials(user)}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — CHAT
// ═══════════════════════════════════════════════════════════════════════════
function ChatTab({ groupId, currentUser }: { groupId: string; currentUser: any }) {
  const [messages, setMessages] = useState<any[]>([])
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    const ch = supabase.channel(`group-chat-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        () => loadMessages())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [groupId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('group_messages')
      .select('*, users(id, email, full_name, photo_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  const sendMessage = async () => {
    if (!text.trim() || sending || !currentUser) return
    setSending(true)
    await supabase.from('group_messages').insert({
      group_id:   groupId,
      user_id:    currentUser.id,
      text:       text.trim().slice(0, 2000),
      user_name:  currentUser.full_name || currentUser.email?.split('@')[0] || 'User',
      user_avatar: currentUser.photo_url || '',
    })
    setText('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center pt-12">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: C.textDim }} />
            <p className="text-sm" style={{ color: C.textDim }}>No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.user_id === currentUser?.id
          const showAvatar = i === 0 || messages[i-1]?.user_id !== msg.user_id
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <div style={{ width: 28 }}>
                  {showAvatar && <Avatar user={msg.users} size={28} />}
                </div>
              )}
              <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && (
                  <span className="text-xs font-semibold px-1" style={{ color: C.blueLight }}>
                    {getName(msg.users)}
                  </span>
                )}
                <div
                  className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isMe ? C.blue : C.card,
                    color:      isMe ? '#fff' : C.text,
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}
                >
                  {msg.text || msg.content}
                </div>
                <span className="text-xs px-1" style={{ color: C.textDim }}>{formatTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Message the group..."
            maxLength={2000}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={{ background: C.blue, color: '#fff' }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — FILES
// ═══════════════════════════════════════════════════════════════════════════
function FilesTab({ groupId, currentUser }: { groupId: string; currentUser: any }) {
  const [files,     setFiles]    = useState<any[]>([])
  const [loading,   setLoading]  = useState(true)
  const [uploading, setUploading]= useState(false)
  const [progress,  setProgress] = useState(0)
  const [dragging,  setDragging] = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { loadFiles() }, [groupId])

  const loadFiles = async () => {
    const { data } = await supabase
      .from('group_files')
      .select('*, users(id, email, full_name, photo_url)')
      .eq('group_id', groupId)
      .order('uploaded_at', { ascending: false })
    if (data) setFiles(data)
    setLoading(false)
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !currentUser) return
    const file = fileList[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { alert('File must be under 50MB'); return }

    setUploading(true)
    setProgress(10)
    const ext  = file.name.split('.').pop()
    const path = `${groupId}/${currentUser.id}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('group-files').upload(path, file, { contentType: file.type })
    setProgress(80)
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('group-files').getPublicUrl(path)
      await supabase.from('group_files').insert({
        group_id:  groupId,
        user_id:   currentUser.id,
        file_name: file.name,
        file_url:  urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      setProgress(100)
      await loadFiles()
    }
    setUploading(false)
    setProgress(0)
  }

  const handleDelete = async (fileId: string, fileUrl: string) => {
    if (!confirm('Delete this file?')) return
    await supabase.from('group_files').delete().eq('id', fileId)
    await loadFiles()
  }

  const fileIcon = (type: string) => {
    if (type?.startsWith('image/')) return '🖼'
    if (type?.includes('pdf'))      return '📄'
    if (type?.includes('video'))    return '🎬'
    if (type?.includes('audio'))    return '🎵'
    if (type?.includes('zip') || type?.includes('rar')) return '📦'
    return '📁'
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Drop zone */}
      <div
        className="rounded-xl flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? C.blueLight : C.border}`,
          background: dragging ? C.blueDim : C.surface,
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6" style={{ color: dragging ? C.blueLight : C.textDim }} />
        <p className="text-sm font-medium" style={{ color: C.textMuted }}>
          Drag & drop files or <span style={{ color: C.blueLight }}>browse</span>
        </p>
        <p className="text-xs" style={{ color: C.textDim }}>Any file type · Max 50MB</p>
        <input ref={inputRef} type="file" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: C.textMuted }}>
            <span>Uploading...</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${C.blue}, ${C.blueLight})` }} />
          </div>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: C.card }} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8">
          <Folder className="w-8 h-8 mx-auto mb-2" style={{ color: C.textDim }} />
          <p className="text-sm" style={{ color: C.textDim }}>No files yet. Upload the first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderFocus }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
              <span className="text-2xl flex-shrink-0">{fileIcon(f.file_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: C.text }}>{f.file_name}</p>
                <p className="text-xs" style={{ color: C.textDim }}>
                  {formatBytes(f.file_size || 0)} · {getName(f.users)} · {formatTime(f.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" download>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: C.blueDim, color: C.blueLight }}>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </a>
                {f.user_id === currentUser?.id && (
                  <button onClick={() => handleDelete(f.id, f.file_url)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: C.redDim, color: C.red }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — VOICE CALL (WebRTC audio only)
// ═══════════════════════════════════════════════════════════════════════════
function VoiceTab({ groupId, currentUser }: { groupId: string; currentUser: any }) {
  const [inCall,    setInCall]    = useState(false)
  const [micOn,     setMicOn]     = useState(true)
  const [loading,   setLoading]   = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const streamRef   = useRef<MediaStream | null>(null)
  const channelRef  = useRef<any>(null)

  useEffect(() => {
    const ch = supabase.channel(`voice-presence-${groupId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        setParticipants(Object.values(state).flat() as any[])
      })
      .subscribe(async (status) => {
        channelRef.current = ch
      })
    return () => { supabase.removeChannel(ch) }
  }, [groupId])

  const joinCall = async () => {
    setLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      await channelRef.current?.track({ user_id: currentUser?.id, name: getName(currentUser), joined_at: Date.now() })
      setInCall(true)
    } catch { alert('Could not access microphone. Please allow permissions.') }
    setLoading(false)
  }

  const leaveCall = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    await channelRef.current?.untrack()
    setInCall(false)
    setMicOn(true)
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(p => !p)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center pt-4">
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: C.textDim }}>Voice Call</p>
        <p className="text-sm" style={{ color: C.textMuted }}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''} in call
        </p>
      </div>

      {/* Participants grid */}
      <div className="flex flex-wrap justify-center gap-4 py-4">
        {participants.length === 0 && !inCall && (
          <div className="text-center py-8 w-full">
            <Mic className="w-8 h-8 mx-auto mb-2" style={{ color: C.textDim }} />
            <p className="text-sm" style={{ color: C.textDim }}>No one in the voice call yet</p>
          </div>
        )}
        {participants.map((p: any, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: avatarColor(p.user_id)+'22', color: avatarColor(p.user_id), border: `2px solid ${avatarColor(p.user_id)}44` }}>
                {(p.name || 'U').slice(0,2).toUpperCase()}
              </div>
              {/* Speaking indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: C.green }}>
                <Mic className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <p className="text-xs text-center max-w-[64px] truncate" style={{ color: C.textMuted }}>
              {p.name || 'User'}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-auto pb-4">
        {inCall ? (
          <>
            <button onClick={toggleMic}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{ background: micOn ? C.card : C.redDim, color: micOn ? C.text : C.red, border: `1px solid ${micOn ? C.border : C.red+'44'}` }}>
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button onClick={leaveCall}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold"
              style={{ background: C.red, color: '#fff' }}>
              <PhoneOff className="w-4 h-4" /> Leave Call
            </button>
          </>
        ) : (
          <button onClick={joinCall} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: C.green, color: '#fff' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {loading ? 'Connecting...' : 'Join Voice Call'}
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — VIDEO MEET (WebRTC, host permission controls)
// ═══════════════════════════════════════════════════════════════════════════
function MeetTab({ groupId, currentUser, isHost }: { groupId: string; currentUser: any; isHost: boolean }) {
  const [inMeet,      setInMeet]      = useState(false)
  const [micOn,       setMicOn]       = useState(true)
  const [camOn,       setCamOn]       = useState(true)
  const [screenOn,    setScreenOn]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [permission,  setPermission]  = useState<MeetPermission>('allow_all')
  const [participants,setParticipants]= useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showSettings,setShowSettings]= useState(false)
  const [handRaised,  setHandRaised]  = useState(false)

  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const screenStreamRef= useRef<MediaStream | null>(null)
  const channelRef     = useRef<any>(null)

  useEffect(() => {
    const ch = supabase.channel(`meet-presence-${groupId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        setParticipants(Object.values(state).flat() as any[])
      })
      .subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [groupId])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // Check if this user is allowed to use cam/mic
  const isAllowed = (() => {
    if (isHost) return true
    if (permission === 'allow_all') return true
    if (permission === 'deny_all')  return false
    if (permission === 'selected')  return selectedIds.has(currentUser?.id || '')
    return false
  })()

  const joinMeet = async () => {
    setLoading(true)
    try {
      if (isAllowed) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          // IMPORTANT: not mirrored — transform: scaleX(1)
          localVideoRef.current.style.transform = 'scaleX(1)'
        }
      }
      await channelRef.current?.track({
        user_id: currentUser?.id,
        name:    getName(currentUser),
        is_host: isHost,
        has_cam: isAllowed,
      })
      setInMeet(true)
    } catch { alert('Could not access camera/microphone.') }
    setLoading(false)
  }

  const leaveMeet = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    await channelRef.current?.untrack()
    setInMeet(false)
    setScreenOn(false)
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(p => !p)
  }

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(p => !p)
  }

  const toggleScreen = async () => {
    if (screenOn) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      if (localVideoRef.current && streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current
        localVideoRef.current.style.transform = 'scaleX(1)'
      }
      setScreenOn(false)
    } else {
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true })
        screenStreamRef.current = screen
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screen
          localVideoRef.current.style.transform = 'scaleX(1)'
        }
        screen.getVideoTracks()[0].onended = () => {
          if (streamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = streamRef.current
          }
          setScreenOn(false)
        }
        setScreenOn(true)
      } catch {}
    }
  }

  const toggleSelectedMember = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Video area */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#000', minHeight: 200 }}>
        {inMeet && isAllowed ? (
          <>
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover"
              // NOT mirrored — critical requirement
              style={{ transform: 'scaleX(1)' }}
            />
            {!camOn && !screenOn && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: C.surface }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2"
                    style={{ background: avatarColor(currentUser?.id || '')+'22', color: avatarColor(currentUser?.id || '') }}>
                    {getInitials(currentUser)}
                  </div>
                  <p className="text-xs" style={{ color: C.textMuted }}>Camera off</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Video className="w-10 h-10" style={{ color: C.textDim }} />
            {!inMeet ? (
              <p className="text-sm" style={{ color: C.textMuted }}>Click "Join Meet" to start</p>
            ) : !isAllowed ? (
              <div className="text-center px-4">
                <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>Camera/mic restricted</p>
                <p className="text-xs" style={{ color: C.textMuted }}>
                  The host has {permission === 'deny_all' ? 'disabled all cameras' : 'not enabled your camera yet'}
                </p>
                {!handRaised && (
                  <button onClick={() => setHandRaised(true)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mx-auto"
                    style={{ background: C.goldDim, color: C.gold }}>
                    <Hand className="w-4 h-4" /> Raise Hand
                  </button>
                )}
                {handRaised && (
                  <p className="mt-2 text-xs" style={{ color: C.gold }}>✋ Hand raised — waiting for host</p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Participant count badge */}
        {inMeet && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
            <Users className="w-3 h-3" />
            {participants.length}
          </div>
        )}

        {/* Screen share indicator */}
        {screenOn && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(37,99,235,0.2)', color: C.blueLight, border: `1px solid rgba(37,99,235,0.3)` }}>
            <Monitor className="w-3 h-3" /> Sharing screen
          </div>
        )}

        {/* Host permission badge */}
        {isHost && inMeet && (
          <div className="absolute bottom-3 left-3">
            <button onClick={() => setShowSettings(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(0,0,0,0.6)', color: C.gold }}>
              <Settings className="w-3 h-3" />
              {permission === 'allow_all' ? 'All can talk' : permission === 'deny_all' ? 'Muted all' : 'Selected'}
            </button>
          </div>
        )}
      </div>

      {/* Host permission settings */}
      {isHost && showSettings && (
        <div className="p-4 space-y-3 flex-shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
            Camera & Mic Permissions
          </p>
          <div className="flex gap-2">
            {([
              { id: 'allow_all', label: 'Allow All',  color: C.green },
              { id: 'selected',  label: 'Selected',   color: C.gold  },
              { id: 'deny_all',  label: 'Deny All',   color: C.red   },
            ] as { id: MeetPermission; label: string; color: string }[]).map(opt => (
              <button key={opt.id} onClick={() => setPermission(opt.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: permission === opt.id ? opt.color : C.card,
                  color:      permission === opt.id ? '#fff'    : C.textMuted,
                  border:     `1px solid ${permission === opt.id ? opt.color : C.border}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Selected members list */}
          {permission === 'selected' && participants.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs" style={{ color: C.textDim }}>Toggle members to enable their camera/mic:</p>
              {participants.filter((p: any) => p.user_id !== currentUser?.id).map((p: any) => (
                <div key={p.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: C.card, border: `1px solid ${selectedIds.has(p.user_id) ? C.green+'44' : C.border}` }}>
                  <span className="text-sm" style={{ color: C.text }}>{p.name}</span>
                  <button onClick={() => toggleSelectedMember(p.user_id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: selectedIds.has(p.user_id) ? C.green : C.border,
                      color:      selectedIds.has(p.user_id) ? '#fff'  : C.textMuted,
                    }}>
                    {selectedIds.has(p.user_id) ? <Check className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5 p-3 flex-shrink-0"
        style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
        {inMeet ? (
          <>
            {isAllowed && (
              <>
                <button onClick={toggleMic}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: micOn ? C.card : C.redDim, color: micOn ? C.text : C.red, border: `1px solid ${micOn ? C.border : C.red+'44'}` }}
                  title={micOn ? 'Mute' : 'Unmute'}>
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleCam}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: camOn ? C.card : C.redDim, color: camOn ? C.text : C.red, border: `1px solid ${camOn ? C.border : C.red+'44'}` }}
                  title={camOn ? 'Turn off camera' : 'Turn on camera'}>
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleScreen}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ background: screenOn ? C.blueDim : C.card, color: screenOn ? C.blueLight : C.textMuted, border: `1px solid ${screenOn ? 'rgba(37,99,235,0.3)' : C.border}` }}
                  title={screenOn ? 'Stop sharing' : 'Share screen'}>
                  {screenOn ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>
              </>
            )}
            <button onClick={leaveMeet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold"
              style={{ background: C.red, color: '#fff' }}>
              <PhoneOff className="w-4 h-4" /> Leave
            </button>
          </>
        ) : (
          <button onClick={joinMeet} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold disabled:opacity-50"
            style={{ background: C.blue, color: '#fff' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {loading ? 'Connecting...' : 'Join Meet'}
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — SHARED NOTES
// ═══════════════════════════════════════════════════════════════════════════
function NotesTab({ groupId, currentUser }: { groupId: string; currentUser: any }) {
  const [content,  setContent]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [lastEditor, setLastEditor] = useState<string | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadNotes()
    // Realtime sync
    const ch = supabase.channel(`notes-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_notes', filter: `group_id=eq.${groupId}` },
        (payload: any) => {
          if (payload.new?.updated_by !== currentUser?.id) {
            setContent(payload.new?.content || '')
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [groupId])

  const loadNotes = async () => {
    const { data } = await supabase
      .from('group_notes')
      .select('*, users:updated_by(email, full_name)')
      .eq('group_id', groupId)
      .maybeSingle()
    if (data) {
      setContent(data.content || '')
      setLastEditor(data.users ? getName(data.users) : null)
    }
    setLoading(false)
  }

  const handleChange = (val: string) => {
    setContent(val)
    setSaved(false)
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => autoSave(val), 1500)
  }

  const autoSave = async (val: string) => {
    if (!currentUser) return
    setSaving(true)
    const { data: existing } = await supabase
      .from('group_notes')
      .select('id')
      .eq('group_id', groupId)
      .maybeSingle()

    if (existing) {
      await supabase.from('group_notes').update({ content: val, updated_by: currentUser.id, updated_at: new Date().toISOString() }).eq('group_id', groupId)
    } else {
      await supabase.from('group_notes').insert({ group_id: groupId, content: val, updated_by: currentUser.id })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
          Shared Notes
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: C.textDim }}>
          {saving && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
          {saved  && <><Check  className="w-3 h-3" style={{ color: C.green }} /> Saved</>}
          {lastEditor && !saving && !saved && <span>Last edit: {lastEditor}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 rounded-xl animate-pulse" style={{ background: C.card }} />
      ) : (
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder="Shared notes for your group — everyone can read and edit these..."
          className="flex-1 w-full p-4 rounded-xl text-sm leading-relaxed outline-none resize-none"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
          onFocus={e => (e.target.style.borderColor = C.borderFocus)}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
      )}

      <p className="mt-2 text-xs flex-shrink-0" style={{ color: C.textDim }}>
        Notes are shared with all group members and auto-save as you type.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function GroupRoomPage() {
  const { id }  = useParams()
  const router  = useRouter()
  const groupId = id as string

  const [group,       setGroup]       = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [members,     setMembers]     = useState<any[]>([])
  const [myRole,      setMyRole]      = useState<string>('member')
  const [activeTab,   setActiveTab]   = useState<Tab>('chat')
  const [loading,     setLoading]     = useState(true)
  const [access,      setAccess]      = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setCurrentUser(u)

      const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single()
      if (!g) { router.push('/groups'); return }
      setGroup(g)

      // Check membership
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', u.id)
        .maybeSingle()

      if (!membership) {
        router.push('/groups')
        return
      }
      setMyRole(membership.role)
      setAccess(true)

      // Load members
      const { data: mems } = await supabase
        .from('group_members')
        .select('*, users(id, email, full_name, photo_url, role)')
        .eq('group_id', groupId)
      setMembers(mems || [])
      setLoading(false)
    })
  }, [groupId])

  const isHost = myRole === 'host'

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'chat',  label: 'Chat',   icon: MessageSquare },
    { id: 'files', label: 'Files',  icon: Folder },
    { id: 'voice', label: 'Voice',  icon: Mic },
    { id: 'meet',  label: 'Meet',   icon: Video },
    { id: 'notes', label: 'Notes',  icon: FileText },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-full flex items-center justify-center" style={{ background: C.bg }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blueLight }} />
        </div>
      </DashboardLayout>
    )
  }

  if (!access) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full" style={{ background: C.bg }}>

        {/* Group header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}
        >
          <button onClick={() => router.push('/groups')}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: C.card, color: C.textMuted }}>
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Group banner / icon */}
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: C.blueDim }}>
            {group?.banner_url
              ? <img src={group.banner_url} alt="" className="w-full h-full object-cover" />
              : <Zap className="w-5 h-5" style={{ color: C.blueLight }} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>{group?.name}</h1>
              {group?.is_private
                ? <Lock className="w-3 h-3 flex-shrink-0" style={{ color: C.gold }} />
                : <Globe className="w-3 h-3 flex-shrink-0" style={{ color: C.textDim }} />
              }
              {isHost && (
                <span className="flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ background: C.goldDim, color: C.gold }}>
                  <Crown className="w-2.5 h-2.5" /> Host
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: C.textDim }}>
              {members.length} member{members.length !== 1 ? 's' : ''} · {group?.category}
            </p>
          </div>

          {/* Members toggle */}
          <button
            onClick={() => setShowMembers(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
            style={{ background: showMembers ? C.blueDim : C.card, color: showMembers ? C.blueLight : C.textMuted }}>
            <Users className="w-3.5 h-3.5" /> {members.length}
          </button>
        </div>

        {/* Main body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Tab content */}
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Tab bar */}
            <div
              className="flex items-center gap-0.5 px-2 py-2 flex-shrink-0 overflow-x-auto"
              style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeTab === tab.id ? C.blue   : 'transparent',
                    color:      activeTab === tab.id ? '#fff'   : C.textMuted,
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat'  && <ChatTab  groupId={groupId} currentUser={currentUser} />}
              {activeTab === 'files' && <FilesTab groupId={groupId} currentUser={currentUser} />}
              {activeTab === 'voice' && <VoiceTab groupId={groupId} currentUser={currentUser} />}
              {activeTab === 'meet'  && <MeetTab  groupId={groupId} currentUser={currentUser} isHost={isHost} />}
              {activeTab === 'notes' && <NotesTab groupId={groupId} currentUser={currentUser} />}
            </div>
          </div>

          {/* Members panel */}
          {showMembers && (
            <div
              className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
              style={{ background: C.surface, borderLeft: `1px solid ${C.border}` }}
            >
              <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Members ({members.length})
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-2 rounded-lg"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.card }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <Avatar user={m.users} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: C.text }}>
                        {getName(m.users)}
                      </p>
                    </div>
                    {m.role === 'host' && (
                      <Crown className="w-3 h-3 flex-shrink-0" style={{ color: C.gold }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
