'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  MessageSquare, Folder, Video,
  Send, Upload, Download, Trash2, Users, Crown,
  Mic, MicOff, VideoOff, PhoneOff, Monitor, MonitorOff,
  Loader2, Lock, Globe, ChevronLeft, Shield, Zap,
  Phone, PhoneCall, X, PhoneMissed
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827', cardHover:'#141E35',
  border:'rgba(255,255,255,0.06)', borderFocus:'rgba(37,99,235,0.5)',
  text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
  purple:'#7C3AED', purpleDim:'rgba(124,58,237,0.1)',
}

const ICE: RTCIceServer[] = [
  { urls:'stun:stun.l.google.com:19302' },
  { urls:'stun:stun1.l.google.com:19302' },
  { urls:'turn:openrelay.metered.ca:80',  username:'openrelayproject', credential:'openrelayproject' },
  { urls:'turn:openrelay.metered.ca:443', username:'openrelayproject', credential:'openrelayproject' },
  { urls:'turns:openrelay.metered.ca:443?transport=tcp', username:'openrelayproject', credential:'openrelayproject' },
]

type Tab = 'chat' | 'files' | 'call'

const getName     = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const getInitials = (u: any) => getName(u).slice(0, 2).toUpperCase()
const AC = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const ac  = (id: string) => AC[(id?.charCodeAt(0)||0) % AC.length]
const fmtBytes = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`
const ago = (ts: string) => { const m=Math.floor((Date.now()-new Date(ts).getTime())/60000); return m<1?'now':m<60?`${m}m ago`:`${Math.floor(m/60)}h ago` }

function Av({ user, size=36 }: { user:any; size?:number }) {
  const color = ac(user?.id||'')
  return (
    <div style={{ width:size, height:size, minWidth:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*.33, background:color+'22', color, border:`1.5px solid ${color}25` }}>
      {user?.photo_url ? <img src={user.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : getInitials(user)}
    </div>
  )
}

// ─── REMOTE TILE ────────────────────────────────────────────────────────────
function RemoteTile({ stream, name, uid }: { stream: MediaStream; name: string; uid: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current && stream) { ref.current.srcObject = stream; ref.current.play().catch(()=>{}) }
  }, [stream])
  return (
    <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#000', aspectRatio:'16/9' }}>
      <video ref={ref} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
      <div style={{ position:'absolute', bottom:6, left:8, fontSize:11, fontWeight:700, color:'#fff', background:'rgba(0,0,0,0.6)', padding:'2px 8px', borderRadius:6 }}>{name}</div>
    </div>
  )
}

// ─── CHAT TAB ────────────────────────────────────────────────────────────────
function ChatTab({ groupId, currentUser }: { groupId:string; currentUser:any }) {
  const [messages, setMessages] = useState<any[]>([])
  const [text,  setText]  = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    const ch = supabase.channel(`grp-chat-${groupId}`)
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'group_messages', filter:`group_id=eq.${groupId}` }, ()=>loadMessages())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [groupId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase.from('group_messages')
      .select('*, users(id,email,full_name,photo_url)').eq('group_id',groupId)
      .order('created_at',{ ascending:true }).limit(100)
    if (data) setMessages(data)
  }

  const send = async () => {
    if (!text.trim()||sending||!currentUser) return
    setSending(true)
    await supabase.from('group_messages').insert({ group_id:groupId, user_id:currentUser.id, text:text.trim().slice(0,2000), user_name:currentUser.full_name||currentUser.email?.split('@')[0]||'User', user_avatar:currentUser.photo_url||'' })
    setText(''); setSending(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        {messages.length===0 && <div style={{ textAlign:'center', paddingTop:48, color:C.textDim, fontSize:13 }}>No messages yet — say hello!</div>}
        {messages.map(m => {
          const isMe = m.user_id===currentUser?.id
          const u = m.users||{ full_name:m.user_name, photo_url:m.user_avatar }
          return (
            <div key={m.id} style={{ display:'flex', gap:10, flexDirection:isMe?'row-reverse':'row' }}>
              <Av user={u} size={28}/>
              <div style={{ display:'flex', flexDirection:'column', gap:3, maxWidth:'72%', alignItems:isMe?'flex-end':'flex-start' }}>
                <span style={{ fontSize:11, fontWeight:600, color:C.textMuted }}>{isMe?'You':getName(u)}</span>
                <div style={{ padding:'8px 12px', borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px', background:isMe?C.blue:C.card, color:isMe?'#fff':C.text, fontSize:13, lineHeight:1.5 }}>{m.text}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:'flex', gap:8, padding:12, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Message..." maxLength={2000}
          style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:13, outline:'none', fontFamily:'DM Sans,sans-serif' }}
          onFocus={e=>(e.target.style.borderColor=C.borderFocus)} onBlur={e=>(e.target.style.borderColor=C.border)}/>
        <button onClick={send} disabled={!text.trim()||sending} style={{ width:42, height:42, borderRadius:12, border:'none', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, opacity:!text.trim()||sending?0.4:1 }}>
          {sending?<Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }}/>:<Send style={{ width:16, height:16 }}/>}
        </button>
      </div>
    </div>
  )
}

// ─── FILES TAB ───────────────────────────────────────────────────────────────
function FilesTab({ groupId, currentUser }: { groupId:string; currentUser:any }) {
  const [files,     setFiles]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [dragging,  setDragging]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadFiles() }, [groupId])

  const loadFiles = async () => {
    const { data } = await supabase.from('group_files').select('*, users(id,email,full_name,photo_url)').eq('group_id',groupId).order('uploaded_at',{ ascending:false })
    if (data) setFiles(data); setLoading(false)
  }

  const handleFiles = async (fl: FileList|null) => {
    if (!fl||!currentUser) return
    const file=fl[0]; if (!file) return
    if (file.size>50*1024*1024) { alert('Max 50MB'); return }
    setUploading(true); setProgress(10)
    const path=`${groupId}/${currentUser.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('group-files').upload(path, file, { contentType:file.type })
    setProgress(80)
    if (!error) {
      const { data:ud } = supabase.storage.from('group-files').getPublicUrl(path)
      await supabase.from('group_files').insert({ group_id:groupId, user_id:currentUser.id, file_name:file.name, file_url:ud.publicUrl, file_size:file.size, file_type:file.type })
      setProgress(100); await loadFiles()
    }
    setUploading(false); setProgress(0)
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('group_files').delete().eq('id',id); await loadFiles() }
  const icon = (t: string) => t?.startsWith('image/')?'🖼':t?.includes('pdf')?'📄':t?.includes('video')?'🎬':t?.includes('audio')?'🎵':'📁'

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:16, height:'100%' }}>
      <div style={{ borderRadius:12, padding:'24px 16px', textAlign:'center', border:`2px dashed ${dragging?C.blueLight:C.border}`, background:dragging?C.blueDim:C.surface, cursor:'pointer' }}
        onDragOver={e=>{ e.preventDefault(); setDragging(true) }} onDragLeave={()=>setDragging(false)}
        onDrop={e=>{ e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={()=>inputRef.current?.click()}>
        <Upload style={{ width:24, height:24, color:dragging?C.blueLight:C.textDim, margin:'0 auto 8px' }}/>
        <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Drop files or <span style={{ color:C.blueLight }}>browse</span> · Max 50MB</p>
        <input ref={inputRef} type="file" style={{ display:'none' }} onChange={e=>handleFiles(e.target.files)}/>
      </div>
      {uploading && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.textMuted, marginBottom:4 }}><span>Uploading...</span><span>{progress}%</span></div>
          <div style={{ height:4, borderRadius:4, background:C.border }}><div style={{ height:'100%', borderRadius:4, background:C.blue, width:`${progress}%`, transition:'width .2s' }}/></div>
        </div>
      )}
      {loading ? [...Array(3)].map((_,i)=><div key={i} style={{ height:56, borderRadius:12, background:C.card, opacity:.5 }}/>) :
       files.length===0 ? <div style={{ textAlign:'center', paddingTop:32, color:C.textDim, fontSize:13 }}>No files yet</div> :
       files.map(f => (
        <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
          <span style={{ fontSize:24 }}>{icon(f.file_type)}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.file_name}</p>
            <p style={{ fontSize:11, color:C.textDim }}>{fmtBytes(f.file_size||0)} · {getName(f.users)} · {ago(f.uploaded_at)}</p>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <a href={f.file_url} target="_blank" rel="noopener noreferrer" download>
              <button style={{ width:32, height:32, borderRadius:8, border:'none', background:C.blueDim, color:C.blueLight, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Download style={{ width:14, height:14 }}/></button>
            </a>
            {f.user_id===currentUser?.id && <button onClick={()=>del(f.id)} style={{ width:32, height:32, borderRadius:8, border:'none', background:C.redDim, color:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Trash2 style={{ width:14, height:14 }}/></button>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── CALL TAB — full WebRTC mesh, everyone sees & hears everyone ─────────────
function CallTab({ groupId, currentUser, myRole }: { groupId:string; currentUser:any; myRole:string }) {
  const isCtrl = myRole==='owner'||myRole==='admin'

  const [callActive,  setCallActive]  = useState(false)
  const [callId,      setCallId]      = useState<string|null>(null)
  const [inCall,      setInCall]      = useState(false)
  const [micOn,       setMicOn]       = useState(true)
  const [camOn,       setCamOn]       = useState(true)
  const [screenOn,    setScreenOn]    = useState(false)
  const [joining,     setJoining]     = useState(false)

  type PeerEntry = { pc:RTCPeerConnection; stream:MediaStream; name:string }
  const [peers, setPeers] = useState<Map<string,PeerEntry>>(new Map())
  const peersRef   = useRef<Map<string,PeerEntry>>(new Map())
  const localVid   = useRef<HTMLVideoElement>(null)
  const localStr   = useRef<MediaStream|null>(null)
  const screenStr  = useRef<MediaStream|null>(null)
  const sigCh      = useRef<any>(null)
  const presCh     = useRef<any>(null)
  const myUid      = currentUser?.id || ''
  const myName     = getName(currentUser)

  // ── Listen for call start/end ───────────────────────────────────────────
  useEffect(() => {
    // Check if call already active
    supabase.from('group_calls').select('id').eq('group_id',groupId).eq('status','active').maybeSingle()
      .then(({ data }) => { if (data) { setCallActive(true); setCallId(data.id) } })

    const ch = supabase.channel(`call-notify-${groupId}`)
      .on('broadcast',{ event:'call-started' },({ payload })=>{ setCallActive(true); setCallId(payload.callId) })
      .on('broadcast',{ event:'call-ended' },()=>{ setCallActive(false); setCallId(null); doLeave(true) })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  // ── Signaling ────────────────────────────────────────────────────────────
  useEffect(() => {
    const sig = supabase.channel(`call-sig-${groupId}`)
      .on('broadcast',{ event:'offer' },async({ payload })=>{
        if (payload.to!==myUid) return
        const pc = makePeer(payload.from, payload.name)
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          const ans = await pc.createAnswer(); await pc.setLocalDescription(ans)
          sig.send({ type:'broadcast', event:'answer', payload:{ to:payload.from, from:myUid, sdp:pc.localDescription, name:myName } })
        } catch(e) { console.error('[CALL] answer',e) }
      })
      .on('broadcast',{ event:'answer' },async({ payload })=>{
        if (payload.to!==myUid) return
        const e=peersRef.current.get(payload.from); if (!e) return
        if (e.pc.signalingState==='have-local-offer') try { await e.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)) } catch{}
      })
      .on('broadcast',{ event:'ice' },async({ payload })=>{
        if (payload.to!==myUid) return
        const e=peersRef.current.get(payload.from); if (!e) return
        try { await e.pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch{}
      })
      .on('broadcast',{ event:'peer-left' },({ payload })=>{ dropPeer(payload.uid) })
      .subscribe()
    sigCh.current = sig
    return () => { supabase.removeChannel(sig) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, myUid])

  const makePeer = (uid: string, name: string) => {
    peersRef.current.get(uid)?.pc.close()
    const pc = new RTCPeerConnection({ iceServers:ICE })
    const ms = new MediaStream()
    const entry: PeerEntry = { pc, stream:ms, name }
    peersRef.current.set(uid, entry)
    setPeers(new Map(peersRef.current))

    // Add local tracks to this peer
    localStr.current?.getTracks().forEach(t=>pc.addTrack(t, localStr.current!))

    pc.ontrack = e => {
      e.streams[0]?.getTracks().forEach(t=>{ if(!ms.getTrackById(t.id)) ms.addTrack(t) })
      peersRef.current.set(uid, { ...entry, stream:ms })
      setPeers(new Map(peersRef.current))
    }
    pc.onicecandidate = ({ candidate }) => {
      if (candidate&&sigCh.current) sigCh.current.send({ type:'broadcast', event:'ice', payload:{ to:uid, from:myUid, candidate:candidate.toJSON() } })
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState==='failed'||pc.connectionState==='closed') dropPeer(uid)
    }
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState==='failed') pc.restartIce() }
    return pc
  }

  const dropPeer = (uid: string) => {
    peersRef.current.get(uid)?.pc.close(); peersRef.current.delete(uid)
    setPeers(new Map(peersRef.current))
  }

  const doJoin = async () => {
    setJoining(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:{ ideal:1280 }, height:{ ideal:720 } }, audio:{ echoCancellation:true, noiseSuppression:true } })
      localStr.current = stream
      if (localVid.current) { localVid.current.srcObject=stream; localVid.current.play().catch(()=>{}) }

      const pch = supabase.channel(`call-pres-${groupId}`, { config:{ presence:{ key:myUid } } })
        .on('presence',{ event:'join' },async({ newPresences })=>{
          for (const p of newPresences as any[]) {
            if (p.uid===myUid) continue
            const pc = makePeer(p.uid, p.name)
            const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
            sigCh.current?.send({ type:'broadcast', event:'offer', payload:{ to:p.uid, from:myUid, sdp:pc.localDescription, name:myName } })
          }
        })
        .on('presence',{ event:'leave' },({ leftPresences })=>{ for (const p of leftPresences as any[]) dropPeer(p.uid) })
        .subscribe(async s=>{ if (s==='SUBSCRIBED') await pch.track({ uid:myUid, name:myName }) })
      presCh.current = pch
      setInCall(true)
    } catch(err: any) {
      if (err.name==='NotAllowedError') alert('Camera/mic access denied. Please allow in browser settings.')
      else alert('Could not access camera or microphone: '+err.message)
    }
    setJoining(false)
  }

  const doLeave = async (forced=false) => {
    localStr.current?.getTracks().forEach(t=>t.stop()); screenStr.current?.getTracks().forEach(t=>t.stop())
    localStr.current=null; screenStr.current=null
    if (localVid.current) localVid.current.srcObject=null
    await presCh.current?.untrack()
    if (presCh.current) supabase.removeChannel(presCh.current); presCh.current=null
    peersRef.current.forEach(({pc})=>pc.close()); peersRef.current.clear(); setPeers(new Map())
    if (!forced) sigCh.current?.send({ type:'broadcast', event:'peer-left', payload:{ uid:myUid } })
    setInCall(false); setMicOn(true); setCamOn(true); setScreenOn(false)
  }

  const startCall = async () => {
    setJoining(true)
    const { data } = await supabase.from('group_calls').insert({ group_id:groupId, started_by:myUid, status:'active' }).select('id').single()
    const cid = data?.id
    setCallId(cid); setCallActive(true)
    // Notify everyone via realtime
    supabase.channel(`call-notify-${groupId}`).send({ type:'broadcast', event:'call-started', payload:{ callId:cid } })
    setJoining(false)
    await doJoin()
  }

  const endCall = async () => {
    await doLeave()
    if (callId) await supabase.from('group_calls').update({ status:'ended', ended_at:new Date().toISOString() }).eq('id',callId)
    supabase.channel(`call-notify-${groupId}`).send({ type:'broadcast', event:'call-ended', payload:{} })
    setCallActive(false); setCallId(null)
  }

  const toggleMic = () => { localStr.current?.getAudioTracks().forEach(t=>{ t.enabled=!t.enabled }); setMicOn(p=>!p) }
  const toggleCam = () => { localStr.current?.getVideoTracks().forEach(t=>{ t.enabled=!t.enabled }); setCamOn(p=>!p) }

  const toggleScreen = async () => {
    if (screenOn) {
      screenStr.current?.getTracks().forEach(t=>t.stop()); screenStr.current=null
      if (localVid.current&&localStr.current) localVid.current.srcObject=localStr.current
      peersRef.current.forEach(({pc})=>{ const camT=localStr.current?.getVideoTracks()[0]; const s=pc.getSenders().find(s=>s.track?.kind==='video'); if(s&&camT) s.replaceTrack(camT).catch(()=>{}) })
      setScreenOn(false)
    } else {
      try {
        const ss = await (navigator.mediaDevices as any).getDisplayMedia({ video:true, audio:false })
        screenStr.current=ss
        if (localVid.current) localVid.current.srcObject=ss
        const vt=ss.getVideoTracks()[0]
        peersRef.current.forEach(({pc})=>{ const s=pc.getSenders().find(s=>s.track?.kind==='video'); if(s) s.replaceTrack(vt).catch(()=>{}) })
        vt.onended=()=>toggleScreen()
        setScreenOn(true)
      } catch {}
    }
  }

  const peerList = Array.from(peers.entries())
  const totalInCall = inCall ? peerList.length+1 : peerList.length
  const cols = peerList.length===0?1:peerList.length===1?2:peerList.length<=3?2:3

  // ── No active call ──────────────────────────────────────────────────────
  if (!callActive && !inCall) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:32, height:'100%' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:C.blueDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <PhoneCall style={{ width:28, height:28, color:C.blueLight }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:6 }}>No active call</p>
        <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
          {isCtrl?'Start a call — all members will be notified':'Waiting for owner or admin to start a call'}
        </p>
      </div>
      {isCtrl && (
        <button onClick={startCall} disabled={joining}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:24, border:'none', background:`linear-gradient(135deg,${C.green},#059669)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', opacity:joining?0.6:1 }}>
          {joining?<Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }}/>:<PhoneCall style={{ width:16, height:16 }}/>}
          {joining?'Starting...':'Start Group Call'}
        </button>
      )}
    </div>
  )

  // ── Call active, not yet joined ──────────────────────────────────────────
  if (callActive && !inCall) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:32, height:'100%' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:C.greenDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Phone style={{ width:28, height:28, color:C.green }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:6 }}>Group call in progress</p>
        <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>Join to see and hear everyone in the group</p>
      </div>
      <div style={{ display:'flex', gap:12 }}>
        <button onClick={doJoin} disabled={joining}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:24, border:'none', background:C.green, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', opacity:joining?0.6:1 }}>
          {joining?<Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }}/>:<Phone style={{ width:16, height:16 }}/>}
          {joining?'Joining...':'Join Call'}
        </button>
        {isCtrl && (
          <button onClick={endCall} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderRadius:24, border:`1px solid ${C.red}55`, background:C.redDim, color:C.red, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            <PhoneMissed style={{ width:16, height:16 }}/>End Call
          </button>
        )}
      </div>
    </div>
  )

  // ── In call — video grid ─────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ flex:1, background:'#000', overflow:'auto', padding:8, display:'grid', gap:8, gridTemplateColumns:`repeat(${cols},1fr)`, alignContent:'start' }}>
        {/* My tile */}
        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:C.surface, aspectRatio:'16/9' }}>
          <video ref={localVid} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          {!camOn&&!screenOn && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.surface }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:ac(myUid)+'22', color:ac(myUid), display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, margin:'0 auto 4px' }}>{getInitials(currentUser)}</div>
                <p style={{ fontSize:10, color:C.textMuted }}>Camera off</p>
              </div>
            </div>
          )}
          <div style={{ position:'absolute', bottom:6, left:8, fontSize:11, fontWeight:700, color:'#fff', background:'rgba(0,0,0,0.6)', padding:'2px 8px', borderRadius:6 }}>
            You{!micOn?' 🔇':''}
          </div>
          {screenOn && (
            <div style={{ position:'absolute', top:6, right:8, fontSize:10, fontWeight:700, color:C.blueLight, background:'rgba(37,99,235,0.2)', padding:'2px 8px', borderRadius:6, border:'1px solid rgba(37,99,235,0.4)' }}>Sharing screen</div>
          )}
        </div>
        {/* Remote tiles */}
        {peerList.map(([uid, { stream, name }])=>(
          <RemoteTile key={uid} uid={uid} stream={stream} name={name}/>
        ))}
      </div>

      {/* Controls */}
      <div style={{ flexShrink:0, background:C.surface, borderTop:`1px solid ${C.border}`, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
        <button onClick={toggleMic} title={micOn?'Mute':'Unmute'}
          style={{ width:44, height:44, borderRadius:'50%', border:`1px solid ${micOn?C.border:C.red+'55'}`, background:micOn?C.card:C.redDim, color:micOn?C.text:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {micOn?<Mic style={{ width:18, height:18 }}/>:<MicOff style={{ width:18, height:18 }}/>}
        </button>
        <button onClick={toggleCam} title={camOn?'Camera off':'Camera on'}
          style={{ width:44, height:44, borderRadius:'50%', border:`1px solid ${camOn?C.border:C.red+'55'}`, background:camOn?C.card:C.redDim, color:camOn?C.text:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {camOn?<Video style={{ width:18, height:18 }}/>:<VideoOff style={{ width:18, height:18 }}/>}
        </button>
        <button onClick={toggleScreen} title={screenOn?'Stop sharing':'Share screen'}
          style={{ width:44, height:44, borderRadius:'50%', border:`1px solid ${screenOn?'rgba(37,99,235,0.4)':C.border}`, background:screenOn?C.blueDim:C.card, color:screenOn?C.blueLight:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {screenOn?<MonitorOff style={{ width:18, height:18 }}/>:<Monitor style={{ width:18, height:18 }}/>}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif', margin:'0 4px' }}>
          <Users style={{ width:13, height:13 }}/>{totalInCall}
        </div>
        <button onClick={()=>doLeave()}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:24, border:'none', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <PhoneOff style={{ width:15, height:15 }}/>Leave
        </button>
        {isCtrl && (
          <button onClick={endCall}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:24, border:`1px solid ${C.red}55`, background:C.redDim, color:C.red, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            <X style={{ width:15, height:15 }}/>End for All
          </button>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function GroupRoomPage() {
  const { id } = useParams()
  const router  = useRouter()
  const groupId = id as string

  const [group,       setGroup]       = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [members,     setMembers]     = useState<any[]>([])
  const [myRole,      setMyRole]      = useState('member')
  const [activeTab,   setActiveTab]   = useState<Tab>('chat')
  const [loading,     setLoading]     = useState(true)
  const [access,      setAccess]      = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [promoting,   setPromoting]   = useState<string|null>(null)

  const isCtrl = myRole==='owner'||myRole==='admin'

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data:{ user:u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setCurrentUser(u)
      const { data:g } = await supabase.from('groups').select('*').eq('id',groupId).single()
      if (!g) { router.push('/groups'); return }
      setGroup(g)
      const { data:mem } = await supabase.from('group_members').select('role').eq('group_id',groupId).eq('user_id',u.id).maybeSingle()
      if (!mem) { router.push('/groups'); return }
      setMyRole(mem.role); setAccess(true)
      await loadMembers()
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const loadMembers = async () => {
    const { data } = await supabase.from('group_members').select('*, users(id,email,full_name,photo_url,role)').eq('group_id',groupId)
    setMembers(data||[])
  }

  const promote = async (memberId: string, userId: string, newRole: 'admin'|'member') => {
    setPromoting(userId)
    await supabase.from('group_members').update({ role:newRole }).eq('id',memberId)
    await loadMembers(); setPromoting(null)
  }

  const TABS: { id:Tab; label:string; icon:any }[] = [
    { id:'chat',  label:'Chat',  icon:MessageSquare },
    { id:'files', label:'Files', icon:Folder },
    { id:'call',  label:'Call',  icon:Video },
  ]

  if (loading) return (
    <DashboardLayout>
      <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
        <Loader2 style={{ width:32, height:32, color:C.blueLight, animation:'spin 1s linear infinite' }}/>
      </div>
    </DashboardLayout>
  )
  if (!access) return null

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={()=>router.push('/groups')} style={{ width:32, height:32, borderRadius:8, border:'none', background:C.card, color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <ChevronLeft style={{ width:16, height:16 }}/>
          </button>
          <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.blueDim }}>
            {group?.banner_url?<img src={group.banner_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<Zap style={{ width:18, height:18, color:C.blueLight }}/>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <h1 style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{group?.name}</h1>
              {group?.is_private?<Lock style={{ width:11, height:11, color:C.gold, flexShrink:0 }}/>:<Globe style={{ width:11, height:11, color:C.textDim, flexShrink:0 }}/>}
              {myRole==='owner'&&<span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:C.goldDim, color:C.gold }}><Crown style={{ width:9, height:9 }}/>Owner</span>}
              {myRole==='admin'&&<span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:C.purpleDim, color:C.purple }}><Shield style={{ width:9, height:9 }}/>Admin</span>}
            </div>
            <p style={{ fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>{members.length} member{members.length!==1?'s':''} · {group?.category}</p>
          </div>
          <button onClick={()=>setShowMembers(p=>!p)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'none', background:showMembers?C.blueDim:C.card, color:showMembers?C.blueLight:C.textMuted, cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0 }}>
            <Users style={{ width:13, height:13 }}/>{members.length}
          </button>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

            {/* Tab bar */}
            <div style={{ display:'flex', alignItems:'center', gap:3, padding:'8px 10px', background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, border:'none', background:activeTab===t.id?C.blue:'transparent', color:activeTab===t.id?'#fff':C.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
                  <t.icon style={{ width:13, height:13 }}/>{t.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div style={{ flex:1, overflow:'hidden' }}>
              {activeTab==='chat'  && <ChatTab  groupId={groupId} currentUser={currentUser}/>}
              {activeTab==='files' && <FilesTab groupId={groupId} currentUser={currentUser}/>}
              {activeTab==='call'  && <CallTab  groupId={groupId} currentUser={currentUser} myRole={myRole}/>}
            </div>
          </div>

          {/* Members panel */}
          {showMembers && (
            <div style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', background:C.surface, borderLeft:`1px solid ${C.border}` }}>
              <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'DM Sans,sans-serif' }}>Members ({members.length})</p>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:3 }}>
                {members.map(m => {
                  const isMe = m.user_id===currentUser?.id
                  const canPromote = myRole==='owner' && !isMe && m.role!=='owner'
                  return (
                    <div key={m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'default' }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=C.card }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background='transparent' }}>
                      <Av user={m.users} size={26}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{getName(m.users)}{isMe?' (you)':''}</p>
                        <p style={{ fontSize:10, color:C.textDim }}>{m.role}</p>
                      </div>
                      {m.role==='owner'&&<Crown style={{ width:12, height:12, color:C.gold, flexShrink:0 }}/>}
                      {m.role==='admin'&&<Shield style={{ width:12, height:12, color:C.purple, flexShrink:0 }}/>}
                      {canPromote&&(
                        <button onClick={()=>promote(m.id, m.user_id, m.role==='admin'?'member':'admin')} disabled={promoting===m.user_id}
                          title={m.role==='admin'?'Remove admin':'Make admin'}
                          style={{ width:22, height:22, borderRadius:5, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:m.role==='admin'?C.redDim:C.purpleDim, color:m.role==='admin'?C.red:C.purple, flexShrink:0 }}>
                          {promoting===m.user_id?<Loader2 style={{ width:9, height:9, animation:'spin 1s linear infinite' }}/>:m.role==='admin'?<X style={{ width:9, height:9 }}/>:<Shield style={{ width:9, height:9 }}/>}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
