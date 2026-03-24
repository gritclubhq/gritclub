'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Send, Search, Paperclip, X,
  Loader2, MessageCircle, ArrowLeft, Check, CheckCheck,
  File, Download
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.07)', text:'#F0F4FF',
  textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueL:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', red:'#EF4444', green:'#10B981',
}

const ACOLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const aBg = (id:string) => ACOLORS[(id?.charCodeAt(0)||0)%ACOLORS.length]
const getName = (u:any) => u?.full_name||u?.email?.split('@')[0]||'User'
const getInitials = (u:any) => getName(u).slice(0,2).toUpperCase()
const fmtTime = (ts:string) => {
  const d = new Date(ts), now = new Date()
  const diff = now.getTime()-d.getTime()
  if(diff < 60000) return 'now'
  if(diff < 3600000) return `${Math.floor(diff/60000)}m`
  if(diff < 86400000) return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
  if(diff < 604800000) return d.toLocaleDateString('en-US',{weekday:'short'})
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
}
const fmtBytes = (b:number) => b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`

function Avatar({user, size=36}:{user:any;size?:number}) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.35,fontWeight:700,color:'#fff',background:aBg(user?.id||'')}}>
      {user?.photo_url?<img src={user.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:getInitials(user)}
    </div>
  )
}

function FilePreview({url,name,size,type,isOwn}:{url:string;name:string;size:number;type:string;isOwn:boolean}) {
  const isImage = type?.startsWith('image/')
  if(isImage) return (
    <div style={{borderRadius:12,overflow:'hidden',maxWidth:260,cursor:'pointer'}} onClick={()=>window.open(url,'_blank')}>
      <img src={url} alt={name} style={{width:'100%',display:'block',borderRadius:12}}/>
    </div>
  )
  return (
    <a href={url} download={name} target="_blank" rel="noreferrer" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,background:isOwn?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.05)',border:`1px solid ${isOwn?'rgba(255,255,255,0.2)':C.border}`,minWidth:200,maxWidth:280}}>
      <div style={{width:36,height:36,borderRadius:8,background:isOwn?'rgba(255,255,255,0.15)':C.blueDim,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <File style={{width:18,height:18,color:isOwn?'#fff':C.blueL}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:600,color:isOwn?'#fff':C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</p>
        <p style={{fontSize:11,color:isOwn?'rgba(255,255,255,0.6)':C.textMuted}}>{fmtBytes(size)}</p>
      </div>
      <Download style={{width:15,height:15,color:isOwn?'rgba(255,255,255,0.7)':C.textMuted,flexShrink:0}}/>
    </a>
  )
}

export default function DMPage() {
  const router = useRouter()

  const [me, setMe] = useState<any>(null)
  const [convos, setConvos] = useState<any[]>([])
  const [activeConvo, setActiveConvo] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [mobileView, setMobileView] = useState<'list'|'chat'>('list')
  const [winW, setWinW] = useState(1200)

  const chatBottom = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const msgChannel = useRef<any>(null)
  const meRef = useRef<any>(null)

  useEffect(()=>{const h=()=>setWinW(window.innerWidth);h();window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[])
  const isMobile = winW < 768

  useEffect(()=>{
    // Read ?user= from URL using window.location (no Suspense needed)
    const targetUserId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('user')
      : null

    ;(async()=>{
      const {data:{user:u}} = await supabase.auth.getUser()
      if(!u){router.push('/auth/login');return}
      setMe(u);meRef.current=u

      await loadConvos(u.id)

      if(targetUserId){
        await openOrCreateConvo(u.id, targetUserId)
      }
      setLoading(false)
    })()
    return()=>{ if(msgChannel.current) supabase.removeChannel(msgChannel.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const loadConvos = async (uid:string) => {
    const {data} = await supabase
      .from('dm_conversations')
      .select(`*, user_a_data:users!dm_conversations_user_a_fkey(id,full_name,email,photo_url), user_b_data:users!dm_conversations_user_b_fkey(id,full_name,email,photo_url)`)
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order('last_message_at', {ascending:false})
    if(data){
      const enriched = data.map(c=>({
        ...c,
        partner: c.user_a === uid ? c.user_b_data : c.user_a_data,
      }))
      setConvos(enriched)
    }
  }

  const openOrCreateConvo = async (myId:string, partnerId:string) => {
    const {data:convId} = await supabase.rpc('get_or_create_dm',{uid_a:myId,uid_b:partnerId})
    if(convId){
      const {data:conv} = await supabase
        .from('dm_conversations')
        .select(`*, user_a_data:users!dm_conversations_user_a_fkey(id,full_name,email,photo_url), user_b_data:users!dm_conversations_user_b_fkey(id,full_name,email,photo_url)`)
        .eq('id',convId).single()
      if(conv){
        const enriched = {...conv, partner: conv.user_a===myId?conv.user_b_data:conv.user_a_data}
        openConvo(enriched, myId)
      }
    }
  }

  const openConvo = useCallback(async (conv:any, uid?:string) => {
    const myId = uid || meRef.current?.id
    setActiveConvo(conv)
    setMobileView('chat')

    const {data:msgs} = await supabase
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at',{ascending:true})
      .limit(200)
    setMessages(msgs||[])
    setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),100)

    if(msgs?.length && myId){
      const unread = msgs.filter(m=>m.sender_id!==myId&&!(m.read_by||[]).includes(myId))
      for(const m of unread){
        await supabase.from('dm_messages').update({read_by:[...(m.read_by||[]),myId]}).eq('id',m.id)
      }
    }

    if(msgChannel.current) supabase.removeChannel(msgChannel.current)
    const ch = supabase.channel(`dm-${conv.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'dm_messages',filter:`conversation_id=eq.${conv.id}`},
        ({new:msg})=>{
          setMessages(prev=>prev.find(m=>m.id===msg.id)?prev:[...prev,msg])
          setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),50)
        })
      .subscribe()
    msgChannel.current = ch
  },[])

  const sendMessage = async () => {
    if((!text.trim())||!activeConvo||!me||sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    const msg = {
      id: crypto.randomUUID(),
      conversation_id: activeConvo.id,
      sender_id: me.id,
      content,
      msg_type: 'text',
      created_at: new Date().toISOString(),
      read_by: [me.id],
    }
    setMessages(prev=>[...prev,msg])
    setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),50)
    await supabase.from('dm_messages').insert(msg)
    await supabase.from('dm_conversations').update({last_message:content,last_message_at:new Date().toISOString()}).eq('id',activeConvo.id)
    await loadConvos(me.id)
    setSending(false)
  }

  const sendFile = async (file:File) => {
    if(!activeConvo||!me) return
    setUploading(true)
    const path = `${me.id}/${activeConvo.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._]/g,'_')}`
    const {error} = await supabase.storage.from('dm-files').upload(path,file,{contentType:file.type})
    if(!error){
      const {data:ud} = await supabase.storage.from('dm-files').createSignedUrl(path,60*60*24*30)
      const isImage = file.type.startsWith('image/')
      const msg = {
        id: crypto.randomUUID(),
        conversation_id: activeConvo.id,
        sender_id: me.id,
        content: null,
        file_url: ud?.signedUrl||'',
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        msg_type: isImage?'image':'file',
        created_at: new Date().toISOString(),
        read_by: [me.id],
      }
      setMessages(prev=>[...prev,msg])
      setTimeout(()=>chatBottom.current?.scrollIntoView({behavior:'smooth'}),50)
      await supabase.from('dm_messages').insert(msg)
      await supabase.from('dm_conversations').update({last_message:`📎 ${file.name}`,last_message_at:new Date().toISOString()}).eq('id',activeConvo.id)
      await loadConvos(me.id)
    }
    setUploading(false)
  }

  const searchUsers = async (q:string) => {
    if(!q.trim()){setAllUsers([]);return}
    const {data} = await supabase.from('users').select('id,full_name,email,photo_url').or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).neq('id',me?.id).limit(10)
    setAllUsers(data||[])
  }

  const startConvoWith = async (user:any) => {
    setShowSearch(false);setSearchQ('');setAllUsers([])
    await openOrCreateConvo(me.id, user.id)
    await loadConvos(me.id)
  }

  const filteredConvos = convos.filter(c=>{
    if(!searchQ.trim()) return true
    return getName(c.partner).toLowerCase().includes(searchQ.toLowerCase())
  })

  if(loading) return(
    <DashboardLayout>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',background:C.bg}}>
        <Loader2 style={{width:32,height:32,color:C.blueL,animation:'spin 1s linear infinite'}}/>
      </div>
    </DashboardLayout>
  )

  const ConvoList = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.surface,borderRight:`1px solid ${C.border}`}}>
      <div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <h2 style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:'Syne,sans-serif'}}>Messages</h2>
          <button onClick={()=>setShowSearch(p=>!p)} style={{width:34,height:34,borderRadius:8,border:'none',background:showSearch?C.blueDim:C.card,color:showSearch?C.blueL:C.textMuted,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <Search style={{width:16,height:16}}/>
          </button>
        </div>
        {showSearch ? (
          <div>
            <div style={{position:'relative'}}>
              <Search style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:C.textDim}}/>
              <input autoFocus value={searchQ} onChange={e=>{setSearchQ(e.target.value);searchUsers(e.target.value)}}
                placeholder="Find people..."
                style={{width:'100%',padding:'9px 12px 9px 32px',borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:13,outline:'none',fontFamily:'DM Sans,sans-serif'}}/>
            </div>
            {allUsers.length>0&&(
              <div style={{marginTop:8,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,overflow:'hidden'}}>
                {allUsers.map(u=>(
                  <button key={u.id} onClick={()=>startConvoWith(u)}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <Avatar user={u} size={32}/>
                    <div>
                      <p style={{fontSize:14,fontWeight:600,color:C.text,fontFamily:'DM Sans,sans-serif'}}>{getName(u)}</p>
                      <p style={{fontSize:11,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{position:'relative'}}>
            <Search style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:C.textDim}}/>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search conversations..."
              style={{width:'100%',padding:'9px 12px 9px 32px',borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:13,outline:'none',fontFamily:'DM Sans,sans-serif'}}/>
          </div>
        )}
      </div>

      <div style={{flex:1,overflowY:'auto'}}>
        {filteredConvos.length===0&&!showSearch&&(
          <div style={{textAlign:'center',padding:'48px 20px'}}>
            <MessageCircle style={{width:36,height:36,color:C.textDim,margin:'0 auto 12px'}}/>
            <p style={{fontSize:14,color:C.textMuted,fontFamily:'DM Sans,sans-serif',marginBottom:8}}>No conversations yet</p>
            <p style={{fontSize:12,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>Click the search icon to start a new message</p>
          </div>
        )}
        {filteredConvos.map(conv=>{
          const isActive = activeConvo?.id===conv.id
          return(
            <button key={conv.id} onClick={()=>openConvo(conv)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:isActive?C.blueDim:'transparent',border:'none',cursor:'pointer',textAlign:'left',borderLeft:`3px solid ${isActive?C.blue:'transparent'}`,transition:'background 0.15s'}}
              onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'}}
              onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background='transparent'}}>
              <Avatar user={conv.partner} size={40}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                  <span style={{fontSize:14,fontWeight:600,color:isActive?C.blueL:C.text,fontFamily:'DM Sans,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{getName(conv.partner)}</span>
                  <span style={{fontSize:11,color:C.textDim,flexShrink:0}}>{conv.last_message_at?fmtTime(conv.last_message_at):''}</span>
                </div>
                <p style={{fontSize:12,color:C.textMuted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'DM Sans,sans-serif'}}>{conv.last_message||'No messages yet'}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const ChatWindow = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12,background:C.surface,flexShrink:0}}>
        {isMobile&&(
          <button onClick={()=>setMobileView('list')} style={{background:'none',border:'none',cursor:'pointer',color:C.textMuted,padding:4,display:'flex'}}>
            <ArrowLeft style={{width:20,height:20}}/>
          </button>
        )}
        <Avatar user={activeConvo?.partner} size={38}/>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:'Syne,sans-serif'}}>{getName(activeConvo?.partner)}</p>
          <p style={{fontSize:12,color:C.textMuted,fontFamily:'DM Sans,sans-serif'}}>{activeConvo?.partner?.email}</p>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
        {messages.length===0&&(
          <div style={{textAlign:'center',paddingTop:40}}>
            <Avatar user={activeConvo?.partner} size={56}/>
            <p style={{fontSize:15,fontWeight:600,color:C.text,marginTop:12,fontFamily:'Syne,sans-serif'}}>{getName(activeConvo?.partner)}</p>
            <p style={{fontSize:13,color:C.textMuted,marginTop:6,fontFamily:'DM Sans,sans-serif'}}>Start of your conversation</p>
          </div>
        )}
        {messages.map(msg=>{
          const isOwn = msg.sender_id===me?.id
          const isRead = (msg.read_by||[]).filter((id:string)=>id!==me?.id).length>0
          return(
            <div key={msg.id} style={{display:'flex',justifyContent:isOwn?'flex-end':'flex-start',gap:8,alignItems:'flex-end'}}>
              {!isOwn&&<Avatar user={activeConvo?.partner} size={28}/>}
              <div style={{maxWidth:'70%',display:'flex',flexDirection:'column',alignItems:isOwn?'flex-end':'flex-start',gap:4}}>
                {(msg.msg_type==='file'||msg.msg_type==='image')&&msg.file_url?(
                  <FilePreview url={msg.file_url} name={msg.file_name||'file'} size={msg.file_size||0} type={msg.file_type||''} isOwn={isOwn}/>
                ):(
                  <div style={{padding:'10px 14px',borderRadius:isOwn?'18px 18px 4px 18px':'18px 18px 18px 4px',background:isOwn?`linear-gradient(135deg,${C.blue},#1D4ED8)`:'rgba(255,255,255,0.07)',color:isOwn?'#fff':C.text,fontSize:14,lineHeight:1.5,wordBreak:'break-word',fontFamily:'DM Sans,sans-serif'}}>
                    {msg.content}
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:10,color:C.textDim,fontFamily:'DM Sans,sans-serif'}}>{fmtTime(msg.created_at)}</span>
                  {isOwn&&(isRead
                    ?<CheckCheck style={{width:12,height:12,color:C.blueL}}/>
                    :<Check style={{width:12,height:12,color:C.textDim}}/>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {uploading&&(
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div style={{padding:'10px 14px',borderRadius:'18px 18px 4px 18px',background:C.blueDim,display:'flex',alignItems:'center',gap:8}}>
              <Loader2 style={{width:14,height:14,color:C.blueL,animation:'spin 0.8s linear infinite'}}/>
              <span style={{fontSize:13,color:C.blueL,fontFamily:'DM Sans,sans-serif'}}>Uploading...</span>
            </div>
          </div>
        )}
        <div ref={chatBottom}/>
      </div>

      <div style={{padding:'12px 14px',borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:10,background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:'8px 12px'}}>
          <button onClick={()=>fileInput.current?.click()} disabled={uploading}
            style={{width:32,height:32,borderRadius:8,border:'none',background:'transparent',color:C.textMuted,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
            onMouseEnter={e=>(e.currentTarget.style.color=C.blueL)} onMouseLeave={e=>(e.currentTarget.style.color=C.textMuted)}>
            <Paperclip style={{width:18,height:18}}/>
          </button>
          <input ref={fileInput} type="file" style={{display:'none'}} accept="*/*"
            onChange={e=>{const f=e.target.files?.[0];if(f)sendFile(f);e.target.value=''}}/>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}}
            placeholder={`Message ${getName(activeConvo?.partner)}...`}
            rows={1} maxLength={2000}
            style={{flex:1,background:'transparent',border:'none',color:C.text,fontSize:14,fontFamily:'DM Sans,sans-serif',outline:'none',resize:'none',lineHeight:1.5,maxHeight:120,overflowY:'auto'}}
            onInput={e=>{const t=e.target as HTMLTextAreaElement;t.style.height='auto';t.style.height=Math.min(t.scrollHeight,120)+'px'}}/>
          <button onClick={sendMessage} disabled={!text.trim()||sending}
            style={{width:32,height:32,borderRadius:8,border:'none',background:text.trim()?C.blue:'transparent',color:text.trim()?'#fff':C.textDim,display:'flex',alignItems:'center',justifyContent:'center',cursor:text.trim()?'pointer':'default',flexShrink:0,transition:'all 0.15s'}}>
            {sending?<Loader2 style={{width:16,height:16,animation:'spin 0.8s linear infinite'}}/>:<Send style={{width:16,height:16}}/>}
          </button>
        </div>
        <p style={{fontSize:10,color:C.textDim,textAlign:'center',marginTop:6,fontFamily:'DM Sans,sans-serif'}}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:C.bg,gap:16}}>
      <div style={{width:72,height:72,borderRadius:'50%',background:C.blueDim,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <MessageCircle style={{width:32,height:32,color:C.blueL}}/>
      </div>
      <h3 style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:'Syne,sans-serif'}}>Your Messages</h3>
      <p style={{fontSize:14,color:C.textMuted,textAlign:'center',maxWidth:280,fontFamily:'DM Sans,sans-serif',lineHeight:1.6}}>
        Send private messages to anyone on GritClub. Share text, images, and files.
      </p>
      <button onClick={()=>setShowSearch(true)}
        style={{display:'flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:12,border:'none',background:C.blue,color:'#fff',fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer'}}>
        <Search style={{width:16,height:16}}/> Start a conversation
      </button>
    </div>
  )

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
      <div style={{display:'flex',height:'100%',overflow:'hidden'}}>
        {(!isMobile || mobileView==='list') && (
          <div style={{width:isMobile?'100%':320,flexShrink:0,height:'100%',overflow:'hidden'}}>
            <ConvoList/>
          </div>
        )}
        {(!isMobile || mobileView==='chat') && (
          <div style={{flex:1,height:'100%',overflow:'hidden'}}>
            {activeConvo ? <ChatWindow/> : <EmptyState/>}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
