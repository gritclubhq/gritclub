'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send,
  Users, Radio, Shield, Volume2, VolumeX, Monitor,
  PenLine, Eraser, Minus, Square, Circle, Trash2,
  Heart, Loader2, Crown, MessageCircle, ChevronDown
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.07)', text:'#F0F4FF',
  textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.12)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
}
type Mode = 'camera'|'screen'|'whiteboard'
const getName     = (u:any)=>u?.full_name||u?.email?.split('@')[0]||'User'
const getInitials = (u:any)=>getName(u).slice(0,2).toUpperCase()
const AVATAR_COLORS=['#2563EB','#7C3AED','#DB2777','#D97706','#059669']
const avatarColor = (id:string)=>AVATAR_COLORS[(id?.charCodeAt(0)||0)%AVATAR_COLORS.length]
const fmtTime = (ts:string|number)=>{
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  return m<1?'now':m<60?`${m}m`:`${Math.floor(m/60)}h`
}

const ICE = [
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:stun.cloudflare.com:3478'},
]

// ── useWindowWidth hook ───────────────────────────────────────────────────────
function useWindowWidth(){
  const [w,setW]=useState(1200)
  useEffect(()=>{
    const set=()=>setW(window.innerWidth); set()
    window.addEventListener('resize',set)
    return ()=>window.removeEventListener('resize',set)
  },[])
  return w
}

