'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  MessageSquare, Folder, Video, VideoOff, Send, Upload, Download, Trash2,
  Users, Crown, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  Loader2, Lock, Globe, ChevronLeft, Shield, Zap,
  Phone, PhoneCall, X, Settings, AlertTriangle, Check, UserMinus, Hand,
  Maximize2, Minimize2, Bell, CheckCircle, XCircle, Clock,
  UserCheck, AlertCircle, Star
} from 'lucide-react'

const C = {
  bg:       '#070B14',
  surface:  '#0D1420',
  card:     '#0F1A2E',
  border:   'rgba(255,255,255,0.07)',
  borderF:  'rgba(255,255,255,0.14)',
  text:     '#E8EAF0',
  textMuted:'#8A9BBF',
  textDim:  '#3D4F6E',
  red:      '#FF3B3B',
  redDim:   'rgba(255,59,59,0.12)',
  gold:     '#FFD700',
  goldDim:  'rgba(255,215,0,0.10)',
  green:    '#22C55E',
  greenDim: 'rgba(34,197,94,0.12)',
  purple:   '#A78BFA',
  purpleDim:'rgba(167,139,250,0.12)',
  sky:      '#38BDF8',
  skyDim:   'rgba(56,189,248,0.10)',
}

const ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]

type Tab = 'chat' | 'files' | 'call' | 'members' | 'settings'
const getName  = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInits = (u: any) => getName(u).slice(0, 2).toUpperCase()
const AC = ['#FF3B3B', '#A78BFA', '#22C55E', '#38BDF8', '#FFD700', '#F472B6']
const ac = (id: string) => AC[(id?.charCodeAt(0) || 0) % AC.length]
const fmtB = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`
const ago = (ts: string) => { const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000); return m < 1 ? 'now' : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago` }

function Av({ user, size = 32 }: { user: any; size?: number }) {
  const color = ac(user?.id || '')
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.34, background: color + '22', color, border: `1.5px solid ${color}33` }}>
      {user?.photo_url ? <img src={user.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInits(user)}
    </div>
  )
}

