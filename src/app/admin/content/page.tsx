'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Search, Trash2, Loader2, X, Heart, MessageCircle, Image as Img, RefreshCw } from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)', text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
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

// ─── Full Post Card for Admin ─────────────────────────────────────────────────
function AdminPostCard({ post, onDelete, deleting }: any) {
  const author = post.users || {}
  const imgs = (post.image_urls || []).filter(Boolean)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div style={{ borderRadius:16, overflow:'hidden', background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column' }}>
      {/* Author row */}
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
        <div style={{ display:'flex', gap:6 }}>
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background:C.redDim, color:C.red, fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600 }}>
              <Trash2 style={{ width:12, height:12 }} /> Delete
            </button>
          ) : (
            <div style={{ display:'flex', gap:5 }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, cursor:'pointer', background:'transparent', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:12 }}>Cancel</button>
              <button onClick={() => { onDelete(post.id); setShowConfirm(false) }} disabled={deleting===post.id}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background:C.red, color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:700 }}>
                {deleting===post.id ? <Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }} /> : <Trash2 style={{ width:11, height:11 }} />}
                Confirm Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ padding:'0 14px 10px', fontSize:14, color:C.text, fontFamily:'DM Sans,sans-serif', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>
          {post.content}
        </p>
      )}

      {/* Images — full display */}
      {imgs.length > 0 && (
        <div style={{ display:'grid', gap:2, gridTemplateColumns:imgs.length===1?'1fr':'1fr 1fr' }}>
          {imgs.slice(0,4).map((url: string, i: number) => (
            <div key={i} style={{ position:'relative', aspectRatio:imgs.length===1?'16/9':'1/1', overflow:'hidden' }}>
              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              {imgs.length > 4 && i === 3 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:20, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif' }}>+{imgs.length-4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'flex', gap:16, padding:'10px 14px', borderTop:`1px solid ${C.border}`, background:C.surface }}>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
          <Heart style={{ width:13, height:13, color:C.red }} /> {post.likes_count||0} likes
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
          <MessageCircle style={{ width:13, height:13, color:C.blueLight }} /> {post.comments_count||0} comments
        </span>
        {imgs.length > 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
            <Img style={{ width:13, height:13, color:C.gold }} /> {imgs.length} image{imgs.length>1?'s':''}
          </span>
        )}
        <span style={{ marginLeft:'auto', fontSize:11, color:C.textDim, fontFamily:'DM Mono,monospace' }}>{post.id.slice(0,8)}...</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminContentPage() {
  const [posts,    setPosts]    = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [tab,      setTab]      = useState<'posts'|'comments'>('posts')
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [deleting, setDeleting] = useState<string|null>(null)

  const load = async () => {
    setLoading(true)
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('posts')
        .select('id, content, image_urls, created_at, user_id, likes_count, comments_count, users(id, full_name, email, photo_url, username, role)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('post_comments')
        .select('id, content, created_at, user_id, post_id, users(id, full_name, email, photo_url)')
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    setPosts(p||[])
    setComments(c||[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Realtime — admin sees new posts/comments immediately
  useEffect(() => {
    const ch = supabase.channel('admin-content-rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'posts' }, () => load())
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'posts' }, (p) => {
        setPosts(prev => prev.filter(x => x.id !== p.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const deletePost = async (id: string) => {
    setDeleting(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('posts').delete().eq('id', id)
    if (user) await supabase.from('admin_audit_log').insert({ admin_id:user.id, action:'delete_post', target_type:'post', target_id:id })
    setPosts(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  const deleteComment = async (id: string) => {
    setDeleting(id)
    await supabase.from('post_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const filteredPosts = posts.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.content?.toLowerCase().includes(q) || getName(p.users).toLowerCase().includes(q)
  })
  const filteredComments = comments.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.content?.toLowerCase().includes(q) || getName(c.users).toLowerCase().includes(q)
  })

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:C.bg, minHeight:'100%' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:11, color:C.blueLight, fontFamily:'DM Sans,sans-serif', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Admin</p>
              <h1 style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em' }}>Content Monitoring</h1>
              <p style={{ fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif', marginTop:4 }}>
                All community posts with full content — {posts.length} posts · {comments.length} comments
              </p>
            </div>
            <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:12, border:`1px solid ${C.border}`, cursor:'pointer', background:C.card, color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13 }}>
              <RefreshCw style={{ width:14, height:14 }} /> Refresh
            </button>
          </div>

          {/* Tabs + search */}
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            {[
              { id:'posts',    label:`Posts (${posts.length})` },
              { id:'comments', label:`Comments (${comments.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:13, background:tab===t.id?C.blue:C.card, color:tab===t.id?'#fff':C.textMuted }}>
                {t.label}
              </button>
            ))}
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:C.textDim }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search content or username..."
                style={{ width:'100%', padding:'9px 14px 9px 36px', borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>(e.target.style.borderColor='rgba(37,99,235,0.4)')} onBlur={e=>(e.target.style.borderColor=C.border)} />
              {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.textDim }}><X style={{ width:13, height:13 }} /></button>}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <Loader2 style={{ width:28, height:28, color:C.blueLight, animation:'spin 1s linear infinite' }} />
            </div>
          ) : tab === 'posts' ? (
            filteredPosts.length === 0 ? (
              <div style={{ textAlign:'center', padding:48, color:C.textDim, fontFamily:'DM Sans,sans-serif', background:C.card, borderRadius:16 }}>
                No posts found
              </div>
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
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:600, color:C.blueLight, fontFamily:'DM Sans,sans-serif', marginBottom:3 }}>
                        {getName(c.users)} · <span style={{ color:C.textDim, fontWeight:400 }}>{timeAgo(c.created_at)}</span>
                      </p>
                      <p style={{ fontSize:13, color:C.text, fontFamily:'DM Sans,sans-serif', lineHeight:1.5 }}>{c.content}</p>
                    </div>
                    <button onClick={() => deleteComment(c.id)} disabled={deleting===c.id}
                      style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', background:C.redDim, color:C.red, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
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
