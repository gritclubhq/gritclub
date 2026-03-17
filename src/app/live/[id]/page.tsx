'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, Users, Radio,
  Shield, Volume2, VolumeX, Monitor, MonitorOff, PenLine, Eraser,
  Minus, Square, Circle, Trash2, Heart, Loader2, Crown,
  MessageCircle, ChevronDown, Hand, Ban, Clock, AlertTriangle,
  Maximize, Minimize, Settings, MoreVertical, X, Check, Eye
} from 'lucide-react'

const C = {
  bg:'#0A0F1E',surface:'#0D1428',card:'#111827',
  border:'rgba(255,255,255,0.07)',text:'#F0F4FF',
  textMuted:'#7B8DB0',textDim:'#3D4F6E',
  blue:'#2563EB',blueL:'#3B82F6',blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B',goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444',redDim:'rgba(239,68,68,0.12)',
  green:'#10B981',greenDim:'rgba(16,185,129,0.1)',
  purple:'#7C3AED',
}

// Bad words filter (basic)
const BAD_WORDS = ['spam','scam','fuck','shit','bitch','asshole','dick','pussy','cunt']
const autoMod = (text: string): boolean => {
  const lower = text.toLowerCase()
  return BAD_WORDS.some(w => lower.includes(w))
}

const getName = (u:any) => u?.full_name||u?.email?.split('@')[0]||'User'
const getInitials = (u:any) => getName(u).slice(0,2).toUpperCase()
const ACOLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const aBg = (id:string) => ACOLORS[(id?.charCodeAt(0)||0)%ACOLORS.length]
const fmtTime = (ts:number) => {
  const m = Math.floor((Date.now()-ts)/60000)
  return m<1?'now':m<60?`${m}m`:`${Math.floor(m/60)}h`
}