// ─── Remote video tile ────────────────────────────────────────────────────────
function RemoteTile({ stream, name, uid }: { stream: MediaStream; name: string; uid: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [needsClick, setNeedsClick] = useState(false)
  useEffect(() => {
    const vid = ref.current; if (!vid) return
    vid.srcObject = stream; vid.muted = false; vid.volume = 1.0
    const tryPlay = () => vid.play().catch(err => { if (err.name === 'NotAllowedError') { vid.muted = true; vid.play().catch(() => {}); setNeedsClick(true) } })
    tryPlay()
    stream.onaddtrack = () => { vid.srcObject = stream; tryPlay() }
    return () => { stream.onaddtrack = null }
  }, [stream])
  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: C.bg, width: '100%', height: '100%' }}>
      <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '2px 8px', borderRadius: 6 }}>{name}</div>
      {needsClick && (
        <button onClick={() => { if (!ref.current) return; ref.current.muted = false; ref.current.volume = 1.0; ref.current.play().catch(() => {}); setNeedsClick(false) }}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 32 }}>🔇</span>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'DM Sans,sans-serif' }}>Tap to hear audio</span>
        </button>
      )}
    </div>
  )
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function ChatTab({ groupId, currentUser }: { groupId: string; currentUser: any }) {
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.from('group_messages').select('*,users(id,email,full_name,photo_url)').eq('group_id', groupId).order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { if (data) { setMessages(data); loadedRef.current = true } })
    const ch = supabase.channel(`grp-chat-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, payload => {
        if (!loadedRef.current) return
        supabase.from('users').select('id,email,full_name,photo_url').eq('id', payload.new.user_id).single()
          .then(({ data: u }) => setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, users: u }]))
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [groupId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const send = async () => {
    if (!text.trim() || sending || !currentUser) return
    const msg = text.trim().slice(0, 2000)
    setText(''); setSending(true)
    if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.focus() }
    setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, group_id: groupId, user_id: currentUser.id, text: msg, created_at: new Date().toISOString(), users: currentUser }])
    await supabase.from('group_messages').insert({ group_id: groupId, user_id: currentUser.id, text: msg, user_name: currentUser.full_name || currentUser.email?.split('@')[0] || 'User', user_avatar: currentUser.photo_url || '' })
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', paddingTop: 48, color: C.textDim, fontSize: 13, fontFamily: 'DM Sans,sans-serif' }}>No messages yet — say hello! 👋</div>}
        {messages.map(m => {
          const isMe = m.user_id === currentUser?.id
          const u = m.users || { full_name: m.user_name, photo_url: m.user_avatar }
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isMe && <Av user={u} size={26} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '70%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginLeft: 2, fontFamily: 'DM Sans,sans-serif' }}>{getName(u)}</span>}
                <div style={{ padding: '9px 13px', borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px', background: isMe ? C.red : C.card, color: '#fff', fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word', fontFamily: 'DM Sans,sans-serif', border: isMe ? 'none' : `1px solid ${C.border}` }}>
                  {m.text}
                </div>
                <span style={{ fontSize: 10, color: C.textDim, fontFamily: 'DM Mono,monospace' }}>{ago(m.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0, alignItems: 'flex-end' }}>
        <textarea ref={taRef} value={text} rows={1}
          onChange={e => { setText(e.target.value) }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px' }}
          placeholder="Message the circle..." maxLength={2000} autoComplete="off"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.5, fontFamily: 'DM Sans,sans-serif', maxHeight: 120, overflowY: 'auto' }}
          onFocus={e => (e.target.style.borderColor = C.borderF)}
          onBlur={e => (e.target.style.borderColor = C.border)} />
        <button onClick={send} disabled={!text.trim() || sending} type="button"
          style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: text.trim() ? C.red : C.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, opacity: !text.trim() || sending ? 0.5 : 1, transition: 'all .15s' }}>
          {sending ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </div>
  )
}

// ─── FILES TAB ────────────────────────────────────────────────────────────────
function FilesTab({ groupId, currentUser }: { groupId: string; currentUser: any }) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('group_files').select('*,users(id,email,full_name,photo_url)').eq('group_id', groupId).order('uploaded_at', { ascending: false })
    if (data) setFiles(data); setLoading(false)
  }, [groupId])

  useEffect(() => { load() }, [load])

  const upload = async (fl: FileList | null) => {
    if (!fl || !currentUser) return
    const file = fl[0]; if (!file) return
    if (file.size > 50 * 1024 * 1024) { alert('Max 50MB'); return }
    setUploading(true); setProgress(20)
    const path = `${groupId}/${currentUser.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('group-files').upload(path, file, { contentType: file.type })
    setProgress(80)
    if (!error) {
      const { data: ud } = supabase.storage.from('group-files').getPublicUrl(path)
      await supabase.from('group_files').insert({ group_id: groupId, user_id: currentUser.id, file_name: file.name, file_url: ud.publicUrl, file_size: file.size, file_type: file.type })
      setProgress(100); await load()
    }
    setUploading(false); setProgress(0)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this file?')) return
    await supabase.from('group_files').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const icon = (t: string) => t?.startsWith('image/') ? '🖼' : t?.includes('pdf') ? '📄' : t?.includes('video') ? '🎬' : t?.includes('audio') ? '🎵' : '📁'

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: `2px dashed ${drag ? C.red : C.border}`, background: drag ? C.redDim : C.surface, cursor: 'pointer', transition: 'all .15s' }}
        onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files) }}
        onClick={() => ref.current?.click()}>
        <Upload style={{ width: 22, height: 22, color: drag ? C.red : C.textDim, margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Drop files or <span style={{ color: C.red }}>browse</span> · Max 50MB</p>
        <input ref={ref} type="file" style={{ display: 'none' }} onChange={e => upload(e.target.files)} />
      </div>
      {uploading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, marginBottom: 4, fontFamily: 'DM Mono,monospace' }}><span>Uploading...</span><span>{progress}%</span></div>
          <div style={{ height: 4, borderRadius: 4, background: C.border, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 4, background: C.red, width: `${progress}%`, transition: 'width .3s' }} /></div>
        </div>
      )}
      {loading ? [...Array(3)].map((_, i) => <div key={i} style={{ height: 52, borderRadius: 12, background: C.card, opacity: 0.5 }} />)
        : files.length === 0 ? <div style={{ textAlign: 'center', paddingTop: 32, color: C.textDim, fontSize: 13, fontFamily: 'DM Sans,sans-serif' }}>No files yet — share your first resource</div>
          : files.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon(f.file_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Sans,sans-serif' }}>{f.file_name}</p>
                <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Mono,monospace' }}>{fmtB(f.file_size || 0)} · {getName(f.users)} · {ago(f.uploaded_at)}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" download>
                  <button style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: C.skyDim, color: C.sky, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Download style={{ width: 13, height: 13 }} /></button>
                </a>
                {f.user_id === currentUser?.id && <button onClick={() => del(f.id)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: C.redDim, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 style={{ width: 13, height: 13 }} /></button>}
              </div>
            </div>
          ))
      }
    </div>
  )
}

