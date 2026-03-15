'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Loader2, Trash2, Image as Img, MessageCircle } from 'lucide-react'

const C = { bg:'#0A0F1E', card:'#111827', border:'rgba(255,255,255,0.06)', text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E', blue:'#3B82F6', blueDim:'rgba(37,99,235,0.12)', red:'#EF4444', redDim:'rgba(239,68,68,0.1)', green:'#10B981' }
const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const timeAgo = (ts: string) => { const d = Date.now()-new Date(ts).getTime(), m = Math.floor(d/60000); if (m<1) return 'now'; if (m<60) return `${m}m ago`; const h=Math.floor(m/60); if (h<24) return `${h}h ago`; return `${Math.floor(h/24)}d ago` }

export default function AdminContentPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'posts'|'comments'>('posts')
  const [comments, setComments] = useState<any[]>([])

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('posts').select('id, content, image_urls, created_at, user_id, likes_count, comments_count, users(email, full_name, photo_url)').order('created_at', { ascending: false }).limit(50),
      supabase.from('post_comments').select('id, content, created_at, user_id, post_id, users(email, full_name)').order('created_at', { ascending: false }).limit(50),
    ])
    setPosts(p || [])
    setComments(c || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('admin_audit_log').insert({ admin_id: user.id, action: 'delete_post', target_type: 'post', target_id: id })
    load()
  }

  const deleteComment = async (id: string) => {
    await supabase.from('post_comments').delete().eq('id', id)
    load()
  }

  return (
    <DashboardLayout>
      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
          <p style={{ fontSize: 11, color: C.blue, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Admin</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 20, letterSpacing: '-0.02em' }}>Content Moderation</h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[{ id: 'posts', label: `Posts (${posts.length})` }, { id: 'comments', label: `Comments (${comments.length})` }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, background: tab===t.id ? C.blue : C.card, color: tab===t.id ? '#fff' : C.textMuted }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 style={{ width: 28, height: 28, color: C.blue, animation: 'spin 1s linear infinite' }} /></div>
          ) : tab === 'posts' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {posts.map(post => (
                <div key={post.id} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.blue, fontFamily: 'Syne,sans-serif', overflow: 'hidden' }}>
                    {(post.users as any)?.photo_url ? <img src={(post.users as any).photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getName(post.users)?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.blue, fontFamily: 'DM Sans,sans-serif', marginBottom: 4 }}>{getName(post.users)} · {timeAgo(post.created_at)}</p>
                    <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content}</p>
                    {(post.image_urls||[]).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {(post.image_urls||[]).map((url: string, i: number) => (
                          <img key={i} src={url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>❤️ {post.likes_count||0}</span>
                      <span style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>💬 {post.comments_count||0}</span>
                    </div>
                  </div>
                  <button onClick={() => deletePost(post.id)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: C.redDim, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, fontFamily: 'DM Sans,sans-serif' }}>{getName(c.users)}</span>
                    <span style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', marginLeft: 8 }}>{timeAgo(c.created_at)}</span>
                    <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</p>
                  </div>
                  <button onClick={() => deleteComment(c.id)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: C.redDim, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
