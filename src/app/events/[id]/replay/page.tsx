'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Lock, Play, Pause, Loader2, ChevronLeft, Crown, Clock, Maximize, Minimize, Volume2, VolumeX, MessageCircle, ChevronDown } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

const C = {
  bg:'#0B0B0C', surface:'#121214', card:'#121214',
  border:'rgba(255,255,255,0.07)', text:'#FFFFFF',
  textMuted:'#C7C7CC', textDim:'#8A8A8F',
  blue:'#C7C7CC', blueL:'#C7C7CC', blueDim:'rgba(255,255,255,0.06)',
  gold:'#C7C7CC', goldDim:'rgba(199,199,204,0.08)',
  red:'#EF4444', purple:'#C7C7CC', purpleDim:'rgba(199,199,204,0.08)',
  green:'#10B981',
}

const getName = (u:any) => u?.full_name||u?.email?.split('@')[0]||'Host'

function useWindowWidth() {
  const [w,setW] = useState(1200)
  useEffect(()=>{const h=()=>setW(window.innerWidth);h();window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[])
  return w
}

export default function EventReplayPage() {
  const {id} = useParams()
  const router = useRouter()
  const eventId = id as string
  const width = useWindowWidth()
  const isMobile = width < 768

  const [event,       setEvent]       = useState<any>(null)
  const [recording,   setRecording]   = useState<any>(null)
  const [videoUrl,    setVideoUrl]    = useState<string>('')
  const [profile,     setProfile]     = useState<any>(null)
  const [messages,    setMessages]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [canWatch,    setCanWatch]    = useState(false)
  const [accessLabel, setAccessLabel] = useState('')
  const [playing,     setPlaying]     = useState(false)
  const [muted,       setMuted]       = useState(false)
  const [fullscreen,  setFullscreen]  = useState(false)
  const [showChat,    setShowChat]    = useState(!isMobile)
  const [progress,    setProgress]    = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [urlError,    setUrlError]    = useState(false)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chatBottom  = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const init = async () => {
      const {data:{user}} = await supabase.auth.getUser()
      if(!user){router.push('/auth/login');return}

      const {data:prof} = await supabase.from('users').select('*').eq('id',user.id).single()
      setProfile(prof)

      const {data:ev} = await supabase.from('events')
        .select('*, users(id,full_name,email,photo_url)').eq('id',eventId).single()
      setEvent(ev)

      const isHost    = ev?.host_id === user.id || prof?.role === 'admin'
      const isPremium = prof?.is_premium === true || prof?.role === 'host' || prof?.role === 'admin'

      let isTicketHolder = false
      if(!isHost && !isPremium){
        const {data:tkt} = await supabase.from('tickets').select('id')
          .eq('user_id',user.id).eq('event_id',eventId)
          .in('status',['paid','confirmed']).maybeSingle()
        if(tkt){
          const endedAt = ev?.ended_at ? new Date(ev.ended_at) : null
          const daysAgo = endedAt ? (Date.now()-endedAt.getTime())/(1000*60*60*24) : 999
          isTicketHolder = daysAgo <= 30 // 30 days for ticket holders
        }
      }

      const watchAllowed = isHost || isPremium || isTicketHolder
      setCanWatch(watchAllowed)

      if(isHost) setAccessLabel('Host')
      else if(isPremium) setAccessLabel('Premium Member')
      else if(isTicketHolder){
        const endedAt = ev?.ended_at ? new Date(ev.ended_at) : null
        const daysLeft = endedAt ? Math.max(0,Math.ceil(30-(Date.now()-endedAt.getTime())/(1000*60*60*24))) : 0
        setAccessLabel(`Ticket Access — ${daysLeft}d left`)
      }

      if(watchAllowed){
        // Load recording
        const {data:rec} = await supabase.from('event_recordings')
          .select('*').eq('event_id',eventId)
          .order('created_at',{ascending:false}).limit(1).maybeSingle()

        if(rec){
          setRecording(rec)
          // Always generate fresh signed URL — public_url may be expired
          if(rec.storage_path){
            const {data:signed} = await supabase.storage
              .from('event-recordings')
              .createSignedUrl(rec.storage_path, 60*60*6) // 6 hour URL
            if(signed?.signedUrl){
              setVideoUrl(signed.signedUrl)
            } else if(rec.public_url){
              // Fallback to stored URL
              setVideoUrl(rec.public_url)
            }
          } else if(rec.public_url){
            setVideoUrl(rec.public_url)
          }
        }

        // Load chat history
        const {data:msgs} = await supabase.from('live_messages')
          .select('*').eq('event_id',eventId)
          .order('created_at',{ascending:true}).limit(500)
        setMessages(msgs||[])
        setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),200)
      }

      setLoading(false)
    }
    init()
  },[eventId])

  const togglePlay = () => {
    const v = videoRef.current; if(!v) return
    if(v.paused){v.play();setPlaying(true)}
    else{v.pause();setPlaying(false)}
  }
  const toggleMute = () => { const v=videoRef.current; if(!v)return; v.muted=!v.muted; setMuted(!muted) }
  const toggleFullscreen = () => {
    if(!containerRef.current)return
    if(!document.fullscreenElement){containerRef.current.requestFullscreen();setFullscreen(true)}
    else{document.exitFullscreen();setFullscreen(false)}
  }
  const seek = (e:React.MouseEvent<HTMLDivElement>) => {
    const v=videoRef.current; if(!v||!duration)return
    const rect=e.currentTarget.getBoundingClientRect()
    const pct=(e.clientX-rect.left)/rect.width
    v.currentTime=pct*duration
  }
  const fmt = (sec:number) => {
    const m=Math.floor(sec/60),s=Math.floor(sec%60)
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  if(loading) return(
    <DashboardLayout>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh',background:C.bg}}>
        <Loader2 style={{width:32,height:32,color:C.blueL,animation:'spin 1s linear infinite'}}/>
      </div>
    </DashboardLayout>
  )

  // ── Upgrade Wall ─────────────────────────────────────────────────────────────
  if(!canWatch) return(
    <DashboardLayout>
      <div style={{background:C.bg,minHeight:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{maxWidth:420,width:'100%',borderRadius:24,padding:40,textAlign:'center',background:C.card,border:'1px solid rgba(124,58,237,0.3)'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:'2px solid rgba(124,58,237,0.3)'}}>
            <Lock style={{width:28,height:28,color:C.purple}}/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em',marginBottom:8}}>Premium Access Required</h2>
          <p style={{fontSize:14,color:C.textMuted,fontFamily:'DM Sans,sans-serif',lineHeight:1.7,marginBottom:24}}>
            Session recordings are exclusively for <strong style={{color:C.gold}}>Premium Plus</strong> members. Upgrade to watch any past session.
          </p>
          {[
            'Unlimited session replay access',
            'No event tickets needed — attend everything free',
            'Private chat + recordings in groups',
            'Host events and keep 80% revenue',
          ].map(f=>(
            <div key={f} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,textAlign:'left'}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:C.goldDim,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontSize:9,color:C.gold,fontWeight:700}}>✓</span>
              </div>
              <span style={{fontSize:13,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>{f}</span>
            </div>
          ))}
          <Link href="/pricing" style={{textDecoration:'none',display:'block',marginTop:20}}>
            <button style={{width:'100%',padding:'14px',borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#7C3AED,#6D28D9)',color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <Crown style={{width:16,height:16}}/> Upgrade to Premium Plus →
            </button>
          </Link>
          <button onClick={()=>router.back()} style={{marginTop:12,background:'none',border:'none',cursor:'pointer',color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>← Go back</button>
        </div>
      </div>
    </DashboardLayout>
  )

  // ── Chat Panel ────────────────────────────────────────────────────────────────
  const ChatPanel = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.card,borderRadius:isMobile?0:16,overflow:'hidden',border:isMobile?'none':`1px solid ${C.border}`}}>
      <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:'DM Sans,sans-serif'}}>Chat Replay</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>{messages.length} messages</span>
          {isMobile && <button onClick={()=>setShowChat(false)} style={{background:'none',border:'none',cursor:'pointer',color:C.textMuted}}><ChevronDown style={{width:16,height:16}}/></button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {messages.length===0
          ? <p style={{textAlign:'center',paddingTop:40,color:C.textDim,fontSize:12,fontFamily:'DM Sans,sans-serif'}}>No chat messages</p>
          : messages.map(msg=>(
            <div key={msg.id} style={{display:'flex',gap:8}}>
              <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',background:msg.is_host?`linear-gradient(135deg,${C.gold},#F97316)`:`linear-gradient(135deg,${C.blue},${C.blueL})`}}>
                {msg.user_avatar?<img src={msg.user_avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:msg.user_name?.[0]?.toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                  <span style={{fontSize:11,fontWeight:700,color:msg.is_host?C.gold:C.blueL,fontFamily:'DM Sans,sans-serif'}}>{msg.user_name}</span>
                  {msg.is_host&&<span style={{fontSize:8,padding:'1px 4px',borderRadius:3,background:C.goldDim,color:C.gold,fontWeight:700}}>HOST</span>}
                </div>
                <p style={{fontSize:12,color:'#D4DBEE',fontFamily:'DM Sans,sans-serif',lineHeight:1.5,wordBreak:'break-word'}}>{msg.content||msg.text}</p>
              </div>
            </div>
          ))
        }
        <div ref={chatBottom}/>
      </div>
      <div style={{padding:'8px 12px',borderTop:`1px solid ${C.border}`,fontSize:11,color:C.textDim,fontFamily:'DM Sans,sans-serif',textAlign:'center',flexShrink:0}}>
        Read-only · Live chat from this session
      </div>
    </div>
  )

  return(
    <DashboardLayout>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
      `}</style>
      <div style={{background:C.bg,minHeight:'100%'}}>

        {/* Top nav */}
        <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10,background:C.surface}}>
          <button onClick={()=>router.back()} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:C.textMuted,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>
            <ChevronLeft style={{width:15,height:15}}/>Back
          </button>
          <span style={{color:C.textDim}}>·</span>
          <span style={{fontSize:13,color:C.text,fontFamily:'DM Sans,sans-serif',fontWeight:600,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{event?.title}</span>
          {accessLabel&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:C.goldDim,color:C.gold,fontFamily:'DM Sans,sans-serif',fontWeight:700,flexShrink:0}}>{accessLabel}</span>}
          {isMobile&&<button onClick={()=>setShowChat(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',color:showChat?C.blueL:C.textMuted,flexShrink:0}}>
            <MessageCircle style={{width:18,height:18}}/>
          </button>}
        </div>

        {/* MOBILE: stack vertically */}
        {isMobile ? (
          <div style={{display:'flex',flexDirection:'column',height:'calc(100dvh - 108px)'}}>
            {/* Video fills screen */}
            <div ref={containerRef} style={{position:'relative',background:'#000',width:'100%',aspectRatio:'16/9',flexShrink:0}}>
              {videoUrl ? (
                <>
                  <video ref={videoRef} src={videoUrl}
                    style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}
                    onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
                    onTimeUpdate={()=>{const v=videoRef.current;if(!v)return;setCurrentTime(v.currentTime);setProgress((v.currentTime/v.duration)*100)}}
                    onLoadedMetadata={()=>{const v=videoRef.current;if(v)setDuration(v.duration)}}
                    onError={()=>setUrlError(true)}
                    playsInline/>

                  {/* Controls overlay */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.85)',padding:'20px 12px 12px'}}>
                    {/* Progress bar */}
                    <div onClick={seek} style={{height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,marginBottom:10,cursor:'pointer',position:'relative'}}>
                      <div style={{height:'100%',width:`${progress}%`,background:C.blueL,borderRadius:2}}/>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <button onClick={togglePlay} style={{width:36,height:36,borderRadius:'50%',border:'none',background:C.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                        {playing?<Pause style={{width:16,height:16}}/>:<Play style={{width:16,height:16,marginLeft:2}}/>}
                      </button>
                      <span style={{fontSize:12,color:'rgba(255,255,255,0.7)',fontFamily:'DM Sans,sans-serif'}}>{fmt(currentTime)} / {fmt(duration)}</span>
                      <div style={{flex:1}}/>
                      <button onClick={toggleMute} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)'}}>
                        {muted?<VolumeX style={{width:18,height:18}}/>:<Volume2 style={{width:18,height:18}}/>}
                      </button>
                      <button onClick={toggleFullscreen} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)'}}>
                        {fullscreen?<Minimize style={{width:18,height:18}}/>:<Maximize style={{width:18,height:18}}/>}
                      </button>
                    </div>
                  </div>
                </>
              ) : urlError ? (
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
                  <Clock style={{width:32,height:32,color:C.textDim}}/>
                  <p style={{color:C.textMuted,fontSize:14,fontFamily:'DM Sans,sans-serif'}}>Recording processing...</p>
                  <p style={{color:C.textDim,fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Check back in a few minutes</p>
                </div>
              ) : (
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Loader2 style={{width:28,height:28,color:C.blueL,animation:'spin 1s linear infinite'}}/>
                </div>
              )}
            </div>

            {/* Chat below video on mobile */}
            {showChat && (
              <div style={{flex:1,overflow:'hidden'}}>
                <ChatPanel/>
              </div>
            )}
          </div>
        ) : (
          /* DESKTOP: side by side */
          <div style={{maxWidth:1100,margin:'0 auto',padding:'20px 16px',display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start'}}>

            {/* Video player */}
            <div>
              <div ref={containerRef} style={{borderRadius:16,overflow:'hidden',background:'#000',aspectRatio:'16/9',position:'relative'}}>
                {videoUrl ? (
                  <>
                    <video ref={videoRef} src={videoUrl}
                      style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}
                      onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
                      onTimeUpdate={()=>{const v=videoRef.current;if(!v)return;setCurrentTime(v.currentTime);setProgress((v.currentTime/v.duration)*100)}}
                      onLoadedMetadata={()=>{const v=videoRef.current;if(v)setDuration(v.duration)}}
                      onError={()=>setUrlError(true)}
                      playsInline/>

                    {/* Controls overlay */}
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.85))',padding:'32px 16px 14px',opacity:0,transition:'opacity .2s'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='0'}>
                      <div onClick={seek} style={{height:5,background:'rgba(255,255,255,0.2)',borderRadius:3,marginBottom:12,cursor:'pointer',position:'relative'}}>
                        <div style={{height:'100%',width:`${progress}%`,background:C.blueL,borderRadius:3}}/>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <button onClick={togglePlay} style={{width:40,height:40,borderRadius:'50%',border:'none',background:C.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                          {playing?<Pause style={{width:18,height:18}}/>:<Play style={{width:18,height:18,marginLeft:2}}/>}
                        </button>
                        <span style={{fontSize:13,color:'rgba(255,255,255,0.8)',fontFamily:'DM Sans,sans-serif'}}>{fmt(currentTime)} / {fmt(duration)}</span>
                        <div style={{flex:1}}/>
                        <button onClick={toggleMute} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.8)'}}>
                          {muted?<VolumeX style={{width:20,height:20}}/>:<Volume2 style={{width:20,height:20}}/>}
                        </button>
                        <button onClick={toggleFullscreen} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.8)'}}>
                          {fullscreen?<Minimize style={{width:20,height:20}}/>:<Maximize style={{width:20,height:20}}/>}
                        </button>
                      </div>
                    </div>

                    {/* Big play button in center when paused */}
                    {!playing && (
                      <button onClick={togglePlay} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:64,height:64,borderRadius:'50%',border:'none',background:'rgba(37,99,235,0.9)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 24px rgba(37,99,235,0.5)'}}>
                        <Play style={{width:28,height:28,marginLeft:4}}/>
                      </button>
                    )}
                  </>
                ) : urlError ? (
                  <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
                    <Clock style={{width:40,height:40,color:C.textDim}}/>
                    <p style={{color:C.textMuted,fontSize:14,fontFamily:'DM Sans,sans-serif'}}>Recording processing...</p>
                    <p style={{color:C.textDim,fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Check back in a few minutes</p>
                  </div>
                ) : (
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Loader2 style={{width:28,height:28,color:C.blueL,animation:'spin 1s linear infinite'}}/>
                  </div>
                )}
              </div>

              {/* Event info below video */}
              <div style={{marginTop:16,padding:'16px 0'}}>
                <h1 style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em',marginBottom:8}}>{event?.title}</h1>
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:28,height:28,borderRadius:'50%',overflow:'hidden',background:'rgba(37,99,235,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:C.blueL}}>
                      {event?.users?.photo_url?<img src={event.users.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:getName(event?.users).slice(0,2).toUpperCase()}
                    </div>
                    <span style={{fontSize:13,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>Hosted by {getName(event?.users)}</span>
                  </div>
                  {duration>0 && <span style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:4}}><Clock style={{width:12,height:12}}/>{fmt(duration)}</span>}
                  <span style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>
                    {event?.ended_at?new Date(event.ended_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):''}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat panel */}
            <div style={{position:'sticky',top:20,height:520}}>
              <ChatPanel/>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
