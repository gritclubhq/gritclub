'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, Users, Radio,
  Monitor, MonitorOff, PenLine, Eraser, Shield,
  Minus, Square, Circle, Trash2, Heart, Loader2, Crown,
  MessageCircle, ChevronDown, Hand, Maximize, Minimize, Volume2,
  Highlighter, Upload, UserPlus, X
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

const BAD    = ['spam','scam','fuck','shit','bitch','asshole','dick','pussy','cunt']
const hasBad = (t: string) => BAD.some(w => t.toLowerCase().includes(w))
const uname  = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const uinits = (u: any) => uname(u).slice(0, 2).toUpperCase()
const AC     = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const uac    = (id: string) => AC[(id?.charCodeAt(0) || 0) % AC.length]
const tsAgo  = (ts: number) => { const m = Math.floor((Date.now()-ts)/60000); return m<1?'now':m<60?`${m}m`:`${Math.floor(m/60)}h` }
const recFmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

function useWin() {
  const [w, setW] = useState(1200)
  useEffect(() => { const h = () => setW(window.innerWidth); h(); window.addEventListener('resize',h); return ()=>window.removeEventListener('resize',h) }, [])
  return w
}

// ── Board canvas — draws based on refs so parent state changes are instant ──
function BoardCanvas({ bg, canvasRef, toolRef, colorRef, sizeRef, opacityRef }:{
  bg:string; canvasRef:React.RefObject<HTMLCanvasElement>
  toolRef:React.MutableRefObject<string>; colorRef:React.MutableRefObject<string>
  sizeRef:React.MutableRefObject<number>; opacityRef:React.MutableRefObject<number>
}) {
  const drawing = useRef(false)
  const origin  = useRef<{x:number,y:number}|null>(null)
  const snap    = useRef<ImageData|null>(null)

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height)
  }, [bg, canvasRef])

  const xy = (e: any, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect(), s = e.touches?.[0] ?? e
    return { x: (s.clientX - r.left) * (c.width/r.width), y: (s.clientY - r.top) * (c.height/r.height) }
  }

  const applyStyle = (ctx: CanvasRenderingContext2D) => {
    const tool = toolRef.current, color = colorRef.current
    const size = sizeRef.current, alpha = opacityRef.current
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = size * 5
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = size * 4
      ctx.globalAlpha = 0.35
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.globalAlpha = alpha
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }

  const resetCtx = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
  }

  const down = (e: any) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!, p = xy(e, c)
    drawing.current = true; origin.current = p
    snap.current = ctx.getImageData(0, 0, c.width, c.height)
    const tool = toolRef.current
    if (tool === 'pen' || tool === 'eraser' || tool === 'marker' || tool === 'highlighter') {
      applyStyle(ctx); ctx.beginPath(); ctx.moveTo(p.x, p.y)
    }
  }

  const move = (e: any) => {
    if (!drawing.current) return; e.preventDefault()
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!, p = xy(e, c)
    const tool = toolRef.current
    if (tool === 'pen' || tool === 'eraser' || tool === 'marker' || tool === 'highlighter') {
      applyStyle(ctx); ctx.lineTo(p.x, p.y); ctx.stroke()
    } else if (snap.current && origin.current) {
      ctx.putImageData(snap.current, 0, 0)
      applyStyle(ctx); ctx.beginPath()
      const o = origin.current
      if (tool === 'line') { ctx.moveTo(o.x,o.y); ctx.lineTo(p.x,p.y); ctx.stroke() }
      else if (tool === 'rect') ctx.strokeRect(o.x,o.y,p.x-o.x,p.y-o.y)
      else if (tool === 'circle') {
        const rx=Math.abs(p.x-o.x)/2, ry=Math.abs(p.y-o.y)/2
        ctx.ellipse(o.x+(p.x-o.x)/2,o.y+(p.y-o.y)/2,rx,ry,0,0,Math.PI*2); ctx.stroke()
      }
      resetCtx(ctx)
    }
  }

  const up = () => {
    if (!drawing.current) return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!; resetCtx(ctx)
    drawing.current = false; origin.current = null
  }

  return (
    <canvas ref={canvasRef} width={1280} height={720}
      style={{ width:'100%', height:'100%', touchAction:'none', display:'block',
        cursor: toolRef.current === 'eraser' ? 'cell' : 'crosshair' }}
      onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
      onTouchStart={down} onTouchMove={move} onTouchEnd={up}
    />
  )
}

// ── Board Toolbar ─────────────────────────────────────────────────────────────
function BoardToolbar({ bg, canvasRef, toolRef, colorRef, sizeRef, opacityRef, tool, setTool, color, setColor, size, setSize, onClear, onFileLoad }:{
  bg:string; canvasRef:React.RefObject<HTMLCanvasElement>
  toolRef:React.MutableRefObject<string>; colorRef:React.MutableRefObject<string>
  sizeRef:React.MutableRefObject<number>; opacityRef:React.MutableRefObject<number>
  tool:string; setTool:(t:string)=>void; color:string; setColor:(c:string)=>void
  size:number; setSize:(s:number)=>void; onClear:()=>void; onFileLoad:(url:string)=>void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  // Keep refs in sync with state
  useEffect(() => { toolRef.current = tool }, [tool, toolRef])
  useEffect(() => { colorRef.current = color }, [color, colorRef])
  useEffect(() => { sizeRef.current = size }, [size, sizeRef])
  useEffect(() => { opacityRef.current = tool === 'highlighter' ? 0.35 : 1 }, [tool, opacityRef])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      const canvas = canvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        // Scale image to fit canvas while keeping aspect ratio
        const scale = Math.min(canvas.width/img.width, canvas.height/img.height)
        const w = img.width * scale, h = img.height * scale
        const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2
        ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, x, y, w, h)
        onFileLoad(url)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const TOOLS = [
    { id:'pen',         label:'Pen',         I:PenLine },
    { id:'marker',      label:'Marker',      I:PenLine },
    { id:'highlighter', label:'Highlight',   I:Highlighter },
    { id:'eraser',      label:'Eraser',      I:Eraser },
    { id:'line',        label:'Line',        I:Minus },
    { id:'rect',        label:'Rectangle',   I:Square },
    { id:'circle',      label:'Circle',      I:Circle },
  ] as any[]

  const COLS = ['#FFFFFF','#000000','#EF4444','#3B82F6','#F59E0B','#10B981','#A78BFA','#FB923C','#EC4899','#06B6D4']

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:C.surface, borderTop:`1px solid ${C.border}`, flexWrap:'wrap', flexShrink:0 }}>
      {/* Tools */}
      <div style={{ display:'flex', gap:2, background:C.card, padding:3, borderRadius:8 }}>
        {TOOLS.map(({ id, label, I }:any) => (
          <button key={id} onClick={()=>setTool(id)} title={label}
            style={{ width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              background: tool===id ? (id==='highlighter'?'rgba(251,191,36,0.3)':id==='marker'?'rgba(16,185,129,0.2)':C.blue) : 'transparent',
              color: tool===id ? (id==='highlighter'?'#FCD34D':id==='marker'?C.green:'#fff') : C.textMuted,
              outline: tool===id ? `2px solid ${id==='highlighter'?'rgba(251,191,36,0.5)':id==='marker'?'rgba(16,185,129,0.4)':C.blue}` : 'none',
              outlineOffset: '1px'
            }}>
            <I style={{ width: id==='highlighter'?14:13, height: id==='highlighter'?14:13 }}/>
          </button>
        ))}
      </div>
      {/* Colors */}
      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
        {COLS.map(col => (
          <button key={col} onClick={()=>setColor(col)}
            style={{ width:color===col?20:14, height:color===col?20:14, borderRadius:'50%', background:col, border:color===col?`2px solid ${C.blueL}`:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', transition:'all .12s', flexShrink:0 }}/>
        ))}
      </div>
      {/* Sizes */}
      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
        {[2,4,8,14,22].map(s => (
          <button key={s} onClick={()=>setSize(s)}
            style={{ width:Math.max(s+4,10), height:Math.max(s+4,10), borderRadius:'50%', border:'none', cursor:'pointer', background:size===s?color:C.textDim, flexShrink:0 }}/>
        ))}
      </div>
      {/* File upload */}
      <button onClick={()=>fileRef.current?.click()}
        title="Load image or PDF to annotate"
        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:`1px solid ${C.border}`, cursor:'pointer', background:'transparent', color:C.textMuted, fontSize:11, fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
        <Upload style={{ width:11, height:11 }}/>File
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
      {/* Clear */}
      <button onClick={onClear}
        style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', background:C.redDim, color:C.red, fontSize:11, fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
        <Trash2 style={{ width:11, height:11 }}/>Clear
      </button>
    </div>
  )
}

