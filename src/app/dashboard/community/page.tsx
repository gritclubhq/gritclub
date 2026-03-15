'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Heart, MessageCircle, Share2, Send, Trash2,
  MoreHorizontal, Globe, Users, Search, X,
  Loader2, UserPlus, Check, Image as ImageIcon, ChevronDown
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0A0F1E',
  card:      '#111827',
  surface:   '#0D1428',
  border:    'rgba(255,255,255,0.06)',
  borderF:   'rgba(37,99,235,0.4)',
  text:      '#F0F4FF',
  textMuted: '#7B8DB0',
  textDim:   '#3D4F6E',
  blue:      '#2563EB',
  blueL:     '#3B82F6',
  blueDim:   'rgba(37,99,235,0.12)',
  gold:      '#F59E0B',
  goldDim:   'rgba(245,158,11,0.1)',
  red:       '#EF4444',
  redDim:    'rgba(239,68,68,0.1)',
  green:     '#10B981',
  greenDim:  'rgba(16,185,129,0.1)',
}

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

function getDisplayName(u: any): string {
  return u?.full_name || u?.email?.split('@')[0] || 'User'
}
function getInitials(u: any): string {
  return getDisplayName(u).slice(0, 2).toUpperCase()
}
function timeAgo(ts: string): string {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Avatar({ u, size = 40 }: { u: any; size?: number }) {
  const color = avatarColor(u?.id || u?.user_id || '')
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: color + '22', color,
      fontSize: size * 0.33, fontWeight: 700,
      fontFamily: 'Syne, sans-serif',
      border: `1.5px solid ${color}33`,
    }}>
      {u?.photo_url
        ? <img src={u.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : getInitials(u)}
    </div>
  )
}