// ─── CALL TAB ─────────────────────────────────────────────────────────────────
function CallTab({ groupId, currentUser, isCtrl, activeTab }: { groupId: string; currentUser: any; isCtrl: boolean; activeTab: string }) {
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => { const h = () => setWinW(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  const isMob = winW < 640

  const [callActive, setCallActive] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [inCall, setInCall] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenOn, setScreenOn] = useState(false)
  const [joining, setJoining] = useState(false)
  const [notifyReady, setNotifyReady] = useState(false)
  const [raiseHand, setRaiseHand] = useState(false)
  const [hands, setHands] = useState<{ uid: string; name: string }[]>([])
  const [mutedAll, setMutedAll] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [spotlitUid, setSpotlitUid] = useState<string | null>(null)
  const [reactions, setReactions] = useState<{ uid: string; emoji: string; ts: number }[]>([])

  type PE = { pc: RTCPeerConnection; stream: MediaStream; name: string; iceQueue?: RTCIceCandidateInit[] }
  const [peers, setPeers] = useState<Map<string, PE>>(new Map())
  const peersRef = useRef<Map<string, PE>>(new Map())
  const localVid = useRef<HTMLVideoElement>(null)
  const localStr = useRef<MediaStream | null>(null)
  const screenStr = useRef<MediaStream | null>(null)
  const notifyCh = useRef<any>(null)
  const sigCh = useRef<any>(null)
  const presCh = useRef<any>(null)
  const callIdRef = useRef<string | null>(null)
  const myUid = currentUser?.id || ''
  const myName = getName(currentUser)

  useEffect(() => {
    if (activeTab === 'call' && inCall && localVid.current && localStr.current) {
      localVid.current.srcObject = localStr.current; localVid.current.play().catch(() => {})
    }
  }, [activeTab, inCall])

  useEffect(() => {
    supabase.from('group_calls').select('id').eq('group_id', groupId).eq('status', 'active').maybeSingle()
      .then(({ data }) => { if (data) { setCallActive(true); setCallId(data.id); callIdRef.current = data.id } })

    const ch = supabase.channel(`notify-${groupId}`)
      .on('broadcast', { event: 'call-started' }, ({ payload }) => { setCallActive(true); setCallId(payload.callId); callIdRef.current = payload.callId })
      .on('broadcast', { event: 'call-ended' }, () => { setCallActive(false); setCallId(null); callIdRef.current = null; doLeave(true) })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const ts = Date.now()
        setReactions(prev => [...prev, { uid: payload.uid, emoji: payload.emoji, ts }])
        setTimeout(() => setReactions(prev => prev.filter(r => !(r.uid === payload.uid && r.ts === ts))), 3000)
      })
      .subscribe(s => { if (s === 'SUBSCRIBED') setNotifyReady(true) })
    notifyCh.current = ch
    return () => { supabase.removeChannel(ch); setNotifyReady(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  useEffect(() => {
    const sig = supabase.channel(`sig-${groupId}`)
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.to !== myUid) return
        const pc = makePeer(payload.from, payload.name)
        if (localStr.current) localStr.current.getTracks().forEach(t => { if (!pc.getSenders().find(s => s.track === t)) pc.addTrack(t, localStr.current!) })
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          const entry = peersRef.current.get(payload.from)
          if (entry?.iceQueue) { for (const c of entry.iceQueue) { try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {} } entry.iceQueue = [] }
          const ans = await pc.createAnswer(); await pc.setLocalDescription(ans)
          sig.send({ type: 'broadcast', event: 'answer', payload: { to: payload.from, from: myUid, sdp: pc.localDescription, name: myName } })
        } catch (e) { console.error('[offer]', e) }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.to !== myUid) return
        const e = peersRef.current.get(payload.from)
        if (!e || e.pc.signalingState !== 'have-local-offer') return
        try { await e.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)); if (e.iceQueue) { for (const c of e.iceQueue) { try { await e.pc.addIceCandidate(new RTCIceCandidate(c)) } catch {} } e.iceQueue = [] } } catch (err) { console.error('[answer]', err) }
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.to !== myUid) return
        const e = peersRef.current.get(payload.from); if (!e) return
        if (e.pc.remoteDescription) { try { await e.pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {} } else { if (!e.iceQueue) e.iceQueue = []; e.iceQueue.push(payload.candidate) }
      })
      .on('broadcast', { event: 'peer-left' }, ({ payload }) => dropPeer(payload.uid))
      .on('broadcast', { event: 'raise-hand' }, ({ payload }) => {
        setHands(prev => payload.raised ? prev.find(h => h.uid === payload.uid) ? prev : [...prev, { uid: payload.uid, name: payload.name }] : prev.filter(h => h.uid !== payload.uid))
      })
      .on('broadcast', { event: 'mute-all' }, () => { if (localStr.current) { localStr.current.getAudioTracks().forEach(t => { t.enabled = false }); setMicOn(false) } })
      .subscribe()
    sigCh.current = sig
    return () => { supabase.removeChannel(sig) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, myUid])

  const makePeer = useCallback((uid: string, name: string) => {
    peersRef.current.get(uid)?.pc.close()
    const pc = new RTCPeerConnection({ iceServers: ICE }); const ms = new MediaStream()
    peersRef.current.set(uid, { pc, stream: ms, name }); setPeers(new Map(peersRef.current))
    localStr.current?.getTracks().forEach(t => pc.addTrack(t, localStr.current!))
    pc.ontrack = e => {
      const incoming = e.streams[0] || new MediaStream([e.track])
      incoming.getTracks().forEach(t => { if (!ms.getTrackById(t.id)) ms.addTrack(t) })
      const fresh = new MediaStream(ms.getTracks())
      peersRef.current.set(uid, { ...peersRef.current.get(uid)!, stream: fresh }); setPeers(new Map(peersRef.current))
    }
    pc.onicecandidate = ({ candidate }) => { if (candidate) sigCh.current?.send({ type: 'broadcast', event: 'ice', payload: { to: uid, from: myUid, candidate: candidate.toJSON() } }) }
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') dropPeer(uid) }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }
    return pc
  }, [myUid])

  const dropPeer = useCallback((uid: string) => { peersRef.current.get(uid)?.pc.close(); peersRef.current.delete(uid); setPeers(new Map(peersRef.current)) }, [])

  const doJoin = useCallback(async () => {
    setJoining(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      localStr.current = stream
      if (localVid.current) { localVid.current.srcObject = stream; await localVid.current.play().catch(() => {}) }
      const pch = supabase.channel(`pres-${groupId}`, { config: { presence: { key: myUid } } })
        .on('presence', { event: 'join' }, async ({ newPresences }) => {
          for (const p of newPresences as any[]) {
            if (p.uid === myUid) continue
            const delay = myUid < p.uid ? 0 : 200
            setTimeout(async () => {
              const pc = makePeer(p.uid, p.name)
              try { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); sigCh.current?.send({ type: 'broadcast', event: 'offer', payload: { to: p.uid, from: myUid, sdp: pc.localDescription, name: myName } }) } catch (e) { console.error('[join offer]', e) }
            }, delay)
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => { for (const p of leftPresences as any[]) dropPeer(p.uid) })
        .subscribe(async s => { if (s === 'SUBSCRIBED') await pch.track({ uid: myUid, name: myName }) })
      presCh.current = pch
      peersRef.current.forEach(async (entry, uid) => {
        if (stream) {
          stream.getTracks().forEach(t => { if (!entry.pc.getSenders().find(s => s.track === t)) entry.pc.addTrack(t, stream) })
          try { const offer = await entry.pc.createOffer(); await entry.pc.setLocalDescription(offer); sigCh.current?.send({ type: 'broadcast', event: 'offer', payload: { to: uid, from: myUid, sdp: entry.pc.localDescription, name: myName } }) } catch {}
        }
      })
      setInCall(true)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') alert('Camera/mic access denied.')
      else alert('Could not start camera/mic: ' + err.message)
    }
    setJoining(false)
  }, [groupId, myUid, myName, makePeer, dropPeer])

  const doLeave = useCallback(async (forced = false) => {
    localStr.current?.getTracks().forEach(t => t.stop()); screenStr.current?.getTracks().forEach(t => t.stop())
    localStr.current = null; screenStr.current = null
    if (localVid.current) localVid.current.srcObject = null
    await presCh.current?.untrack()
    if (presCh.current) { supabase.removeChannel(presCh.current); presCh.current = null }
    peersRef.current.forEach(({ pc }) => pc.close()); peersRef.current.clear(); setPeers(new Map())
    if (!forced) sigCh.current?.send({ type: 'broadcast', event: 'peer-left', payload: { uid: myUid } })
    setInCall(false); setMicOn(true); setCamOn(true); setScreenOn(false); setRaiseHand(false); setHands([]); setSpotlitUid(null)
  }, [myUid])

  const startCall = async () => {
    if (!notifyReady) { alert('Still connecting — try again.'); return }
    setJoining(true)
    const { data } = await supabase.from('group_calls').insert({ group_id: groupId, started_by: myUid, status: 'active' }).select('id').single()
    const cid = data?.id; callIdRef.current = cid; setCallId(cid); setCallActive(true)
    notifyCh.current.send({ type: 'broadcast', event: 'call-started', payload: { callId: cid } })
    setJoining(false); await doJoin()
  }

  const endCall = async () => {
    await doLeave()
    const cid = callIdRef.current
    if (cid) await supabase.from('group_calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', cid)
    notifyCh.current?.send({ type: 'broadcast', event: 'call-ended', payload: {} })
    setCallActive(false); setCallId(null); callIdRef.current = null
  }

  const toggleMic = () => { localStr.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled }); setMicOn(p => !p) }
  const toggleCam = () => { localStr.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled }); setCamOn(p => !p) }
  const toggleScreen = async () => {
    if (screenOn) {
      screenStr.current?.getTracks().forEach(t => t.stop()); screenStr.current = null
      if (localVid.current && localStr.current) localVid.current.srcObject = localStr.current
      const camT = localStr.current?.getVideoTracks()[0]
      peersRef.current.forEach(({ pc }) => { const s = pc.getSenders().find(s => s.track?.kind === 'video'); if (s && camT) s.replaceTrack(camT).catch(() => {}) })
      setScreenOn(false)
    } else {
      try {
        const ss = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false }); screenStr.current = ss
        if (localVid.current) localVid.current.srcObject = ss
        const vt = ss.getVideoTracks()[0]
        peersRef.current.forEach(({ pc }) => { const s = pc.getSenders().find(s => s.track?.kind === 'video'); if (s) s.replaceTrack(vt).catch(() => {}) })
        vt.onended = () => toggleScreen(); setScreenOn(true)
      } catch {}
    }
  }

  const sendReaction = (emoji: string) => {
    const ts = Date.now()
    notifyCh.current?.send({ type: 'broadcast', event: 'reaction', payload: { uid: myUid, emoji, ts } })
    setReactions(prev => [...prev, { uid: myUid, emoji, ts }])
    setTimeout(() => setReactions(prev => prev.filter(r => !(r.uid === myUid && r.ts === ts))), 3000)
  }

  const toggleRaiseHand = () => {
    const raised = !raiseHand; setRaiseHand(raised)
    sigCh.current?.send({ type: 'broadcast', event: 'raise-hand', payload: { uid: myUid, name: myName, raised } })
    if (raised) setHands(prev => [...prev.filter(h => h.uid !== myUid), { uid: myUid, name: myName }])
    else setHands(prev => prev.filter(h => h.uid !== myUid))
  }

  const muteAll = () => { sigCh.current?.send({ type: 'broadcast', event: 'mute-all', payload: {} }); setMutedAll(true); setTimeout(() => setMutedAll(false), 3000) }

  const peerList = useMemo(() => Array.from(peers.entries()), [peers])
  const orderedPeers = useMemo(() => {
    if (!spotlitUid) return peerList
    const s = peerList.find(([uid]) => uid === spotlitUid); const rest = peerList.filter(([uid]) => uid !== spotlitUid)
    return s ? [s, ...rest] : peerList
  }, [peerList, spotlitUid])

  const cols = !spotlitUid ? (peerList.length === 0 ? 1 : peerList.length === 1 ? 2 : peerList.length <= 3 ? 2 : 3) : 1
  const EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '👏', '🎉', '💡']

  const btnStyle = (active = false, danger = false): React.CSSProperties => ({
    width: isMob ? 40 : 44, height: isMob ? 40 : 44, borderRadius: '50%', border: `1px solid ${danger ? C.red + '55' : active ? C.borderF : C.border}`,
    background: danger ? C.redDim : active ? C.card : C.card, color: danger ? C.red : active ? C.text : C.textMuted,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {!callActive && !inCall && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.skyDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall style={{ width: 28, height: 28, color: C.sky }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>No active call</p>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{isCtrl ? 'Start a call — all members will be notified instantly' : 'Waiting for the owner or admin to start a call'}</p>
          </div>
          {isCtrl && (
            <button onClick={startCall} disabled={joining || !notifyReady}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 24, border: 'none', background: notifyReady ? C.green : 'rgba(34,197,94,0.3)', color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, cursor: joining || !notifyReady ? 'not-allowed' : 'pointer', opacity: joining ? 0.6 : 1 }}>
              {joining ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <PhoneCall style={{ width: 16, height: 16 }} />}
              {joining ? 'Starting...' : 'Start Group Call'}
            </button>
          )}
        </div>
      )}

      {callActive && !inCall && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone style={{ width: 28, height: 28, color: C.green }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>Group call is live 🟢</p>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Join to see and hear everyone</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={doJoin} disabled={joining}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 24, border: 'none', background: C.green, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: joining ? 0.6 : 1 }}>
              {joining ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Phone style={{ width: 16, height: 16 }} />}
              {joining ? 'Joining...' : 'Join Call'}
            </button>
            {isCtrl && <button onClick={endCall} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 24, border: `1px solid ${C.red}55`, background: C.redDim, color: C.red, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><X style={{ width: 15, height: 15 }} />End for All</button>}
          </div>
        </div>
      )}

      <div style={{ display: inCall ? 'flex' : 'none', flexDirection: 'column', ...(isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, background: C.bg, height: '100dvh' } : { flex: 1, minHeight: 0, height: '100%' }) }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
          {reactions.map((r, i) => <div key={`${r.uid}-${r.ts}-${i}`} style={{ position: 'absolute', fontSize: 28, animation: 'floatUp 3s ease-out forwards', bottom: 80, left: `${15 + ((r.ts + i * 37) % 70)}%` }}>{r.emoji}</div>)}
        </div>
        <div style={{ flex: 1, background: C.bg, overflow: 'hidden', padding: 8, display: 'grid', gap: 6, gridTemplateColumns: spotlitUid && orderedPeers.length > 0 ? '3fr 1fr' : `repeat(${cols},1fr)`, gridAutoRows: '1fr', minHeight: 0 }}>
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#121214', minHeight: 0, height: '100%' }}>
            <video ref={localVid} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {!camOn && !screenOn && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.card }}><div style={{ textAlign: 'center' }}><div style={{ width: 44, height: 44, borderRadius: '50%', background: ac(myUid) + '22', color: ac(myUid), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, margin: '0 auto 4px' }}>{getInits(currentUser)}</div><p style={{ fontSize: 10, color: C.textMuted }}>Camera off</p></div></div>}
            <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '2px 8px', borderRadius: 6 }}>You{!micOn ? ' 🔇' : ''}</div>
          </div>
          {orderedPeers.map(([uid, { stream, name }]) => {
            const isSpotlit = uid === spotlitUid
            return (
              <div key={uid} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: C.bg, minHeight: 120, gridColumn: isSpotlit ? '1' : 'auto', gridRow: isSpotlit ? '1 / span 3' : 'auto', outline: isSpotlit ? `2px solid ${C.gold}` : 'none' }}>
                <RemoteTile uid={uid} stream={stream} name={name} />
                {isCtrl && <button onClick={() => setSpotlitUid(isSpotlit ? null : uid)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.6)', color: isSpotlit ? C.gold : C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>⭐</button>}
              </div>
            )
          })}
        </div>

        {isCtrl && hands.length > 0 && (
          <div style={{ flexShrink: 0, background: C.goldDim, borderTop: `1px solid rgba(255,215,0,0.3)`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
            <Hand style={{ width: 14, height: 14, color: C.gold, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, fontFamily: 'DM Mono,monospace', flexShrink: 0 }}>Hands raised:</span>
            {hands.map((h, i) => (
              <div key={h.uid} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,215,0,0.15)', fontSize: 11, color: C.gold, fontFamily: 'DM Sans,sans-serif', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {i + 1}. {h.name}
                <button onClick={() => setHands(prev => prev.filter(x => x.uid !== h.uid))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 0, marginLeft: 2, fontSize: 10 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ flexShrink: 0, background: C.surface, borderTop: `1px solid ${C.border}`, padding: isMob ? '8px' : '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMob ? 6 : 8, flexWrap: 'nowrap' }}>
            <button onClick={toggleMic} style={{ ...btnStyle(!micOn, !micOn) }}>{micOn ? <Mic style={{ width: 17, height: 17 }} /> : <MicOff style={{ width: 17, height: 17 }} />}</button>
            <button onClick={toggleCam} style={{ ...btnStyle(!camOn, !camOn) }}>{camOn ? <Video style={{ width: 17, height: 17 }} /> : <VideoOff style={{ width: 17, height: 17 }} />}</button>
            {!isMob && <button onClick={toggleScreen} style={{ ...btnStyle(screenOn) }}>{screenOn ? <MonitorOff style={{ width: 17, height: 17 }} /> : <Monitor style={{ width: 17, height: 17 }} />}</button>}
            <button onClick={toggleRaiseHand} style={{ ...btnStyle(raiseHand), border: `1px solid ${raiseHand ? C.gold + '55' : C.border}`, background: raiseHand ? C.goldDim : C.card, color: raiseHand ? C.gold : C.textMuted }}><Hand style={{ width: 17, height: 17 }} /></button>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button style={{ ...btnStyle(), fontSize: 17 }} onClick={() => { const el = document.getElementById(`ep-${myUid}`); if (el) el.style.display = el.style.display === 'flex' ? 'none' : 'flex' }}>😊</button>
              <div id={`ep-${myUid}`} style={{ display: 'none', position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 8, gap: 4, flexWrap: 'wrap', width: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 30 }}>
                {EMOJIS.map((e, idx) => <button key={idx} onClick={() => { sendReaction(e); const el = document.getElementById(`ep-${myUid}`); if (el) el.style.display = 'none' }} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20 }}>{e}</button>)}
              </div>
            </div>
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Mono,monospace', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}><Users style={{ width: 12, height: 12 }} />{peerList.length + 1}</span>
            {isCtrl && !isMob && <button onClick={muteAll} style={{ ...btnStyle(mutedAll, mutedAll) }}><MicOff style={{ width: 17, height: 17 }} /></button>}
            <button onClick={() => setIsFullscreen(f => !f)} style={{ ...btnStyle(isFullscreen) }}>{isFullscreen ? <Minimize2 style={{ width: 17, height: 17 }} /> : <Maximize2 style={{ width: 17, height: 17 }} />}</button>
            <button onClick={() => doLeave()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMob ? '9px 14px' : '10px 20px', borderRadius: 24, border: 'none', background: C.red, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: isMob ? 12 : 13, cursor: 'pointer', flexShrink: 0 }}>
              <PhoneOff style={{ width: 14, height: 14 }} />Leave
            </button>
            {isCtrl && <button onClick={endCall} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMob ? '9px 14px' : '10px 20px', borderRadius: 24, border: `1px solid ${C.red}55`, background: C.redDim, color: C.red, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: isMob ? 12 : 13, cursor: 'pointer', flexShrink: 0 }}>
              <X style={{ width: 14, height: 14 }} />End All
            </button>}
          </div>
        </div>
        <style>{`@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-140px) scale(1.4)}}`}</style>
      </div>
    </div>
  )
}

