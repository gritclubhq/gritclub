'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Heart, MessageCircle, Share2, Image, Send, X,
  Loader2, MoreHorizontal, Trash2, ChevronDown
} from 'lucide-react'

const C = {
  bg: '#0A0F1E', surface: '#0D1428', card: '#111827', cardHover: '#141E35',
  border: 'rgba(255,255,255,0.06)', borderFocus: 'rgba(37,99,235,0.5)',
  text: '#F0F4FF', textMuted: '#7B8DB0', textDim: '#3D4F6E',
  blue: '#2563EB', blueLight: '#3B82F6', blueDim: 'rgba(37,99,235,0.12)',
  gold: '#F59E0B', goldDim: 'rgba(245,158,11,0.1)',
  red: '#EF4444', redDim: 'rgba(239,68,68,0.1)',
  green: '#10B981', greenDim: 'rgba(16,185,129,0.1)',
}

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const getName = (name: string, email: string) => name || email?.split('@')[0] || 'User'
const getInitials = (name: string, email: string) => getName(name, email).slice(0,2).toUpperCase()
const timeAgo = (ts: string) => {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d/60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function Avatar({ name, email, photo, userId, size = 40 }: any) {
  const color = avatarColor(userId || '')
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color+'22', color, fontSize: size * 0.33, fontWeight: 700, fontFamily: 'Syne,sans-serif', border: `1.5px solid ${color}33`, flexShrink: 0 }}>
      {photo
        ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : getInitials(name, email)}
    </div>
  )
}

