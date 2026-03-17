'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, Users, Radio,
  Shield, Volume2, VolumeX, Monitor, MonitorOff, PenLine, Eraser,
  Minus, Square, Circle, Trash2, Heart, Loader2, Crown,
  MessageCircle, ChevronDown, Hand, Maximize, Minimize, Eye
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.07)', text:'#F0F4FF',
  textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueL:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.12)',
  green:'#10B981',
}

const ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]

const BAD_WORDS = ['spam','scam','fuck','shit','bitch','asshole','dick','pussy','cunt']
const autoMod  = (t: string) => BAD_WORDS.some(w => t.toLowerCase().includes(w))
const getName  = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInit  = (u: any) => getName(u).slice(0, 2).toUpperCase()
const ACOLORS  = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const aBg      = (id: string) => ACOLORS[(id?.charCodeAt(0) || 0) % ACOLORS.length]
const fmtTs    = (ts: number) => { const m = Math.floor((Date.now()-ts)/60000); return m<1?'now':m<60?`${m}m`:`${Math.floor(m/60)}h` }
const fmtRec   = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

function useWW() {
  const [w, setW] = useState(1200)
  useEffect(() => { const h = () => setW(window.innerWidth); h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  return w
}

// ── Whiteboard ─────────────────────────────────────────────────────────────────
function Whiteboard({ bg, canvasRef }: { bg: string; canvasRef: React.RefObject<HTMLCanvasElement> }) {
  const [tool,  setTool]  = useState<'pen'|'eraser'|'line'|'rect'|'circle'>('pen')
  const [color, setColor] = useState('#FFFFFF')
  const [size,  setSize]  = useState(4)
  const drawing = useRef(false), lastPos = useRef<any>(null), snap = useRef<ImageData|null>(null)

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height)
  }, [bg, canvasRef])

  const gp = (e: any, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect(), s = e.touches ? e.touches[0] : e
    return { x: (s.clientX - r.left) * (c.width / r.width), y: (s.clientY - r.top) * (c.height / r.height) }
  }
  const dn = (e: any) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!, p = gp(e, c)
    drawing.current = true; lastPos.current = p; snap.current = ctx.getImageData(0, 0, c.width, c.height)
    if (tool === 'pen' || tool === 'eraser') { ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  }
  const mv = (e: any) => {
    if (!drawing.current) return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!, p = gp(e, c)
    ctx.lineWidth = tool === 'eraser' ? size*5 : size; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = tool === 'eraser' ? bg : color
    if (tool === 'pen' || tool === 'eraser') { ctx.lineTo(p.x, p.y); ctx.stroke() }
    else if (snap.current && lastPos.current) {
      ctx.putImageData(snap.current, 0, 0); ctx.beginPath(); ctx.strokeStyle = color
      if (tool === 'line') { ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(p.x, p.y); ctx.stroke() }
      else if (tool === 'rect') ctx.strokeRect(lastPos.current.x, lastPos.current.y, p.x - lastPos.current.x, p.y - lastPos.current.y)
      else if (tool === 'circle') { const rx = Math.abs(p.x-lastPos.current.x)/2, ry = Math.abs(p.y-lastPos.current.y)/2; ctx.ellipse(lastPos.current.x+(p.x-lastPos.current.x)/2, lastPos.current.y+(p.y-lastPos.current.y)/2, rx, ry, 0, 0, Math.PI*2); ctx.stroke() }
    }
  }
  const up  = () => { drawing.current = false; lastPos.current = null }
  const clr = () => { const c = canvasRef.current; if (!c) return; const ctx = c.getContext('2d')!; ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height) }

  const TOOLS = [{ id:'pen',Icon:PenLine },{ id:'eraser',Icon:Eraser },{ id:'line',Icon:Minus },{ id:'rect',Icon:Square },{ id:'circle',Icon:Circle }] as any[]
  const COLS  = ['#FFFFFF','#EF4444','#3B82F6','#F59E0B','#10B981','#A78BFA','#FB923C','#000000']

  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:C.card, borderBottom:`1px solid ${C.border}`, flexWrap:'wrap', flexShrink:0 }}>
        <div style={{ display:'flex', gap:2, background:C.surface, padding:3, borderRadius:8 }}>
          {TOOLS.map(({ id, Icon }: any) => <button key={id} onClick={() => setTool(id)} style={{ width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:tool===id?C.blue:'transparent', color:tool===id?'#fff':C.textMuted }}><Icon style={{ width:13, height:13 }}/></button>)}
        </div>
        <div style={{ display:'flex', gap:4 }}>{COLS.map(col => <button key={col} onClick={() => setColor(col)} style={{ width:color===col?20:14, height:color===col?20:14, borderRadius:'50%', background:col, border:color===col?`2px solid ${C.blueL}`:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', transition:'all .15s' }}/>)}</div>
        <div style={{ display:'flex', gap:3, alignItems:'center' }}>{[2,4,8,14,22].map(s => <button key={s} onClick={() => setSize(s)} style={{ width:Math.max(s+4,10), height:Math.max(s+4,10), borderRadius:'50%', border:'none', cursor:'pointer', background:size===s?color:C.textDim }}/>)}</div>
        <button onClick={clr} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', background:C.redDim, color:C.red, fontSize:11, fontFamily:'DM Sans,sans-serif' }}><Trash2 style={{ width:11, height:11 }}/>Clear</button>
      </div>
      <canvas ref={canvasRef} width={1280} height={720}
        style={{ flex:1, width:'100%', height:'100%', cursor:tool==='eraser'?'cell':'crosshair', touchAction:'none', background:bg, display:'block' }}
        onMouseDown={dn} onMouseMove={mv} onMouseUp={up} onMouseLeave={up}
        onTouchStart={dn} onTouchMove={mv} onTouchEnd={up}/>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { id } = useParams(); const router = useRouter()
  const eventId = id as string
  const w = useWW(); const isMobile = w < 768, isTablet = w >= 768 && w < 1100

  const [event,       setEvent]       = useState<any>(null)
  const [user,        setUser]        = useState<any>(null)
  const [profile,     setProfile]     = useState<any>(null)
  const [isHost,      setIsHost]      = useState(false)
  const [isCohost,    setIsCohost]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [accessDenied,setAccessDenied]= useState(false)
  const [streaming,   setStreaming]   = useState(false)
  const [micOn,       setMicOn]       = useState(true)
  const [camOn,       setCamOn]       = useState(true)
  const [muted,       setMuted]       = useState(false)
  const [mode,        setMode]        = useState<'camera'|'screen'|'whiteboard'>('camera')
  const [boardBg,     setBoardBg]     = useState('#0A0A0F')
  const [streamErr,   setStreamErr]   = useState('')
  const [vStatus,     setVStatus]     = useState<'idle'|'connecting'|'connected'|'failed'>('idle')
  const [retries,     setRetries]     = useState(0)
  const [fullscreen,  setFullscreen]  = useState(false)
  const [recording,   setRecording]   = useState(false)
  const [recStatus,   setRecStatus]   = useState('')
  const [recTime,     setRecTime]     = useState(0)
  const [messages,    setMessages]    = useState<any[]>([])
  const [newMsg,      setNewMsg]      = useState('')
  const [sending,     setSending]     = useState(false)
  const [viewers,     setViewers]     = useState(1)
  const [reactions,   setReactions]   = useState(0)
  const [liked,       setLiked]       = useState(false)
  const [earnings,    setEarnings]    = useState(0)
  const [showChat,    setShowChat]    = useState(true)
  const [unread,      setUnread]      = useState(0)
  const [slowMode,    setSlowMode]    = useState(false)
  const [lastMsgTime, setLastMsgTime] = useState(0)
  const [slowCD,      setSlowCD]      = useState(0)
  const [mutedUsers,  setMutedUsers]  = useState<Set<string>>(new Set())
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set())
  const [modCmd,      setModCmd]      = useState('')
  const [showMod,     setShowMod]     = useState(false)
  const [hands,       setHands]       = useState<string[]>([])
  const [myHand,      setMyHand]      = useState(false)

  // DOM refs
  const localVid    = useRef<HTMLVideoElement>(null)
  const remoteVid   = useRef<HTMLVideoElement>(null)
  const wbCanvas    = useRef<HTMLCanvasElement>(null)
  const vidContainer= useRef<HTMLDivElement>(null)
  const chatBottom  = useRef<HTMLDivElement>(null)

  // Media refs
  const camRef    = useRef<MediaStream|null>(null)
  const scrRef    = useRef<MediaStream|null>(null)
  const wbRef     = useRef<MediaStream|null>(null)
  const txRef     = useRef<MediaStream|null>(null)   // currently-transmitted stream

  // WebRTC refs
  const hPeers    = useRef<Map<string, RTCPeerConnection>>(new Map())
  const vPc       = useRef<RTCPeerConnection|null>(null)
  const pendIce   = useRef<RTCIceCandidateInit[]>([])
  const live      = useRef(false)

  // Supabase refs
  const chatCh    = useRef<any>(null)
  const sigCh     = useRef<any>(null)

  // Misc refs
  const retryT    = useRef<any>(null)
  const recTimer  = useRef<any>(null)
  const mediaRec  = useRef<MediaRecorder|null>(null)
  const recChunks = useRef<Blob[]>([])
  const uRef      = useRef<any>(null)
  const pRef      = useRef<any>(null)
  const isHostRef = useRef(false)

  // ── Bootstrap ─────────────────────────────────────────────────────
  useEffect(() => {
    let gone = false
    ;(async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u); uRef.current = u

      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof); pRef.current = prof

      const { data: ev } = await supabase.from('events')
        .select('*, users(id,email,full_name,photo_url)').eq('id', eventId).single()
      if (!ev || gone) { router.push('/dashboard'); return }
      setEvent(ev)

      const hc = ev.host_id === u.id || prof?.role === 'admin'
      setIsHost(hc); isHostRef.current = hc

      const { data: co } = await supabase.from('event_cohosts')
        .select('id').eq('event_id', eventId).eq('user_id', u.id).maybeSingle()
      const cc = !!co; setIsCohost(cc); if (cc) isHostRef.current = true
      const ctrl = hc || cc

      if (!ctrl && (ev.price > 0 || !ev.is_free)) {
        const { data: tkt } = await supabase.from('tickets').select('id')
          .eq('user_id', u.id).eq('event_id', eventId)
          .in('status', ['paid','free','confirmed','active']).maybeSingle()
        if (!tkt) { setAccessDenied(true); setLoading(false); return }
      }

      const { data: ml } = await supabase.from('live_muted_users').select('user_id,muted_until').eq('event_id', eventId)
      if (ml) setMutedUsers(new Set(ml.filter(m => !m.muted_until || new Date(m.muted_until) > new Date()).map(m => m.user_id)) as Set<string>)

      const { data: hist } = await supabase.from('live_messages').select('*')
        .eq('event_id', eventId).order('created_at', { ascending: true }).limit(200)
      if (hist?.length) {
        setMessages(hist.map(m => ({ id:m.id, user_id:m.user_id, name:m.user_name, avatar:m.user_avatar, text:m.content, ts:new Date(m.created_at).getTime(), isHost:m.is_host })))
        setTimeout(() => chatBottom.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }

      const { count: rc } = await supabase.from('event_reactions').select('*', { count:'exact', head:true }).eq('event_id', eventId)
      setReactions(rc || 0)
      const { data: myR } = await supabase.from('event_reactions').select('id').eq('event_id', eventId).eq('user_id', u.id).maybeSingle()
      if (myR) setLiked(true)

      if (hc) {
        const { data: tix } = await supabase.from('tickets').select('amount').eq('event_id', eventId).eq('status', 'paid')
        setEarnings((tix || []).reduce((s: number, t: any) => s + Math.floor(t.amount * 0.8), 0))
      }

      setLoading(false); if (gone) return

      // Chat channel
      const ch = supabase.channel(`chat-${eventId}`, { config: { presence: { key: u.id } } })
        .on('broadcast', { event: 'msg' }, ({ payload }) => {
          setMessages(prev => prev.find(m => m.id === payload.id) ? prev : [...prev, payload])
          setTimeout(() => chatBottom.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          setUnread(p => p + 1)
        })
        .on('broadcast', { event: 'react' }, () => setReactions(p => p + 1))
        .on('broadcast', { event: 'hand' }, ({ payload }) => {
          setHands(prev => payload.raised ? [...prev.filter(h => h !== payload.uid), payload.uid] : prev.filter(h => h !== payload.uid))
        })
        .on('broadcast', { event: 'mod' }, ({ payload }) => {
          if (payload.action === 'mute' && payload.target === u.id) alert('You have been muted.')
          if (payload.action === 'ban'  && payload.target === u.id) { alert('You have been removed.'); router.push('/dashboard') }
          if (payload.action === 'slow') setSlowMode(payload.enabled)
        })
        .on('presence', { event: 'sync' }, () => setViewers(Object.keys(ch.presenceState()).length))
        .subscribe(async s => { if (s === 'SUBSCRIBED') await ch.track({ uid: u.id }) })
      chatCh.current = ch

      initSignaling(u.id, ctrl, ev.status === 'live')
    })()

    return () => {
      gone = true
      clearTimeout(retryT.current); clearInterval(recTimer.current)
      killMedia()
      vPc.current?.close()
      hPeers.current.forEach(pc => pc.close()); hPeers.current.clear()
      if (chatCh.current) supabase.removeChannel(chatCh.current)
      if (sigCh.current)  supabase.removeChannel(sigCh.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const killMedia = () => {
    camRef.current?.getTracks().forEach(t => t.stop())
    scrRef.current?.getTracks().forEach(t => t.stop())
    wbRef.current?.getTracks().forEach(t => t.stop())
    camRef.current = null; scrRef.current = null; wbRef.current = null; txRef.current = null
  }

  // ── Replace tracks on all viewer peer connections ─────────────────
  const replaceVid = useCallback((track: MediaStreamTrack) => {
    hPeers.current.forEach(pc => { pc.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(track).catch(() => {}) })
  }, [])
  const replaceAud = useCallback((track: MediaStreamTrack) => {
    hPeers.current.forEach(pc => { pc.getSenders().find(s => s.track?.kind === 'audio')?.replaceTrack(track).catch(() => {}) })
  }, [])

  // ── Create peer connection — HOST side ────────────────────────────
  const mkHostPeer = useCallback((vid: string, stream: MediaStream) => {
    const sig = sigCh.current
    hPeers.current.get(vid)?.close(); hPeers.current.delete(vid)
    const pc = new RTCPeerConnection({ iceServers: ICE })

    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && sig) sig.send({ type:'broadcast', event:'ice', payload:{ to:vid, from:'host', candidate:candidate.toJSON() } })
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') { hPeers.current.delete(vid); pc.close() }
    }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }

    pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })
      .then(o => pc.setLocalDescription(o))
      .then(() => sig?.send({ type:'broadcast', event:'offer', payload:{ to:vid, from:uRef.current?.id, sdp:pc.localDescription } }))
      .catch(e => console.error('[HOST] offer error:', e))

    hPeers.current.set(vid, pc)
    return pc
  }, [])

  // ── Create peer connection — VIEWER side ──────────────────────────
  const mkViewerPeer = useCallback((myId: string) => {
    vPc.current?.close(); pendIce.current = []
    const pc = new RTCPeerConnection({ iceServers: ICE })
    const ms = new MediaStream()

    pc.ontrack = e => {
      e.streams[0]?.getTracks().forEach(t => { if (!ms.getTrackById(t.id)) ms.addTrack(t) })
      if (remoteVid.current) { remoteVid.current.srcObject = ms; remoteVid.current.play().catch(() => {}) }
      setVStatus('connected'); clearTimeout(retryT.current)
    }
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && sigCh.current) sigCh.current.send({ type:'broadcast', event:'ice', payload:{ to:'host', from:myId, candidate:candidate.toJSON() } })
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') { setVStatus('connected'); setRetries(0); clearTimeout(retryT.current) }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setVStatus('failed')
        retryT.current = setTimeout(() => {
          setRetries(r => r+1); setVStatus('connecting')
          sigCh.current?.send({ type:'broadcast', event:'join', payload:{ viewerId:myId } })
        }, 4000)
      }
    }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') pc.restartIce() }

    vPc.current = pc; return pc
  }, [])

  // ── Signaling channel ─────────────────────────────────────────────
  const initSignaling = useCallback((uid: string, ctrl: boolean, isLive: boolean) => {
    const sig = supabase.channel(`sig-${eventId}`)

    if (ctrl) {
      sig.on('broadcast', { event:'join' }, ({ payload }) => {
        const { viewerId } = payload
        if (!viewerId || viewerId === uid) return
        if (!live.current || !txRef.current) { sig.send({ type:'broadcast', event:'not-live', payload:{ to:viewerId } }); return }
        mkHostPeer(viewerId, txRef.current)
      })
      sig.on('broadcast', { event:'answer' }, async ({ payload }) => {
        if (payload.to !== uid && payload.to !== 'host') return
        const pc = hPeers.current.get(payload.from)
        if (pc && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            const q: RTCIceCandidateInit[] = (pc as any).__ice || []
            for (const c of q) { try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {} }
            delete (pc as any).__ice
          } catch (e) { console.warn('[HOST] setRemote error', e) }
        }
      })
      sig.on('broadcast', { event:'ice' }, async ({ payload }) => {
        if (payload.to !== 'host' && payload.to !== uid) return
        const pc = hPeers.current.get(payload.from); if (!pc) return
        if (pc.remoteDescription) { try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {} }
        else { if (!(pc as any).__ice) (pc as any).__ice = []; (pc as any).__ice.push(payload.candidate) }
      })
    } else {
      sig.on('broadcast', { event:'offer' }, async ({ payload }) => {
        if (payload.to !== uid) return
        const pc = mkViewerPeer(uid); setVStatus('connecting')
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          for (const c of pendIce.current) { try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {} }
          pendIce.current = []
          const ans = await pc.createAnswer(); await pc.setLocalDescription(ans)
          sig.send({ type:'broadcast', event:'answer', payload:{ to:payload.from, from:uid, sdp:pc.localDescription } })
        } catch (e) { console.error('[VIEWER] offer error:', e); setVStatus('failed') }
      })
      sig.on('broadcast', { event:'ice' }, async ({ payload }) => {
        if (payload.to !== uid) return
        const pc = vPc.current; if (!pc) return
        if (pc.remoteDescription) { try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {} }
        else pendIce.current.push(payload.candidate)
      })
      sig.on('broadcast', { event:'not-live' }, ({ payload }) => { if (payload.to === uid) setVStatus('idle') })
      sig.on('broadcast', { event:'stream-ended' }, () => { setVStatus('idle'); if (remoteVid.current) remoteVid.current.srcObject = null })
    }

    sig.subscribe(async s => {
      if (s === 'SUBSCRIBED' && !ctrl && isLive) {
        setVStatus('connecting')
        sig.send({ type:'broadcast', event:'join', payload:{ viewerId:uid } })
        retryT.current = setTimeout(() => {
          if (vPc.current?.connectionState !== 'connected') sig.send({ type:'broadcast', event:'join', payload:{ viewerId:uid } })
        }, 7000)
      }
    })
    sigCh.current = sig
  }, [mkHostPeer, mkViewerPeer, eventId])

  // ── Go Live ───────────────────────────────────────────────────────
  const goLive = async () => {
    setStreamErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:{ ideal:1280 }, height:{ ideal:720 }, frameRate:{ ideal:30 } },
        audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true },
      })
      camRef.current = stream; txRef.current = stream; live.current = true
      if (localVid.current) { localVid.current.srcObject = stream; localVid.current.muted = true; await localVid.current.play().catch(() => {}) }
      setStreaming(true); setMode('camera')
      await supabase.from('events').update({ status:'live' }).eq('id', eventId)
      const ps = chatCh.current?.presenceState() || {}
      Object.keys(ps).filter(v => v !== uRef.current?.id).forEach(vid => mkHostPeer(vid, stream))
      startRec(stream)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setStreamErr('Camera/mic denied. Allow permissions in browser.')
      else if (err.name === 'NotFoundError') setStreamErr('No camera/mic found.')
      else setStreamErr('Stream error: ' + err.message)
    }
  }

  const endStream = async () => {
    live.current = false
    sigCh.current?.send({ type:'broadcast', event:'stream-ended', payload:{} })
    await stopRec()
    killMedia()
    hPeers.current.forEach(pc => pc.close()); hPeers.current.clear()
    if (localVid.current) localVid.current.srcObject = null
    setStreaming(false)
    await supabase.from('events').update({ status:'ended', ended_at:new Date().toISOString() }).eq('id', eventId)
    router.push('/host')
  }

  const toggleMic = () => { camRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled }); setMicOn(p => !p) }
  const toggleCam = () => { camRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled }); setCamOn(p => !p) }

  const toCamera = () => {
    const s = camRef.current; if (!s) return
    scrRef.current?.getTracks().forEach(t => t.stop()); scrRef.current = null
    wbRef.current?.getTracks().forEach(t => t.stop());  wbRef.current  = null
    txRef.current = s
    if (localVid.current) localVid.current.srcObject = s
    const vt = s.getVideoTracks()[0]; if (vt) replaceVid(vt)
    const at = s.getAudioTracks()[0]; if (at) replaceAud(at)
    setMode('camera')
  }

  const startScreen = async () => {
    try {
      const ss = await (navigator.mediaDevices as any).getDisplayMedia({ video:{ cursor:'always' }, audio:true })
      scrRef.current = ss; wbRef.current?.getTracks().forEach(t => t.stop()); wbRef.current = null
      txRef.current = ss; setMode('screen')
      if (localVid.current) { localVid.current.srcObject = ss; await localVid.current.play().catch(() => {}) }
      const vt = ss.getVideoTracks()[0]; if (vt) { replaceVid(vt); vt.onended = stopScreen }
      const at = ss.getAudioTracks()[0]; if (at) replaceAud(at)
    } catch {}
  }
  const stopScreen = () => { scrRef.current?.getTracks().forEach(t => t.stop()); scrRef.current = null; toCamera() }

  const startWB = (bg: string) => {
    scrRef.current?.getTracks().forEach(t => t.stop()); scrRef.current = null
    wbRef.current?.getTracks().forEach(t => t.stop()); wbRef.current = null
    setBoardBg(bg); setMode('whiteboard')
    // Canvas renders after state update — wait 200ms then capture its stream
    setTimeout(() => {
      const canvas = wbCanvas.current
      if (!canvas) { setStreamErr('Canvas not ready. Try again.'); return }
      try {
        const ws = (canvas as any).captureStream(30) as MediaStream
        wbRef.current = ws; txRef.current = ws
        const vt = ws.getVideoTracks()[0]
        if (!vt) { setStreamErr('Canvas stream unavailable. Use Chrome/Edge.'); return }
        replaceVid(vt)
        if (localVid.current) { localVid.current.srcObject = ws; localVid.current.play().catch(() => {}) }
      } catch (e) { console.error('[WB]', e); setStreamErr('Whiteboard requires Chrome 72+ or Edge.') }
    }, 200)
  }

  const togglePip = async () => {
    const vid = isHost ? localVid.current : remoteVid.current; if (!vid) return
    try { document.pictureInPictureElement ? await document.exitPictureInPicture() : await (vid as any).requestPictureInPicture() } catch {}
  }
  const toggleFS = () => {
    if (!vidContainer.current) return
    if (!document.fullscreenElement) { vidContainer.current.requestFullscreen(); setFullscreen(true) }
    else { document.exitFullscreen(); setFullscreen(false) }
  }

  const startRec = (stream: MediaStream) => {
    recChunks.current = []
    const mime = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(t => MediaRecorder.isTypeSupported(t))
    try {
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      rec.ondataavailable = e => { if (e.data.size > 0) recChunks.current.push(e.data) }
      rec.start(5000); mediaRec.current = rec; setRecording(true); setRecTime(0)
      recTimer.current = setInterval(() => setRecTime(p => p+1), 1000)
    } catch {}
  }
  const stopRec = async () => {
    clearInterval(recTimer.current)
    const rec = mediaRec.current; if (!rec || rec.state === 'inactive') return
    setRecStatus('Saving...')
    await new Promise<void>(r => { rec.onstop = () => r(); rec.stop() })
    setRecording(false)
    if (!recChunks.current.length) { setRecStatus(''); return }
    const blob = new Blob(recChunks.current, { type: rec.mimeType || 'video/webm' })
    const path = `${eventId}/${Date.now()}.webm`
    setRecStatus('Uploading...')
    const { error } = await supabase.storage.from('event-recordings').upload(path, blob, { contentType: blob.type, upsert: true })
    if (!error) {
      const { data: ud } = await supabase.storage.from('event-recordings').createSignedUrl(path, 60*60*24*30)
      await supabase.from('event_recordings').insert({ event_id:eventId, host_id:uRef.current?.id, storage_path:path, public_url:ud?.signedUrl||'', size_bytes:blob.size, premium_only:true })
      setRecStatus('✓ Saved!'); setTimeout(() => setRecStatus(''), 3000)
    } else setRecStatus('Upload failed')
    recChunks.current = []
  }

  const parseMod = async (cmd: string) => {
    const [action, target, durStr] = cmd.trim().split(' ')
    const dur = parseInt(durStr) || 30, ct = target?.replace('@','')
    if (action === '/mute' && ct) {
      const { data: u } = await supabase.from('users').select('id').ilike('email', `${ct}%`).maybeSingle()
      if (u) {
        await supabase.from('live_muted_users').upsert({ event_id:eventId, user_id:u.id, muted_by:uRef.current?.id, muted_until:new Date(Date.now()+dur*60000).toISOString() })
        setMutedUsers(prev => new Set([...prev, u.id]))
        chatCh.current?.send({ type:'broadcast', event:'mod', payload:{ action:'mute', target:u.id, duration:dur } })
      }
    } else if (action === '/ban' && ct) {
      const { data: u } = await supabase.from('users').select('id').ilike('email', `${ct}%`).maybeSingle()
      if (u) {
        await supabase.from('live_muted_users').upsert({ event_id:eventId, user_id:u.id, muted_by:uRef.current?.id })
        setBannedUsers(prev => new Set([...prev, u.id]))
        chatCh.current?.send({ type:'broadcast', event:'mod', payload:{ action:'ban', target:u.id } })
      }
    } else if (action === '/slow') { setSlowMode(true); chatCh.current?.send({ type:'broadcast', event:'mod', payload:{ action:'slow', enabled:true } }) }
    else if (action === '/slowoff') { setSlowMode(false); chatCh.current?.send({ type:'broadcast', event:'mod', payload:{ action:'slow', enabled:false } }) }
    setModCmd('')
  }

  const sendMsg = async () => {
    if (!newMsg.trim() || sending) return
    const u = uRef.current, p = pRef.current
    if (slowMode && !(isHost || isCohost)) {
      const elapsed = (Date.now() - lastMsgTime) / 1000
      if (elapsed < 10) {
        const rem = Math.ceil(10 - elapsed); setSlowCD(rem)
        const t = setInterval(() => setSlowCD(prev => { if (prev <= 1) { clearInterval(t); return 0 } return prev-1 }), 1000)
        return
      }
    }
    if (autoMod(newMsg) && !(isHost || isCohost)) { alert('Message blocked by AutoMod.'); return }
    if (mutedUsers.has(u?.id || '')) { alert('You are muted.'); return }
    setSending(true)
    const msg = { id:crypto.randomUUID(), user_id:u?.id, name:getName(p||u), avatar:p?.photo_url||'', text:newMsg.trim().slice(0,500), ts:Date.now(), isHost:isHost||isCohost }
    setNewMsg(''); setLastMsgTime(Date.now())
    setMessages(prev => [...prev, msg])
    setTimeout(() => chatBottom.current?.scrollIntoView({ behavior:'smooth' }), 50)
    await supabase.from('live_messages').insert({ id:msg.id, event_id:eventId, user_id:u?.id, user_name:msg.name, user_avatar:msg.avatar, is_host:msg.isHost, content:msg.text })
    chatCh.current?.send({ type:'broadcast', event:'msg', payload:msg })
    setSending(false)
  }

  const handleLike = async () => {
    if (liked) return; setLiked(true); setReactions(p => p+1)
    await supabase.from('event_reactions').insert({ event_id:eventId, user_id:uRef.current?.id })
    chatCh.current?.send({ type:'broadcast', event:'react', payload:{} })
  }
  const toggleHand = () => {
    const raised = !myHand; setMyHand(raised)
    chatCh.current?.send({ type:'broadcast', event:'hand', payload:{ uid:uRef.current?.id, name:getName(pRef.current||uRef.current), raised } })
  }

  const canCtrl = isHost || isCohost

  // ── Loading / Access denied ───────────────────────────────────────
  if (loading) return (
    <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, flexDirection:'column', gap:12 }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <Loader2 style={{ width:36, height:36, color:C.blueL, animation:'spin 1s linear infinite' }}/>
      <p style={{ color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:14 }}>Joining room...</p>
    </div>
  )
  if (accessDenied) return (
    <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, padding:24 }}>
      <div style={{ borderRadius:24, padding:36, textAlign:'center', maxWidth:340, width:'100%', background:C.card, border:`1px solid ${C.border}` }}>
        <Shield style={{ width:44, height:44, color:C.red, marginBottom:16 }}/>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:8 }}>Ticket Required</h2>
        <p style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginBottom:24 }}>You need a ticket to attend this event.</p>
        <button onClick={() => router.push(`/events/${eventId}`)} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:C.gold, color:'#0A0F1E', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>Get Ticket →</button>
      </div>
    </div>
  )

  // ── VideoArea ─────────────────────────────────────────────────────
  const VideoArea = () => (
    <div ref={vidContainer} style={{ position:'relative', width:'100%', height:'100%', background:'#000', overflow:'hidden' }}>
      {canCtrl && <video ref={localVid} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0, opacity:streaming&&mode!=='whiteboard'?1:0, transition:'opacity 0.2s' }}/>}
      {!canCtrl && <video ref={remoteVid} autoPlay playsInline muted={muted} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0, visibility:vStatus==='connected'?'visible':'hidden' }}/>}
      {mode === 'whiteboard' && canCtrl && <div style={{ position:'absolute', inset:0, zIndex:3 }}><Whiteboard bg={boardBg} canvasRef={wbCanvas}/></div>}

      {((canCtrl&&!streaming)||(!canCtrl&&vStatus!=='connected'))&&mode!=='whiteboard' && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'linear-gradient(180deg,#000 0%,#0A0F1E 100%)', zIndex:2 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', border:`3px solid ${aBg(event?.users?.id||'')}44`, flexShrink:0 }}>
            {event?.users?.photo_url ? <img src={event.users.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ width:'100%', height:'100%', background:aBg(event?.users?.id||'')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, color:aBg(event?.users?.id||''), fontFamily:'Syne,sans-serif' }}>{getInit(event?.users)}</div>}
          </div>
          <div style={{ textAlign:'center', maxWidth:300, padding:'0 20px' }}>
            {canCtrl ? (
              <>
                <p style={{ color:'#fff', fontWeight:700, fontSize:16, fontFamily:'Syne,sans-serif', marginBottom:6 }}>{isHost?'You are the host':'You are co-host'}</p>
                <p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:24 }}>Click Go Live to start broadcasting</p>
                {streamErr && <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, background:C.redDim, border:`1px solid rgba(239,68,68,0.3)` }}><p style={{ fontSize:12, color:C.red, fontFamily:'DM Sans,sans-serif' }}>{streamErr}</p></div>}
                <button onClick={goLive} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 32px', borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.red},#DC2626)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 6px 24px rgba(239,68,68,0.4)' }}><Radio style={{ width:18, height:18 }}/>Go Live</button>
              </>
            ) : (
              <>
                <p style={{ color:'#fff', fontWeight:600, fontSize:15, fontFamily:'Syne,sans-serif', marginBottom:6 }}>{getName(event?.users)}</p>
                {vStatus === 'connecting' && <><p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:14 }}>Connecting to stream...</p><div style={{ width:28, height:28, border:`3px solid ${C.blue}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/>{retries>0&&<p style={{ color:C.textDim, fontSize:11, marginTop:10, fontFamily:'DM Sans,sans-serif' }}>Retry {retries}</p>}</>}
                {vStatus === 'idle'       && <p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif' }}>{event?.status==='live'?'Stream starting...':'Waiting for host to go live'}</p>}
                {vStatus === 'failed'     && <><p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:14 }}>Connection lost. Reconnecting...</p><div style={{ width:28, height:28, border:`3px solid ${C.red}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/></>}
              </>
            )}
          </div>
        </div>
      )}

      {canCtrl&&streaming&&!camOn&&mode==='camera' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.surface, zIndex:4 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:aBg(uRef.current?.id||'')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:aBg(uRef.current?.id||''), margin:'0 auto 8px', fontFamily:'Syne,sans-serif' }}>{getInit(pRef.current)}</div>
            <p style={{ color:C.textMuted, fontSize:12, fontFamily:'DM Sans,sans-serif' }}>Camera off</p>
          </div>
        </div>
      )}
      {mode==='screen'     && <div style={{ position:'absolute', top:12, left:12, zIndex:5, display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'rgba(37,99,235,0.25)', backdropFilter:'blur(8px)', border:`1px solid rgba(37,99,235,0.4)` }}><Monitor style={{ width:13, height:13, color:C.blueL }}/><span style={{ fontSize:11, fontWeight:700, color:C.blueL }}>Screen Sharing</span></div>}
      {mode==='whiteboard' && <div style={{ position:'absolute', top:12, left:12, zIndex:5, display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'rgba(124,58,237,0.25)', backdropFilter:'blur(8px)', border:`1px solid rgba(124,58,237,0.4)` }}><PenLine style={{ width:13, height:13, color:'#A78BFA' }}/><span style={{ fontSize:11, fontWeight:700, color:'#A78BFA' }}>Whiteboard Live</span></div>}
      <div style={{ position:'absolute', top:10, right:10, zIndex:10, display:'flex', gap:6 }}>
        <button onClick={toggleFS} style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{fullscreen?<Minimize style={{ width:14, height:14 }}/>:<Maximize style={{ width:14, height:14 }}/>}</button>
        <button onClick={togglePip} style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><Eye style={{ width:14, height:14 }}/></button>
      </div>
      {hands.length>0&&canCtrl && <div style={{ position:'absolute', bottom:12, left:12, zIndex:5, padding:'6px 12px', borderRadius:20, background:'rgba(245,158,11,0.2)', border:`1px solid rgba(245,158,11,0.4)`, backdropFilter:'blur(8px)' }}><span style={{ fontSize:12, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>✋ {hands.length} hand{hands.length>1?'s':''} raised</span></div>}
    </div>
  )

  const HostBar = () => (
    <div style={{ flexShrink:0, background:C.surface, borderTop:`1px solid ${C.border}`, padding:isMobile?'10px 12px':'12px 20px' }}>
      {streaming && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10, flexWrap:'wrap' }}>
          <button onClick={toCamera} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${mode==='camera'?'rgba(37,99,235,0.4)':'transparent'}`, background:mode==='camera'?C.blueDim:'rgba(51,65,85,0.4)', color:mode==='camera'?C.blueL:C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}><Video style={{ width:13, height:13 }}/>Camera</button>
          <button onClick={mode==='screen'?stopScreen:startScreen} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${mode==='screen'?'rgba(37,99,235,0.4)':'transparent'}`, background:mode==='screen'?C.blueDim:'rgba(51,65,85,0.4)', color:mode==='screen'?C.blueL:C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {mode==='screen'?<MonitorOff style={{ width:13, height:13 }}/>:<Monitor style={{ width:13, height:13 }}/>}{mode==='screen'?'Stop Share':'Screen'}
          </button>
          {[{ n:'White', v:'#F8FAFC' },{ n:'Dark', v:'#0A0A0F' },{ n:'Green', v:'#064E3B' }].map(b => (
            <button key={b.v} onClick={() => startWB(b.v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${mode==='whiteboard'&&boardBg===b.v?'rgba(124,58,237,0.4)':'transparent'}`, background:mode==='whiteboard'&&boardBg===b.v?'rgba(124,58,237,0.15)':'rgba(51,65,85,0.4)', color:mode==='whiteboard'&&boardBg===b.v?'#A78BFA':C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              <div style={{ width:10, height:10, borderRadius:2, background:b.v, border:'1px solid rgba(255,255,255,0.2)' }}/>{b.n}
            </button>
          ))}
          <button onClick={() => setShowMod(p => !p)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${showMod?'rgba(239,68,68,0.4)':'transparent'}`, background:showMod?C.redDim:'rgba(51,65,85,0.4)', color:showMod?C.red:C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}><Shield style={{ width:13, height:13 }}/>Mod</button>
        </div>
      )}
      {showMod&&streaming && (
        <div style={{ marginBottom:10, display:'flex', gap:8 }}>
          <input value={modCmd} onChange={e => setModCmd(e.target.value)} onKeyDown={e => e.key==='Enter'&&parseMod(modCmd)} placeholder="/mute @user 30 | /ban @user | /slow | /slowoff" style={{ flex:1, padding:'8px 12px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:12, fontFamily:'DM Sans,sans-serif', outline:'none' }}/>
          <button onClick={() => parseMod(modCmd)} style={{ padding:'8px 14px', borderRadius:10, border:'none', background:C.red, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>Run</button>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
        <button onClick={toggleMic} style={{ width:46, height:46, borderRadius:'50%', border:`1px solid ${micOn?C.border:C.red+'55'}`, background:micOn?C.card:C.redDim, color:micOn?C.text:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>{micOn?<Mic style={{ width:19, height:19 }}/>:<MicOff style={{ width:19, height:19 }}/>}</button>
        <button onClick={toggleCam} style={{ width:46, height:46, borderRadius:'50%', border:`1px solid ${camOn?C.border:C.red+'55'}`, background:camOn?C.card:C.redDim, color:camOn?C.text:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>{camOn?<Video style={{ width:19, height:19 }}/>:<VideoOff style={{ width:19, height:19 }}/>}</button>
        {streaming
          ? <button onClick={endStream} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:24, border:'none', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(239,68,68,0.35)' }}><PhoneOff style={{ width:17, height:17 }}/>End Stream</button>
          : <button onClick={goLive}    style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:24, border:'none', background:`linear-gradient(135deg,${C.red},#DC2626)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(239,68,68,0.35)' }}><Radio style={{ width:17, height:17 }}/>Go Live</button>
        }
        {recording && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.red, fontFamily:'DM Sans,sans-serif', fontWeight:700 }}><span style={{ width:8, height:8, borderRadius:'50%', background:C.red, display:'inline-block', animation:'pulse 1s infinite' }}/>{fmtRec(recTime)}</div>}
        {recStatus && <span style={{ fontSize:11, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>{recStatus}</span>}
      </div>
      {slowMode && <p style={{ textAlign:'center', fontSize:11, color:C.gold, marginTop:8, fontFamily:'DM Sans,sans-serif' }}>⏱ Slow mode ON</p>}
    </div>
  )

  const ViewerBar = () => (
    <div style={{ flexShrink:0, background:C.surface, borderTop:`1px solid ${C.border}`, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <button onClick={() => setMuted(m => !m)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${muted?C.red+'44':C.border}`, background:muted?C.redDim:C.card, color:muted?C.red:C.textMuted, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif' }}>{muted?<VolumeX style={{ width:14, height:14 }}/>:<Volume2 style={{ width:14, height:14 }}/>}{!isMobile&&(muted?'Unmute':'Mute')}</button>
      <button onClick={handleLike} disabled={liked} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${liked?C.red+'44':C.border}`, background:liked?C.redDim:C.card, color:liked?C.red:C.textMuted, cursor:liked?'default':'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif', opacity:liked?0.8:1 }}><Heart style={{ width:14, height:14, fill:liked?C.red:'none', stroke:liked?C.red:'currentColor' }}/>{reactions>0?reactions:(!isMobile?'Like':'')}</button>
      <button onClick={toggleHand} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${myHand?C.gold+'44':C.border}`, background:myHand?C.goldDim:C.card, color:myHand?C.gold:C.textMuted, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif' }}><Hand style={{ width:14, height:14 }}/>{!isMobile&&(myHand?'Lower Hand':'Raise Hand')}</button>
      <div style={{ flex:1 }}/>
      {isMobile && <button onClick={() => { setShowChat(true); setUnread(0) }} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${C.border}`, background:C.card, color:C.blueL, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif' }}><MessageCircle style={{ width:14, height:14 }}/>Chat{unread>0&&<span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:C.red, fontSize:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>{unread>9?'9+':unread}</span>}</button>}
      <button onClick={() => router.push('/dashboard')} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:20, border:'none', background:C.redDim, color:C.red, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif', fontWeight:600 }}><PhoneOff style={{ width:13, height:13 }}/>Leave</button>
    </div>
  )

  const ChatPanel = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg }}>
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.card, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'DM Sans,sans-serif' }}>Live Chat</span>
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:C.textMuted }}><Users style={{ width:11, height:11 }}/>{viewers}</div>
          {reactions>0 && <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:C.red }}><Heart style={{ width:11, height:11, fill:C.red }}/>{reactions}</div>}
        </div>
        {isMobile && <button onClick={() => setShowChat(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, padding:4 }}><ChevronDown style={{ width:18, height:18 }}/></button>}
      </div>
      {canCtrl&&hands.length>0 && (
        <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.border}`, background:'rgba(245,158,11,0.05)', flexShrink:0 }}>
          <p style={{ fontSize:11, color:C.gold, fontFamily:'DM Sans,sans-serif', fontWeight:600, marginBottom:4 }}>✋ Raised Hands ({hands.length})</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{hands.map(uid => <span key={uid} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:C.goldDim, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>{uid.slice(0,8)}</span>)}</div>
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length===0 && <div style={{ textAlign:'center', paddingTop:40 }}><p style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>Chat is live — say hello! 👋</p></div>}
        {messages.map(msg => (
          <div key={msg.id} style={{ display:'flex', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:msg.isHost?`linear-gradient(135deg,${C.gold},#F97316)`:`linear-gradient(135deg,${C.blue},${C.blueL})` }}>
              {msg.avatar?<img src={msg.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:msg.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                <span style={{ fontSize:11, fontWeight:700, color:msg.isHost?C.gold:C.blueL, fontFamily:'DM Sans,sans-serif' }}>{msg.name}</span>
                {msg.isHost && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:3, background:C.goldDim, color:C.gold, fontWeight:700 }}>HOST</span>}
                <span style={{ fontSize:10, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>{fmtTs(msg.ts)}</span>
                {canCtrl && <button onClick={() => setMutedUsers(prev => new Set([...prev, msg.user_id]))} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:C.textDim, fontSize:9, padding:'1px 4px', borderRadius:3 }}>🔇</button>}
              </div>
              <p style={{ fontSize:13, color:'#D4DBEE', fontFamily:'DM Sans,sans-serif', lineHeight:1.5, wordBreak:'break-word' }}>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatBottom}/>
      </div>
      <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        {slowCD>0 && <p style={{ fontSize:11, color:C.gold, marginBottom:6, textAlign:'center', fontFamily:'DM Sans,sans-serif' }}>⏱ {slowCD}s until next message</p>}
        <div style={{ display:'flex', gap:8 }}>
          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key==='Enter'&&!e.shiftKey&&sendMsg()}
            placeholder={mutedUsers.has(uRef.current?.id||'')?'You are muted':'Say something...'} maxLength={500}
            disabled={mutedUsers.has(uRef.current?.id||'')||slowCD>0}
            style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none' }}
            onFocus={e => (e.target.style.borderColor='rgba(37,99,235,0.5)')} onBlur={e => (e.target.style.borderColor=C.border)}/>
          <button onClick={sendMsg} disabled={!newMsg.trim()||sending||slowCD>0}
            style={{ width:42, height:42, borderRadius:12, border:'none', cursor:'pointer', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', opacity:(!newMsg.trim()||sending||slowCD>0)?0.4:1 }}>
            {sending?<Loader2 style={{ width:16, height:16, animation:'spin .8s linear infinite' }}/>:<Send style={{ width:16, height:16 }}/>}
          </button>
        </div>
      </div>
    </div>
  )

  const TopBar = () => (
    <div style={{ padding:'10px 16px', background:C.card, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
        {event?.status==='live' && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:C.redDim, color:C.red, flexShrink:0 }}><span style={{ width:5, height:5, borderRadius:'50%', background:C.red, animation:'pulse 1.2s infinite' }}/>LIVE</span>}
        <h1 style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:'DM Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event?.title}</h1>
        {canCtrl && <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:C.goldDim, color:C.gold, flexShrink:0 }}><Crown style={{ width:9, height:9 }}/>{isHost?'Host':'Co-host'}</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        {isHost&&earnings>0 && <span style={{ fontSize:13, fontWeight:700, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>${(earnings/100).toFixed(2)}</span>}
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:C.textMuted }}><Users style={{ width:12, height:12 }}/>{viewers}</div>
        {!isMobile&&!showChat && <button onClick={() => { setShowChat(true); setUnread(0) }} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.blueL, cursor:'pointer', fontSize:12 }}><MessageCircle style={{ width:12, height:12 }}/>Chat{unread>0&&` (${unread})`}</button>}
      </div>
    </div>
  )

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', overflow:'hidden', background:C.bg }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box;}`}</style>
      <TopBar/>
      {isMobile && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
          <div style={{ flex:1, position:'relative', overflow:'hidden' }}><VideoArea/></div>
          {canCtrl?<HostBar/>:<ViewerBar/>}
          {showChat && <div style={{ position:'absolute', inset:0, zIndex:30 }}><ChatPanel/></div>}
          {!showChat&&!canCtrl && <button onClick={() => { setShowChat(true); setUnread(0) }} style={{ position:'absolute', bottom:72, right:16, zIndex:20, width:48, height:48, borderRadius:'50%', background:C.blue, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.45)' }}><MessageCircle style={{ width:20, height:20, color:'#fff' }}/>{unread>0&&<span style={{ position:'absolute', top:-2, right:-2, width:18, height:18, borderRadius:'50%', background:C.red, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>{unread>9?'9+':unread}</span>}</button>}
        </div>
      )}
      {isTablet && (
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ flex:'0 0 58%', display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, position:'relative', overflow:'hidden' }}><VideoArea/></div>
            {canCtrl?<HostBar/>:<ViewerBar/>}
          </div>
          <div style={{ flex:'0 0 42%', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}><ChatPanel/></div>
        </div>
      )}
      {!isMobile&&!isTablet && (
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ flex:showChat?'0 0 70%':'1', display:'flex', flexDirection:'column', transition:'flex .25s ease' }}>
            <div style={{ flex:1, position:'relative', overflow:'hidden' }}><VideoArea/></div>
            {canCtrl?<HostBar/>:<ViewerBar/>}
          </div>
          {showChat && <div style={{ flex:'0 0 30%', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}><ChatPanel/></div>}
        </div>
      )}
    </div>
  )
}