// ─── MEMBERS TAB (owner approval panel) ──────────────────────────────────────
function MembersTab({ groupId, currentUser, myRole, members, onMembersChange }: {
  groupId: string; currentUser: any; myRole: string; members: any[]; onMembersChange: () => void
}) {
  const [acting, setActing] = useState<string | null>(null)
  const isCtrl = myRole === 'owner' || myRole === 'admin'
  const pending = members.filter(m => m.status === 'pending')
  const active  = members.filter(m => m.status !== 'pending')

  const approve = async (m: any) => {
    setActing(m.id)
    await supabase.from('group_members').update({ status: 'active' }).eq('id', m.id)
    const activeCount = members.filter(x => x.status === 'active' || !x.status || x.role === 'owner').length
    await supabase.from('groups').update({ member_count: activeCount + 1 }).eq('id', groupId)
    await onMembersChange(); setActing(null)
  }

  const reject = async (m: any) => {
    setActing(m.id)
    await supabase.from('group_members').delete().eq('id', m.id)
    await onMembersChange(); setActing(null)
  }

  const promote = async (m: any, newRole: 'admin' | 'member') => {
    setActing(m.id)
    await supabase.from('group_members').update({ role: newRole }).eq('id', m.id)
    await onMembersChange(); setActing(null)
  }

  const kick = async (m: any) => {
    if (!confirm(`Remove ${getName(m.users)} from the circle?`)) return
    setActing(m.id)
    await supabase.from('group_members').delete().eq('id', m.id)
    const activeCount = members.filter(x => (x.status === 'active' || !x.status || x.role === 'owner') && x.id !== m.id).length
    await supabase.from('groups').update({ member_count: activeCount }).eq('id', groupId)
    await onMembersChange(); setActing(null)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Pending requests — only shown to owner/admin */}
      {isCtrl && pending.length > 0 && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid rgba(255,215,0,0.25)`, background: C.goldDim }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: `1px solid rgba(255,215,0,0.2)` }}>
            <Clock style={{ width: 14, height: 14, color: C.gold }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono,monospace' }}>
              Join Requests ({pending.length})
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {pending.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < pending.length - 1 ? `1px solid rgba(255,215,0,0.1)` : 'none' }}>
                <Av user={m.users} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(m.users)}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Mono,monospace' }}>{m.users?.email || ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => approve(m)} disabled={acting === m.id} title="Approve"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: `1px solid rgba(34,197,94,0.3)`, background: C.greenDim, color: C.green, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {acting === m.id ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <CheckCircle style={{ width: 12, height: 12 }} />}
                    Approve
                  </button>
                  <button onClick={() => reject(m)} disabled={acting === m.id} title="Reject"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: `1px solid rgba(255,59,59,0.3)`, background: C.redDim, color: C.red, fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {acting === m.id ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <XCircle style={{ width: 12, height: 12 }} />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No pending, owner sees a note */}
      {isCtrl && pending.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: C.greenDim, border: `1px solid rgba(34,197,94,0.2)` }}>
          <CheckCircle style={{ width: 16, height: 16, color: C.green, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: C.green, fontFamily: 'DM Sans,sans-serif' }}>No pending join requests right now.</p>
        </div>
      )}

      {/* Active members list */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textDim, fontFamily: 'DM Mono,monospace', marginBottom: 10 }}>
          Active Members ({active.length})
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {active.map(m => {
            const isMe = m.user_id === currentUser?.id
            const mRole = m.role === 'host' ? 'owner' : (m.role || 'member')
            const canPromote = myRole === 'owner' && !isMe && mRole !== 'owner'
            const canKick = isCtrl && !isMe && mRole !== 'owner'
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, transition: 'border-color .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderF}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                <Av user={m.users} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(m.users)}{isMe ? ' (you)' : ''}</p>
                    {mRole === 'owner' && <Crown style={{ width: 12, height: 12, color: C.gold, flexShrink: 0 }} />}
                    {mRole === 'admin' && <Shield style={{ width: 12, height: 12, color: C.purple, flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Mono,monospace', textTransform: 'capitalize' }}>{mRole}</p>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {canPromote && (
                    <button onClick={() => promote(m, mRole === 'admin' ? 'member' : 'admin')} disabled={acting === m.id}
                      title={mRole === 'admin' ? 'Remove admin' : 'Make admin'}
                      style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: mRole === 'admin' ? C.redDim : C.purpleDim, color: mRole === 'admin' ? C.red : C.purple, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {acting === m.id ? <Loader2 style={{ width: 10, height: 10, animation: 'spin 1s linear infinite' }} /> : <Shield style={{ width: 10, height: 10 }} />}
                      {mRole === 'admin' ? 'Demote' : 'Admin'}
                    </button>
                  )}
                  {canKick && (
                    <button onClick={() => kick(m)} disabled={acting === m.id}
                      style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: C.redDim, color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {acting === m.id ? <Loader2 style={{ width: 10, height: 10, animation: 'spin 1s linear infinite' }} /> : <UserMinus style={{ width: 10, height: 10 }} />}
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ group, myRole, currentUser, onDeleted }: { group: any; myRole: string; currentUser: any; onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const isOwner = myRole === 'owner' || myRole === 'admin'
  const required = 'delete the circle'

  const deleteGroup = async () => {
    if (confirmText !== required) return
    setDeleting(true)
    try {
      await supabase.from('group_messages').delete().eq('group_id', group.id)
      await supabase.from('group_files').delete().eq('group_id', group.id)
      await supabase.from('group_calls').delete().eq('group_id', group.id)
      await supabase.from('group_members').delete().eq('group_id', group.id)
      const { error } = await supabase.from('groups').delete().eq('id', group.id)
      if (error) { alert('Delete failed. Please contact support.'); setDeleting(false); return }
      setDeleting(false); onDeleted()
    } catch (err: any) { alert('Error: ' + err.message); setDeleting(false) }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textDim, fontFamily: 'DM Mono,monospace', marginBottom: 10 }}>Circle Info</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 4 }}>{group?.name}</p>
        <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{group?.description || 'No description'}</p>
        {group?.category && <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: C.redDim, color: C.red, fontFamily: 'DM Mono,monospace' }}>{group.category}</span>}
      </div>
      <div style={{ padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textDim, fontFamily: 'DM Mono,monospace', marginBottom: 8 }}>Your Role</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {myRole === 'owner' && <Crown style={{ width: 16, height: 16, color: C.gold }} />}
          {myRole === 'admin' && <Shield style={{ width: 16, height: 16, color: C.purple }} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: myRole === 'owner' ? C.gold : myRole === 'admin' ? C.purple : C.text, fontFamily: 'Syne,sans-serif', textTransform: 'capitalize' }}>{myRole}</span>
        </div>
      </div>
      {isOwner && (
        <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,59,59,0.06)', border: `1px solid rgba(255,59,59,0.25)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: C.red }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono,monospace' }}>Danger Zone</p>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.6, marginBottom: 16 }}>Permanently delete this circle and all its data. <strong style={{ color: C.text }}>This cannot be undone.</strong></p>
          <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginBottom: 8 }}>Type <strong style={{ color: C.text, fontFamily: 'monospace' }}>{required}</strong> to confirm:</p>
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={required}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${confirmText === required ? C.red : C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'DM Mono,monospace', boxSizing: 'border-box', marginBottom: 12 }} />
          <button onClick={deleteGroup} disabled={confirmText !== required || deleting}
            style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: confirmText === required ? C.red : 'rgba(255,59,59,0.2)', color: confirmText === required ? '#fff' : 'rgba(255,59,59,0.4)', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 13, cursor: confirmText === required ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {deleting ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Deleting...</> : <><Trash2 style={{ width: 14, height: 14 }} />Delete Circle Permanently</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GroupRoomPage() {
  const { id } = useParams()
  const router = useRouter()
  const groupId = id as string

  const [group, setGroup] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [myRole, setMyRole] = useState('member')
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const isCtrl = myRole === 'owner' || myRole === 'admin'

  useEffect(() => {
    let dead = false
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setCurrentUser(u)
      const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single()
      if (!g || dead) { router.push('/groups'); return }
      setGroup(g)
      const { data: mem } = await supabase.from('group_members').select('role,status').eq('group_id', groupId).eq('user_id', u.id).maybeSingle()
      if (!mem || dead) { router.push('/groups'); return }
      const role = mem.role === 'host' ? 'owner' : (mem.role || 'member')
      if (mem.status === 'pending' && role !== 'owner' && role !== 'admin') { router.push('/groups?pending=1'); return }
      setMyRole(role); setAccess(true)
      const { data: mems } = await supabase.from('group_members').select('*,users(id,email,full_name,photo_url,role)').eq('group_id', groupId).order('created_at', { ascending: true })
      if (!dead) { setMembers(mems || []); setPendingCount((mems || []).filter((m: any) => m.status === 'pending').length) }
      setLoading(false)
    })
    return () => { dead = true }
  }, [groupId, router])

  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from('group_members').select('*,users(id,email,full_name,photo_url,role)').eq('group_id', groupId).order('created_at', { ascending: true })
    setMembers(data || [])
    setPendingCount((data || []).filter((m: any) => m.status === 'pending').length)
  }, [groupId])

  const TABS = useMemo((): { id: Tab; label: string; icon: any; badge?: number }[] => {
    const base: { id: Tab; label: string; icon: any; badge?: number }[] = [
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'files', label: 'Files', icon: Folder },
      { id: 'call', label: 'Call', icon: Video },
      { id: 'members', label: 'Members', icon: Users, badge: isCtrl && pendingCount > 0 ? pendingCount : undefined },
    ]
    if (isCtrl) base.push({ id: 'settings', label: 'Settings', icon: Settings })
    return base
  }, [isCtrl, pendingCount])

  if (loading) return (
    <DashboardLayout>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <Loader2 style={{ width: 32, height: 32, color: C.red, animation: 'spin 1s linear infinite' }} />
      </div>
    </DashboardLayout>
  )
  if (!access) return null

  const activeMemberCount = members.filter(m => m.status !== 'pending').length

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={() => router.push('/groups')} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: C.card, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.redDim }}>
            {group?.banner_url ? <img src={group.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Zap style={{ width: 16, height: 16, color: C.red }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{group?.name}</h1>
              {group?.is_private ? <Lock style={{ width: 10, height: 10, color: C.gold, flexShrink: 0 }} /> : <Globe style={{ width: 10, height: 10, color: C.textDim, flexShrink: 0 }} />}
              {myRole === 'owner' && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: C.goldDim, color: C.gold, fontFamily: 'DM Mono,monospace' }}><Crown style={{ width: 8, height: 8 }} />Owner</span>}
              {myRole === 'admin' && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: C.purpleDim, color: C.purple, fontFamily: 'DM Mono,monospace' }}><Shield style={{ width: 8, height: 8 }} />Admin</span>}
            </div>
            <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Mono,monospace' }}>{activeMemberCount} member{activeMemberCount !== 1 ? 's' : ''} · {group?.category}</p>
          </div>
          {/* Pending badge in header for owner */}
          {isCtrl && pendingCount > 0 && (
            <button onClick={() => setActiveTab('members')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, border: `1px solid rgba(255,215,0,0.3)`, background: C.goldDim, color: C.gold, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono,monospace', flexShrink: 0 }}>
              <Bell style={{ width: 12, height: 12 }} />{pendingCount} request{pendingCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '7px 10px', background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0, overflowX: 'auto' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: activeTab === t.id ? C.red : 'transparent', color: activeTab === t.id ? '#fff' : C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', flexShrink: 0, transition: 'all .15s', position: 'relative' }}>
                  <t.icon style={{ width: 13, height: 13 }} />{t.label}
                  {t.badge && <span style={{ marginLeft: 2, background: C.gold, color: '#0B0B0C', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{t.badge}</span>}
                </button>
              ))}
            </div>

            {/* Panels */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
                <ChatTab groupId={groupId} currentUser={currentUser} />
              </div>
              <div style={{ position: 'absolute', inset: 0, display: activeTab === 'files' ? 'flex' : 'none', flexDirection: 'column' }}>
                <FilesTab groupId={groupId} currentUser={currentUser} />
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', visibility: activeTab === 'call' ? 'visible' : 'hidden' }}>
                <CallTab groupId={groupId} currentUser={currentUser} isCtrl={isCtrl} activeTab={activeTab} />
              </div>
              <div style={{ position: 'absolute', inset: 0, display: activeTab === 'members' ? 'flex' : 'none', flexDirection: 'column' }}>
                <MembersTab groupId={groupId} currentUser={currentUser} myRole={myRole} members={members} onMembersChange={loadMembers} />
              </div>
              {isCtrl && (
                <div style={{ position: 'absolute', inset: 0, display: activeTab === 'settings' ? 'flex' : 'none', flexDirection: 'column' }}>
                  <SettingsTab group={group} myRole={myRole} currentUser={currentUser} onDeleted={() => router.push('/groups')} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