const ICE: RTCIceServer[] = [
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:stun2.l.google.com:19302'},
  {urls:'stun:stun3.l.google.com:19302'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'},
]

function useW() {
  const [w,setW] = useState(1200)
  useEffect(()=>{const h=()=>setW(window.innerWidth);h();window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[])
  return w
}

// ── Whiteboard ────────────────────────────────────────────────────────────────
function Whiteboard({bg,onCanvasReady}:{bg:string,onCanvasReady?:(c:HTMLCanvasElement)=>void}) {
  const ref=useRef<HTMLCanvasElement>(null)
  const [tool,setTool]=useState<'pen'|'eraser'|'line'|'rect'|'circle'>('pen')
  const [color,setColor]=useState('#FFFFFF')
  const [size,setSize]=useState(4)
  const dr=useRef(false),last=useRef<any>(null),snap=useRef<ImageData|null>(null)

  useEffect(()=>{
    const c=ref.current;if(!c)return
    const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height)
    // Notify parent so it can captureStream
    if(onCanvasReady)onCanvasReady(c)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[bg])

  const gp=(e:any,c:HTMLCanvasElement)=>{const r=c.getBoundingClientRect();const s=e.touches?e.touches[0]:e;return{x:(s.clientX-r.left)*(c.width/r.width),y:(s.clientY-r.top)*(c.height/r.height)}}
  const start=(e:any)=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;const p=gp(e,c);dr.current=true;last.current=p;snap.current=ctx.getImageData(0,0,c.width,c.height);if(tool==='pen'||tool==='eraser'){ctx.beginPath();ctx.moveTo(p.x,p.y)}}
  const move=(e:any)=>{if(!dr.current)return;const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;const p=gp(e,c);ctx.lineWidth=tool==='eraser'?size*5:size;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=tool==='eraser'?bg:color;if(tool==='pen'||tool==='eraser'){ctx.lineTo(p.x,p.y);ctx.stroke()}else if(snap.current&&last.current){ctx.putImageData(snap.current,0,0);ctx.beginPath();ctx.strokeStyle=color;if(tool==='line'){ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.stroke()}else if(tool==='rect')ctx.strokeRect(last.current.x,last.current.y,p.x-last.current.x,p.y-last.current.y);else if(tool==='circle'){const rx=Math.abs(p.x-last.current.x)/2,ry=Math.abs(p.y-last.current.y)/2;ctx.ellipse(last.current.x+(p.x-last.current.x)/2,last.current.y+(p.y-last.current.y)/2,rx,ry,0,0,Math.PI*2);ctx.stroke()}}}
  const end=()=>{dr.current=false;last.current=null}
  const clear=()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height)}

  const TOOLS=[{id:'pen',Icon:PenLine},{id:'eraser',Icon:Eraser},{id:'line',Icon:Minus},{id:'rect',Icon:Square},{id:'circle',Icon:Circle}] as any[]
  const COLS=['#FFFFFF','#EF4444','#3B82F6','#F59E0B','#10B981','#A78BFA','#FB923C','#000000']
  return(
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 12px',background:C.card,borderBottom:`1px solid ${C.border}`,flexWrap:'wrap',flexShrink:0}}>
        <div style={{display:'flex',gap:2,background:C.surface,padding:3,borderRadius:8}}>
          {TOOLS.map(({id,Icon}:any)=><button key={id} onClick={()=>setTool(id)} style={{width:28,height:28,borderRadius:6,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:tool===id?C.blue:'transparent',color:tool===id?'#fff':C.textMuted}}><Icon style={{width:13,height:13}}/></button>)}
        </div>
        <div style={{display:'flex',gap:4}}>{COLS.map(col=><button key={col} onClick={()=>setColor(col)} style={{width:color===col?20:14,height:color===col?20:14,borderRadius:'50%',background:col,border:color===col?`2px solid ${C.blueL}`:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',transition:'all .15s'}}/>)}</div>
        <div style={{display:'flex',gap:3,alignItems:'center'}}>{[2,4,8,14,22].map(s=><button key={s} onClick={()=>setSize(s)} style={{width:Math.max(s+4,10),height:Math.max(s+4,10),borderRadius:'50%',border:'none',cursor:'pointer',background:size===s?color:C.textDim}}/>)}</div>
        <button onClick={clear} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:C.redDim,color:C.red,fontSize:11,fontFamily:'DM Sans,sans-serif'}}><Trash2 style={{width:11,height:11}}/>Clear</button>
      </div>
      <canvas ref={ref} width={1280} height={720} style={{flex:1,width:'100%',height:'100%',cursor:tool==='eraser'?'cell':'crosshair',touchAction:'none',background:bg,display:'block'}}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const {id}=useParams();const router=useRouter()
  const eventId=id as string
  const width=useW()
  const isMobile=width<768,isTablet=width>=768&&width<1100

  // Auth
  const [event,setEvent]=useState<any>(null)
  const [user,setUser]=useState<any>(null)
  const [profile,setProfile]=useState<any>(null)
  const [isHost,setIsHost]=useState(false)
  const [isCohost,setIsCohost]=useState(false)
  const [loading,setLoading]=useState(true)
  const [accessDenied,setAccessDenied]=useState(false)

  // Stream
  const [streaming,setStreaming]=useState(false)
  const [micOn,setMicOn]=useState(true)
  const [camOn,setCamOn]=useState(true)
  const [muted,setMuted]=useState(false)
  const [mode,setMode]=useState<'camera'|'screen'|'whiteboard'>('camera')
  const [boardBg,setBoardBg]=useState('#0A0A0F')
  const [streamErr,setStreamErr]=useState('')
  const [viewerStatus,setViewerStatus]=useState<'idle'|'connecting'|'connected'|'failed'>('idle')
  const [retries,setRetries]=useState(0)
  const [fullscreen,setFullscreen]=useState(false)
  const [pip,setPip]=useState(false)

  // Chat
  const [messages,setMessages]=useState<any[]>([])
  const [newMsg,setNewMsg]=useState('')
  const [sending,setSending]=useState(false)
  const [viewers,setViewers]=useState(1)
  const [reactions,setReactions]=useState(0)
  const [liked,setLiked]=useState(false)
  const [earnings,setEarnings]=useState(0)
  const [showChat,setShowChat]=useState(!isMobile)
  const [unread,setUnread]=useState(0)
  const [slowMode,setSlowMode]=useState(false)
  const [lastMsgTime,setLastMsgTime]=useState(0)
  const [slowCountdown,setSlowCountdown]=useState(0)

  // Moderation
  const [mutedUsers,setMutedUsers]=useState<Set<string>>(new Set())
  const [bannedUsers,setBannedUsers]=useState<Set<string>>(new Set())
  const [modCmd,setModCmd]=useState('')
  const [showMod,setShowMod]=useState(false)
  const [raisedHands,setRaisedHands]=useState<string[]>([])
  const [myHandRaised,setMyHandRaised]=useState(false)

  // Recording
  const [recording,setRecording]=useState(false)
  const [recStatus,setRecStatus]=useState('')
  const [recTime,setRecTime]=useState(0)

  // Refs
  const localRef=useRef<HTMLVideoElement>(null)
  const remoteRef=useRef<HTMLVideoElement>(null)
  const localStream=useRef<MediaStream|null>(null)
  const screenStream=useRef<MediaStream|null>(null)
  const wbStreamRef=useRef<MediaStream|null>(null)
  const chatCh=useRef<any>(null)
  const sigCh=useRef<any>(null)
  const peerConn=useRef<RTCPeerConnection|null>(null)
  const hostPeers=useRef<Map<string,RTCPeerConnection>>(new Map())
  const retryTimer=useRef<any>(null)
  const recTimer=useRef<any>(null)
  const chatBottom=useRef<HTMLDivElement>(null)
  const profRef=useRef<any>(null)
  const userRef=useRef<any>(null)
  const isHostRef=useRef(false)
  const mediaRec=useRef<MediaRecorder|null>(null)
  const recChunks=useRef<Blob[]>([])
  const pendingICE=useRef<RTCIceCandidateInit[]>([])
  const isStreamingRef=useRef(false)
  const videoContainer=useRef<HTMLDivElement>(null)

  // ── Init ──────────────────────────────────────────────────────────
  useEffect(()=>{
    ;(async()=>{
      const {data:{user:u}}=await supabase.auth.getUser()
      if(!u){router.push('/auth/login');return}
      setUser(u);userRef.current=u

      const {data:prof}=await supabase.from('users').select('*').eq('id',u.id).single()
      setProfile(prof);profRef.current=prof

      const {data:ev}=await supabase.from('events').select('*, users(id,email,full_name,photo_url)').eq('id',eventId).single()
      if(!ev){router.push('/dashboard');return}
      setEvent(ev)

      const hostChk=ev.host_id===u.id||prof?.role==='admin'
      setIsHost(hostChk);isHostRef.current=hostChk

      const {data:coRow}=await supabase.from('event_cohosts').select('id').eq('event_id',eventId).eq('user_id',u.id).maybeSingle()
      const coChk=!!coRow;setIsCohost(coChk)
      if(coChk)isHostRef.current=true
      const ctrl=hostChk||coChk

      if(!ctrl&&(ev.price>0||!ev.is_free)){
        const {data:tkt}=await supabase.from('tickets').select('id').eq('user_id',u.id).eq('event_id',eventId).in('status',['paid','free','confirmed','active']).maybeSingle()
        if(!tkt){setAccessDenied(true);setLoading(false);return}
      }

      // Load muted users
      const {data:muted}=await supabase.from('live_muted_users').select('user_id,muted_until').eq('event_id',eventId)
      if(muted){
        const now=new Date()
        const set=new Set(muted.filter(m=>!m.muted_until||new Date(m.muted_until)>now).map(m=>m.user_id))
        setMutedUsers(set as Set<string>)
      }

      // Load chat
      const {data:hist}=await supabase.from('live_messages').select('*').eq('event_id',eventId).order('created_at',{ascending:true}).limit(200)
      if(hist?.length){
        setMessages(hist.map(m=>({id:m.id,user_id:m.user_id,name:m.user_name,avatar:m.user_avatar,text:m.content,ts:new Date(m.created_at).getTime(),isHost:m.is_host})))
        setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),100)
      }

      const {count:rc}=await supabase.from('event_reactions').select('*',{count:'exact',head:true}).eq('event_id',eventId)
      setReactions(rc||0)
      const {data:myR}=await supabase.from('event_reactions').select('id').eq('event_id',eventId).eq('user_id',u.id).maybeSingle()
      if(myR)setLiked(true)

      if(hostChk){
        const {data:tix}=await supabase.from('tickets').select('amount').eq('event_id',eventId).eq('status','paid')
        setEarnings((tix||[]).reduce((s:number,t:any)=>s+Math.floor(t.amount*0.8),0))
        supabase.channel('earn-'+eventId).on('postgres_changes',{event:'INSERT',schema:'public',table:'tickets',filter:`event_id=eq.${eventId}`},(p:any)=>setEarnings(prev=>prev+Math.floor(p.new.amount*0.8))).subscribe()
      }

      setLoading(false)

      // Chat channel
      const ch=supabase.channel(`chat-${eventId}`,{config:{presence:{key:u.id}}})
        .on('broadcast',{event:'msg'},({payload})=>{
          if(bannedUsers.has(payload.user_id)||mutedUsers.has(payload.user_id))return
          setMessages(prev=>prev.find(m=>m.id===payload.id)?prev:[...prev,payload])
          setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),50)
          setUnread(p=>p+1)
        })
        .on('broadcast',{event:'react'},()=>setReactions(p=>p+1))
        .on('broadcast',{event:'hand'},({payload})=>{
          setRaisedHands(prev=>payload.raised?[...prev.filter(h=>h!==payload.uid),payload.uid]:prev.filter(h=>h!==payload.uid))
        })
        .on('broadcast',{event:'mod'},({payload})=>{
          if(payload.action==='mute'&&payload.target===u.id)alert('You have been muted by the host.')
          if(payload.action==='ban'&&payload.target===u.id){alert('You have been removed from this event.');router.push('/dashboard')}
          if(payload.action==='slow'){setSlowMode(payload.enabled)}
        })
        .on('presence',{event:'sync'},()=>setViewers(Object.keys(ch.presenceState()).length))
        .subscribe(async s=>{if(s==='SUBSCRIBED')await ch.track({uid:u.id})})
      chatCh.current=ch

      setupSignaling(u.id,ctrl,ev.status==='live')
    })()

    return()=>{
      clearTimeout(retryTimer.current)
      clearInterval(recTimer.current)
      localStream.current?.getTracks().forEach(t=>t.stop())
      screenStream.current?.getTracks().forEach(t=>t.stop())
      wbStreamRef.current?.getTracks().forEach(t=>t.stop())
      peerConn.current?.close()
      hostPeers.current.forEach(pc=>pc.close())
      if(chatCh.current)supabase.removeChannel(chatCh.current)
      if(sigCh.current)supabase.removeChannel(sigCh.current)
    }
  },[eventId])

  // Attach remote stream
  useEffect(()=>{
    if(remoteRef.current&&viewerStatus==='connected'){
      // already set in ontrack
    }
  },[viewerStatus])

  // ── Signaling ─────────────────────────────────────────────────────
  const createHostPeer=useCallback((viewerId:string,stream:MediaStream)=>{
    const sig=sigCh.current
    hostPeers.current.get(viewerId)?.close()
    const pc=new RTCPeerConnection({iceServers:ICE})
    stream.getTracks().forEach(t=>pc.addTrack(t,stream))
    pc.onicecandidate=({candidate})=>{
      if(candidate&&sig)sig.send({type:'broadcast',event:'ice',payload:{to:viewerId,from:'host',candidate:candidate.toJSON()}})
    }
    pc.onnegotiationneeded=()=>{
      pc.createOffer().then(o=>{pc.setLocalDescription(o);sig?.send({type:'broadcast',event:'offer',payload:{to:viewerId,sdp:o,from:userRef.current?.id}})})
    }
    pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'||pc.connectionState==='closed'){hostPeers.current.delete(viewerId);pc.close()}}
    hostPeers.current.set(viewerId,pc)
    return pc
  },[])

  const createViewerPeer=useCallback((myId:string)=>{
    peerConn.current?.close();pendingICE.current=[]
    const pc=new RTCPeerConnection({iceServers:ICE})
    const ms=new MediaStream()
    pc.ontrack=(e)=>{
      e.streams[0]?.getTracks().forEach(t=>ms.addTrack(t))
      if(ms.getTracks().length>0&&remoteRef.current){
        remoteRef.current.srcObject=ms
        remoteRef.current.play().catch(()=>{})
        setViewerStatus('connected')
        setRetries(0)
        clearTimeout(retryTimer.current)
      }
    }
    pc.onicecandidate=({candidate})=>{
      if(candidate&&sigCh.current)sigCh.current.send({type:'broadcast',event:'ice',payload:{to:'host',from:myId,candidate:candidate.toJSON()}})
    }
    pc.onconnectionstatechange=()=>{
      if(pc.connectionState==='connected'){setViewerStatus('connected');clearTimeout(retryTimer.current)}
      if(pc.connectionState==='failed'||pc.connectionState==='disconnected'){
        setViewerStatus('failed')
        retryTimer.current=setTimeout(()=>{
          setRetries(p=>p+1);setViewerStatus('connecting')
          sigCh.current?.send({type:'broadcast',event:'join',payload:{viewerId:myId,retry:true}})
        },3000)
      }
    }
    pc.oniceconnectionstatechange=()=>{if(pc.iceConnectionState==='failed')pc.restartIce()}
    peerConn.current=pc
    return pc
  },[])

  const setupSignaling=useCallback((uid:string,ctrl:boolean,isLive:boolean)=>{
    const sig=supabase.channel(`sig-${eventId}`)

    if(ctrl){
      sig.on('broadcast',{event:'join'},async({payload})=>{
        const {viewerId}=payload
        if(!viewerId||viewerId===uid)return
        if(!isStreamingRef.current||!localStream.current){sig.send({type:'broadcast',event:'not-live',payload:{to:viewerId}});return}
        createHostPeer(viewerId,localStream.current)
      })
      sig.on('broadcast',{event:'answer'},async({payload})=>{
        const {from,sdp}=payload;const pc=hostPeers.current.get(from)
        if(pc&&pc.signalingState!=='stable'){try{await pc.setRemoteDescription(new RTCSessionDescription(sdp))}catch{}}
      })
      sig.on('broadcast',{event:'ice'},async({payload})=>{
        const {from,candidate,to}=payload
        if(to!=='host'&&to!==uid)return
        const pc=hostPeers.current.get(from)
        if(pc?.remoteDescription){try{await pc.addIceCandidate(new RTCIceCandidate(candidate))}catch{}}
      })
    } else {
      sig.on('broadcast',{event:'offer'},async({payload})=>{
        if(payload.to!==uid)return
        const pc=createViewerPeer(uid);setViewerStatus('connecting')
        try{
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          for(const c of pendingICE.current){try{await pc.addIceCandidate(new RTCIceCandidate(c))}catch{}}
          pendingICE.current=[]
          const ans=await pc.createAnswer()
          await pc.setLocalDescription(ans)
          sig.send({type:'broadcast',event:'answer',payload:{to:payload.from,sdp:pc.localDescription,from:uid}})
        }catch(e){setViewerStatus('failed')}
      })
      sig.on('broadcast',{event:'ice'},async({payload})=>{
        if(payload.to!==uid)return
        const pc=peerConn.current
        if(pc?.remoteDescription){try{await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))}catch{}}
        else pendingICE.current.push(payload.candidate)
      })
      sig.on('broadcast',{event:'not-live'},({payload})=>{if(payload.to===uid)setViewerStatus('idle')})
      sig.on('broadcast',{event:'stream-ended'},()=>{setViewerStatus('idle');if(remoteRef.current)remoteRef.current.srcObject=null})
    }

    sig.subscribe(async(status)=>{
      if(status==='SUBSCRIBED'&&!ctrl&&isLive){
        setViewerStatus('connecting')
        sig.send({type:'broadcast',event:'join',payload:{viewerId:uid}})
        retryTimer.current=setTimeout(()=>{
          if(peerConn.current?.connectionState!=='connected'){
            setRetries(1);sig.send({type:'broadcast',event:'join',payload:{viewerId:uid,retry:true}})
          }
        },5000)
      }
    })
    sigCh.current=sig
  },[createHostPeer,createViewerPeer,eventId])

  // ── Go Live ───────────────────────────────────────────────────────
  const goLive=async()=>{
    setStreamErr('')
    try{
      const stream=await navigator.mediaDevices.getUserMedia({
        video:{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}},
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
      })
      localStream.current=stream
      if(localRef.current){
        localRef.current.srcObject=stream
        localRef.current.muted=true
        localRef.current.volume=0
        await localRef.current.play().catch(()=>{})
      }
      isStreamingRef.current=true
      setStreaming(true);setMode('camera')
      await supabase.from('events').update({status:'live'}).eq('id',eventId)
      sigCh.current?.send({type:'broadcast',event:'host-live',payload:{hostId:userRef.current?.id}})
      const state=chatCh.current?.presenceState()||{}
      Object.keys(state).filter(v=>v!==userRef.current?.id).forEach(v=>createHostPeer(v,stream))
      startRecording(stream)
    }catch(err:any){
      if(err.name==='NotAllowedError')setStreamErr('Camera/microphone access denied. Please allow permissions in your browser.')
      else if(err.name==='NotFoundError')setStreamErr('No camera or microphone found. Please connect a device.')
      else setStreamErr('Could not start stream: '+err.message)
    }
  }

  // ── End Stream ────────────────────────────────────────────────────
  const endStream=async()=>{
    isStreamingRef.current=false
    sigCh.current?.send({type:'broadcast',event:'stream-ended',payload:{}})
    await stopRecording()
    localStream.current?.getTracks().forEach(t=>t.stop())
    screenStream.current?.getTracks().forEach(t=>t.stop())
    wbStreamRef.current?.getTracks().forEach(t=>t.stop());wbStreamRef.current=null
    hostPeers.current.forEach(pc=>pc.close());hostPeers.current.clear()
    if(localRef.current)localRef.current.srcObject=null
    setStreaming(false)
    await supabase.from('events').update({status:'ended',ended_at:new Date().toISOString()}).eq('id',eventId)
    router.push('/host')
  }

  const toggleMic=()=>{localStream.current?.getAudioTracks().forEach(t=>{t.enabled=!t.enabled});setMicOn(p=>!p)}
  const toggleCam=()=>{localStream.current?.getVideoTracks().forEach(t=>{t.enabled=!t.enabled});setCamOn(p=>!p)}

  // ── Helper: replace video track on all peer connections ──────────
  const replaceVideoTrackAll=(track:MediaStreamTrack)=>{
    hostPeers.current.forEach(pc=>{
      const sender=pc.getSenders().find(s=>s.track?.kind==='video')
      if(sender)sender.replaceTrack(track).catch(()=>{})
    })
  }

  // ── Screen share ──────────────────────────────────────────────────
  const startScreen=async()=>{
    try{
      const ss=await (navigator.mediaDevices as any).getDisplayMedia({video:{cursor:'always'},audio:true})
      screenStream.current=ss
      // Stop any active whiteboard stream first
      wbStreamRef.current?.getTracks().forEach(t=>t.stop());wbStreamRef.current=null
      if(localRef.current){localRef.current.srcObject=ss;await localRef.current.play().catch(()=>{})}
      setMode('screen')
      const vt=ss.getVideoTracks()[0]
      replaceVideoTrackAll(vt)
      // Signal viewers so late-joiners know current mode
      sigCh.current?.send({type:'broadcast',event:'mode-change',payload:{mode:'screen'}})
      vt.onended=stopScreen
    }catch{}
  }
  const stopScreen=()=>{
    screenStream.current?.getTracks().forEach(t=>t.stop());screenStream.current=null
    if(localStream.current&&localRef.current){localRef.current.srcObject=localStream.current}
    const ct=localStream.current?.getVideoTracks()[0]
    if(ct)replaceVideoTrackAll(ct)
    sigCh.current?.send({type:'broadcast',event:'mode-change',payload:{mode:'camera'}})
    setMode('camera')
  }

  // ── Whiteboard ────────────────────────────────────────────────────
  const handleWhiteboardCanvas=(canvas:HTMLCanvasElement,bg:string)=>{
    // Stop existing wb stream if switching bg
    wbStreamRef.current?.getTracks().forEach(t=>t.stop());wbStreamRef.current=null
    try{
      // captureStream at 30fps — broadcasts canvas content as video track
      const stream=(canvas as any).captureStream(30) as MediaStream
      wbStreamRef.current=stream
      const vt=stream.getVideoTracks()[0]
      if(!vt)return
      replaceVideoTrackAll(vt)
      // Also mirror in host's local preview so host sees it in the video element
      if(localRef.current){localRef.current.srcObject=stream;localRef.current.play().catch(()=>{})}
    }catch(e){console.warn('captureStream not supported:',e)}
  }
  const stopWhiteboard=()=>{
    wbStreamRef.current?.getTracks().forEach(t=>t.stop());wbStreamRef.current=null
    // Restore camera
    const ct=localStream.current?.getVideoTracks()[0]
    if(ct)replaceVideoTrackAll(ct)
    if(localStream.current&&localRef.current)localRef.current.srcObject=localStream.current
    sigCh.current?.send({type:'broadcast',event:'mode-change',payload:{mode:'camera'}})
  }

  // ── PiP ──────────────────────────────────────────────────────────
  const togglePip=async()=>{
    const vid=isHost?localRef.current:remoteRef.current
    if(!vid)return
    try{
      if(document.pictureInPictureElement){await document.exitPictureInPicture();setPip(false)}
      else{await (vid as any).requestPictureInPicture();setPip(true)}
    }catch(e){console.log('PiP not supported')}
  }

  // ── Fullscreen ────────────────────────────────────────────────────
  const toggleFullscreen=()=>{
    if(!videoContainer.current)return
    if(!document.fullscreenElement){videoContainer.current.requestFullscreen();setFullscreen(true)}
    else{document.exitFullscreen();setFullscreen(false)}
  }

  // ── Recording ─────────────────────────────────────────────────────
  const startRecording=(stream:MediaStream)=>{
    recChunks.current=[]
    const opts=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t))
    try{
      const rec=new MediaRecorder(stream,opts?{mimeType:opts}:undefined)
      rec.ondataavailable=e=>{if(e.data.size>0)recChunks.current.push(e.data)}
      rec.start(5000);mediaRec.current=rec;setRecording(true);setRecTime(0)
      recTimer.current=setInterval(()=>setRecTime(p=>p+1),1000)
    }catch(e){console.log('Recording not supported')}
  }
  const stopRecording=async()=>{
    clearInterval(recTimer.current)
    const rec=mediaRec.current
    if(!rec||rec.state==='inactive')return
    setRecStatus('Saving...')
    await new Promise<void>(r=>{rec.onstop=()=>r();rec.stop()})
    setRecording(false)
    if(!recChunks.current.length){setRecStatus('');return}
    const blob=new Blob(recChunks.current,{type:rec.mimeType||'video/webm'})
    const path=`${eventId}/${Date.now()}.webm`
    setRecStatus('Uploading...')
    const {error}=await supabase.storage.from('event-recordings').upload(path,blob,{contentType:blob.type,upsert:true})
    if(!error){
      const {data:ud}=await supabase.storage.from('event-recordings').createSignedUrl(path,60*60*24*30)
      await supabase.from('event_recordings').insert({event_id:eventId,host_id:userRef.current?.id,storage_path:path,public_url:ud?.signedUrl||'',size_bytes:blob.size,premium_only:true})
      setRecStatus('✓ Saved!')
      setTimeout(()=>setRecStatus(''),3000)
    } else setRecStatus('Upload failed')
    recChunks.current=[]
  }

  // ── Moderation ────────────────────────────────────────────────────
  const parseModCommand=async(cmd:string)=>{
    const parts=cmd.trim().split(' ')
    const action=parts[0]?.toLowerCase()
    const target=parts[1]?.replace('@','')
    const duration=parseInt(parts[2])||30

    if(action==='/mute'&&target){
      const {data:u}=await supabase.from('users').select('id').ilike('email',`${target}%`).maybeSingle()
      if(u){
        const until=new Date(Date.now()+duration*60000).toISOString()
        await supabase.from('live_muted_users').upsert({event_id:eventId,user_id:u.id,muted_by:userRef.current?.id,muted_until:until})
        setMutedUsers(prev=>new Set([...prev,u.id]))
        chatCh.current?.send({type:'broadcast',event:'mod',payload:{action:'mute',target:u.id,duration}})
        alert(`Muted ${target} for ${duration} minutes`)
      }
    } else if(action==='/ban'&&target){
      const {data:u}=await supabase.from('users').select('id').ilike('email',`${target}%`).maybeSingle()
      if(u){
        await supabase.from('live_muted_users').upsert({event_id:eventId,user_id:u.id,muted_by:userRef.current?.id,muted_until:null,reason:'banned'})
        setBannedUsers(prev=>new Set([...prev,u.id]))
        chatCh.current?.send({type:'broadcast',event:'mod',payload:{action:'ban',target:u.id}})
        alert(`Banned ${target}`)
      }
    } else if(action==='/slow'){
      setSlowMode(true)
      chatCh.current?.send({type:'broadcast',event:'mod',payload:{action:'slow',enabled:true}})
      alert('Slow mode enabled (10s between messages)')
    } else if(action==='/slowoff'){
      setSlowMode(false)
      chatCh.current?.send({type:'broadcast',event:'mod',payload:{action:'slow',enabled:false}})
    } else {
      alert('Commands: /mute @user [mins] | /ban @user | /slow | /slowoff')
    }
    setModCmd('')
  }

  // ── Send message ──────────────────────────────────────────────────
  const sendMessage=async()=>{
    if(!newMsg.trim()||sending)return
    const u=userRef.current;const p=profRef.current

    // Slow mode check
    if(slowMode&&!(isHost||isCohost)){
      const elapsed=(Date.now()-lastMsgTime)/1000
      if(elapsed<10){
        setSlowCountdown(Math.ceil(10-elapsed))
        const t=setInterval(()=>{
          setSlowCountdown(prev=>{if(prev<=1){clearInterval(t);return 0}return prev-1})
        },1000)
        return
      }
    }

    // AutoMod
    if(autoMod(newMsg)&&!(isHost||isCohost)){
      alert('Your message was blocked by AutoMod. Please keep the chat respectful.')
      return
    }

    // Mute check
    if(mutedUsers.has(u?.id||'')){alert('You are muted.');return}

    setSending(true)
    const msg={id:crypto.randomUUID(),user_id:u?.id,name:getName(p||u),avatar:p?.photo_url||u?.user_metadata?.avatar_url||'',text:newMsg.trim().slice(0,500),ts:Date.now(),isHost:isHost||isCohost}
    setNewMsg('');setLastMsgTime(Date.now())
    setMessages(prev=>[...prev,msg])
    setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),50)
    await supabase.from('live_messages').insert({id:msg.id,event_id:eventId,user_id:u?.id,user_name:msg.name,user_avatar:msg.avatar,is_host:msg.isHost,content:msg.text})
    chatCh.current?.send({type:'broadcast',event:'msg',payload:msg})
    setSending(false)
  }

  const handleLike=async()=>{
    if(liked)return
    setLiked(true);setReactions(p=>p+1)
    await supabase.from('event_reactions').insert({event_id:eventId,user_id:userRef.current?.id})
    chatCh.current?.send({type:'broadcast',event:'react',payload:{}})
  }

  const toggleHand=()=>{
    const raised=!myHandRaised
    setMyHandRaised(raised)
    chatCh.current?.send({type:'broadcast',event:'hand',payload:{uid:userRef.current?.id,name:getName(profRef.current||userRef.current),raised}})
  }

  const fmtRec=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const canCtrl=isHost||isCohost

  if(loading)return(
    <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,flexDirection:'column',gap:12}}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <Loader2 style={{width:36,height:36,color:C.blueL,animation:'spin 1s linear infinite'}}/>
      <p style={{color:C.textMuted,fontFamily:'DM Sans,sans-serif',fontSize:14}}>Joining room...</p>
    </div>
  )

  if(accessDenied)return(
    <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,padding:24}}>
      <div style={{borderRadius:24,padding:36,textAlign:'center',maxWidth:340,width:'100%',background:C.card,border:`1px solid ${C.border}`}}>
        <Shield style={{width:44,height:44,color:C.red,marginBottom:16}}/>
        <h2 style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:'Syne,sans-serif',marginBottom:8}}>Ticket Required</h2>
        <p style={{fontSize:14,color:C.textMuted,fontFamily:'DM Sans,sans-serif',marginBottom:24}}>You need a ticket to attend this event.</p>
        <button onClick={()=>router.push(`/events/${eventId}`)} style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:C.gold,color:'#0A0F1E',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>Get Ticket →</button>
      </div>
    </div>
  )

  // ── Video Area ────────────────────────────────────────────────────
  const VideoArea=()=>(
    <div ref={videoContainer} style={{position:'relative',width:'100%',height:'100%',background:'#000',overflow:'hidden'}}>
      {/* Host local video — hidden when whiteboard is active since wb shows in video element */}
      <video ref={localRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block',visibility:canCtrl&&streaming&&(mode==='camera'||mode==='screen'||mode==='whiteboard')?'visible':'hidden',position:canCtrl&&streaming?'relative':'absolute'}}/>
      {/* Viewer remote video */}
      {!canCtrl&&<video ref={remoteRef} autoPlay playsInline style={{width:'100%',height:'100%',objectFit:'cover',display:'block',visibility:viewerStatus==='connected'?'visible':'hidden'}} muted={muted}/>}
      {/* Whiteboard overlay — only for host to draw; stream captured via onCanvasReady */}
      {mode==='whiteboard'&&canCtrl&&<div style={{position:'absolute',inset:0,zIndex:2}}><Whiteboard bg={boardBg} onCanvasReady={(c)=>handleWhiteboardCanvas(c,boardBg)}/></div>}

      {/* Placeholder */}
      {((canCtrl&&!streaming)||((!canCtrl)&&viewerStatus!=='connected'))&&mode!=='whiteboard'&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,background:'linear-gradient(180deg,#000 0%,#0A0F1E 100%)',zIndex:1}}>
          <div style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',border:`3px solid ${aBg(event?.users?.id||'')}44`,flexShrink:0}}>
            {event?.users?.photo_url?<img src={event.users.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<div style={{width:'100%',height:'100%',background:aBg(event?.users?.id||'')+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,color:aBg(event?.users?.id||''),fontFamily:'Syne,sans-serif'}}>{getInitials(event?.users)}</div>}
          </div>
          <div style={{textAlign:'center',maxWidth:300,padding:'0 20px'}}>
            {canCtrl?(
              <>
                <p style={{color:'#fff',fontWeight:700,fontSize:16,fontFamily:'Syne,sans-serif',marginBottom:6}}>{isHost?'You are the host':'You are co-host'}</p>
                <p style={{color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif',marginBottom:24}}>Click Go Live to start broadcasting to all viewers</p>
                {streamErr&&<div style={{marginBottom:16,padding:'10px 14px',borderRadius:10,background:C.redDim,border:`1px solid rgba(239,68,68,0.3)`}}><p style={{fontSize:12,color:C.red,fontFamily:'DM Sans,sans-serif'}}>{streamErr}</p></div>}
                <button onClick={goLive} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'13px 32px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${C.red},#DC2626)`,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 6px 24px rgba(239,68,68,0.4)'}}>
                  <Radio style={{width:18,height:18}}/>Go Live
                </button>
              </>
            ):(
              <>
                <p style={{color:'#fff',fontWeight:600,fontSize:15,fontFamily:'Syne,sans-serif',marginBottom:6}}>{getName(event?.users)}</p>
                {viewerStatus==='connecting'&&<>
                  <p style={{color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif',marginBottom:14}}>Connecting to stream...</p>
                  <div style={{width:28,height:28,border:`3px solid ${C.blue}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
                  {retries>0&&<p style={{color:C.textDim,fontSize:11,marginTop:10,fontFamily:'DM Sans,sans-serif'}}>Retrying... attempt {retries}</p>}
                </>}
                {viewerStatus==='idle'&&<p style={{color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>{event?.status==='live'?'Stream starting...':'Waiting for host to go live'}</p>}
                {viewerStatus==='failed'&&<>
                  <p style={{color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif',marginBottom:14}}>Connection lost. Reconnecting...</p>
                  <div style={{width:28,height:28,border:`3px solid ${C.red}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
                </>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Screen share badge */}
      {mode==='screen'&&<div style={{position:'absolute',top:12,left:12,zIndex:5,display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:20,background:'rgba(37,99,235,0.25)',backdropFilter:'blur(8px)',border:`1px solid rgba(37,99,235,0.4)`}}><Monitor style={{width:13,height:13,color:C.blueL}}/><span style={{fontSize:11,fontWeight:700,color:C.blueL}}>Screen Sharing</span></div>}

      {/* Cam off */}
      {canCtrl&&streaming&&!camOn&&mode==='camera'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:C.surface,zIndex:3}}><div style={{textAlign:'center'}}><div style={{width:56,height:56,borderRadius:'50%',background:aBg(userRef.current?.id||'')+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:aBg(userRef.current?.id||''),margin:'0 auto 8px',fontFamily:'Syne,sans-serif'}}>{getInitials(profRef.current)}</div><p style={{color:C.textMuted,fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Camera off</p></div></div>}

      {/* Floating controls overlay - top right */}
      <div style={{position:'absolute',top:10,right:10,zIndex:10,display:'flex',gap:6}}>
        <button onClick={toggleFullscreen} style={{width:32,height:32,borderRadius:8,border:'none',cursor:'pointer',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {fullscreen?<Minimize style={{width:14,height:14}}/>:<Maximize style={{width:14,height:14}}/>}
        </button>
        <button onClick={togglePip} style={{width:32,height:32,borderRadius:8,border:'none',cursor:'pointer',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Eye style={{width:14,height:14}}/>
        </button>
      </div>

      {/* Raised hands indicator */}
      {raisedHands.length>0&&canCtrl&&<div style={{position:'absolute',bottom:12,left:12,zIndex:5,padding:'6px 12px',borderRadius:20,background:'rgba(245,158,11,0.2)',border:`1px solid rgba(245,158,11,0.4)`,backdropFilter:'blur(8px)'}}><span style={{fontSize:12,color:C.gold,fontFamily:'DM Sans,sans-serif'}}>✋ {raisedHands.length} hand{raisedHands.length>1?'s':''} raised</span></div>}
    </div>
  )

  // ── Host Controls Bar ──────────────────────────────────────────────
  const HostBar=()=>(
    <div style={{flexShrink:0,background:C.surface,borderTop:`1px solid ${C.border}`,padding:isMobile?'10px 12px':'12px 20px'}}>
      {streaming&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:10,flexWrap:'wrap'}}>
          {[{label:'Camera',active:mode==='camera',action:()=>{stopWhiteboard();stopScreen();setMode('camera')},Icon:Video},
            {label:mode==='screen'?'Stop Share':'Screen',active:mode==='screen',action:mode==='screen'?stopScreen:startScreen,Icon:mode==='screen'?MonitorOff:Monitor},
          ].map(b=><button key={b.label} onClick={b.action} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,border:`1px solid ${b.active?'rgba(37,99,235,0.4)':'transparent'}`,background:b.active?C.blueDim:'rgba(51,65,85,0.4)',color:b.active?C.blueL:C.textDim,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}><b.Icon style={{width:13,height:13}}/>{b.label}</button>)}
          {[{n:'White',v:'#F8FAFC'},{n:'Dark',v:'#0A0A0F'},{n:'Green',v:'#064E3B'}].map(b=>(
            <button key={b.v} onClick={()=>{stopScreen();setBoardBg(b.v);setMode('whiteboard');sigCh.current?.send({type:'broadcast',event:'mode-change',payload:{mode:'whiteboard'}})}} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,border:`1px solid ${mode==='whiteboard'&&boardBg===b.v?'rgba(124,58,237,0.4)':'transparent'}`,background:mode==='whiteboard'&&boardBg===b.v?'rgba(124,58,237,0.15)':'rgba(51,65,85,0.4)',color:mode==='whiteboard'&&boardBg===b.v?'#A78BFA':C.textDim,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
              <div style={{width:10,height:10,borderRadius:2,background:b.v,border:'1px solid rgba(255,255,255,0.2)'}}/>{b.n}
            </button>
          ))}
          {/* Moderation button */}
          <button onClick={()=>setShowMod(p=>!p)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,border:`1px solid ${showMod?'rgba(239,68,68,0.4)':'transparent'}`,background:showMod?C.redDim:'rgba(51,65,85,0.4)',color:showMod?C.red:C.textDim,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
            <Shield style={{width:13,height:13}}/>Mod {mutedUsers.size>0&&`(${mutedUsers.size})`}
          </button>
        </div>
      )}
      {/* Mod command bar */}
      {showMod&&streaming&&(
        <div style={{marginBottom:10,display:'flex',gap:8}}>
          <input value={modCmd} onChange={e=>setModCmd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&parseModCommand(modCmd)}
            placeholder="/mute @user 30 | /ban @user | /slow | /slowoff"
            style={{flex:1,padding:'8px 12px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:12,fontFamily:'DM Sans,sans-serif',outline:'none'}}/>
          <button onClick={()=>parseModCommand(modCmd)} style={{padding:'8px 14px',borderRadius:10,border:'none',background:C.red,color:'#fff',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:600}}>Run</button>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
        <button onClick={toggleMic} style={{width:46,height:46,borderRadius:'50%',border:`1px solid ${micOn?C.border:C.red+'55'}`,background:micOn?C.card:C.redDim,color:micOn?C.text:C.red,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          {micOn?<Mic style={{width:19,height:19}}/>:<MicOff style={{width:19,height:19}}/>}
        </button>
        <button onClick={toggleCam} style={{width:46,height:46,borderRadius:'50%',border:`1px solid ${camOn?C.border:C.red+'55'}`,background:camOn?C.card:C.redDim,color:camOn?C.text:C.red,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          {camOn?<Video style={{width:19,height:19}}/>:<VideoOff style={{width:19,height:19}}/>}
        </button>
        {streaming?(
          <button onClick={endStream} style={{display:'flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:24,border:'none',background:C.red,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 4px 16px rgba(239,68,68,0.35)'}}>
            <PhoneOff style={{width:17,height:17}}/>End Stream
          </button>
        ):(
          <button onClick={goLive} style={{display:'flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:24,border:'none',background:`linear-gradient(135deg,${C.red},#DC2626)`,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 4px 16px rgba(239,68,68,0.35)'}}>
            <Radio style={{width:17,height:17}}/>Go Live
          </button>
        )}
        {recording&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.red,fontFamily:'DM Sans,sans-serif',fontWeight:700}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:C.red,display:'inline-block',animation:'pulse 1s infinite'}}/>
          {fmtRec(recTime)}
        </div>}
        {recStatus&&<span style={{fontSize:11,color:C.gold,fontFamily:'DM Sans,sans-serif'}}>{recStatus}</span>}
      </div>
      {/* Slow mode indicator */}
      {slowMode&&<p style={{textAlign:'center',fontSize:11,color:C.gold,marginTop:8,fontFamily:'DM Sans,sans-serif'}}>⏱ Slow mode ON — viewers can send 1 message per 10 seconds</p>}
    </div>
  )

  // ── Viewer Controls Bar ───────────────────────────────────────────
  const ViewerBar=()=>(
    <div style={{flexShrink:0,background:C.surface,borderTop:`1px solid ${C.border}`,padding:'10px 16px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
      <button onClick={()=>setMuted(m=>!m)} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:20,border:`1px solid ${muted?C.red+'44':C.border}`,background:muted?C.redDim:C.card,color:muted?C.red:C.textMuted,cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif'}}>
        {muted?<VolumeX style={{width:14,height:14}}/>:<Volume2 style={{width:14,height:14}}/>}
        {!isMobile&&(muted?'Unmute':'Mute')}
      </button>
      <button onClick={handleLike} disabled={liked} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:20,border:`1px solid ${liked?C.red+'44':C.border}`,background:liked?C.redDim:C.card,color:liked?C.red:C.textMuted,cursor:liked?'default':'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif',opacity:liked?.8:1}}>
        <Heart style={{width:14,height:14,fill:liked?C.red:'none',stroke:liked?C.red:'currentColor'}}/>{reactions>0?reactions:(!isMobile?'Like':'')}
      </button>
      <button onClick={toggleHand} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:20,border:`1px solid ${myHandRaised?C.gold+'44':C.border}`,background:myHandRaised?C.goldDim:C.card,color:myHandRaised?C.gold:C.textMuted,cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif'}}>
        <Hand style={{width:14,height:14}}/>{!isMobile&&(myHandRaised?'Lower Hand':'Raise Hand')}
      </button>
      <div style={{flex:1}}/>
      {isMobile&&<button onClick={()=>{setShowChat(true);setUnread(0)}} style={{position:'relative',display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:20,border:`1px solid ${C.border}`,background:C.card,color:C.blueL,cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif'}}>
        <MessageCircle style={{width:14,height:14}}/>Chat
        {unread>0&&<span style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:C.red,fontSize:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{unread>9?'9+':unread}</span>}
      </button>}
      <button onClick={()=>router.push('/dashboard')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 16px',borderRadius:20,border:'none',background:C.redDim,color:C.red,cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif',fontWeight:600}}>
        <PhoneOff style={{width:13,height:13}}/>Leave
      </button>
    </div>
  )

  // ── Chat Panel ────────────────────────────────────────────────────
  const ChatPanel=()=>(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',background:C.card,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:'DM Sans,sans-serif'}}>Live Chat</span>
          {slowMode&&<span style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:C.goldDim,color:C.gold,fontWeight:700}}>SLOW</span>}
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:12,color:C.textMuted}}><Users style={{width:11,height:11}}/>{viewers}</div>
          {reactions>0&&<div style={{display:'flex',alignItems:'center',gap:3,fontSize:12,color:C.red}}><Heart style={{width:11,height:11,fill:C.red}}/>{reactions}</div>}
        </div>
        {isMobile&&<button onClick={()=>setShowChat(false)} style={{background:'none',border:'none',cursor:'pointer',color:C.textMuted,padding:4}}><ChevronDown style={{width:18,height:18}}/></button>}
      </div>

      {/* Raised hands for host */}
      {canCtrl&&raisedHands.length>0&&(
        <div style={{padding:'8px 12px',borderBottom:`1px solid ${C.border}`,background:'rgba(245,158,11,0.05)',flexShrink:0}}>
          <p style={{fontSize:11,color:C.gold,fontFamily:'DM Sans,sans-serif',fontWeight:600,marginBottom:4}}>✋ Raised Hands ({raisedHands.length})</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {raisedHands.map(uid=><span key={uid} style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:C.goldDim,color:C.gold,fontFamily:'DM Sans,sans-serif'}}>{uid.slice(0,8)}</span>)}
          </div>
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:10}}>
        {messages.length===0&&<div style={{textAlign:'center',paddingTop:40}}><p style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>Chat is live — say hello! 👋</p></div>}
        {messages.map(msg=>(
          <div key={msg.id} style={{display:'flex',gap:8,opacity:mutedUsers.has(msg.user_id)?0.3:1}}>
            <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',background:msg.isHost?`linear-gradient(135deg,${C.gold},#F97316)`:`linear-gradient(135deg,${C.blue},${C.blueL})`}}>
              {msg.avatar?<img src={msg.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:msg.name?.[0]?.toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                <span style={{fontSize:11,fontWeight:700,color:msg.isHost?C.gold:C.blueL,fontFamily:'DM Sans,sans-serif'}}>{msg.name}</span>
                {msg.isHost&&<span style={{fontSize:8,padding:'1px 5px',borderRadius:3,background:C.goldDim,color:C.gold,fontWeight:700}}>HOST</span>}
                <span style={{fontSize:10,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>{fmtTime(msg.ts)}</span>
                {canCtrl&&<button onClick={()=>{setMutedUsers(prev=>new Set([...prev,msg.user_id]));chatCh.current?.send({type:'broadcast',event:'mod',payload:{action:'mute',target:msg.user_id,duration:10}})}} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:C.textDim,fontSize:9,padding:'1px 4px',borderRadius:3}} title="Mute user">🔇</button>}
              </div>
              <p style={{fontSize:13,color:'#D4DBEE',fontFamily:'DM Sans,sans-serif',lineHeight:1.5,wordBreak:'break-word'}}>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatBottom}/>
      </div>

      <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
        {slowCountdown>0&&<p style={{fontSize:11,color:C.gold,marginBottom:6,textAlign:'center',fontFamily:'DM Sans,sans-serif'}}>⏱ Slow mode: {slowCountdown}s until next message</p>}
        <div style={{display:'flex',gap:8}}>
          <input type="text" value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
            placeholder={mutedUsers.has(userRef.current?.id||'')?'You are muted':'Say something...'} maxLength={500}
            disabled={mutedUsers.has(userRef.current?.id||'')||slowCountdown>0}
            style={{flex:1,padding:'10px 14px',borderRadius:12,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',opacity:mutedUsers.has(userRef.current?.id||'')?0.5:1}}
            onFocus={e=>(e.target.style.borderColor='rgba(37,99,235,0.5)')} onBlur={e=>(e.target.style.borderColor=C.border)}/>
          <button onClick={sendMessage} disabled={!newMsg.trim()||sending||slowCountdown>0}
            style={{width:42,height:42,borderRadius:12,border:'none',cursor:'pointer',background:C.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',opacity:!newMsg.trim()||sending||slowCountdown>0?.4:1}}>
            {sending?<Loader2 style={{width:16,height:16,animation:'spin .8s linear infinite'}}/>:<Send style={{width:16,height:16}}/>}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Top Bar ───────────────────────────────────────────────────────
  const TopBar=()=>(
    <div style={{padding:'10px 16px',background:C.card,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0,flex:1}}>
        {event?.status==='live'&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:C.redDim,color:C.red,flexShrink:0}}><span style={{width:5,height:5,borderRadius:'50%',background:C.red,animation:'pulse 1.2s infinite'}}/>LIVE</span>}
        <h1 style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:'DM Sans,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{event?.title}</h1>
        {canCtrl&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:5,background:C.goldDim,color:C.gold,flexShrink:0}}><Crown style={{width:9,height:9}}/>{isHost?'Host':'Co-host'}</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        {isHost&&earnings>0&&<span style={{fontSize:13,fontWeight:700,color:C.gold,fontFamily:'DM Sans,sans-serif'}}>${(earnings/100).toFixed(2)}</span>}
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.textMuted}}><Users style={{width:12,height:12}}/>{viewers}</div>
        {!isMobile&&!showChat&&<button onClick={()=>{setShowChat(true);setUnread(0)}} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.blueL,cursor:'pointer',fontSize:12,position:'relative'}}>
          <MessageCircle style={{width:12,height:12}}/>Chat{unread>0&&` (${unread})`}
        </button>}
      </div>
    </div>
  )

  return(
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',background:C.bg}}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box;}`}</style>
      <TopBar/>

      {isMobile&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
          <div style={{flex:1,position:'relative',overflow:'hidden'}}><VideoArea/></div>
          {canCtrl?<HostBar/>:<ViewerBar/>}
          {showChat&&<div style={{position:'absolute',inset:0,zIndex:30}}><ChatPanel/></div>}
          {!showChat&&!canCtrl&&<button onClick={()=>{setShowChat(true);setUnread(0)}} style={{position:'absolute',bottom:72,right:16,zIndex:20,width:48,height:48,borderRadius:'50%',background:C.blue,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(37,99,235,0.45)'}}>
            <MessageCircle style={{width:20,height:20,color:'#fff'}}/>
            {unread>0&&<span style={{position:'absolute',top:-2,right:-2,width:18,height:18,borderRadius:'50%',background:C.red,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{unread>9?'9+':unread}</span>}
          </button>}
        </div>
      )}

      {isTablet&&(
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          <div style={{flex:'0 0 58%',display:'flex',flexDirection:'column'}}>
            <div style={{flex:1,position:'relative',overflow:'hidden'}}><VideoArea/></div>
            {canCtrl?<HostBar/>:<ViewerBar/>}
          </div>
          <div style={{flex:'0 0 42%',borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',overflow:'hidden'}}><ChatPanel/></div>
        </div>
      )}

      {!isMobile&&!isTablet&&(
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          <div style={{flex:showChat?'0 0 70%':'1',display:'flex',flexDirection:'column',transition:'flex .25s ease'}}>
            <div style={{flex:1,position:'relative',overflow:'hidden'}}><VideoArea/></div>
            {canCtrl?<HostBar/>:<ViewerBar/>}
          </div>
          {showChat&&<div style={{flex:'0 0 30%',borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',overflow:'hidden'}}><ChatPanel/></div>}
        </div>
      )}
    </div>
  )
}
