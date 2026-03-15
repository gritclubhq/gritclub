'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Search, Trash2, Loader2, X, Heart, MessageCircle,
  Image as Img, RefreshCw, Megaphone, Upload, Check, Bell
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)', text:'#F0F4FF',
  textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
}

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const timeAgo = (ts: string) => {
  const d = Date.now()-new Date(ts).getTime(), m=Math.floor(d/60000)
  if (m<1) return 'just now'; if (m<60) return `${m}m ago`
  const h=Math.floor(m/60); if (h<24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`
}

function Avatar({ u, size=36 }: { u: any; size?: number }) {
  const color = avatarColor(u?.id||'')
  return (
    <div style={{ width:size, height:size, minWidth:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:color+'22', color, fontSize:size*0.35, fontWeight:700, fontFamily:'Syne,sans-serif' }}>
      {u?.photo_url ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getName(u).slice(0,2).toUpperCase()}
    </div>
  )
}

// ─── Full post card for admin ─────────────────────────────────────────────────
function AdminPostCard({ post, onDelete, deleting }: any) {
  const author   = post.users || {}
  const imgs     = (post.image_urls || []).filter(Boolean)
  const [confirm, setConfirm] = useState(false)

  return (
    <div style={{ borderRadius:16, overflow:'hidden', background:C.card, border:`1px solid ${C.border}` }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Avatar u={author} size={36} />
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif' }}>{getName(author)}</p>
            <div style={{ display:'flex', gap:8 }}>
              {author.username && <p style={{ fontSize:11, color:C.blueLight, fontFamily:'DM Sans,sans-serif' }}>@{author.username}</p>}
              <p style={{ fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>{timeAgo(post.created_at)}</p>
            </div>
          </div>
        </div>
        {!confirm ? (
          <button onClick={() => setConfirm(true)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background:C.redDim, color:C.red, fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600 }}>
            <Trash2 style={{ width:12, height:12 }} /> Delete
          </button>
        ) : (
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={() => setConfirm(false)} style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, cursor:'pointer', background:'transparent', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:12 }}>Cancel</button>
            <button onClick={() => { onDelete(post.id); setConfirm(false) }} disabled={deleting===post.id}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:700 }}>
              {deleting===post.id ? <Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }} /> : <Trash2 style={{ width:11, height:11 }} />}
              Confirm
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ padding:'0 14px 10px', fontSize:14, color:C.text, fontFamily:'DM Sans,sans-serif', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>
          {post.content}
        </p>
      )}

      {/* IMAGES — always fully visible for admin */}
      {imgs.length > 0 && (
        <div style={{ display:'grid', gap:2, gridTemplateColumns:imgs.length===1?'1fr':'1fr 1fr' }}>
          {imgs.slice(0,4).map((url: string, i: number) => (
            <div key={i} style={{ position:'relative', aspectRatio:imgs.length===1?'16/9':'1/1', overflow:'hidden', background:C.surface }}>
              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              {imgs.length > 4 && i === 3 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:22, fontWeight:800, color:'#fff' }}>+{imgs.length-4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'flex', gap:16, padding:'10px 14px', borderTop:`1px solid ${C.border}`, background:C.surface }}>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
          <Heart style={{ width:13, height:13, color:C.red }} /> {post.likes_count||0}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
          <MessageCircle style={{ width:13, height:13, color:C.blueLight }} /> {post.comments_count||0}
        </span>
        {imgs.length > 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
            <Img style={{ width:13, height:13, color:C.gold }} /> {imgs.length} image{imgs.length>1?'s':''}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Announce panel with image upload ─────────────────────────────────────────
function AnnouncePanel({ adminId }: { adminId: string }) {
  const [title,        setTitle]        = useState('')
  const [body,         setBody]         = useState('')
  const [linkUrl,      setLinkUrl]      = useState('')
  const [linkText,     setLinkText]     = useState('')
  const [imgFile,      setImgFile]      = useState<File|null>(null)
  const [imgPreview,   setImgPreview]   = useState<string|null>(null)
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setAnnouncements(data||[]))
  }, [])

  const handleImgFile = (f: File) => {
    if (f.size > 5*1024*1024) { alert('Max 5MB'); return }
    setImgFile(f)
    const r = new FileReader(); r.onload = e => setImgPreview(e.target?.result as string); r.readAsDataURL(f)
  }

  const send = async () => {
    if (!title.trim()) return
    setSending(true)
    try {
      let imgUrl: string|null = null

      // Upload image if provided
      if (imgFile) {
        const path = `announcements/${Date.now()}_${imgFile.name.replace(/[^a-zA-Z0-9._]/g,'_')}`
        const { error: upErr } = await supabase.storage.from('post-images').upload(path, imgFile, { contentType: imgFile.type })
        if (!upErr) {
          imgUrl = supabase.storage.from('post-images').getPublicUrl(path).data.publicUrl
        }
      }

      const { data, error } = await supabase.from('announcements').insert({
        title:     title.trim(),
        body:      body.trim() || null,
        image_url: imgUrl,
        link_url:  linkUrl.trim() || null,
        link_text: linkText.trim() || null,
        created_by: adminId,
        is_active:  true,
      }).select().single()

      if (error) throw error

      setAnnouncements(prev => [data, ...prev])
      setTitle(''); setBody(''); setLinkUrl(''); setLinkText(''); setImgFile(null); setImgPreview(null)
      setSent(true); setTimeout(() => setSent(false), 3000)
    } catch (err: any) {
      alert('Failed to send: ' + err.message)
    }
    setSending(false)
  }

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Compose */}
      <div style={{ borderRadius:16, padding:20, background:C.card, border:`1px solid rgba(245,158,11,0.2)` }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.gold, fontFamily:'Syne,sans-serif', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <Megaphone style={{ width:15, height:15 }} /> New Announcement
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Announcement title..."
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,0.4)')} onBlur={e=>(e.target.style.borderColor=C.border)} />
          </div>

          <div>
            <label style={{ display:'block', fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Message</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Optional message body..." rows={3}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,0.4)')} onBlur={e=>(e.target.style.borderColor=C.border)} />
          </div>

          {/* Image upload */}
          <div>
            <label style={{ display:'block', fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Image (optional)</label>
            {imgPreview ? (
              <div style={{ position:'relative', borderRadius:10, overflow:'hidden', aspectRatio:'16/6' }}>
                <img src={imgPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <button onClick={() => { setImgFile(null); setImgPreview(null) }}
                  style={{ position:'absolute', top:8, right:8, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                  <X style={{ width:13, height:13 }} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                style={{ border:`2px dashed ${C.border}`, borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer', background:C.surface }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(245,158,11,0.4)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}>
                <Img style={{ width:24, height:24, color:C.textDim, margin:'0 auto 8px' }} />
                <p style={{ fontSize:13, color:C.textDim, fontFamily:'DM Sans,sans-serif', margin:0 }}>Click to upload image</p>
                <p style={{ fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', margin:'4px 0 0' }}>PNG, JPG up to 5MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) handleImgFile(f); e.target.value='' }} />
          </div>

          {/* Optional link */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
            <div>
              <label style={{ display:'block', fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Link URL</label>
              <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Link Text</label>
              <input value={linkText} onChange={e=>setLinkText(e.target.value)} placeholder="Learn more"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>

          <button onClick={send} disabled={!title.trim()||sending}
            style={{ padding:'12px', borderRadius:12, border:'none', cursor:!title.trim()||sending?'not-allowed':'pointer', background:sent?C.green:C.gold, color:sent?'#fff':'#0A0F1E', fontFamily:'DM Sans,sans-serif', fontWeight:800, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:!title.trim()||sending?0.5:1 }}>
            {sending ? <><Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} /> Sending...</> : sent ? <><Check style={{ width:15, height:15 }} /> Sent!</> : <><Megaphone style={{ width:15, height:15 }} /> Send to All Users</>}
          </button>
        </div>
      </div>

      {/* Past announcements */}
      {announcements.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.textDim, fontFamily:'DM Sans,sans-serif', textTransform:'uppercase', letterSpacing:'0.1em' }}>Past Announcements</p>
          {announcements.map(a => (
            <div key={a.id} style={{ borderRadius:14, overflow:'hidden', background:C.card, border:`1px solid ${C.border}` }}>
              {a.image_url && (
                <img src={a.image_url} alt="" style={{ width:'100%', aspectRatio:'16/5', objectFit:'cover', display:'block' }} />
              )}
              <div style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:'Syne,sans-serif', marginBottom:a.body?4:0 }}>{a.title}</p>
                  {a.body && <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>{a.body}</p>}
                  <p style={{ fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', marginTop:4 }}>{timeAgo(a.created_at)}</p>
                </div>
                <button onClick={() => deleteAnnouncement(a.id)}
                  style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', background:C.redDim, color:C.red, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Trash2 style={{ width:13, height:13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminContentPage() {
  const [posts,    setPosts]    = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [tab,      setTab]      = useState<'posts'|'comments'|'announce'>('posts')
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [deleting, setDeleting] = useState<string|null>(null)
  const [adminId,  setAdminId]  = useState<string>('')

  const load = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }, { data: { user: u } }] = await Promise.all([
      supabase.from('posts')
        .select('id, content, image_urls, created_at, user_id, likes_count, comments_count, users(id, full_name, email, photo_url, username, role)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('post_comments')
        .select('id, content, created_at, user_id, post_id, users(id, full_name, email, photo_url)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.auth.getUser(),
    ])
    setPosts(p||[])
    setComments(c||[])
    if (u) setAdminId(u.id)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const ch = supabase.channel('admin-rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'posts' }, () => load())
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'posts' }, p => setPosts(prev => prev.filter(x => x.id !== p.old.id)))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const deletePost = async (id: string) => {
    setDeleting(id)
    await supabase.from('posts').delete().eq('id', id)
    try { await supabase.from('admin_audit_log').insert({ admin_id:adminId, action:'delete_post', target_type:'post', target_id:id }) } catch(_){}
    setPosts(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  const deleteComment = async (id: string) => {
    setDeleting(id)
    await supabase.from('post_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const filteredPosts = posts.filter(p => !search.trim() || p.content?.toLowerCase().includes(search.toLowerCase()) || getName(p.users).toLowerCase().includes(search.toLowerCase()))
  const filteredComments = comments.filter(c => !search.trim() || c.content?.toLowerCase().includes(search.toLowerCase()) || getName(c.users).toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:C.bg, minHeight:'100%' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:11, color:C.blueLight, fontFamily:'DM Sans,sans-serif', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Admin</p>
              <h1 style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em' }}>Content</h1>
              <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginTop:4 }}>{posts.length} posts · {comments.length} comments</p>
            </div>
            <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:12, border:`1px solid ${C.border}`, cursor:'pointer', background:C.card, color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13 }}>
              <RefreshCw style={{ width:14, height:14 }} /> Refresh
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { id:'posts',    label:`Posts (${posts.length})`,       color: tab==='posts'    ? C.blue : undefined },
              { id:'comments', label:`Comments (${comments.length})`, color: tab==='comments' ? C.blue : undefined },
              { id:'announce', label:'Announcements',                 color: tab==='announce' ? C.gold : undefined },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:13, background:tab===t.id?(t.id==='announce'?C.goldDim:C.blue):C.card, color:tab===t.id?(t.id==='announce'?C.gold:'#fff'):C.textMuted, border:`1px solid ${tab===t.id?(t.id==='announce'?'rgba(245,158,11,0.3)':C.blue):C.border}` }}>
                {t.id==='announce' && <Megaphone style={{ width:12, height:12, display:'inline', marginRight:5 }} />}
                {t.label}
              </button>
            ))}
            {tab !== 'announce' && (
              <div style={{ position:'relative', flex:1, minWidth:200 }}>
                <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:C.textDim }} />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
                  style={{ width:'100%', padding:'9px 14px 9px 36px', borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.textDim }}><X style={{ width:13, height:13 }} /></button>}
              </div>
            )}
          </div>

          {/* Content */}
          {tab === 'announce' ? (
            <AnnouncePanel adminId={adminId} />
          ) : loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <Loader2 style={{ width:28, height:28, color:C.blueLight, animation:'spin 1s linear infinite' }} />
            </div>
          ) : tab === 'posts' ? (
            filteredPosts.length === 0 ? (
              <div style={{ textAlign:'center', padding:48, color:C.textDim, fontFamily:'DM Sans,sans-serif', background:C.card, borderRadius:16 }}>No posts found</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {filteredPosts.map(post => (
                  <AdminPostCard key={post.id} post={post} onDelete={deletePost} deleting={deleting} />
                ))}
              </div>
            )
          ) : (
            filteredComments.length === 0 ? (
              <div style={{ textAlign:'center', padding:48, color:C.textDim, fontFamily:'DM Sans,sans-serif', background:C.card, borderRadius:16 }}>No comments found</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filteredComments.map(c => (
                  <div key={c.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', borderRadius:14, background:C.card, border:`1px solid ${C.border}` }}>
                    <Avatar u={c.users||{}} size={32} />
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:600, color:C.blueLight, fontFamily:'DM Sans,sans-serif', marginBottom:3 }}>
                        {getName(c.users)} · <span style={{ color:C.textDim, fontWeight:400 }}>{timeAgo(c.created_at)}</span>
                      </p>
                      <p style={{ fontSize:13, color:C.text, fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>{c.content}</p>
                    </div>
                    <button onClick={() => deleteComment(c.id)} disabled={deleting===c.id}
                      style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', background:C.redDim, color:C.red, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {deleting===c.id ? <Loader2 style={{ width:12, height:12, animation:'spin 1s linear infinite' }} /> : <Trash2 style={{ width:12, height:12 }} />}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