// ── Cohost modal ──────────────────────────────────────────────────────────────
function CohostModal({ eventId, hostId, eventTitle, onClose }: { eventId: string; hostId: string; eventTitle: string; onClose: () => void }) {
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<any[]>([])
  const [selected,   setSelected]   = useState<any>(null)
  const [cohosts,    setCohosts]    = useState<any[]>([])
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')
  const debounce     = useRef<any>(null)

  // Load existing co-hosts and search connections on mount
  useEffect(() => {
    loadCohosts()
  }, [])

  const loadCohosts = async () => {
    const { data } = await supabase
      .from('event_cohosts')
      .select('user_id, users(id,full_name,email,photo_url,username)')
      .eq('event_id', eventId)
    setCohosts(data || [])
  }

  const searchConnections = async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    // Search only from host's accepted connections
    const { data: conns } = await supabase
      .from('connections')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${hostId},user2_id.eq.${hostId}`)
      .eq('status', 'accepted')
    const connIds = (conns||[]).map((c:any) => c.user1_id === hostId ? c.user2_id : c.user1_id)
    if (!connIds.length) { setResults([]); return }

    const { data: users } = await supabase
      .from('users')
      .select('id,full_name,email,photo_url,username')
      .in('id', connIds)
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(6)
    setResults(users || [])
  }

  const handleInput = (val: string) => {
    setQuery(val); setSelected(null)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => searchConnections(val), 300)
  }

  const add = async () => {
    if (!selected) return
    setSaving(true); setMsg('')
    // Use INSERT with ON CONFLICT DO NOTHING to avoid duplicate key error
    const { error } = await supabase.from('event_cohosts')
      .insert({ event_id: eventId, user_id: selected.id })
      .select()
    if (error && !error.message.includes('duplicate')) {
      setMsg('Error: ' + error.message); setSaving(false); return
    }
    // Send notification to the co-host
    await supabase.from('notifications').insert({
      user_id:   selected.id,
      actor_id:  hostId,
      type:      'cohost_invite',
      title:     'You've been added as co-host!',
      body:      `You are now co-host for "${eventTitle}"`,
      link:      `/live/${eventId}`,
      is_read:   false,
    })
    setMsg(`✓ ${selected.full_name || selected.email} added as co-host`)
    setSelected(null); setQuery('')
    loadCohosts()
    setSaving(false)
  }

  const remove = async (userId: string) => {
    await supabase.from('event_cohosts').delete().eq('event_id', eventId).eq('user_id', userId)
    loadCohosts()
  }

  const AC2 = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
  const uc = (id: string) => AC2[(id?.charCodeAt(0)||0) % AC2.length]
  const un = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }} onClick={onClose}/>
      <div style={{ position:'relative', width:'100%', maxWidth:420, margin:'0 16px', borderRadius:20, padding:24, background:C.card, border:`1px solid ${C.border}`, maxHeight:'80vh', overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:'DM Sans,sans-serif' }}>Manage Co-hosts</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted }}><X style={{ width:18, height:18 }}/></button>
        </div>
        <p style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginBottom:16 }}>Search your connections by name or username</p>

        {/* Search input */}
        <div style={{ position:'relative', marginBottom:10 }}>
          {selected ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, border:`1px solid ${C.blue}`, background:C.blueDim }}>
              <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:uc(selected.id)+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:uc(selected.id) }}>
                {selected.photo_url ? <img src={selected.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : un(selected).slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:'DM Sans,sans-serif' }}>{un(selected)}</p>
                {selected.username && <p style={{ fontSize:11, color:C.blueL, fontFamily:'DM Sans,sans-serif' }}>@{selected.username}</p>}
              </div>
              <button onClick={()=>{ setSelected(null); setQuery('') }} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted }}><X style={{ width:14, height:14 }}/></button>
            </div>
          ) : (
            <input
              value={query}
              onChange={e=>handleInput(e.target.value)}
              placeholder="Search by name, @username or email..."
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='rgba(37,99,235,0.5)')}
              onBlur={e=>setTimeout(()=>{ (e.target as any).style.borderColor=C.border }, 200)}
            />
          )}
          {/* Autocomplete dropdown */}
          {results.length > 0 && !selected && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, zIndex:10, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
              {results.map(u => (
                <div key={u.id} onClick={()=>{ setSelected(u); setResults([]); setQuery(un(u)) }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:`1px solid ${C.border}` }}
                  onMouseEnter={e=>((e.currentTarget as HTMLElement).style.background=C.surface)}
                  onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
                  <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:uc(u.id)+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:uc(u.id) }}>
                    {u.photo_url ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : un(u).slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:'DM Sans,sans-serif', margin:0 }}>{un(u)}</p>
                    <p style={{ fontSize:11, color:C.textMuted, fontFamily:'DM Sans,sans-serif', margin:0 }}>{u.username ? `@${u.username}` : u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {msg && <p style={{ fontSize:12, color:msg.startsWith('✓')?C.green:C.red, fontFamily:'DM Sans,sans-serif', marginBottom:10 }}>{msg}</p>}

        <button onClick={add} disabled={saving||!selected}
          style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:C.blue, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'DM Sans,sans-serif', marginBottom:16, opacity:saving||!selected?0.4:1 }}>
          {saving?'Adding...':'Add Co-host'}
        </button>

        {/* Current co-hosts list */}
        {cohosts.length > 0 && (
          <>
            <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:8 }}>Current Co-hosts</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {cohosts.map((c:any) => {
                const u = c.users || {}
                return (
                  <div key={c.user_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:uc(u.id)+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:uc(u.id) }}>
                      {u.photo_url ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : un(u).slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:'DM Sans,sans-serif', margin:0 }}>{un(u)}</p>
                      {u.username && <p style={{ fontSize:11, color:C.blueL, fontFamily:'DM Sans,sans-serif', margin:0 }}>@{u.username}</p>}
                    </div>
                    <button onClick={()=>remove(c.user_id)} style={{ background:'none', border:'none', cursor:'pointer', color:C.red, fontSize:11, fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>Remove</button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}: { eventId: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const add = async () => {
    if (!email.trim()) return
    setSaving(true); setMsg('')
    const { data: u } = await supabase.from('users').select('id,full_name,email').ilike('email', email.trim()).maybeSingle()
    if (!u) { setMsg('User not found'); setSaving(false); return }
    const { error } = await supabase.from('event_cohosts').upsert({ event_id: eventId, user_id: u.id })
    if (error) setMsg('Error: ' + error.message)
    else setMsg(`✓ ${u.full_name || u.email} added as co-host`)
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }} onClick={onClose}/>
      <div style={{ position:'relative', width:'100%', maxWidth:380, margin:'0 16px', borderRadius:20, padding:24, background:C.card, border:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:'DM Sans,sans-serif' }}>Add Co-host</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted }}><X style={{ width:18, height:18 }}/></button>
        </div>
        <p style={{ fontSize:12, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginBottom:12 }}>Enter the email of the user you want to add as co-host</p>
        <input value={email} onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="email@example.com"
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', marginBottom:10, boxSizing:'border-box' }}/>
        {msg && <p style={{ fontSize:12, color:msg.startsWith('✓')?C.green:C.red, fontFamily:'DM Sans,sans-serif', marginBottom:10 }}>{msg}</p>}
        <button onClick={add} disabled={saving||!email.trim()}
          style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:C.blue, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'DM Sans,sans-serif', opacity:saving||!email.trim()?0.5:1 }}>
          {saving?'Adding...':'Add Co-host'}
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { id } = useParams(); const router = useRouter()
  const eventId = id as string
  const w = useWin(); const isMobile = w < 768; const isTablet = w >= 768 && w < 1100

  const [event,        setEvent]       = useState<any>(null)
  const [isHost,       setIsHost]      = useState(false)
  const [isCohost,     setIsCohost]    = useState(false)
  const [loading,      setLoading]     = useState(true)
  const [accessDenied, setAccessDenied]= useState(false)
  const [streaming,    setStreaming]   = useState(false)
  const [micOn,        setMicOn]       = useState(true)
  const [camOn,        setCamOn]       = useState(true)
  const [mode,         setMode]        = useState<'camera'|'screen'|'board'>('camera')
  const [boardBg,      setBoardBg]     = useState('#0A0A0F')
  // Board tool state — synced to refs so canvas always reads latest values
  const [boardTool,    setBoardTool]   = useState('pen')
  const [boardColor,   setBoardColor]  = useState('#FFFFFF')
  const [boardSize,    setBoardSize]   = useState(4)
  const boardToolRef    = useRef('pen')
  const boardColorRef   = useRef('#FFFFFF')
  const boardSizeRef    = useRef(4)
  const boardOpacityRef = useRef(1)
  const [wbBgOpen,     setWbBgOpen]    = useState(false)
  const [streamErr,    setStreamErr]   = useState('')
  const [vStatus,      setVStatus]     = useState<'idle'|'connecting'|'connected'|'failed'>('idle')
  const [needsUnmute,  setNeedsUnmute] = useState(false)
  const [retries,      setRetries]     = useState(0)
  const [fullscreen,   setFullscreen]  = useState(false)
  const [showCohost,   setShowCohost]  = useState(false)
  const [messages,     setMessages]    = useState<any[]>([])
  const [newMsg,       setNewMsg]      = useState('')
  const [sending,      setSending]     = useState(false)
  const [viewers,      setViewers]     = useState(0)
  const [reactions,    setReactions]   = useState(0)
  const [liked,        setLiked]       = useState(false)
  const [earnings,     setEarnings]    = useState(0)
  const [showChat,     setShowChat]    = useState(true)
  const [unread,       setUnread]      = useState(0)
  const [slowMode,     setSlowMode]    = useState(false)
  const [lastMsg,      setLastMsg]     = useState(0)
  const [slowCD,       setSlowCD]      = useState(0)
  const [mutedUsers,   setMutedUsers]  = useState<Set<string>>(new Set())
  const [hands,        setHands]       = useState<string[]>([])
  const [myHand,       setMyHand]      = useState(false)
  const [recording,    setRecording]   = useState(false)
  const [recStatus,    setRecStatus]   = useState('')
  const [recTime,      setRecTime]     = useState(0)

  const localVid  = useRef<HTMLVideoElement>(null)
  const remoteVid = useRef<HTMLVideoElement>(null)
  const wbCanvas  = useRef<HTMLCanvasElement>(null)
  const vidBox    = useRef<HTMLDivElement>(null)
  const chatEnd   = useRef<HTMLDivElement>(null)
  const wbDropRef = useRef<HTMLDivElement>(null)

  const camStream = useRef<MediaStream|null>(null)
  const scrStream = useRef<MediaStream|null>(null)
  const wbStream  = useRef<MediaStream|null>(null)

  const hPeers = useRef<Map<string,{pc:RTCPeerConnection,iceQueue:RTCIceCandidateInit[]}>>(new Map())
  const vPc    = useRef<RTCPeerConnection|null>(null)
  const vIce   = useRef<RTCIceCandidateInit[]>([])
  const isLive = useRef(false)
  const myUid  = useRef<string>('')  // stored here so presence sync can exclude host

  const chatCh = useRef<any>(null)
  const sigCh  = useRef<any>(null)
  const uRef   = useRef<any>(null)
  const pRef   = useRef<any>(null)
  const retryT = useRef<any>(null)
  const recTimer = useRef<any>(null)
  const mediaRec = useRef<MediaRecorder|null>(null)
  const recChunks= useRef<Blob[]>([])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (wbDropRef.current && !wbDropRef.current.contains(e.target as Node)) setWbBgOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      uRef.current = u; myUid.current = u.id

      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      pRef.current = prof

      const { data: ev } = await supabase.from('events')
        .select('*, users(id,email,full_name,photo_url)').eq('id', eventId).single()
      if (!ev || dead) { router.push('/dashboard'); return }
      setEvent(ev)

      const hc = ev.host_id === u.id || prof?.role === 'admin'
      setIsHost(hc)
      const { data: co } = await supabase.from('event_cohosts')
        .select('id').eq('event_id', eventId).eq('user_id', u.id).maybeSingle()
      const cc = !!co; setIsCohost(cc)
      const ctrl = hc || cc

      if (!ctrl && (ev.price > 0 || !ev.is_free)) {
        const { data: tkt } = await supabase.from('tickets').select('id')
          .eq('user_id', u.id).eq('event_id', eventId)
          .in('status', ['paid','free','confirmed','active']).maybeSingle()
        if (!tkt) { setAccessDenied(true); setLoading(false); return }
      }

      const { data: ml } = await supabase.from('live_muted_users').select('user_id,muted_until').eq('event_id', eventId)
      if (ml) setMutedUsers(new Set(ml.filter(m=>!m.muted_until||new Date(m.muted_until)>new Date()).map(m=>m.user_id)) as Set<string>)

      const { data: hist } = await supabase.from('live_messages').select('*')
        .eq('event_id', eventId).order('created_at', { ascending:true }).limit(200)
      if (hist?.length) {
        setMessages(hist.map(m=>({ id:m.id, user_id:m.user_id, name:m.user_name, avatar:m.user_avatar, text:m.content, ts:new Date(m.created_at).getTime(), isHost:m.is_host })))
        setTimeout(()=>chatEnd.current?.scrollIntoView({ behavior:'smooth' }), 100)
      }

      const { count: rc } = await supabase.from('event_reactions').select('*',{ count:'exact', head:true }).eq('event_id', eventId)
      setReactions(rc||0)
      const { data: myR } = await supabase.from('event_reactions').select('id').eq('event_id', eventId).eq('user_id', u.id).maybeSingle()
      if (myR) setLiked(true)
      if (hc) {
        const { data: tix } = await supabase.from('tickets').select('amount').eq('event_id', eventId).eq('status','paid')
        setEarnings((tix||[]).reduce((s:number,t:any)=>s+Math.floor(t.amount*0.8), 0))
      }

      setLoading(false); if (dead) return

      // ── If host reloads while stream was live, mark as streaming again ──
      if (ctrl && ev.status === 'live') setStreaming(true)

      const ch = supabase.channel(`chat-${eventId}`, { config:{ presence:{ key: u.id } } })
        .on('broadcast', { event:'msg' }, ({ payload })=>{
          setMessages(prev=>prev.find(m=>m.id===payload.id)?prev:[...prev,payload])
          setTimeout(()=>chatEnd.current?.scrollIntoView({ behavior:'smooth' }), 50)
          setUnread(p=>p+1)
        })
        .on('broadcast', { event:'react' }, ()=>setReactions(p=>p+1))
        .on('broadcast', { event:'hand' }, ({ payload })=>{
          setHands(prev=>payload.raised?[...prev.filter(h=>h!==payload.uid),payload.uid]:prev.filter(h=>h!==payload.uid))
        })
        .on('broadcast', { event:'mod' }, ({ payload })=>{
          if (payload.action==='mute'&&payload.target===u.id) alert('You have been muted by the host.')
          if (payload.action==='ban'&&payload.target===u.id) { alert('You have been removed.'); router.push('/dashboard') }
          if (payload.action==='slow') setSlowMode(payload.enabled)
        })
        .on('presence', { event:'sync' }, ()=>{
          // Count only viewers — exclude host (myUid) from count
          const state = ch.presenceState()
          const count = Object.keys(state).filter(k => k !== myUid.current).length
          setViewers(count)
        })
        .subscribe(async s=>{ if (s==='SUBSCRIBED') await ch.track({ uid: u.id }) })
      chatCh.current = ch

      setupSignaling(u.id, ctrl, ev.status === 'live')
    })()

    return ()=>{
      dead = true
      clearTimeout(retryT.current); clearInterval(recTimer.current)
      killTracks()
      vPc.current?.close()
      hPeers.current.forEach(({pc})=>pc.close()); hPeers.current.clear()
      if (chatCh.current) supabase.removeChannel(chatCh.current)
      if (sigCh.current)  supabase.removeChannel(sigCh.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const killTracks = () => {
    camStream.current?.getTracks().forEach(t=>t.stop())
    scrStream.current?.getTracks().forEach(t=>t.stop())
    wbStream.current?.getTracks().forEach(t=>t.stop())
    camStream.current=null; scrStream.current=null; wbStream.current=null
  }

  const replaceVid = (track: MediaStreamTrack) => {
    hPeers.current.forEach(({pc})=>{
      const s=pc.getSenders().find(s=>s.track?.kind==='video')
      if (s) s.replaceTrack(track).catch(()=>{})
    })
  }

  // ── Host peer ─────────────────────────────────────────────────────────────────
  const makeHostPeer = (viewerId: string, stream: MediaStream) => {
    hPeers.current.get(viewerId)?.pc.close()
    hPeers.current.delete(viewerId)
    const pc = new RTCPeerConnection({ iceServers:ICE })
    const entry = { pc, iceQueue:[] as RTCIceCandidateInit[] }
    hPeers.current.set(viewerId, entry)
    stream.getTracks().forEach(t=>pc.addTrack(t, stream))
    pc.onicecandidate=({ candidate })=>{ if(candidate&&sigCh.current) sigCh.current.send({ type:'broadcast', event:'ice', payload:{ to:viewerId, from:'host', candidate:candidate.toJSON() } }) }
    pc.onconnectionstatechange=()=>{ if(pc.connectionState==='failed'||pc.connectionState==='closed'){ hPeers.current.delete(viewerId); pc.close() } }
    pc.oniceconnectionstatechange=()=>{ if(pc.iceConnectionState==='failed') pc.restartIce() }
    pc.createOffer({ offerToReceiveAudio:false, offerToReceiveVideo:false })
      .then(o=>pc.setLocalDescription(o))
      .then(()=>{ sigCh.current?.send({ type:'broadcast', event:'offer', payload:{ to:viewerId, from:uRef.current?.id, sdp:pc.localDescription } }) })
      .catch(e=>console.error('[HOST] offer error:',e))
    return pc
  }

  // ── Viewer peer ───────────────────────────────────────────────────────────────
  const makeViewerPeer = (myId: string) => {
    vPc.current?.close(); vIce.current=[]
    const pc = new RTCPeerConnection({ iceServers:ICE })
    const ms = new MediaStream()
    pc.ontrack=e=>{
      e.streams[0]?.getTracks().forEach(t=>{ if(!ms.getTrackById(t.id)) ms.addTrack(t) })
      if (remoteVid.current) {
        remoteVid.current.srcObject=ms; remoteVid.current.muted=false
        remoteVid.current.play().catch(()=>{
          if (remoteVid.current) { remoteVid.current.muted=true; remoteVid.current.play().catch(()=>{}); setNeedsUnmute(true) }
        })
      }
      setVStatus('connected'); clearTimeout(retryT.current)
    }
    pc.onicecandidate=({ candidate })=>{ if(candidate&&sigCh.current) sigCh.current.send({ type:'broadcast', event:'ice', payload:{ to:'host', from:myId, candidate:candidate.toJSON() } }) }
    pc.onconnectionstatechange=()=>{
      if(pc.connectionState==='connected'){ setVStatus('connected'); setRetries(0); clearTimeout(retryT.current) }
      if(pc.connectionState==='failed'||pc.connectionState==='disconnected'){
        setVStatus('failed')
        retryT.current=setTimeout(()=>{ setRetries(r=>r+1); setVStatus('connecting'); sigCh.current?.send({ type:'broadcast', event:'join', payload:{ viewerId:myId } }) }, 4000)
      }
    }
    pc.oniceconnectionstatechange=()=>{ if(pc.iceConnectionState==='failed') pc.restartIce() }
    vPc.current=pc; return pc
  }

  // ── Signaling ─────────────────────────────────────────────────────────────────
  const setupSignaling = (uid: string, ctrl: boolean, alreadyLive: boolean) => {
    const sig = supabase.channel(`sig-${eventId}`)
    if (ctrl) {
      sig.on('broadcast',{ event:'join' },({ payload })=>{
        const vid=payload.viewerId; if(!vid||vid===uid) return
        if(!isLive.current||!camStream.current){ sig.send({ type:'broadcast', event:'not-live', payload:{ to:vid } }); return }
        makeHostPeer(vid, camStream.current)
      })
      sig.on('broadcast',{ event:'answer' },async({ payload })=>{
        if(payload.to!==uid&&payload.to!=='host') return
        const entry=hPeers.current.get(payload.from); if(!entry) return
        const { pc, iceQueue }=entry
        if(pc.signalingState!=='have-local-offer') return
        try { await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)); for(const c of iceQueue){ try{ await pc.addIceCandidate(new RTCIceCandidate(c)) }catch{} }; entry.iceQueue=[] } catch(e){ console.warn('[HOST]',e) }
      })
      sig.on('broadcast',{ event:'ice' },async({ payload })=>{
        if(payload.to!=='host'&&payload.to!==uid) return
        const entry=hPeers.current.get(payload.from); if(!entry) return
        if(entry.pc.remoteDescription){ try{ await entry.pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) }catch{} } else entry.iceQueue.push(payload.candidate)
      })
    } else {
      sig.on('broadcast',{ event:'offer' },async({ payload })=>{
        if(payload.to!==uid) return
        const pc=makeViewerPeer(uid); setVStatus('connecting')
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          for(const c of vIce.current){ try{ await pc.addIceCandidate(new RTCIceCandidate(c)) }catch{} }; vIce.current=[]
          const ans=await pc.createAnswer(); await pc.setLocalDescription(ans)
          sig.send({ type:'broadcast', event:'answer', payload:{ to:payload.from, from:uid, sdp:pc.localDescription } })
        } catch(e){ console.error('[VIEWER]',e); setVStatus('failed') }
      })
      sig.on('broadcast',{ event:'ice' },async({ payload })=>{
        if(payload.to!==uid) return
        if(vPc.current?.remoteDescription){ try{ await vPc.current.addIceCandidate(new RTCIceCandidate(payload.candidate)) }catch{} } else vIce.current.push(payload.candidate)
      })
      sig.on('broadcast',{ event:'not-live' },({ payload })=>{ if(payload.to===uid) setVStatus('idle') })
      sig.on('broadcast',{ event:'stream-ended' },()=>{ setVStatus('idle'); if(remoteVid.current) remoteVid.current.srcObject=null })
    }
    sig.subscribe(async s=>{
      if(s==='SUBSCRIBED'&&!ctrl&&alreadyLive){
        setVStatus('connecting')
        sig.send({ type:'broadcast', event:'join', payload:{ viewerId:uid } })
        retryT.current=setTimeout(()=>{ if(vPc.current?.connectionState!=='connected') sig.send({ type:'broadcast', event:'join', payload:{ viewerId:uid } }) }, 7000)
      }
    })
    sigCh.current=sig
  }

  // ── Go Live ───────────────────────────────────────────────────────────────────
  const goLive = async () => {
    setStreamErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{ width:{ ideal:1280 }, height:{ ideal:720 }, frameRate:{ ideal:30 } },
        audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true },
      })
      camStream.current=stream; isLive.current=true
      if(localVid.current){ localVid.current.srcObject=stream; localVid.current.muted=true; await localVid.current.play().catch(()=>{}) }
      setStreaming(true); setMode('camera')
      await supabase.from('events').update({ status:'live' }).eq('id', eventId)
      const ps=chatCh.current?.presenceState()||{}
      Object.keys(ps).filter(v=>v!==uRef.current?.id).forEach(vid=>makeHostPeer(vid,stream))
      startRec(stream)
    } catch(err:any){
      if(err.name==='NotAllowedError') setStreamErr('Camera/mic access denied. Allow permissions.')
      else if(err.name==='NotFoundError') setStreamErr('No camera or microphone found.')
      else setStreamErr('Could not start: '+err.message)
    }
  }

  const endStream = async () => {
    isLive.current=false
    sigCh.current?.send({ type:'broadcast', event:'stream-ended', payload:{} })
    await stopRec()
    killTracks()
    hPeers.current.forEach(({pc})=>pc.close()); hPeers.current.clear()
    if(localVid.current) localVid.current.srcObject=null
    setStreaming(false)
    await supabase.from('events').update({ status:'ended', ended_at:new Date().toISOString() }).eq('id', eventId)
    router.push('/host')
  }

  const toggleMic = () => { camStream.current?.getAudioTracks().forEach(t=>{ t.enabled=!t.enabled }); setMicOn(p=>!p) }
  const toggleCam = () => { camStream.current?.getVideoTracks().forEach(t=>{ t.enabled=!t.enabled }); setCamOn(p=>!p) }

  const toCamera = () => {
    const s=camStream.current; if(!s) return
    scrStream.current?.getTracks().forEach(t=>t.stop()); scrStream.current=null
    wbStream.current?.getTracks().forEach(t=>t.stop()); wbStream.current=null
    if(localVid.current) localVid.current.srcObject=s
    const vt=s.getVideoTracks()[0]; if(vt) replaceVid(vt)
    setMode('camera')
  }

  const startScreen = async () => {
    try {
      const ss=await (navigator.mediaDevices as any).getDisplayMedia({ video:{ cursor:'always' }, audio:false })
      scrStream.current=ss
      wbStream.current?.getTracks().forEach(t=>t.stop()); wbStream.current=null
      setMode('screen')
      if(localVid.current){ localVid.current.srcObject=ss; await localVid.current.play().catch(()=>{}) }
      const vt=ss.getVideoTracks()[0]; if(vt){ replaceVid(vt); vt.onended=stopScreen }
    } catch{}
  }
  const stopScreen = () => { scrStream.current?.getTracks().forEach(t=>t.stop()); scrStream.current=null; toCamera() }

  const startBoard = (bg: string) => {
    scrStream.current?.getTracks().forEach(t=>t.stop()); scrStream.current=null
    wbStream.current?.getTracks().forEach(t=>t.stop()); wbStream.current=null
    setBoardBg(bg); setMode('board')
    setTimeout(()=>{
      const canvas=wbCanvas.current; if(!canvas){ setStreamErr('Canvas not ready.'); return }
      try {
        const ws=(canvas as any).captureStream(30) as MediaStream
        wbStream.current=ws
        const vt=ws.getVideoTracks()[0]; if(!vt){ setStreamErr('Canvas stream unavailable. Use Chrome/Edge.'); return }
        replaceVid(vt)
        if(localVid.current){ localVid.current.srcObject=ws; localVid.current.play().catch(()=>{}) }
      } catch(e){ setStreamErr('Board streaming requires Chrome 72+ or Edge.') }
    }, 200)
  }

  const clearBoard = () => {
    const canvas=wbCanvas.current; if(!canvas) return
    const ctx=canvas.getContext('2d')!; ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1
    ctx.fillStyle=boardBg; ctx.fillRect(0,0,canvas.width,canvas.height)
  }

  const toggleFS = () => {
    if(!vidBox.current) return
    if(!document.fullscreenElement){ vidBox.current.requestFullscreen(); setFullscreen(true) }
    else{ document.exitFullscreen(); setFullscreen(false) }
  }

  const startRec = (stream: MediaStream) => {
    recChunks.current=[]
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t))
    try {
      const rec=new MediaRecorder(stream, mime?{ mimeType:mime }:undefined)
      rec.ondataavailable=e=>{ if(e.data.size>0) recChunks.current.push(e.data) }
      rec.start(5000); mediaRec.current=rec; setRecording(true); setRecTime(0)
      recTimer.current=setInterval(()=>setRecTime(p=>p+1), 1000)
    } catch{}
  }
  const stopRec = async () => {
    clearInterval(recTimer.current)
    const rec=mediaRec.current; if(!rec||rec.state==='inactive') return
    setRecStatus('Saving...')
    await new Promise<void>(r=>{ rec.onstop=()=>r(); rec.stop() })
    setRecording(false)
    if(!recChunks.current.length){ setRecStatus(''); return }
    const blob=new Blob(recChunks.current,{ type:rec.mimeType||'video/webm' })
    const path=`${eventId}/${Date.now()}.webm`; setRecStatus('Uploading...')
    const { error }=await supabase.storage.from('event-recordings').upload(path,blob,{ contentType:blob.type, upsert:true })
    if(!error){
      const { data:ud }=await supabase.storage.from('event-recordings').createSignedUrl(path, 60*60*24*30)
      await supabase.from('event_recordings').insert({ event_id:eventId, host_id:uRef.current?.id, storage_path:path, public_url:ud?.signedUrl||'', size_bytes:blob.size, premium_only:true })
      setRecStatus('✓ Saved!'); setTimeout(()=>setRecStatus(''), 3000)
    } else setRecStatus('Upload failed')
    recChunks.current=[]
  }

  const sendMsg = async () => {
    if(!newMsg.trim()||sending) return
    const u=uRef.current, p=pRef.current
    if(slowMode&&!(isHost||isCohost)){
      const elapsed=(Date.now()-lastMsg)/1000
      if(elapsed<10){ const rem=Math.ceil(10-elapsed); setSlowCD(rem); const t=setInterval(()=>setSlowCD(prev=>{ if(prev<=1){ clearInterval(t); return 0 } return prev-1 }),1000); return }
    }
    if(hasBad(newMsg)&&!(isHost||isCohost)){ alert('Message blocked.'); return }
    if(mutedUsers.has(u?.id||'')){ alert('You are muted.'); return }
    setSending(true)
    const m={ id:crypto.randomUUID(), user_id:u?.id, name:uname(p||u), avatar:p?.photo_url||'', text:newMsg.trim().slice(0,500), ts:Date.now(), isHost:isHost||isCohost }
    setNewMsg(''); setLastMsg(Date.now())
    setMessages(prev=>[...prev,m]); setTimeout(()=>chatEnd.current?.scrollIntoView({ behavior:'smooth' }),50)
    await supabase.from('live_messages').insert({ id:m.id, event_id:eventId, user_id:u?.id, user_name:m.name, user_avatar:m.avatar, is_host:m.isHost, content:m.text })
    chatCh.current?.send({ type:'broadcast', event:'msg', payload:m })
    setSending(false)
  }

  const doLike = async () => {
    if(liked) return; setLiked(true); setReactions(p=>p+1)
    await supabase.from('event_reactions').insert({ event_id:eventId, user_id:uRef.current?.id })
    chatCh.current?.send({ type:'broadcast', event:'react', payload:{} })
  }
  const toggleHand = () => {
    const raised=!myHand; setMyHand(raised)
    chatCh.current?.send({ type:'broadcast', event:'hand', payload:{ uid:uRef.current?.id, name:uname(pRef.current||uRef.current), raised } })
  }

  const canCtrl = isHost || isCohost

  if(loading) return (
    <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, flexDirection:'column', gap:12 }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <Loader2 style={{ width:36, height:36, color:C.blueL, animation:'spin 1s linear infinite' }}/>
      <p style={{ color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:14 }}>Joining room...</p>
    </div>
  )
  if(accessDenied) return (
    <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, padding:24 }}>
      <div style={{ borderRadius:24, padding:36, textAlign:'center', maxWidth:340, width:'100%', background:C.card, border:`1px solid ${C.border}` }}>
        <Shield style={{ width:44, height:44, color:C.red, marginBottom:16 }}/>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:8 }}>Ticket Required</h2>
        <p style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginBottom:24 }}>You need a ticket to attend this event.</p>
        <button onClick={()=>router.push(`/events/${eventId}`)} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:C.gold, color:'#0A0F1E', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>Get Ticket →</button>
      </div>
    </div>
  )

  const renderVideoArea = () => (
    <div ref={vidBox} style={{ position:'relative', width:'100%', height:'100%', background:'#000', overflow:'hidden' }}>
      {canCtrl && <video ref={localVid} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0, opacity:streaming&&mode!=='board'?1:0, transition:'opacity 0.2s' }}/>}
      {!canCtrl && <video ref={remoteVid} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0, visibility:vStatus==='connected'?'visible':'hidden' }}/>}
      {mode==='board'&&canCtrl && (
        <div style={{ position:'absolute', inset:0, zIndex:3, background:boardBg }}>
          <BoardCanvas bg={boardBg} canvasRef={wbCanvas} toolRef={boardToolRef} colorRef={boardColorRef} sizeRef={boardSizeRef} opacityRef={boardOpacityRef}/>
        </div>
      )}

      {/* Waiting placeholder */}
      {((canCtrl&&!streaming)||(!canCtrl&&vStatus!=='connected'))&&mode!=='board' && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'linear-gradient(180deg,#000 0%,#0A0F1E 100%)', zIndex:2 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', border:`3px solid ${uac(event?.users?.id||'')}44`, flexShrink:0 }}>
            {event?.users?.photo_url ? <img src={event.users.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ width:'100%', height:'100%', background:uac(event?.users?.id||'')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, color:uac(event?.users?.id||''), fontFamily:'Syne,sans-serif' }}>{uinits(event?.users)}</div>}
          </div>
          <div style={{ textAlign:'center', maxWidth:300, padding:'0 20px' }}>
            {canCtrl ? (
              <>
                <p style={{ color:'#fff', fontWeight:700, fontSize:16, fontFamily:'Syne,sans-serif', marginBottom:6 }}>{isHost?'You are the host':'You are co-host'}</p>
                <p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:24 }}>Click Go Live to start broadcasting</p>
                {streamErr && <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, background:C.redDim, border:'1px solid rgba(239,68,68,0.3)' }}><p style={{ fontSize:12, color:C.red, fontFamily:'DM Sans,sans-serif' }}>{streamErr}</p></div>}
                <button onClick={goLive} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 32px', borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.red},#DC2626)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 6px 24px rgba(239,68,68,0.4)' }}>
                  <Radio style={{ width:18, height:18 }}/>Go Live
                </button>
              </>
            ) : (
              <>
                <p style={{ color:'#fff', fontWeight:600, fontSize:15, fontFamily:'Syne,sans-serif', marginBottom:6 }}>{uname(event?.users)}</p>
                {vStatus==='connecting' && <><p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:14 }}>Connecting to stream...</p><div style={{ width:28, height:28, border:`3px solid ${C.blue}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/>{retries>0&&<p style={{ color:C.textDim, fontSize:11, marginTop:10, fontFamily:'DM Sans,sans-serif' }}>Retry {retries}...</p>}</>}
                {vStatus==='idle'   && <p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif' }}>{event?.status==='live'?'Stream starting...':'Waiting for host to go live'}</p>}
                {vStatus==='failed' && <><p style={{ color:C.textMuted, fontSize:13, fontFamily:'DM Sans,sans-serif', marginBottom:14 }}>Connection lost. Reconnecting...</p><div style={{ width:28, height:28, border:`3px solid ${C.red}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/></>}
              </>
            )}
          </div>
        </div>
      )}

      {canCtrl&&streaming&&!camOn&&mode==='camera' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.surface, zIndex:4 }}>
          <div style={{ textAlign:'center' }}><div style={{ width:56, height:56, borderRadius:'50%', background:uac(uRef.current?.id||'')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:uac(uRef.current?.id||''), margin:'0 auto 8px' }}>{uinits(pRef.current)}</div><p style={{ color:C.textMuted, fontSize:12, fontFamily:'DM Sans,sans-serif' }}>Camera off</p></div>
        </div>
      )}

      {/* Tap to unmute */}
      {!canCtrl&&needsUnmute&&vStatus==='connected' && (
        <div onClick={()=>{ if(remoteVid.current){ remoteVid.current.muted=false; remoteVid.current.play().catch(()=>{}) }; setNeedsUnmute(false) }}
          style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, cursor:'pointer', background:'rgba(0,0,0,0.5)' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'20px 32px', borderRadius:16, background:C.card, border:`1px solid ${C.border}` }}>
            <Volume2 style={{ width:32, height:32, color:C.blueL }}/>
            <p style={{ color:C.text, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15 }}>Tap to enable audio</p>
          </div>
        </div>
      )}

      {/* Mode badges */}
      {mode==='screen' && <div style={{ position:'absolute', top:12, left:12, zIndex:5, display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'rgba(37,99,235,0.25)', backdropFilter:'blur(8px)', border:'1px solid rgba(37,99,235,0.4)' }}><Monitor style={{ width:13, height:13, color:C.blueL }}/><span style={{ fontSize:11, fontWeight:700, color:C.blueL }}>Screen Sharing</span></div>}
      {mode==='board'  && <div style={{ position:'absolute', top:12, left:12, zIndex:5, display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'rgba(124,58,237,0.25)', backdropFilter:'blur(8px)', border:'1px solid rgba(124,58,237,0.4)' }}><PenLine style={{ width:13, height:13, color:'#A78BFA' }}/><span style={{ fontSize:11, fontWeight:700, color:'#A78BFA' }}>Board Live</span></div>}

      <div style={{ position:'absolute', top:10, right:10, zIndex:10 }}>
        <button onClick={toggleFS} style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {fullscreen?<Minimize style={{ width:14, height:14 }}/>:<Maximize style={{ width:14, height:14 }}/>}
        </button>
      </div>
      {hands.length>0&&canCtrl && <div style={{ position:'absolute', bottom:12, left:12, zIndex:5, padding:'6px 12px', borderRadius:20, background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.4)', backdropFilter:'blur(8px)' }}><span style={{ fontSize:12, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>✋ {hands.length} hand{hands.length>1?'s':''} raised</span></div>}
    </div>
  )

  const renderHostBar = () => (
    <div style={{ flexShrink:0, background:C.surface, borderTop:`1px solid ${C.border}` }}>
      {/* Board toolbar — shown inline when in board mode */}
      {streaming&&mode==='board' && (
        <BoardToolbar bg={boardBg} canvasRef={wbCanvas}
          toolRef={boardToolRef} colorRef={boardColorRef} sizeRef={boardSizeRef} opacityRef={boardOpacityRef}
          tool={boardTool} setTool={t=>{ setBoardTool(t); boardToolRef.current=t }}
          color={boardColor} setColor={c=>{ setBoardColor(c); boardColorRef.current=c }}
          size={boardSize} setSize={s=>{ setBoardSize(s); boardSizeRef.current=s }}
          onClear={clearBoard}
          onFileLoad={()=>{}}
        />
      )}
      {/* Mode switcher */}
      {streaming && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 12px', borderBottom:`1px solid ${C.border}`, flexWrap:'wrap' }}>
          <button onClick={toCamera} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${mode==='camera'?'rgba(37,99,235,0.4)':'transparent'}`, background:mode==='camera'?C.blueDim:'rgba(51,65,85,0.4)', color:mode==='camera'?C.blueL:C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            <Video style={{ width:13, height:13 }}/>Camera
          </button>
          <button onClick={mode==='screen'?stopScreen:startScreen} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${mode==='screen'?'rgba(37,99,235,0.4)':'transparent'}`, background:mode==='screen'?C.blueDim:'rgba(51,65,85,0.4)', color:mode==='screen'?C.blueL:C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {mode==='screen'?<MonitorOff style={{ width:13, height:13 }}/>:<Monitor style={{ width:13, height:13 }}/>}
            {mode==='screen'?'Stop Share':'Screen'}
          </button>
          {/* Board dropdown */}
          <div ref={wbDropRef} style={{ position:'relative' }}>
            <button onClick={()=>setWbBgOpen(p=>!p)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid ${mode==='board'?'rgba(124,58,237,0.4)':'transparent'}`, background:mode==='board'?'rgba(124,58,237,0.15)':'rgba(51,65,85,0.4)', color:mode==='board'?'#A78BFA':C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              <PenLine style={{ width:13, height:13 }}/>Board<ChevronDown style={{ width:11, height:11, marginLeft:1 }}/>
            </button>
            {wbBgOpen && (
              <div style={{ position:'absolute', bottom:'calc(100% + 4px)', left:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', zIndex:50, minWidth:130, boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                {[{ n:'White', v:'#F8FAFC' },{ n:'Dark', v:'#0A0A0F' },{ n:'Green', v:'#064E3B' }].map(b=>(
                  <button key={b.v} onClick={()=>{ startBoard(b.v); setWbBgOpen(false) }}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', border:'none', background:boardBg===b.v&&mode==='board'?'rgba(124,58,237,0.15)':'transparent', color:boardBg===b.v&&mode==='board'?'#A78BFA':C.text, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', textAlign:'left' }}>
                    <div style={{ width:14, height:14, borderRadius:3, background:b.v, border:'1px solid rgba(255,255,255,0.25)', flexShrink:0 }}/>{b.n}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Add co-host (host only) */}
          {isHost && (
            <button onClick={()=>setShowCohost(true)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1px solid transparent`, background:'rgba(51,65,85,0.4)', color:C.textDim, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              <UserPlus style={{ width:13, height:13 }}/>Co-host
            </button>
          )}
        </div>
      )}
      {/* Main controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:isMobile?'10px 12px':'12px 20px' }}>
        <button onClick={toggleMic} style={{ width:46, height:46, borderRadius:'50%', border:`1px solid ${micOn?C.border:C.red+'55'}`, background:micOn?C.card:C.redDim, color:micOn?C.text:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {micOn?<Mic style={{ width:19, height:19 }}/>:<MicOff style={{ width:19, height:19 }}/>}
        </button>
        <button onClick={toggleCam} style={{ width:46, height:46, borderRadius:'50%', border:`1px solid ${camOn?C.border:C.red+'55'}`, background:camOn?C.card:C.redDim, color:camOn?C.text:C.red, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {camOn?<Video style={{ width:19, height:19 }}/>:<VideoOff style={{ width:19, height:19 }}/>}
        </button>
        {streaming
          ? <button onClick={endStream} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:24, border:'none', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(239,68,68,0.35)' }}><PhoneOff style={{ width:17, height:17 }}/>End Stream</button>
          : <button onClick={goLive}    style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:24, border:'none', background:`linear-gradient(135deg,${C.red},#DC2626)`, color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(239,68,68,0.35)' }}><Radio style={{ width:17, height:17 }}/>Go Live</button>
        }
        {recording && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.red, fontFamily:'DM Sans,sans-serif', fontWeight:700 }}><span style={{ width:8, height:8, borderRadius:'50%', background:C.red, display:'inline-block', animation:'pulse 1s infinite' }}/>{recFmt(recTime)}</div>}
        {recStatus && <span style={{ fontSize:11, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>{recStatus}</span>}
      </div>
      {slowMode && <p style={{ textAlign:'center', fontSize:11, color:C.gold, paddingBottom:8, fontFamily:'DM Sans,sans-serif' }}>⏱ Slow mode ON</p>}
    </div>
  )

  const renderViewerBar = () => (
    <div style={{ flexShrink:0, background:C.surface, borderTop:`1px solid ${C.border}`, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <button onClick={doLike} disabled={liked} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${liked?C.red+'44':C.border}`, background:liked?C.redDim:C.card, color:liked?C.red:C.textMuted, cursor:liked?'default':'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif', opacity:liked?0.8:1 }}>
        <Heart style={{ width:14, height:14, fill:liked?C.red:'none', stroke:liked?C.red:'currentColor' }}/>{reactions>0?reactions:(!isMobile?'Like':'')}
      </button>
      <button onClick={toggleHand} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${myHand?C.gold+'44':C.border}`, background:myHand?C.goldDim:C.card, color:myHand?C.gold:C.textMuted, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif' }}>
        <Hand style={{ width:14, height:14 }}/>{!isMobile&&(myHand?'Lower Hand':'Raise Hand')}
      </button>
      <div style={{ flex:1 }}/>
      {isMobile && <button onClick={()=>{ setShowChat(true); setUnread(0) }} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:20, border:`1px solid ${C.border}`, background:C.card, color:C.blueL, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif' }}><MessageCircle style={{ width:14, height:14 }}/>Chat{unread>0&&<span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:C.red, fontSize:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>{unread>9?'9+':unread}</span>}</button>}
      <button onClick={()=>router.push('/dashboard')} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:20, border:'none', background:C.redDim, color:C.red, cursor:'pointer', fontSize:12, fontFamily:'DM Sans,sans-serif', fontWeight:600 }}><PhoneOff style={{ width:13, height:13 }}/>Leave</button>
    </div>
  )

  const renderChat = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg }}>
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.card, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'DM Sans,sans-serif' }}>Live Chat</span>
          {slowMode&&<span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:C.goldDim, color:C.gold, fontWeight:700 }}>SLOW</span>}
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:C.textMuted }}><Users style={{ width:11, height:11 }}/>{viewers}</div>
          {reactions>0&&<div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:C.red }}><Heart style={{ width:11, height:11, fill:C.red }}/>{reactions}</div>}
        </div>
        {isMobile&&<button onClick={()=>setShowChat(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, padding:4 }}><ChevronDown style={{ width:18, height:18 }}/></button>}
      </div>
      {canCtrl&&hands.length>0&&(
        <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.border}`, background:'rgba(245,158,11,0.05)', flexShrink:0 }}>
          <p style={{ fontSize:11, color:C.gold, fontFamily:'DM Sans,sans-serif', fontWeight:600, marginBottom:4 }}>✋ Raised Hands ({hands.length})</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{hands.map(uid=><span key={uid} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:C.goldDim, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>{uid.slice(0,8)}</span>)}</div>
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length===0&&<div style={{ textAlign:'center', paddingTop:40 }}><p style={{ fontSize:12, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>Chat is live — say hello! 👋</p></div>}
        {messages.map(m=>(
          <div key={m.id} style={{ display:'flex', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:m.isHost?`linear-gradient(135deg,${C.gold},#F97316)`:`linear-gradient(135deg,${C.blue},${C.blueL})` }}>
              {m.avatar?<img src={m.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:m.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                <span style={{ fontSize:11, fontWeight:700, color:m.isHost?C.gold:C.blueL, fontFamily:'DM Sans,sans-serif' }}>{m.name}</span>
                {m.isHost&&<span style={{ fontSize:8, padding:'1px 5px', borderRadius:3, background:C.goldDim, color:C.gold, fontWeight:700 }}>HOST</span>}
                <span style={{ fontSize:10, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>{tsAgo(m.ts)}</span>
                {canCtrl&&<button onClick={()=>setMutedUsers(p=>new Set([...p,m.user_id]))} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:C.textDim, fontSize:9, padding:'1px 4px', borderRadius:3 }}>🔇</button>}
              </div>
              <p style={{ fontSize:13, color:'#D4DBEE', fontFamily:'DM Sans,sans-serif', lineHeight:1.5, wordBreak:'break-word' }}>{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEnd}/>
      </div>
      <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        {slowCD>0&&<p style={{ fontSize:11, color:C.gold, marginBottom:6, textAlign:'center', fontFamily:'DM Sans,sans-serif' }}>⏱ {slowCD}s until next message</p>}
        <div style={{ display:'flex', gap:8 }}>
          <input type="text" value={newMsg} onChange={e=>setNewMsg(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
            placeholder="Say something..."
            maxLength={500}
            style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none' }}
            onFocus={e=>(e.target.style.borderColor='rgba(37,99,235,0.5)')}
            onBlur={e=>(e.target.style.borderColor=C.border)}
          />
          <button onClick={sendMsg} disabled={!newMsg.trim()||sending||slowCD>0}
            style={{ width:42, height:42, borderRadius:12, border:'none', cursor:'pointer', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', opacity:(!newMsg.trim()||sending||slowCD>0)?0.4:1 }}>
            {sending?<Loader2 style={{ width:16, height:16, animation:'spin .8s linear infinite' }}/>:<Send style={{ width:16, height:16 }}/>}
          </button>
        </div>
      </div>
    </div>
  )

  const renderTopBar = () => (
    <div style={{ padding:'10px 16px', background:C.card, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
        {event?.status==='live'&&<span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:C.redDim, color:C.red, flexShrink:0 }}><span style={{ width:5, height:5, borderRadius:'50%', background:C.red, animation:'pulse 1.2s infinite' }}/>LIVE</span>}
        <h1 style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:'DM Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event?.title}</h1>
        {canCtrl&&<span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:C.goldDim, color:C.gold, flexShrink:0 }}><Crown style={{ width:9, height:9 }}/>{isHost?'Host':'Co-host'}</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        {isHost&&earnings>0&&<span style={{ fontSize:13, fontWeight:700, color:C.gold, fontFamily:'DM Sans,sans-serif' }}>${(earnings/100).toFixed(2)}</span>}
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:C.textMuted }}><Users style={{ width:12, height:12 }}/>{viewers}</div>
        {!isMobile&&!showChat&&<button onClick={()=>{ setShowChat(true); setUnread(0) }} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.blueL, cursor:'pointer', fontSize:12 }}><MessageCircle style={{ width:12, height:12 }}/>Chat{unread>0&&` (${unread})`}</button>}
      </div>
    </div>
  )

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', overflow:'hidden', background:C.bg }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box;}`}</style>
      {renderTopBar()}
      {showCohost && <CohostModal eventId={eventId} hostId={uRef.current?.id||''} eventTitle={event?.title||''} onClose={()=>setShowCohost(false)}/>}
      {isMobile&&(
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
          <div style={{ flex:1, position:'relative', overflow:'hidden' }}>{renderVideoArea()}</div>
          {canCtrl?renderHostBar():renderViewerBar()}
          {showChat&&<div style={{ position:'absolute', inset:0, zIndex:30 }}>{renderChat()}</div>}
          {!showChat&&!canCtrl&&<button onClick={()=>{ setShowChat(true); setUnread(0) }} style={{ position:'absolute', bottom:72, right:16, zIndex:20, width:48, height:48, borderRadius:'50%', background:C.blue, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.45)' }}><MessageCircle style={{ width:20, height:20, color:'#fff' }}/>{unread>0&&<span style={{ position:'absolute', top:-2, right:-2, width:18, height:18, borderRadius:'50%', background:C.red, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>{unread>9?'9+':unread}</span>}</button>}
        </div>
      )}
      {isTablet&&(
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ flex:'0 0 58%', display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, position:'relative', overflow:'hidden' }}>{renderVideoArea()}</div>
            {canCtrl?renderHostBar():renderViewerBar()}
          </div>
          <div style={{ flex:'0 0 42%', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>{renderChat()}</div>
        </div>
      )}
      {!isMobile&&!isTablet&&(
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ flex:showChat?'0 0 70%':'1', display:'flex', flexDirection:'column', transition:'flex .25s ease' }}>
            <div style={{ flex:1, position:'relative', overflow:'hidden' }}>{renderVideoArea()}</div>
            {canCtrl?renderHostBar():renderViewerBar()}
          </div>
          {showChat&&<div style={{ flex:'0 0 30%', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>{renderChat()}</div>}
        </div>
      )}
    </div>
  )
}