// ─── Post Composer ────────────────────────────────────────────────────────────
function PostComposer({ currentUser, profile, onPosted }: any) {
  const [text,       setText]       = useState('')
  const [images,     setImages]     = useState<File[]>([])
  const [previews,   setPreviews]   = useState<string[]>([])
  const [uploading,  setUploading]  = useState(false)
  const [posting,    setPosting]    = useState(false)
  const [expanded,   setExpanded]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImages = (files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') && f.size < 10*1024*1024).slice(0, 4 - images.length)
    setImages(p => [...p, ...valid].slice(0, 4))
    valid.forEach(f => {
      const r = new FileReader()
      r.onload = e => setPreviews(p => [...p, e.target?.result as string].slice(0, 4))
      r.readAsDataURL(f)
    })
  }

  const removeImage = (i: number) => {
    setImages(p => p.filter((_,idx) => idx !== i))
    setPreviews(p => p.filter((_,idx) => idx !== i))
  }

  const handlePost = async () => {
    if (!text.trim() && images.length === 0) return
    if (!currentUser) return
    setPosting(true)

    try {
      // Upload images
      const imageUrls: string[] = []
      if (images.length > 0) {
        setUploading(true)
        for (const img of images) {
          const path = `posts/${currentUser.id}/${Date.now()}_${img.name}`
          const { error } = await supabase.storage.from('post-images').upload(path, img, { contentType: img.type })
          if (!error) {
            const { data } = supabase.storage.from('post-images').getPublicUrl(path)
            imageUrls.push(data.publicUrl)
          }
        }
        setUploading(false)
      }

      // Insert post — visible to ALL users via RLS
      const { error } = await supabase.from('posts').insert({
        user_id:        currentUser.id,
        content:        text.trim().slice(0, 2000),
        image_urls:     imageUrls,
        likes_count:    0,
        comments_count: 0,
      })

      if (error) throw error

      setText('')
      setImages([])
      setPreviews([])
      setExpanded(false)
      onPosted()
    } catch (err: any) {
      alert('Failed to post: ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name={profile?.full_name || ''} email={currentUser?.email || ''} photo={profile?.photo_url} userId={currentUser?.id} size={40} />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); if (e.target.value) setExpanded(true) }}
            onFocus={() => setExpanded(true)}
            placeholder="What are you building? Share with the community..."
            maxLength={2000}
            rows={expanded ? 3 : 1}
            style={{ width: '100%', background: C.surface, border: `1px solid ${expanded ? C.borderFocus : C.border}`, borderRadius: 12, padding: '10px 14px', color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 14, lineHeight: 1.6, outline: 'none', resize: 'none', transition: 'all 0.2s' }}
          />

          {/* Image previews */}
          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: previews.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 8, marginTop: 10 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: previews.length === 1 ? '16/9' : '1/1' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} disabled={images.length >= 4}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: images.length >= 4 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, opacity: images.length >= 4 ? 0.4 : 1 }}>
                  <Image style={{ width: 14, height: 14 }} /> Photo {images.length > 0 ? `(${images.length}/4)` : ''}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleImages(e.target.files)} />
              </div>
              <button onClick={handlePost} disabled={posting || uploading || (!text.trim() && images.length === 0)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.blue, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, opacity: (posting || uploading || (!text.trim() && images.length === 0)) ? 0.5 : 1 }}>
                {posting || uploading ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 14, height: 14 }} />}
                {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Comments section ─────────────────────────────────────────────────────────
function CommentsSection({ postId, currentUser }: any) {
  const [comments, setComments] = useState<any[]>([])
  const [text,     setText]     = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    supabase.from('post_comments')
      .select('id, content, created_at, user_id, users(id, full_name, email, photo_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(20)
      .then(({ data }) => { setComments(data || []); setLoading(false) })
  }, [postId])

  const sendComment = async () => {
    if (!text.trim() || sending || !currentUser) return
    setSending(true)
    const { data, error } = await supabase.rpc('add_post_comment', {
      p_post_id: postId,
      p_user_id: currentUser.id,
      p_content: text.trim(),
    })
    if (!error && data?.[0]) {
      setComments(prev => [...prev, {
        id: data[0].comment_id,
        content: text.trim(),
        created_at: data[0].created_at,
        user_id: currentUser.id,
        users: { id: currentUser.id, full_name: data[0].author_name, photo_url: data[0].author_photo, email: currentUser.email }
      }])
      setText('')
    }
    setSending(false)
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
          <Loader2 style={{ width: 16, height: 16, color: C.textDim, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : comments.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 8 }}>
          <Avatar name={(c.users as any)?.full_name||''} email={(c.users as any)?.email||''} photo={(c.users as any)?.photo_url} userId={c.user_id} size={28} />
          <div style={{ flex: 1 }}>
            <div style={{ background: C.surface, borderRadius: '4px 14px 14px 14px', padding: '8px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.blueLight, marginBottom: 2, fontFamily: 'DM Sans,sans-serif' }}>
                {getName((c.users as any)?.full_name||'', (c.users as any)?.email||'')}
              </p>
              <p style={{ fontSize: 13, color: C.text, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{c.content}</p>
            </div>
            <p style={{ fontSize: 11, color: C.textDim, marginTop: 3, paddingLeft: 4, fontFamily: 'DM Sans,sans-serif' }}>{timeAgo(c.created_at)}</p>
          </div>
        </div>
      ))}

      {/* Comment input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Avatar name={''} email={currentUser?.email||''} photo={null} userId={currentUser?.id} size={28} />
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendComment()}
            placeholder="Write a comment..."
            maxLength={500}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)}
            onBlur={e => (e.target.style.borderColor = C.border)} />
          <button onClick={sendComment} disabled={!text.trim() || sending}
            style={{ width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || sending ? 0.4 : 1 }}>
            {sending ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 13, height: 13 }} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onDelete, onLikeToggle }: any) {
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(post.my_like || false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [likePending, setLikePending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isOwn = post.user_id === currentUser?.id

  const handleLike = async () => {
    if (likePending) return
    setLikePending(true)
    // Optimistic
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c: number) => wasLiked ? c - 1 : c + 1)

    const { data, error } = await supabase.rpc('toggle_post_like', {
      p_post_id: post.id,
      p_user_id: currentUser.id,
    })
    if (error) {
      // Revert on error
      setLiked(wasLiked)
      setLikeCount((c: number) => wasLiked ? c + 1 : c - 1)
    } else if (data?.[0]) {
      setLiked(data[0].liked)
      setLikeCount(data[0].new_count)
    }
    setLikePending(false)
    onLikeToggle?.()
  }

  const imgGrid = post.image_urls?.filter(Boolean) || []

  return (
    <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar name={post.author_name||''} email={''} photo={post.author_photo} userId={post.user_id} size={40} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: 'Syne,sans-serif' }}>
              {post.author_name || 'User'}
              {post.author_role === 'host' && (
                <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 5, background: C.goldDim, color: C.gold, fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>HOST</span>
              )}
            </p>
            {post.author_username && <p style={{ fontSize: 12, color: C.blueLight, fontFamily: 'DM Sans,sans-serif' }}>@{post.author_username}</p>}
            <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {isOwn && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(p => !p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: C.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MoreHorizontal style={{ width: 16, height: 16 }} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: 36, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', zIndex: 20, minWidth: 130 }}>
                <button onClick={() => { onDelete(post.id); setShowMenu(false) }}
                  style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontFamily: 'DM Sans,sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                  <Trash2 style={{ width: 13, height: 13 }} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ fontSize: 14, color: C.text, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.7, marginBottom: imgGrid.length > 0 ? 12 : 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </p>
      )}

      {/* Images */}
      {imgGrid.length > 0 && (
        <div style={{ display: 'grid', gap: 4, borderRadius: 14, overflow: 'hidden', marginBottom: 4,
          gridTemplateColumns: imgGrid.length === 1 ? '1fr' : imgGrid.length === 2 ? '1fr 1fr' : imgGrid.length === 3 ? '2fr 1fr' : '1fr 1fr',
          gridTemplateRows: imgGrid.length === 3 ? '1fr 1fr' : undefined,
        }}>
          {imgGrid.slice(0,4).map((url: string, i: number) => (
            <img key={i} src={url} alt="" loading="lazy"
              style={{ width: '100%', objectFit: 'cover', display: 'block',
                aspectRatio: imgGrid.length === 1 ? '16/9' : '1/1',
                gridRow: imgGrid.length === 3 && i === 0 ? '1 / 3' : undefined,
              }} />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleLike}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: liked ? C.redDim : 'transparent', color: liked ? C.red : C.textMuted, fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: liked ? 700 : 400, transition: 'all 0.15s' }}>
          <Heart style={{ width: 16, height: 16, fill: liked ? C.red : 'none', stroke: liked ? C.red : 'currentColor' }} />
          {likeCount > 0 ? likeCount : 'Like'}
        </button>
        <button onClick={() => setShowComments(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: showComments ? C.blueDim : 'transparent', color: showComments ? C.blueLight : C.textMuted, fontFamily: 'DM Sans,sans-serif', fontSize: 13, transition: 'all 0.15s' }}>
          <MessageCircle style={{ width: 16, height: 16 }} />
          {post.comments_count > 0 ? post.comments_count : 'Comment'}
        </button>
        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: C.textMuted, fontFamily: 'DM Sans,sans-serif', fontSize: 13, transition: 'all 0.15s', marginLeft: 'auto' }}>
          <Share2 style={{ width: 16, height: 16 }} />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentsSection postId={post.id} currentUser={currentUser} />}
    </div>
  )
}

