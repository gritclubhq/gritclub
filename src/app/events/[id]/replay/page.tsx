'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Lock, Play, Loader2, ChevronLeft, Crown, Clock } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)', text:'#F0F4FF',
  textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', purple:'#7C3AED', purpleDim:'rgba(124,58,237,0.1)',
}

const getName = (u:any) => u?.full_name||u?.email?.split('@')[0]||'Host'
const fmt = (sec:number) => { const m=Math.floor(sec/60),s=sec%60; return `${m}:${s.toString().padStart(2,'0')}` }

export default function EventReplayPage() {
  const {id}   = useParams()
  const router = useRouter()
  const eventId = id as string

  const [event,      setEvent]      = useState<any>(null)
  const [recording,  setRecording]  = useState<any>(null)
  const [profile,    setProfile]    = useState<any>(null)
  const [messages,   setMessages]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [canWatch,   setCanWatch]   = useState(false)
  const [playing,    setPlaying]    = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(()=>{
    const init = async () => {
      const {data:{user}} = await supabase.auth.getUser()
      if(!user){router.push('/auth/login');return}

      const {data:prof} = await supabase.from('users').select('*').eq('id',user.id).single()
      setProfile(prof)

      const {data:ev} = await supabase.from('events').select('*, users(id,full_name,email,photo_url)').eq('id',eventId).single()
      setEvent(ev)

      // Check if user can watch
      const isHost = ev?.host_id===user.id || prof?.role==='admin'
      const isPremium = prof?.is_premium===true || prof?.role==='host' || prof?.role==='admin'
      const watchAllowed = isHost || isPremium

      setCanWatch(watchAllowed)

      if(watchAllowed){
        // Load recording
        const {data:rec} = await supabase
          .from('event_recordings')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at',{ascending:false})
          .limit(1)
          .maybeSingle()
        setRecording(rec)

        // Load chat history
        const {data:msgs} = await supabase
          .from('live_messages')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at',{ascending:true})
          .limit(500)
        setMessages(msgs||[])
      }

      setLoading(false)
    }
    init()
  },[eventId])

  if(loading) return (
    <DashboardLayout>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh',background:C.bg}}>
        <Loader2 style={{width:28,height:28,color:C.blueLight,animation:'spin 1s linear infinite'}}/>
      </div>
    </DashboardLayout>
  )

  // Not premium — upgrade wall
  if(!canWatch) return (
    <DashboardLayout>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{background:C.bg,minHeight:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{maxWidth:420,width:'100%',borderRadius:24,padding:40,textAlign:'center',background:C.card,border:`1px solid rgba(124,58,237,0.3)`}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:`2px solid rgba(124,58,237,0.3)`}}>
            <Lock style={{width:28,height:28,color:C.purple}}/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em',marginBottom:8}}>Premium Only</h2>
          <p style={{fontSize:14,color:C.textMuted,fontFamily:'DM Sans,sans-serif',lineHeight:1.7,marginBottom:24}}>
            Replay access is available for <strong style={{color:C.gold}}>GritClub Pro</strong> members. Upgrade to watch this session and all past recordings.
          </p>
          <div style={{borderRadius:16,padding:20,background:C.surface,border:`1px solid ${C.border}`,marginBottom:24,textAlign:'left'}}>
            {['Watch all session replays','Download recordings','Exclusive networking','Priority event access'].map(f=>(
              <div key={f} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:C.goldDim,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontSize:10,color:C.gold}}>✓</span>
                </div>
                <span style={{fontSize:13,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>{f}</span>
              </div>
            ))}
          </div>
          <Link href="/pricing" style={{textDecoration:'none'}}>
            <button style={{width:'100%',padding:'14px',borderRadius:14,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${C.purple},#6D28D9)`,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <Crown style={{width:16,height:16}}/> Upgrade to Pro →
            </button>
          </Link>
          <button onClick={()=>router.back()} style={{marginTop:12,background:'none',border:'none',cursor:'pointer',color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>← Go back</button>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{background:C.bg,minHeight:'100%'}}>

        {/* Nav */}
        <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>router.back()} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:C.textMuted,fontSize:14,fontFamily:'DM Sans,sans-serif'}}>
            <ChevronLeft style={{width:16,height:16}}/>Back
          </button>
          <span style={{color:C.textDim}}>·</span>
          <span style={{fontSize:13,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>Replay</span>
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:C.goldDim,color:C.gold,fontFamily:'DM Sans,sans-serif',fontWeight:700,marginLeft:4}}>PRO</span>
        </div>

        <div style={{maxWidth:900,margin:'0 auto',padding:'24px 16px',display:'grid',gridTemplateColumns:'1fr 300px',gap:20,alignItems:'start'}}>

          {/* Video player */}
          <div>
            <div style={{borderRadius:16,overflow:'hidden',background:'#000',aspectRatio:'16/9',position:'relative'}}>
              {recording?.public_url ? (
                <video ref={videoRef} src={recording.public_url} controls
                  style={{width:'100%',height:'100%',objectFit:'contain'}}
                  onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>
              ) : (
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
                  <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Clock style={{width:24,height:24,color:C.textDim}}/>
                  </div>
                  <p style={{fontSize:14,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>Recording processing...</p>
                  <p style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>Check back in a few minutes</p>
                </div>
              )}
            </div>

            {/* Event info */}
            <div style={{marginTop:16}}>
              <h1 style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em',marginBottom:8}}>{event?.title}</h1>
              <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,borderRadius:'50%',overflow:'hidden',background:'rgba(37,99,235,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:C.blueLight}}>
                    {event?.users?.photo_url?<img src={event.users.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:getName(event?.users).slice(0,2).toUpperCase()}
                  </div>
                  <span style={{fontSize:13,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>Hosted by {getName(event?.users)}</span>
                </div>
                {recording && (
                  <span style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                    <Clock style={{width:12,height:12}}/>{fmt(recording.duration_sec||0)}
                  </span>
                )}
                <span style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>
                  {event?.ended_at ? new Date(event.ended_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Chat replay */}
          <div style={{borderRadius:16,background:C.card,border:`1px solid ${C.border}`,overflow:'hidden',height:500,display:'flex',flexDirection:'column'}}>
            <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:'DM Sans,sans-serif'}}>Chat Replay</span>
              <span style={{fontSize:11,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>{messages.length} messages</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:10}}>
              {messages.length===0 ? (
                <div style={{textAlign:'center',paddingTop:40,color:C.textDim,fontSize:12,fontFamily:'DM Sans,sans-serif'}}>No chat messages</div>
              ) : messages.map(msg=>(
                <div key={msg.id} style={{display:'flex',gap:8}}>
                  <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',overflow:'hidden',background:msg.is_host?`linear-gradient(135deg,${C.gold},#F97316)`:`linear-gradient(135deg,${C.blue},${C.blueLight})`}}>
                    {msg.user_avatar?<img src={msg.user_avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:msg.user_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                      <span style={{fontSize:11,fontWeight:700,color:msg.is_host?C.gold:C.blueLight,fontFamily:'DM Sans,sans-serif'}}>{msg.user_name}</span>
                      {msg.is_host&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:C.goldDim,color:C.gold,fontWeight:700}}>HOST</span>}
                    </div>
                    <p style={{fontSize:12,color:'#D4DBEE',fontFamily:'DM Sans,sans-serif',lineHeight:1.5,wordBreak:'break-word'}}>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:'8px 12px',borderTop:`1px solid ${C.border}`,fontSize:11,color:C.textDim,fontFamily:'DM Sans,sans-serif',textAlign:'center'}}>
              Read-only · Live chat from this session
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