// ─── People Search Panel ──────────────────────────────────────────────────────
function PeopleSearch({ currentUserId }: { currentUserId: string }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [sent,    setSent]    = useState<Set<string>>(new Set())
  const debounce = useRef<NodeJS.Timeout>()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    // Search by name, username, or email prefix — everyone is searchable
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, username, photo_url, role, bio')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', currentUserId)
      .limit(10)
    setResults(data || [])
    setLoading(false)
  }, [currentUserId])

  const handleInput = (val: string) => {
    setQuery(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(val), 350)
  }

  const connect = async (targetId: string) => {
    setPending(p => new Set([...p, targetId]))
    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${currentUserId})`)
      .maybeSingle()

    if (!existing) {
      await supabase.from('connections').insert({ user1_id: currentUserId, user2_id: targetId, status: 'requested' })
    }
    setSent(p => new Set([...p, targetId]))
    setPending(p => { const n = new Set(p); n.delete(targetId); return n })
  }

  const follow = async (targetId: string) => {
    setPending(p => new Set([...p, targetId + '_f']))
    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId }).maybeSingle()
    setSent(p => new Set([...p, targetId + '_f']))
    setPending(p => { const n = new Set(p); n.delete(targetId + '_f'); return n })
  }

  return (
    <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 12 }}>Find People</p>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.textDim }} />
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search by name, @handle or email..."
          style={{ width: '100%', padding: '9px 36px 9px 34px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = C.borderF)}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, display: 'flex' }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}><Loader2 style={{ width: 16, height: 16, color: C.textDim, animation: 'spin 1s linear infinite' }} /></div>}

      {results.map(u => (
        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
          <Avatar u={u} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getDisplayName(u)}
            </p>
            {u.username && <p style={{ fontSize: 11, color: C.blueL, fontFamily: 'DM Sans,sans-serif' }}>@{u.username}</p>}
            {u.role && <p style={{ fontSize: 10, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>{u.role}</p>}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => connect(u.id)} disabled={sent.has(u.id) || pending.has(u.id)}
              style={{ padding: '5px 9px', borderRadius: 8, border: `1px solid ${sent.has(u.id) ? C.green : C.blue}`, cursor: 'pointer', background: sent.has(u.id) ? C.greenDim : C.blueDim, color: sent.has(u.id) ? C.green : C.blueL, fontFamily: 'DM Sans,sans-serif', fontSize: 11, fontWeight: 600, opacity: pending.has(u.id) ? 0.5 : 1 }}>
              {sent.has(u.id) ? '✓' : <UserPlus style={{ width: 11, height: 11 }} />}
            </button>
          </div>
        </div>
      ))}

      {query && !loading && results.length === 0 && (
        <p style={{ fontSize: 12, color: C.textDim, fontFamily: 'DM Sans,sans-serif', textAlign: 'center', padding: '8px 0' }}>No users found</p>
      )}
    </div>
  )
}

// ─── Post Composer ────────────────────────────────────────────────────────────
function Composer({ currentUser, profile, onPosted }: any) {
  const [text,     setText]     = useState('')
  const [images,   setImages]   = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [posting,  setPosting]  = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const addImages = (files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') && f.size < 10 * 1024 * 1024).slice(0, 4 - images.length)
    setImages(p => [...p, ...valid].slice(0, 4))
    valid.forEach(f => {
      const r = new FileReader()
      r.onload = e => setPreviews(p => [...p, e.target?.result as string].slice(0, 4))
      r.readAsDataURL(f)
    })
  }

  const removeImg = (i: number) => {
    setImages(p => p.filter((_, j) => j !== i))
    setPreviews(p => p.filter((_, j) => j !== i))
  }

  const post = async () => {
    if ((!text.trim() && images.length === 0) || posting || !currentUser) return
    setPosting(true)
    try {
      // Upload images to storage
      const imageUrls: string[] = []
      for (const img of images) {
        const path = `posts/${currentUser.id}/${Date.now()}_${img.name.replace(/[^a-zA-Z0-9._]/g, '_')}`
        const { error } = await supabase.storage.from('post-images').upload(path, img, { contentType: img.type })
        if (!error) {
          const { data } = supabase.storage.from('post-images').getPublicUrl(path)
          imageUrls.push(data.publicUrl)
        }
      }
      // Insert post — RLS allows all authenticated users to read (global)
      await supabase.from('posts').insert({
        user_id:        currentUser.id,
        content:        text.trim().slice(0, 2000),
        image_urls:     imageUrls,
        likes_count:    0,
        comments_count: 0,
      })
      setText(''); setImages([]); setPreviews([]); setExpanded(false)
      onPosted()
    } catch (err: any) {
      alert('Post failed: ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar u={{ ...profile, id: currentUser?.id }} size={40} />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setExpanded(true) }}
            onFocus={() => setExpanded(true)}
            placeholder="Share something with the community — everyone can see this..."
            maxLength={2000}
            rows={expanded ? 3 : 1}
            style={{ width: '100%', background: C.surface, border: `1px solid ${expanded ? C.borderF : C.border}`, borderRadius: 12, padding: '10px 14px', color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 14, lineHeight: 1.6, outline: 'none', resize: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          />

          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: previews.length === 1 ? '1fr' : '1fr 1fr', gap: 6, marginTop: 8 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: previews.length === 1 ? '16/9' : '1/1' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeImg(i)}
                    style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <X style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button onClick={() => fileRef.current?.click()} disabled={images.length >= 4}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, opacity: images.length >= 4 ? 0.4 : 1 }}>
                <ImageIcon style={{ width: 14, height: 14 }} />
                Photo {images.length > 0 && `(${images.length}/4)`}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addImages(e.target.files)} />
              <button onClick={post} disabled={posting || (!text.trim() && images.length === 0)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.blue, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, opacity: (posting || (!text.trim() && images.length === 0)) ? 0.5 : 1 }}>
                {posting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 14, height: 14 }} />}
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onDelete }: any) {
  const [liked,        setLiked]        = useState(post.my_like || false)
  const [likeCount,    setLikeCount]    = useState(post.likes_count || 0)
  const [liking,       setLiking]       = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState<any[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText,  setCommentText]  = useState('')
  const [sending,      setSending]      = useState(false)
  const [showMenu,     setShowMenu]     = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)

  const isOwn = post.user_id === currentUserId
  const author = post.users || {}
  const imgs = (post.image_urls || []).filter(Boolean)

  const loadComments = async () => {
    if (commentsLoaded) return
    const { data } = await supabase
      .from('post_comments')
      .select('id, content, created_at, user_id, users(id, full_name, email, photo_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(30)
    setComments(data || [])
    setCommentsLoaded(true)
  }

  const toggleComments = async () => {
    if (!showComments && !commentsLoaded) await loadComments()
    setShowComments(p => !p)
  }

  const handleLike = async () => {
    if (liking || !currentUserId) return
    setLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c: number) => wasLiked ? Math.max(0, c - 1) : c + 1)
    try {
      const { data } = await supabase.rpc('toggle_post_like', { p_post_id: post.id, p_user_id: currentUserId })
      if (data?.[0]) { setLiked(data[0].liked); setLikeCount(data[0].new_count) }
    } catch {
      setLiked(wasLiked)
      setLikeCount((c: number) => wasLiked ? c + 1 : Math.max(0, c - 1))
    }
    setLiking(false)
  }

  const sendComment = async () => {
    if (!commentText.trim() || sending || !currentUserId) return
    setSending(true)
    try {
      const { data } = await supabase.rpc('add_post_comment', {
        p_post_id: post.id,
        p_user_id: currentUserId,
        p_content: commentText.trim(),
      })
      if (data?.[0]) {
        // Fetch current user profile to show in comment
        const { data: me } = await supabase.from('users').select('id, full_name, email, photo_url').eq('id', currentUserId).single()
        setComments(prev => [...prev, {
          id: data[0].comment_id,
          content: commentText.trim(),
          created_at: data[0].created_at,
          user_id: currentUserId,
          users: me || { id: currentUserId, email: '' },
        }])
        setCommentCount((c: number) => c + 1)
        setCommentText('')
      }
    } catch (err: any) {
      // Fallback: direct insert if RPC fails
      const { data: me } = await supabase.from('users').select('id, full_name, email, photo_url').eq('id', currentUserId).single()
      const { data: inserted } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: currentUserId, content: commentText.trim() }).select().single()
      if (inserted) {
        await supabase.from('posts').update({ comments_count: commentCount + 1 }).eq('id', post.id)
        setComments(prev => [...prev, { ...inserted, users: me }])
        setCommentCount((c: number) => c + 1)
        setCommentText('')
      }
    }
    setSending(false)
  }

  return (
    <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar u={{ ...author, id: post.user_id }} size={40} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif' }}>
                {getDisplayName(author)}
              </p>
              {author.role === 'host' && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, background: C.goldDim, color: C.gold, fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>HOST</span>
              )}
              {author.role === 'admin' && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, background: C.redDim, color: C.red, fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>ADMIN</span>
              )}
            </div>
            {author.username && <p style={{ fontSize: 12, color: C.blueL, fontFamily: 'DM Sans,sans-serif' }}>@{author.username}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Globe style={{ width: 11, height: 11, color: C.textDim }} />
              <span style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>{timeAgo(post.created_at)} · visible to everyone</span>
            </div>
          </div>
        </div>
        {isOwn && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(p => !p)}
              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <p style={{ padding: '12px 16px 8px', fontSize: 14, color: C.text, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
          {post.content}
        </p>
      )}

      {/* Images */}
      {imgs.length > 0 && (
        <div style={{ display: 'grid', gap: 3, margin: '4px 0',
          gridTemplateColumns: imgs.length === 1 ? '1fr' : '1fr 1fr',
        }}>
          {imgs.slice(0, 4).map((url: string, i: number) => (
            <img key={i} src={url} alt="" loading="lazy"
              style={{ width: '100%', objectFit: 'cover', display: 'block', aspectRatio: imgs.length === 1 ? '16/9' : '1/1' }} />
          ))}
        </div>
      )}

      {/* Stats */}
      {(likeCount > 0 || commentCount > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', borderTop: `1px solid ${C.border}` }}>
          {likeCount > 0 && <span style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>❤️ {likeCount}</span>}
          {commentCount > 0 && (
            <button onClick={toggleComments}
              style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
              {commentCount} comment{commentCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
        {[
          { icon: <Heart style={{ width: 16, height: 16, fill: liked ? C.red : 'none', stroke: liked ? C.red : 'currentColor' }} />, label: liked ? 'Liked' : 'Like', onClick: handleLike, active: liked, color: liked ? C.red : C.textMuted },
          { icon: <MessageCircle style={{ width: 16, height: 16 }} />, label: 'Comment', onClick: toggleComments, active: showComments, color: showComments ? C.blueL : C.textMuted },
          { icon: <Share2 style={{ width: 16, height: 16 }} />, label: 'Share', onClick: () => navigator.clipboard?.writeText(window.location.origin + '/post/' + post.id), active: false, color: C.textMuted },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: 'none', background: 'transparent', color: btn.color, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 13, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8 }}>
              <Avatar u={{ ...(c.users || {}), id: c.user_id }} size={28} />
              <div style={{ flex: 1, background: C.surface, borderRadius: '4px 14px 14px 14px', padding: '8px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.blueL, marginBottom: 2, fontFamily: 'DM Sans,sans-serif' }}>
                  {getDisplayName(c.users || {})}
                </p>
                <p style={{ fontSize: 13, color: C.text, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{c.content}</p>
              </div>
            </div>
          ))}

          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Avatar u={{ id: currentUserId }} size={28} />
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendComment()}
                placeholder="Write a comment..."
                maxLength={500}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', minWidth: 0 }}
                onFocus={e => (e.target.style.borderColor = C.borderF)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button onClick={sendComment} disabled={!commentText.trim() || sending}
                style={{ width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !commentText.trim() || sending ? 0.4 : 1, flexShrink: 0 }}>
                {sending ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 13, height: 13 }} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile,     setProfile]     = useState<any>(null)
  const [posts,       setPosts]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState(true)
  const [likedIds,    setLikedIds]    = useState<Set<string>>(new Set())
  const PAGE = 20
  const offsetRef = useRef(0)

  // ── Load posts — global, no filter, everyone sees all ──
  const loadPosts = useCallback(async (userId: string, reset = false) => {
    if (reset) { offsetRef.current = 0; setLoading(true) }
    else setLoadingMore(true)

    // Simple direct query — no RPC needed for community page
    // All authenticated users can see all posts via RLS
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, image_urls, created_at, user_id, likes_count, comments_count, users(id, full_name, email, photo_url, username, role)')
      .order('created_at', { ascending: false })
      .range(offsetRef.current, offsetRef.current + PAGE - 1)

    if (!error && data) {
      const enriched = data.map((p: any) => ({ ...p, my_like: likedIds.has(p.id) }))
      if (reset) setPosts(enriched)
      else setPosts(prev => {
        const ids = new Set(prev.map((x: any) => x.id))
        return [...prev, ...enriched.filter((x: any) => !ids.has(x.id))]
      })
      setHasMore(data.length === PAGE)
      offsetRef.current += data.length
    }

    setLoading(false)
    setLoadingMore(false)
  }, [likedIds])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setCurrentUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)

      // Load liked IDs
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', u.id)
      const ids = new Set((likes || []).map((l: any) => l.post_id))
      setLikedIds(ids)

      loadPosts(u.id, true)
    })
  }, [])

  // Realtime — new posts from ANY user appear instantly
  useEffect(() => {
    const ch = supabase.channel('community-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        // Fetch full post with author info and prepend
        supabase.from('posts')
          .select('id, content, image_urls, created_at, user_id, likes_count, comments_count, users(id, full_name, email, photo_url, username, role)')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) setPosts(prev => {
              if (prev.find(p => p.id === data.id)) return prev
              return [{ ...data, my_like: false }, ...prev]
            })
          })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const handlePosted = () => {
    if (currentUser) loadPosts(currentUser.id, true)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const postsWithLikes = posts.map(p => ({ ...p, my_like: likedIds.has(p.id) }))

  return (
    <DashboardLayout>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .community-grid { grid-template-columns: 1fr !important; } .sidebar { display: none !important; } }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

          <div className="community-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

            {/* Main feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.blueL, fontFamily: 'DM Sans,sans-serif', marginBottom: 4 }}>Global</p>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em', marginBottom: 2 }}>Community Feed</h1>
                <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>
                  Posts here are visible to <strong style={{ color: C.text }}>everyone</strong> on GritClub
                </p>
              </div>

              {currentUser && (
                <Composer currentUser={currentUser} profile={profile} onPosted={handlePosted} />
              )}

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ height: 160, borderRadius: 20, background: C.card, opacity: 0.5 + i * 0.15 }} />
                  ))}
                </div>
              ) : postsWithLikes.length === 0 ? (
                <div style={{ borderRadius: 20, padding: 48, textAlign: 'center', background: C.card, border: `1px solid ${C.border}` }}>
                  <Users style={{ width: 40, height: 40, color: C.textDim, margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: C.textMuted, marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>No posts yet</p>
                  <p style={{ fontSize: 13, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>
                    Be the first to post — your message will reach everyone here!
                  </p>
                </div>
              ) : (
                <>
                  {postsWithLikes.map(post => (
                    <PostCard key={post.id} post={post} currentUserId={currentUser?.id} onDelete={handleDelete} />
                  ))}
                  {hasMore && (
                    <button onClick={() => currentUser && loadPosts(currentUser.id, false)} disabled={loadingMore}
                      style={{ padding: '12px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, color: C.textMuted, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loadingMore ? 0.6 : 1 }}>
                      {loadingMore ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
                      {loadingMore ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="sidebar" style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentUser && <PeopleSearch currentUserId={currentUser.id} />}
              <div style={{ borderRadius: 20, padding: 16, background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 12 }}>About Community</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Open to everyone', value: '🌍' },
                    { label: 'Connect with anyone', value: '🤝' },
                    { label: 'All posts are global', value: '📢' },
                    { label: 'Real-time updates', value: '⚡' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{s.label}</span>
                      <span style={{ fontSize: 14 }}>{s.value}</span>
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