// ─── Connection Suggestions Sidebar ──────────────────────────────────────────
function SuggestionsSidebar({ currentUser }: any) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [pending,     setPending]     = useState<Set<string>>(new Set())
  const [sent,        setSent]        = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!currentUser?.id) return
    supabase.rpc('get_connection_suggestions', { p_user_id: currentUser.id, p_limit: 8 })
      .then(({ data }) => setSuggestions(data || []))
  }, [currentUser?.id])

  const sendRequest = async (targetId: string) => {
    setPending(p => new Set([...p, targetId]))
    await supabase.from('connections').insert({
      user1_id: currentUser.id,
      user2_id: targetId,
      status: 'requested',
    })
    setSent(p => new Set([...p, targetId]))
    setPending(p => { const n = new Set(p); n.delete(targetId); return n })
  }

  if (suggestions.length === 0) return null

  return (
    <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 14 }}>
        People you may know
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {suggestions.slice(0,6).map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={s.full_name||''} email={s.email||''} photo={s.photo_url} userId={s.id} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.full_name || s.email?.split('@')[0]}
              </p>
              <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.suggestion_reason}
              </p>
            </div>
            <button onClick={() => sendRequest(s.id)} disabled={sent.has(s.id) || pending.has(s.id)}
              style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${sent.has(s.id) ? C.green : C.blue}`, cursor: sent.has(s.id) ? 'default' : 'pointer', background: sent.has(s.id) ? C.greenDim : C.blueDim, color: sent.has(s.id) ? C.green : C.blueLight, fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, flexShrink: 0, opacity: pending.has(s.id) ? 0.5 : 1 }}>
              {sent.has(s.id) ? '✓ Sent' : pending.has(s.id) ? '...' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Feed Page ───────────────────────────────────────────────────────────
export default function FeedPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile,     setProfile]     = useState<any>(null)
  const [posts,       setPosts]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState(true)
  const [likedIds,    setLikedIds]    = useState<Set<string>>(new Set())
  const offsetRef = useRef(0)
  const PAGE_SIZE = 15

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setCurrentUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)
      await loadFeed(u.id, true)

      // Load my liked post IDs for this session
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', u.id)
      setLikedIds(new Set((likes||[]).map((l:any) => l.post_id)))
    })
  }, [])

  // Realtime: new posts from anyone appear instantly
  useEffect(() => {
    const ch = supabase.channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        if (currentUser) loadFeed(currentUser.id, true)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [currentUser])

  const loadFeed = async (userId: string, reset = false) => {
    if (reset) {
      offsetRef.current = 0
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    const { data, error } = await supabase.rpc('get_feed_posts', {
      p_user_id: userId,
      p_limit:   PAGE_SIZE,
      p_offset:  offsetRef.current,
    })

    if (!error && data) {
      const enriched = data.map((p: any) => ({ ...p, my_like: likedIds.has(p.id) }))
      if (reset) {
        setPosts(enriched)
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map((p: any) => p.id))
          return [...prev, ...enriched.filter((p: any) => !ids.has(p.id))]
        })
      }
      setHasMore(data.length === PAGE_SIZE)
      offsetRef.current += data.length
    }

    setLoading(false)
    setLoadingMore(false)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handlePosted = () => {
    if (currentUser) loadFeed(currentUser.id, true)
  }

  // Re-enrich liked state when likedIds changes
  const postsWithLikes = posts.map(p => ({ ...p, my_like: likedIds.has(p.id) }))

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

            {/* Main feed column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.blueLight, fontFamily: 'DM Sans,sans-serif', marginBottom: 4 }}>Community</p>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>Feed</h1>
              </div>

              {/* Composer */}
              {currentUser && <PostComposer currentUser={currentUser} profile={profile} onPosted={handlePosted} />}

              {/* Posts */}
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ height: 180, borderRadius: 20, background: C.card, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : postsWithLikes.length === 0 ? (
                <div style={{ borderRadius: 20, padding: 48, textAlign: 'center', background: C.card, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>No posts yet</p>
                  <p style={{ fontSize: 13, color: C.textDim }}>Be the first to post — your post will appear for everyone!</p>
                </div>
              ) : (
                <>
                  {postsWithLikes.map(post => (
                    <PostCard key={post.id} post={post} currentUser={currentUser} onDelete={handleDelete}
                      onLikeToggle={() => {
                        setLikedIds(prev => {
                          const n = new Set(prev)
                          n.has(post.id) ? n.delete(post.id) : n.add(post.id)
                          return n
                        })
                      }} />
                  ))}
                  {hasMore && (
                    <button onClick={() => currentUser && loadFeed(currentUser.id, false)} disabled={loadingMore}
                      style={{ padding: '12px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, color: C.textMuted, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loadingMore ? 0.6 : 1 }}>
                      {loadingMore ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
                      {loadingMore ? 'Loading...' : 'Load more posts'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Sidebar — connection suggestions */}
            <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentUser && <SuggestionsSidebar currentUser={currentUser} />}
              {/* Community stats */}
              <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 12 }}>Community</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Active founders', value: '2,400+' },
                    { label: 'Live sessions', value: 'Weekly' },
                    { label: 'Cities', value: '40+' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{s.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.blueLight, fontFamily: 'Syne,sans-serif' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