// ── Whiteboard ────────────────────────────────────────────────────────────────
function Whiteboard({bg}:{bg:string}){
  const ref=useRef<HTMLCanvasElement>(null)
  const [tool,setTool]=useState<'pen'|'eraser'|'line'|'rect'|'circle'>('pen')
  const [color,setColor]=useState('#FFFFFF')
  const [size,setSize]=useState(4)
  const [canvasBg,setBg]=useState(bg)
  const drawing=useRef(false), last=useRef<any>(null), snap=useRef<ImageData|null>(null)
  useEffect(()=>{setBg(bg)},[bg])
  useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;ctx.fillStyle=canvasBg;ctx.fillRect(0,0,c.width,c.height)},[canvasBg])
  const gp=(e:any,c:HTMLCanvasElement)=>{const r=c.getBoundingClientRect();if(e.touches)return{x:(e.touches[0].clientX-r.left)*(c.width/r.width),y:(e.touches[0].clientY-r.top)*(c.height/r.height)};return{x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)}}
  const sd=(e:any)=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;const p=gp(e,c);drawing.current=true;last.current=p;snap.current=ctx.getImageData(0,0,c.width,c.height);if(['pen','eraser'].includes(tool)){ctx.beginPath();ctx.moveTo(p.x,p.y)}}
  const dr=(e:any)=>{if(!drawing.current)return;const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;const p=gp(e,c);ctx.lineWidth=tool==='eraser'?size*4:size;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=tool==='eraser'?canvasBg:color;if(tool==='pen'||tool==='eraser'){ctx.lineTo(p.x,p.y);ctx.stroke()}else if(snap.current&&last.current){ctx.putImageData(snap.current,0,0);ctx.beginPath();ctx.strokeStyle=color;if(tool==='line'){ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.stroke()}else if(tool==='rect'){ctx.strokeRect(last.current.x,last.current.y,p.x-last.current.x,p.y-last.current.y)}else if(tool==='circle'){const rx=Math.abs(p.x-last.current.x)/2,ry=Math.abs(p.y-last.current.y)/2;ctx.ellipse(last.current.x+(p.x-last.current.x)/2,last.current.y+(p.y-last.current.y)/2,rx,ry,0,0,Math.PI*2);ctx.stroke()}}}
  const sp=()=>{drawing.current=false;last.current=null}
  const clr=()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;ctx.fillStyle=canvasBg;ctx.fillRect(0,0,c.width,c.height)}
  const COLS=['#FFFFFF','#EF4444','#3B82F6','#F59E0B','#10B981','#000000']
  const TOOLS=[{id:'pen',icon:PenLine},{id:'eraser',icon:Eraser},{id:'line',icon:Minus},{id:'rect',icon:Square},{id:'circle',icon:Circle}] as any[]
  return(
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',flexWrap:'wrap',background:C.card,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:'flex',gap:2,background:C.surface,padding:3,borderRadius:8}}>
          {TOOLS.map((t:any)=><button key={t.id} onClick={()=>setTool(t.id)} style={{width:26,height:26,borderRadius:5,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:tool===t.id?C.blue:'transparent',color:tool===t.id?'#fff':C.textMuted}}><t.icon style={{width:12,height:12}}/></button>)}
        </div>
        <div style={{display:'flex',gap:3}}>{COLS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:color===c?18:13,height:color===c?18:13,borderRadius:'50%',background:c,border:color===c?`2px solid ${C.blueLight}`:'1px solid rgba(255,255,255,0.15)',cursor:'pointer'}}/>)}</div>
        <div style={{display:'flex',gap:2,alignItems:'center'}}>{[2,4,8,14].map(s=><button key={s} onClick={()=>setSize(s)} style={{width:Math.max(s+4,10),height:Math.max(s+4,10),borderRadius:'50%',background:size===s?color:C.textDim,border:'none',cursor:'pointer'}}/>)}</div>
        <button onClick={clr} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:5,border:'none',cursor:'pointer',background:C.redDim,color:C.red,fontSize:11}}><Trash2 style={{width:10,height:10}}/>Clear</button>
      </div>
      <canvas ref={ref} width={1280} height={720} style={{flex:1,width:'100%',height:'100%',cursor:tool==='eraser'?'cell':'crosshair',touchAction:'none',background:canvasBg}}
        onMouseDown={sd} onMouseMove={dr} onMouseUp={sp} onMouseLeave={sp}
        onTouchStart={sd} onTouchMove={dr} onTouchEnd={sp}/>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LiveRoomPage(){
  const {id}=useParams(); const router=useRouter()
  const eventId=id as string
  const width=useWindowWidth()
  const isMobile=width<768
  const isTablet=width>=768&&width<1024

  const [event,setEvent]=useState<any>(null)
  const [user,setUser]=useState<any>(null)
  const [profile,setProfile]=useState<any>(null)
  const [isHost,setIsHost]=useState(false)
  const [isCohost,setIsCohost]=useState(false)
  const [messages,setMessages]=useState<any[]>([])
  const [newMsg,setNewMsg]=useState('')
  const [viewers,setViewers]=useState(1)
  const [micOn,setMicOn]=useState(true)
  const [camOn,setCamOn]=useState(true)
  const [muted,setMuted]=useState(false)
  const [streaming,setStreaming]=useState(false)
  const [loading,setLoading]=useState(true)
  const [accessDenied,setAccessDenied]=useState(false)
  const [mode,setMode]=useState<Mode>('camera')
  const [boardBg,setBoardBg]=useState('#0A0A0F')
  const [reactions,setReactions]=useState(0)
  const [liked,setLiked]=useState(false)
  const [earnings,setEarnings]=useState(0)
  const [sendingMsg,setSendingMsg]=useState(false)
  const [remoteStream,setRemoteStream]=useState<MediaStream|null>(null)
  const [recording,setRecording]=useState(false)
  const [recStatus,setRecStatus]=useState('')
  const [showChat,setShowChat]=useState(false) // mobile chat toggle
  const [streamStatus,setStreamStatus]=useState<'waiting'|'connecting'|'connected'|'ended'>('waiting')
  const [retryCount,setRetryCount]=useState(0)

  const localVideoRef=useRef<HTMLVideoElement>(null)
  const remoteVideoRef=useRef<HTMLVideoElement>(null)
  const streamRef=useRef<MediaStream|null>(null)
  const screenStreamRef=useRef<MediaStream|null>(null)
  const chatBottomRef=useRef<HTMLDivElement>(null)
  const channelRef=useRef<any>(null)
  const sigChannelRef=useRef<any>(null)
  const peerRef=useRef<RTCPeerConnection|null>(null)
  const viewerPeers=useRef<Map<string,RTCPeerConnection>>(new Map())
  const isHostRef=useRef(false)
  const userIdRef=useRef('')
  const profileRef=useRef<any>(null)
  const mediaRecRef=useRef<MediaRecorder|null>(null)
  const recChunks=useRef<Blob[]>([])
  const retryTimerRef=useRef<any>(null)
  const connectedRef=useRef(false)

  useEffect(()=>{
    const init=async()=>{
      const {data:{user:u}}=await supabase.auth.getUser()
      if(!u){router.push('/auth/login');return}
      setUser(u);userIdRef.current=u.id

      const {data:prof}=await supabase.from('users').select('*').eq('id',u.id).single()
      setProfile(prof);profileRef.current=prof

      const {data:ev}=await supabase.from('events').select('*, users(id,email,full_name,photo_url)').eq('id',eventId).single()
      if(!ev){router.push('/dashboard');return}
      setEvent(ev)

      const isEventHost=ev.host_id===u.id||prof?.role==='admin'
      setIsHost(isEventHost);isHostRef.current=isEventHost

      const {data:cohostRow}=await supabase.from('event_cohosts').select('id').eq('event_id',eventId).eq('user_id',u.id).maybeSingle()
      const isCo=!!cohostRow;setIsCohost(isCo)
      if(isCo) isHostRef.current=true
      const canControl=isEventHost||isCo

      if(!canControl&&(ev.price>0||!ev.is_free)){
        const {data:ticket}=await supabase.from('tickets').select('id').eq('user_id',u.id).eq('event_id',eventId).in('status',['paid','free','confirmed','active']).maybeSingle()
        if(!ticket){setAccessDenied(true);setLoading(false);return}
      }

      // Load persisted chat
      const {data:pastMsgs}=await supabase.from('live_messages').select('*').eq('event_id',eventId).order('created_at',{ascending:true}).limit(200)
      if(pastMsgs?.length){
        setMessages(pastMsgs.map(m=>({id:m.id,user_id:m.user_id,name:m.user_name,avatar:m.user_avatar,text:m.content,ts:new Date(m.created_at).getTime(),isHost:m.is_host})))
        setTimeout(()=>chatBottomRef.current?.scrollIntoView({behavior:'smooth'}),100)
      }

      const {count:rc}=await supabase.from('event_reactions').select('*',{count:'exact',head:true}).eq('event_id',eventId)
      setReactions(rc||0)
      const {data:myR}=await supabase.from('event_reactions').select('id').eq('event_id',eventId).eq('user_id',u.id).maybeSingle()
      if(myR) setLiked(true)

      if(isEventHost){
        const {data:tix}=await supabase.from('tickets').select('amount').eq('event_id',eventId).eq('status','paid')
        setEarnings((tix||[]).reduce((s:number,t:any)=>s+Math.floor(t.amount*0.8),0))
      }

      // If event is already live and viewer, set connecting state
      if(!canControl&&ev.status==='live') setStreamStatus('connecting')

      setLoading(false)

      // ── Chat channel ──
      const ch=supabase.channel(`live-${eventId}`,{config:{presence:{key:u.id}}})
        .on('broadcast',{event:'chat'},({payload})=>{
          setMessages(prev=>prev.find(m=>m.id===payload.id)?prev:[...prev,payload])
          setTimeout(()=>chatBottomRef.current?.scrollIntoView({behavior:'smooth'}),50)
        })
        .on('broadcast',{event:'reaction'},()=>setReactions(p=>p+1))
        .on('presence',{event:'sync'},()=>{
          const state=ch.presenceState()
          setViewers(Object.keys(state).length)
        })
        .subscribe(async(status)=>{if(status==='SUBSCRIBED') await ch.track({user_id:u.id})})
      channelRef.current=ch

      // ── WebRTC signaling ──
      setupSignaling(u.id, canControl)

      if(isEventHost){
        supabase.channel('earn-tick')
          .on('postgres_changes',{event:'INSERT',schema:'public',table:'tickets',filter:`event_id=eq.${eventId}`},
            (p:any)=>setEarnings(prev=>prev+Math.floor(p.new.amount*0.8)))
          .subscribe()
      }
    }
    init()
    return ()=>{
      clearTimeout(retryTimerRef.current)
      streamRef.current?.getTracks().forEach(t=>t.stop())
      screenStreamRef.current?.getTracks().forEach(t=>t.stop())
      peerRef.current?.close()
      viewerPeers.current.forEach(pc=>pc.close())
      if(channelRef.current) supabase.removeChannel(channelRef.current)
      if(sigChannelRef.current) supabase.removeChannel(sigChannelRef.current)
    }
  },[eventId])

  useEffect(()=>{
    if(remoteVideoRef.current&&remoteStream){
      remoteVideoRef.current.srcObject=remoteStream
    }
  },[remoteStream])

  // ── Setup signaling ────────────────────────────────────────────────────────
  const setupSignaling=(uid:string, canControl:boolean)=>{
    const sig=supabase.channel(`signal-${eventId}`)

    if(!canControl){
      // VIEWER side
      sig.on('broadcast',{event:'offer'},async({payload})=>{
        // Accept offers targeted to me, or broadcast offers
        if(payload.to&&payload.to!==uid) return

        // Close old connection if any
        if(peerRef.current){peerRef.current.close();peerRef.current=null}

        const pc=createViewerPC(uid)
        peerRef.current=pc
        setStreamStatus('connecting')

        try{
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          const answer=await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sig.send({type:'broadcast',event:'answer',payload:{sdp:pc.localDescription,viewerId:uid}})
        }catch(e){console.error('offer handling error',e)}
      })

      sig.on('broadcast',{event:'ice-to-viewer'},async({payload})=>{
        if(payload.viewerId!==uid) return
        const pc=peerRef.current
        if(pc){
          try{
            if(pc.remoteDescription){
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            }
          }catch{}
        }
      })

      // Host went live — request offer
      sig.on('broadcast',{event:'host-live'},()=>{
        setStreamStatus('connecting')
        // Small delay then request offer
        setTimeout(()=>{
          sig.send({type:'broadcast',event:'viewer-request',payload:{viewerId:uid}})
        },500)
      })

      // Stream ended
      sig.on('broadcast',{event:'stream-ended'},()=>{
        setStreamStatus('ended')
        setRemoteStream(null)
      })
    }

    if(canControl){
      // HOST side — when viewer requests, send them an offer
      sig.on('broadcast',{event:'viewer-request'},async({payload})=>{
        if(!streamRef.current) return
        const {viewerId}=payload
        // Close any existing connection to this viewer
        viewerPeers.current.get(viewerId)?.close()
        const pc=createHostPC(viewerId,sig,streamRef.current)
        viewerPeers.current.set(viewerId,pc)
      })

      // Legacy viewer-joined event (backward compat)
      sig.on('broadcast',{event:'viewer-joined'},async({payload})=>{
        if(!streamRef.current) return
        const {viewerId}=payload
        viewerPeers.current.get(viewerId)?.close()
        const pc=createHostPC(viewerId,sig,streamRef.current)
        viewerPeers.current.set(viewerId,pc)
      })

      sig.on('broadcast',{event:'answer'},async({payload})=>{
        const pc=viewerPeers.current.get(payload.viewerId)
        if(pc&&!pc.remoteDescription){
          try{await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))}catch{}
        }
      })

      sig.on('broadcast',{event:'ice-to-host'},async({payload})=>{
        const pc=viewerPeers.current.get(payload.viewerId)
        if(pc?.remoteDescription){
          try{await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))}catch{}
        }
      })
    }

    sig.subscribe(async(status)=>{
      if(status==='SUBSCRIBED'&&!canControl){
        // After subscribing, check if host is already live and request stream
        const {data:ev}=await supabase.from('events').select('status').eq('id',eventId).single()
        if(ev?.status==='live'){
          setStreamStatus('connecting')
          setTimeout(()=>{
            sig.send({type:'broadcast',event:'viewer-request',payload:{viewerId:uid}})
          },800)
          // Retry every 5s if not connected yet
          scheduleRetry(sig, uid)
        }
      }
    })

    sigChannelRef.current=sig
  }

  // Retry requesting stream every 5s until connected
  const scheduleRetry=(sig:any,uid:string)=>{
    clearTimeout(retryTimerRef.current)
    retryTimerRef.current=setTimeout(()=>{
      if(!connectedRef.current&&sigChannelRef.current){
        setRetryCount(p=>p+1)
        sig.send({type:'broadcast',event:'viewer-request',payload:{viewerId:uid}})
        scheduleRetry(sig,uid)
      }
    },5000)
  }

  // ── WebRTC helpers ─────────────────────────────────────────────────────────
  const createHostPC=(viewerId:string,sig:any,stream:MediaStream)=>{
    const pc=new RTCPeerConnection({iceServers:ICE})
    stream.getTracks().forEach(t=>pc.addTrack(t,stream))
    pc.onicecandidate=(e)=>{
      if(e.candidate) sig.send({type:'broadcast',event:'ice-to-viewer',payload:{candidate:e.candidate,viewerId}})
    }
    pc.onnegotiationneeded=()=>{
      pc.createOffer().then(offer=>{
        pc.setLocalDescription(offer)
        sig.send({type:'broadcast',event:'offer',payload:{sdp:pc.localDescription,to:viewerId}})
      })
    }
    return pc
  }

  const createViewerPC=(viewerId:string)=>{
    const pc=new RTCPeerConnection({iceServers:ICE})
    const ms=new MediaStream()
    pc.ontrack=(e)=>{
      e.streams[0]?.getTracks().forEach(t=>ms.addTrack(t))
      setRemoteStream(ms)
      setStreamStatus('connected')
      connectedRef.current=true
      clearTimeout(retryTimerRef.current)
    }
    pc.onicecandidate=(e)=>{
      if(e.candidate&&sigChannelRef.current)
        sigChannelRef.current.send({type:'broadcast',event:'ice-to-host',payload:{candidate:e.candidate,viewerId}})
    }
    pc.onconnectionstatechange=()=>{
      if(pc.connectionState==='failed'||pc.connectionState==='disconnected'){
        setStreamStatus('connecting')
        connectedRef.current=false
        // Retry after 2s
        setTimeout(()=>{
          if(!connectedRef.current&&sigChannelRef.current){
            sigChannelRef.current.send({type:'broadcast',event:'viewer-request',payload:{viewerId:userIdRef.current}})
          }
        },2000)
      }
    }
    return pc
  }

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording=(stream:MediaStream)=>{
    recChunks.current=[]
    const opts=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?{mimeType:'video/webm;codecs=vp9'}:MediaRecorder.isTypeSupported('video/webm')?{mimeType:'video/webm'}:{}
    try{
      const rec=new MediaRecorder(stream,opts)
      rec.ondataavailable=(e)=>{if(e.data.size>0) recChunks.current.push(e.data)}
      rec.start(3000);mediaRecRef.current=rec;setRecording(true);setRecStatus('● REC')
    }catch(e){console.error('Recording failed',e)}
  }

  const stopRecordingAndUpload=async()=>{
    const rec=mediaRecRef.current
    if(!rec||rec.state==='inactive') return
    setRecStatus('Saving...')
    await new Promise<void>(resolve=>{rec.onstop=()=>resolve();rec.stop()})
    setRecording(false)
    if(!recChunks.current.length){setRecStatus('');return}
    const mimeType=rec.mimeType||'video/webm'
    const blob=new Blob(recChunks.current,{type:mimeType})
    const ext=mimeType.includes('mp4')?'mp4':'webm'
    const path=`${eventId}/${Date.now()}.${ext}`
    setRecStatus('Uploading...')
    const {error}=await supabase.storage.from('event-recordings').upload(path,blob,{contentType:mimeType,upsert:true})
    if(error){setRecStatus('Upload failed');return}
    const {data:urlData}=await supabase.storage.from('event-recordings').createSignedUrl(path,60*60*24*30)
    await supabase.from('event_recordings').insert({event_id:eventId,host_id:userIdRef.current,storage_path:path,public_url:urlData?.signedUrl||'',size_bytes:blob.size,premium_only:true})
    setRecStatus('✓ Saved!');setTimeout(()=>setRecStatus(''),3000);recChunks.current=[]
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  const startStream=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true})
      streamRef.current=stream
      if(localVideoRef.current){localVideoRef.current.srcObject=stream;localVideoRef.current.muted=true}
      setStreaming(true);setMode('camera')
      await supabase.from('events').update({status:'live'}).eq('id',eventId)
      // Notify viewers
      sigChannelRef.current?.send({type:'broadcast',event:'host-live',payload:{}})
      // Send offers to all currently online viewers
      const state=channelRef.current?.presenceState()||{}
      Object.keys(state).filter(vid=>vid!==userIdRef.current).forEach(vid=>{
        const pc=createHostPC(vid,sigChannelRef.current!,stream)
        viewerPeers.current.set(vid,pc)
      })
      startRecording(stream)
    }catch{alert('Could not access camera/microphone.')}
  }

  const stopStream=async()=>{
    sigChannelRef.current?.send({type:'broadcast',event:'stream-ended',payload:{}})
    await stopRecordingAndUpload()
    streamRef.current?.getTracks().forEach(t=>t.stop())
    screenStreamRef.current?.getTracks().forEach(t=>t.stop())
    viewerPeers.current.forEach(pc=>pc.close());viewerPeers.current.clear()
    if(localVideoRef.current) localVideoRef.current.srcObject=null
    setStreaming(false)
    await supabase.from('events').update({status:'ended',ended_at:new Date().toISOString()}).eq('id',eventId)
    router.push(isHost?'/host':'/dashboard')
  }

  const toggleMic=()=>{streamRef.current?.getAudioTracks().forEach(t=>{t.enabled=!t.enabled});setMicOn(p=>!p)}
  const toggleCam=()=>{streamRef.current?.getVideoTracks().forEach(t=>{t.enabled=!t.enabled});setCamOn(p=>!p)}

  const startScreenShare=async()=>{
    try{
      const screen=await (navigator.mediaDevices as any).getDisplayMedia({video:true,audio:true})
      screenStreamRef.current=screen
      if(localVideoRef.current) localVideoRef.current.srcObject=screen
      setMode('screen')
      const vt=screen.getVideoTracks()[0]
      viewerPeers.current.forEach(pc=>{pc.getSenders().find(s=>s.track?.kind==='video')?.replaceTrack(vt)})
      vt.onended=()=>{
        if(streamRef.current&&localVideoRef.current) localVideoRef.current.srcObject=streamRef.current
        const ct=streamRef.current?.getVideoTracks()[0]
        if(ct) viewerPeers.current.forEach(pc=>{pc.getSenders().find(s=>s.track?.kind==='video')?.replaceTrack(ct)})
        setMode('camera');screenStreamRef.current=null
      }
    }catch{}
  }

  const stopScreenShare=()=>{
    screenStreamRef.current?.getTracks().forEach(t=>t.stop());screenStreamRef.current=null
    if(streamRef.current&&localVideoRef.current) localVideoRef.current.srcObject=streamRef.current
    const ct=streamRef.current?.getVideoTracks()[0]
    if(ct) viewerPeers.current.forEach(pc=>{pc.getSenders().find(s=>s.track?.kind==='video')?.replaceTrack(ct)})
    setMode('camera')
  }

  const sendMessage=async()=>{
    if(!newMsg.trim()||!user||sendingMsg) return
    setSendingMsg(true)
    const p=profileRef.current||profile
    const msg={id:crypto.randomUUID(),user_id:user.id,name:getName(p||user),avatar:p?.photo_url||user.user_metadata?.avatar_url||'',text:newMsg.trim().slice(0,500),ts:Date.now(),isHost:isHost||isCohost}
    setNewMsg('')
    setMessages(prev=>[...prev,msg])
    setTimeout(()=>chatBottomRef.current?.scrollIntoView({behavior:'smooth'}),50)
    await supabase.from('live_messages').insert({id:msg.id,event_id:eventId,user_id:user.id,user_name:msg.name,user_avatar:msg.avatar,is_host:msg.isHost,content:msg.text})
    channelRef.current?.send({type:'broadcast',event:'chat',payload:msg})
    setSendingMsg(false)
  }

  const handleLike=async()=>{
    if(!user||liked) return
    setLiked(true);setReactions(p=>p+1)
    await supabase.from('event_reactions').insert({event_id:eventId,user_id:user.id})
    channelRef.current?.send({type:'broadcast',event:'reaction',payload:{}})
  }

  const canControl=isHost||isCohost
  const initials=getInitials(profile||user)

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg}}>
      <div style={{textAlign:'center'}}><Loader2 style={{width:32,height:32,color:C.blueLight,animation:'spin 1s linear infinite',marginBottom:12}}/><p style={{color:C.textMuted,fontFamily:'DM Sans,sans-serif',fontSize:14}}>Joining room...</p></div>
    </div>
  )

  if(accessDenied) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:C.bg}}>
      <div style={{borderRadius:24,padding:32,textAlign:'center',maxWidth:340,width:'100%',background:C.card,border:`1px solid ${C.border}`}}>
        <Shield style={{width:40,height:40,color:C.red,marginBottom:16}}/>
        <h2 style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:'Syne,sans-serif',marginBottom:8}}>Ticket Required</h2>
        <p style={{fontSize:14,color:C.textMuted,fontFamily:'DM Sans,sans-serif',marginBottom:20}}>You need a ticket to join.</p>
        <button onClick={()=>router.push(`/events/${eventId}`)} style={{width:'100%',padding:'13px',borderRadius:12,border:'none',background:C.gold,color:'#0A0F1E',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:15,cursor:'pointer'}}>Get Ticket →</button>
      </div>
    </div>
  )

  // ── Video area content ─────────────────────────────────────────────────────
  const VideoArea=()=>(
    <div style={{position:'relative',width:'100%',height:'100%',background:'#000'}}>
      {/* Host local */}
      <video ref={localVideoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',display:canControl&&mode==='camera'&&streaming?'block':'none'}}/>
      {/* Viewer remote */}
      <video ref={remoteVideoRef} autoPlay playsInline muted={muted} style={{width:'100%',height:'100%',objectFit:'cover',display:!canControl&&streamStatus==='connected'?'block':'none'}}/>
      {/* Whiteboard */}
      {mode==='whiteboard'&&<div style={{position:'absolute',inset:0}}><Whiteboard bg={boardBg}/></div>}

      {/* Placeholder */}
      {((canControl&&!streaming)||((!canControl)&&streamStatus!=='connected'&&mode!=='whiteboard'))&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:20}}>
          <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',background:avatarColor(event?.users?.id||'')+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:avatarColor(event?.users?.id||''),border:`2px solid ${avatarColor(event?.users?.id||'')}44`}}>
            {event?.users?.photo_url?<img src={event.users.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:getInitials(event?.users)}
          </div>
          <div style={{textAlign:'center'}}>
            {canControl?(
              <>
                <p style={{color:'#fff',fontWeight:600,fontSize:15,marginBottom:6,fontFamily:'DM Sans,sans-serif'}}>You're the {isHost?'host':'co-host'}</p>
                <p style={{color:C.textMuted,fontSize:13,marginBottom:20,fontFamily:'DM Sans,sans-serif'}}>Ready to go live?</p>
                <button onClick={startStream} style={{display:'flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:14,border:'none',background:C.red,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:15,cursor:'pointer',margin:'0 auto',boxShadow:'0 4px 20px rgba(239,68,68,0.4)'}}>
                  <Radio style={{width:18,height:18}}/> Go Live
                </button>
              </>
            ):(
              <>
                <p style={{color:'#fff',fontWeight:600,fontSize:15,marginBottom:4,fontFamily:'DM Sans,sans-serif'}}>{getName(event?.users)}</p>
                {streamStatus==='connecting'&&(
                  <>
                    <p style={{color:C.textMuted,fontSize:13,marginBottom:12,fontFamily:'DM Sans,sans-serif'}}>Connecting to stream...</p>
                    <div style={{width:24,height:24,border:`2px solid ${C.blue}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
                    {retryCount>0&&<p style={{color:C.textDim,fontSize:11,marginTop:8,fontFamily:'DM Sans,sans-serif'}}>Retrying... ({retryCount})</p>}
                  </>
                )}
                {streamStatus==='waiting'&&<p style={{color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>Waiting for host to go live</p>}
                {streamStatus==='ended'&&<p style={{color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>Stream has ended</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Cam off overlay */}
      {canControl&&streaming&&!camOn&&mode==='camera'&&(
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:C.surface}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:avatarColor(user?.id||'')+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:avatarColor(user?.id||''),margin:'0 auto 8px'}}>{initials}</div>
            <p style={{color:C.textMuted,fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Camera off</p>
          </div>
        </div>
      )}
      {mode==='screen'&&<div style={{position:'absolute',top:12,left:12,display:'flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,background:'rgba(37,99,235,0.25)',border:`1px solid rgba(37,99,235,0.4)`}}><Monitor style={{width:13,height:13,color:C.blueLight}}/><span style={{fontSize:11,fontWeight:700,color:C.blueLight}}>Sharing Screen</span></div>}
    </div>
  )

  // ── Chat panel ─────────────────────────────────────────────────────────────
  const ChatPanel=()=>(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg}}>
      <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:C.card}}>
        <div>
          <span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:'DM Sans,sans-serif'}}>Live Chat</span>
          <span style={{fontSize:11,color:C.textDim,fontFamily:'DM Sans,sans-serif',marginLeft:6}}>{messages.length}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {reactions>0&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:12,color:C.red}}><Heart style={{width:12,height:12,fill:C.red}}/>{reactions}</span>}
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.textMuted}}><Users style={{width:13,height:13}}/>{viewers}</div>
          {isMobile&&<button onClick={()=>setShowChat(false)} style={{background:'none',border:'none',cursor:'pointer',color:C.textMuted,padding:4}}><ChevronDown style={{width:18,height:18}}/></button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:10}}>
        {messages.length===0&&<div style={{textAlign:'center',paddingTop:32}}><p style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>Chat is live — say hello! 👋</p></div>}
        {messages.map(msg=>(
          <div key={msg.id} style={{display:'flex',gap:8}}>
            <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',overflow:'hidden',background:msg.isHost?`linear-gradient(135deg,${C.gold},#F97316)`:`linear-gradient(135deg,${C.blue},${C.blueLight})`}}>
              {msg.avatar?<img src={msg.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:msg.name?.[0]?.toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                <span style={{fontSize:11,fontWeight:700,color:msg.isHost?C.gold:C.blueLight,fontFamily:'DM Sans,sans-serif'}}>{msg.name}</span>
                {msg.isHost&&<span style={{fontSize:8,padding:'1px 5px',borderRadius:4,background:C.goldDim,color:C.gold,fontWeight:700}}>HOST</span>}
                <span style={{fontSize:10,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>{fmtTime(msg.ts)}</span>
              </div>
              <p style={{fontSize:13,color:'#D4DBEE',fontFamily:'DM Sans,sans-serif',lineHeight:1.5,wordBreak:'break-word'}}>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatBottomRef}/>
      </div>
      <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:'flex',gap:8}}>
          <input type="text" value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
            placeholder="Say something..." maxLength={500}
            style={{flex:1,padding:'10px 14px',borderRadius:12,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none'}}
            onFocus={e=>(e.target.style.borderColor='rgba(37,99,235,0.5)')} onBlur={e=>(e.target.style.borderColor=C.border)}/>
          <button onClick={sendMessage} disabled={!newMsg.trim()||sendingMsg}
            style={{width:40,height:40,borderRadius:12,border:'none',cursor:'pointer',background:C.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',opacity:!newMsg.trim()||sendingMsg?0.4:1}}>
            {sendingMsg?<Loader2 style={{width:16,height:16,animation:'spin 0.8s linear infinite'}}/>:<Send style={{width:16,height:16}}/>}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Host controls bar ──────────────────────────────────────────────────────
  const HostControls=()=>(
    <div style={{flexShrink:0,background:C.surface,borderTop:`1px solid ${C.border}`,padding:isMobile?'10px 12px':'12px 16px'}}>
      {streaming&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:10,flexWrap:'wrap'}}>
          {[{label:'Camera',active:mode==='camera',action:()=>{if(screenStreamRef.current){screenStreamRef.current.getTracks().forEach(t=>t.stop());screenStreamRef.current=null};if(streamRef.current&&localVideoRef.current)localVideoRef.current.srcObject=streamRef.current;setMode('camera')},icon:Video},
            {label:mode==='screen'?'Stop Share':'Screen',active:mode==='screen',action:mode==='screen'?stopScreenShare:startScreenShare,icon:Monitor},
          ].map(btn=>(
            <button key={btn.label} onClick={btn.action} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,border:`1px solid ${btn.active?'rgba(37,99,235,0.4)':'transparent'}`,background:btn.active?C.blueDim:'rgba(51,65,85,0.4)',color:btn.active?C.blueLight:C.textDim,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
              <btn.icon style={{width:12,height:12}}/>{btn.label}
            </button>
          ))}
          {[{n:'White',v:'#F8FAFC'},{n:'Dark',v:'#0A0A0F'},{n:'Green',v:'#14532D'}].map(b=>(
            <button key={b.v} onClick={()=>{setBoardBg(b.v);setMode('whiteboard')}} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,border:`1px solid ${mode==='whiteboard'&&boardBg===b.v?'rgba(124,58,237,0.4)':'transparent'}`,background:mode==='whiteboard'&&boardBg===b.v?'rgba(124,58,237,0.15)':'rgba(51,65,85,0.4)',color:mode==='whiteboard'&&boardBg===b.v?'#A78BFA':C.textDim,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
              <div style={{width:10,height:10,borderRadius:2,background:b.v,border:'1px solid rgba(255,255,255,0.2)'}}/>{b.n}
            </button>
          ))}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
        <button onClick={toggleMic} style={{width:44,height:44,borderRadius:'50%',border:`1px solid ${micOn?C.border:C.red+'44'}`,background:micOn?C.card:C.redDim,color:micOn?C.text:C.red,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          {micOn?<Mic style={{width:18,height:18}}/>:<MicOff style={{width:18,height:18}}/>}
        </button>
        <button onClick={toggleCam} style={{width:44,height:44,borderRadius:'50%',border:`1px solid ${camOn?C.border:C.red+'44'}`,background:camOn?C.card:C.redDim,color:camOn?C.text:C.red,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          {camOn?<Video style={{width:18,height:18}}/>:<VideoOff style={{width:18,height:18}}/>}
        </button>
        {streaming?(
          <button onClick={stopStream} style={{display:'flex',alignItems:'center',gap:6,padding:'11px 24px',borderRadius:24,border:'none',background:C.red,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 4px 16px rgba(239,68,68,0.3)'}}>
            <PhoneOff style={{width:16,height:16}}/>End Stream
          </button>
        ):(
          <button onClick={startStream} style={{display:'flex',alignItems:'center',gap:6,padding:'11px 24px',borderRadius:24,border:'none',background:C.red,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 4px 16px rgba(239,68,68,0.3)'}}>
            <Radio style={{width:16,height:16}}/>Go Live
          </button>
        )}
      </div>
    </div>
  )

  // ── Viewer controls bar ────────────────────────────────────────────────────
  const ViewerControls=()=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,padding:'10px 16px',background:C.surface,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
      <button onClick={()=>setMuted(m=>!m)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:20,border:`1px solid ${C.border}`,background:muted?C.redDim:C.card,color:muted?C.red:C.textMuted,cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif'}}>
        {muted?<VolumeX style={{width:15,height:15}}/>:<Volume2 style={{width:15,height:15}}/>}
        {muted?'Unmute':'Mute'}
      </button>
      <button onClick={handleLike} disabled={liked} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:20,border:`1px solid ${liked?C.red+'44':C.border}`,background:liked?C.redDim:C.card,color:liked?C.red:C.textMuted,cursor:liked?'default':'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif',opacity:liked?0.8:1}}>
        <Heart style={{width:15,height:15,fill:liked?C.red:'none',stroke:liked?C.red:'currentColor'}}/>{reactions>0?reactions:'Like'}
      </button>
      {isMobile&&(
        <button onClick={()=>setShowChat(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:20,border:`1px solid ${C.border}`,background:C.card,color:C.blueLight,cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif',position:'relative'}}>
          <MessageCircle style={{width:15,height:15}}/>Chat
          {messages.length>0&&<span style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:C.blue,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{messages.length>9?'9+':messages.length}</span>}
        </button>
      )}
    </div>
  )

  // ── Top bar ────────────────────────────────────────────────────────────────
  const TopBar=()=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:C.card,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
        {event?.status==='live'&&<span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:C.redDim,color:C.red,flexShrink:0}}><span style={{width:6,height:6,borderRadius:'50%',background:C.red,animation:'pulse 1s infinite'}}/>LIVE</span>}
        <h1 style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:'DM Sans,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{event?.title}</h1>
        {canControl&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:C.goldDim,color:C.gold,flexShrink:0}}><Crown style={{width:10,height:10}}/>{isHost?'Host':'Co-host'}</span>}
        {recording&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:'rgba(239,68,68,0.15)',color:C.red,flexShrink:0,animation:'pulse 1s infinite'}}>⬤ REC</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        {recStatus&&<span style={{fontSize:11,color:C.gold,fontFamily:'DM Sans,sans-serif',display:'none'}} className="sm-show">{recStatus}</span>}
        {isHost&&<div style={{display:'flex',alignItems:'center',gap:4,fontSize:13,fontWeight:700,color:C.gold}}>${(earnings/100).toFixed(2)}</div>}
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.textMuted}}><Users style={{width:13,height:13}}/>{viewers}</div>
        <button onClick={()=>router.push('/dashboard')} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.textMuted,fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>Leave</button>
      </div>
    </div>
  )

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',background:C.bg}}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        * { box-sizing: border-box; }
      `}</style>

      <TopBar/>

      {/* MOBILE layout */}
      {isMobile&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
          {/* Video fills screen */}
          <div style={{flex:1,position:'relative',overflow:'hidden'}}><VideoArea/></div>
          {/* Controls at bottom */}
          {canControl?<HostControls/>:<ViewerControls/>}

          {/* Chat slides up as overlay */}
          {showChat&&(
            <div style={{position:'absolute',inset:0,zIndex:30,display:'flex',flexDirection:'column',background:C.bg}}>
              <ChatPanel/>
            </div>
          )}

          {/* Floating chat button when chat hidden */}
          {!showChat&&!canControl&&(
            <button onClick={()=>setShowChat(true)} style={{position:'absolute',bottom:70,right:16,zIndex:20,width:48,height:48,borderRadius:'50%',background:C.blue,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(37,99,235,0.4)'}}>
              <MessageCircle style={{width:20,height:20,color:'#fff'}}/>
              {messages.length>0&&<span style={{position:'absolute',top:-2,right:-2,width:18,height:18,borderRadius:'50%',background:C.red,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{messages.length>9?'9+':messages.length}</span>}
            </button>
          )}
          {!showChat&&canControl&&(
            <button onClick={()=>setShowChat(true)} style={{position:'absolute',bottom:isMobile?80:70,right:16,zIndex:20,width:44,height:44,borderRadius:'50%',background:C.card,border:`1px solid ${C.border}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <MessageCircle style={{width:18,height:18,color:C.textMuted}}/>
            </button>
          )}
        </div>
      )}

      {/* TABLET layout */}
      {isTablet&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            <div style={{flex:'0 0 60%',display:'flex',flexDirection:'column'}}>
              <div style={{flex:1,position:'relative',overflow:'hidden'}}><VideoArea/></div>
              {canControl?<HostControls/>:<ViewerControls/>}
            </div>
            <div style={{flex:'0 0 40%',borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <ChatPanel/>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP layout */}
      {!isMobile&&!isTablet&&(
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          <div style={{flex:'0 0 70%',display:'flex',flexDirection:'column'}}>
            <div style={{flex:1,position:'relative',overflow:'hidden'}}><VideoArea/></div>
            {canControl?<HostControls/>:<ViewerControls/>}
          </div>
          <div style={{flex:'0 0 30%',borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <ChatPanel/>
          </div>
        </div>
      )}
    </div>
  )
}
