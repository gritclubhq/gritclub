'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  Heart, MessageCircle, Share2, Send, Trash2, MoreHorizontal,
  Globe, Image as ImageIcon, X, Loader2, UserPlus, Check,
  TrendingUp, Users, Radio, BookOpen, AlertCircle, ChevronDown
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0A0F1E',
  surface:     '#0D1428',
  card:        '#111827',
  cardHover:   '#141E35',
  border:      'rgba(255,255,255,0.06)',
  borderHover: 'rgba(37,99,235,0.3)',
  text:        '#F0F4FF',
  textMuted:   '#7B8DB0',
  textDim:     '#3D4F6E',
  blue:        '#2563EB',
  blueLight:   '#3B82F6',
  blueDim:     'rgba(37,99,235,0.12)',
  gold:        '#F59E0B',
  goldDim:     'rgba(245,158,11,0.1)',
  red:         '#EF4444',
  redDim:      'rgba(239,68,68,0.1)',
  green:       '#10B981',
  greenDim:    'rgba(16,185,129,0.1)',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (ts: string) => {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getName   = (p: any) => p?.full_name || p?.email?.split('@')[0] || 'User'
const getInitials = (p: any) => (getName(p)).slice(0, 2).toUpperCase()

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) =>
  AVATAR_COLORS[id?.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0]

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ profile, size = 40 }: { profile: any; size?: number }) {
  const color = avatarColor(profile?.id || profile?.email || '')
  return (
    <div
      className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
      style={{ width: size, height: size, minWidth: size, background: color + '25', color, fontSize: size * 0.35, border: `1.5px solid ${color}30` }}
    >
      {profile?.photo_url
        ? <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
        : getInitials(profile)
      }
    </div>
  )
}

// ─── Image drag-drop uploader ─────────────────────────────────────────────────
function ImageDropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) onFiles(files)
  }, [onFiles])

  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-all"
      style={{
        border: `2px dashed ${dragging ? C.blueLight : C.border}`,
        background: dragging ? C.blueDim : 'transparent',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <ImageIcon className="w-6 h-6" style={{ color: dragging ? C.blueLight : C.textDim }} />
      <p className="text-xs font-medium" style={{ color: C.textMuted }}>
        Drag & drop images or <span style={{ color: C.blueLight }}>browse</span>
      </p>
      <p className="text-xs" style={{ color: C.textDim }}>JPG, PNG, WebP · Max 10MB each · Up to 4 images</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Post composer ────────────────────────────────────────────────────────────
function PostComposer({ currentUser, currentProfile, onPost }: {
  currentUser: any
  currentProfile: any
  onPost: () => void
}) {
  const [content,   setContent]   = useState('')
  const [images,    setImages]    = useState<File[]>([])
  const [previews,  setPreviews]  = useState<string[]>([])
  const [showDropZone, setShowDropZone] = useState(false)
  const [posting,   setPosting]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error,     setError]     = useState<string | null>(null)

  const handleFiles = (files: File[]) => {
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024).slice(0, 4 - images.length)
    if (valid.length < files.length) setError('Some images exceed 10MB and were skipped')
    const newImages = [...images, ...valid].slice(0, 4)
    setImages(newImages)
    newImages.forEach(f => {
      const r = new FileReader()
      r.onload = e => setPreviews(prev => {
        const next = [...prev]
        next[newImages.indexOf(f)] = e.target?.result as string
        return next
      })
      r.readAsDataURL(f)
    })
  }

  const removeImage = (idx: number) => {
    setImages(prev  => prev.filter((_, i)  => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return
    if (content.length > 1000) { setError('Post too long (max 1000 chars)'); return }
    setPosting(true)
    setError(null)

    try {
      const imageUrls: string[] = []

      // Upload images to Supabase Storage
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 80))
        const file = images[i]
        const ext  = file.name.split('.').pop()
        const path = `${currentUser.id}/${Date.now()}_${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('post-images')
          .upload(path, file, { contentType: file.type })
        if (!upErr) {
          const { data } = supabase.storage.from('post-images').getPublicUrl(path)
          imageUrls.push(data.publicUrl)
        }
      }

      setUploadProgress(90)

      // Insert post — parameterized, no raw SQL
      const { error: insertErr } = await supabase.from('posts').insert({
        user_id:    currentUser.id,
        content:    content.trim(),
        image_urls: imageUrls,
        likes_count:    0,
        comments_count: 0,
      })

      if (insertErr) throw insertErr

      setContent('')
      setImages([])
      setPreviews([])
      setShowDropZone(false)
      setUploadProgress(0)
      onPost()
    } catch (err: any) {
      setError(err.message || 'Failed to post. Please try again.')
    } finally {
      setPosting(false)
      setUploadProgress(0)
    }
  }

  const charLeft = 1000 - content.length
  const canPost  = (content.trim().length > 0 || images.length > 0) && !posting

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar profile={currentProfile} size={40} />
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setError(null) }}
            placeholder="Share something with the founder community..."
            rows={3}
            maxLength={1000}
            className="flex-1 bg-transparent text-sm leading-relaxed resize-none outline-none"
            style={{ color: C.text, caretColor: C.blueLight }}
          />
        </div>

        {/* Image previews */}
        {previews.length > 0 && (
          <div className={`mt-3 grid gap-2 ${previews.length === 1 ? 'grid-cols-1' : previews.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {previews.map((src, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-video">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previews.length < 4 && (
              <div
                className="rounded-xl flex items-center justify-center cursor-pointer aspect-video"
                style={{ border: `2px dashed ${C.border}` }}
                onClick={() => setShowDropZone(true)}
              >
                <span className="text-xs" style={{ color: C.textDim }}>+ Add more</span>
              </div>
            )}
          </div>
        )}

        {/* Drop zone */}
        {showDropZone && images.length < 4 && (
          <div className="mt-3">
            <ImageDropZone onFiles={files => { handleFiles(files); setShowDropZone(false) }} />
          </div>
        )}

        {/* Upload progress */}
        {posting && uploadProgress > 0 && (
          <div className="mt-3">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${uploadProgress}%`, background: `linear-gradient(to right, ${C.blue}, ${C.blueLight})` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDropZone(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showDropZone ? C.blueDim : 'transparent',
              color:      showDropZone ? C.blueLight : C.textMuted,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.blueDim; (e.currentTarget as HTMLElement).style.color = C.blueLight }}
            onMouseLeave={e => { if (!showDropZone) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted } }}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photo
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium"
            style={{ color: charLeft < 50 ? C.red : C.textDim }}
          >
            {charLeft < 200 ? charLeft : ''}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canPost}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: C.gold, color: '#0A0F1E' }}
          >
            {posting
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting...</>
              : <><Send className="w-3.5 h-3.5" /> Post</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Comment ──────────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: any }) {
  return (
    <div className="flex gap-2.5">
      <Avatar profile={comment.users} size={28} />
      <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: C.surface }}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: C.blueLight }}>
            {getName(comment.users)}
          </span>
          <span className="text-xs" style={{ color: C.textDim }}>
            {formatTime(comment.created_at)}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{comment.content}</p>
      </div>
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onDelete, onLike, onComment }: {
  post: any
  currentUserId: string | null
  onDelete: (id: string) => void
  onLike:   (id: string, liked: boolean) => void
  onComment:(id: string, text: string) => Promise<void>
}) {
  const [showComments,  setShowComments]  = useState(false)
  const [commentText,   setCommentText]   = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [comments,      setComments]      = useState<any[]>(post.post_comments || [])
  const isOwner = post.user_id === currentUserId

  const loadComments = async () => {
    if (loadingComments) return
    setLoadingComments(true)
    const { data } = await supabase
      .from('post_comments')
      .select('*, users(id, email, full_name, photo_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
    setLoadingComments(false)
  }

  const toggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(p => !p)
  }

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    await onComment(post.id, commentText.trim())
    setCommentText('')
    await loadComments()
    setSubmitting(false)
  }

  const images: string[] = post.image_urls || []

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-center gap-3">
          <Avatar profile={post.users} size={42} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: C.text }}>
                {getName(post.users)}
              </span>
              {post.users?.role && post.users.role !== 'audience' && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: post.users.role === 'host' ? C.goldDim : C.redDim,
                    color:      post.users.role === 'host' ? C.gold    : C.red,
                  }}
                >
                  {post.users.role === 'host' ? '⚡ Host' : '🛡 Admin'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Globe className="w-3 h-3" style={{ color: C.textDim }} />
              <span className="text-xs" style={{ color: C.textDim }}>{formatTime(post.created_at)}</span>
              {post.users?.username && (
                <span className="text-xs" style={{ color: C.textDim }}>· @{post.users.username}</span>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(p => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: C.textDim }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.border }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-9 w-44 rounded-xl overflow-hidden z-20 shadow-2xl"
              style={{ background: '#1A2340', border: `1px solid ${C.border}` }}
            >
              {isOwner && (
                <button
                  onClick={() => { onDelete(post.id); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: C.red }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redDim }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                style={{ color: C.textMuted }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.border }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Share2 className="w-3.5 h-3.5" /> Copy link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-5 pb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#D4DBEE' }}>
            {post.content}
          </p>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div
          className={`mx-0 mb-0 grid gap-0.5 ${
            images.length === 1 ? 'grid-cols-1' :
            images.length === 2 ? 'grid-cols-2' :
            images.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}
        >
          {images.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${
                images.length === 3 && i === 0 ? 'row-span-2' : ''
              }`}
              style={{ aspectRatio: images.length === 1 ? '16/9' : '1/1' }}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
              {/* 4+ overlay */}
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div
          className="flex items-center justify-between px-5 py-2 text-xs"
          style={{ borderTop: images.length > 0 ? `1px solid ${C.border}` : 'none', color: C.textDim }}
        >
          {post.likes_count > 0 && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${C.red}, #F97316)` }}
              >
                <Heart className="w-2.5 h-2.5 text-white fill-white" />
              </div>
              <span>{post.likes_count}</span>
            </div>
          )}
          {post.comments_count > 0 && (
            <button
              onClick={toggleComments}
              className="ml-auto hover:underline transition-colors"
              style={{ color: C.textMuted }}
            >
              {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center px-2 py-1" style={{ borderTop: `1px solid ${C.border}` }}>
        {/* Like */}
        <button
          onClick={() => onLike(post.id, !!post.liked_by_me)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{ color: post.liked_by_me ? C.red : C.textMuted }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redDim; (e.currentTarget as HTMLElement).style.color = C.red }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = post.liked_by_me ? C.red : C.textMuted }}
        >
          <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Like</span>
        </button>

        {/* Comment */}
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{ color: C.textMuted }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.blueDim; (e.currentTarget as HTMLElement).style.color = C.blueLight }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted }}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        {/* Share */}
        <button
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{ color: C.textMuted }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenDim; (e.currentTarget as HTMLElement).style.color = C.green }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted }}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.textDim }} />
            </div>
          ) : (
            comments.map(c => <CommentItem key={c.id} comment={c} />)
          )}

          {/* Comment input */}
          {currentUserId && (
            <div className="flex gap-2 pt-1">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                  placeholder="Add a comment..."
                  maxLength={500}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: C.text }}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{ background: C.blue, color: '#fff' }}
                >
                  {submitting
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Suggested person card ────────────────────────────────────────────────────
function SuggestedPerson({ person, currentUserId, onConnect }: {
  person: any
  currentUserId: string | null
  onConnect: (id: string) => void
}) {
  const [status, setStatus] = useState<'none' | 'pending' | 'connected'>('none')

  useEffect(() => {
    if (!currentUserId) return
    supabase
      .from('connections')
      .select('status')
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${person.id}),and(user1_id.eq.${person.id},user2_id.eq.${currentUserId})`)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === 'accepted')  setStatus('connected')
        else if (data?.status === 'requested') setStatus('pending')
      })
  }, [currentUserId, person.id])

  const handleConnect = async () => {
    if (!currentUserId || status !== 'none') return
    setStatus('pending')
    await supabase.from('connections').insert({
      user1_id: currentUserId,
      user2_id: person.id,
      status: 'requested',
    })
    onConnect(person.id)
  }

  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <Avatar profile={person} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{getName(person)}</p>
        <p className="text-xs truncate" style={{ color: C.textMuted }}>
          {person.role || 'Founder'}
          {person.mutual > 0 && (
            <span style={{ color: C.blueLight }}> · {person.mutual} mutual</span>
          )}
        </p>
      </div>
      <button
        onClick={handleConnect}
        disabled={status !== 'none'}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:cursor-default"
        style={{
          background: status === 'connected' ? C.greenDim : status === 'pending' ? C.border : C.blueDim,
          color:      status === 'connected' ? C.green    : status === 'pending' ? C.textMuted : C.blueLight,
          border:     `1px solid ${status === 'connected' ? C.green + '30' : status === 'pending' ? C.border : 'rgba(37,99,235,0.2)'}`,
        }}
      >
        {status === 'connected' ? <><Check className="w-3 h-3" /> Connected</> :
         status === 'pending'   ? 'Pending' :
         <><UserPlus className="w-3 h-3" /> Connect</>}
      </button>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function RightSidebar({ currentUserId }: { currentUserId: string | null }) {
  const [suggested, setSuggested] = useState<any[]>([])
  const [stats,     setStats]     = useState({ members: 0, posts: 0, live: 0 })

  useEffect(() => {
    if (!currentUserId) return

    // Fetch suggested connections — people not yet connected
    supabase
      .from('users')
      .select('id, email, full_name, photo_url, role, username')
      .neq('id', currentUserId)
      .limit(5)
      .then(({ data }) => { if (data) setSuggested(data) })

    // Platform stats
    Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'live'),
    ]).then(([u, p, e]) => {
      setStats({ members: u.count || 0, posts: p.count || 0, live: e.count || 0 })
    })
  }, [currentUserId])

  const trending = [
    '#AIFounders', '#SaaSGrowth', '#Fundraising', '#ProductMindset', '#BootstrappedLife'
  ]

  return (
    <div className="space-y-4">
      {/* Suggested connections */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.blueLight }}>Network</p>
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Suggested Connections</h3>
        </div>
        <div className="px-5 pb-2">
          {suggested.length === 0 ? (
            <p className="text-xs py-3" style={{ color: C.textDim }}>No suggestions yet</p>
          ) : (
            suggested.map(p => (
              <SuggestedPerson
                key={p.id}
                person={p}
                currentUserId={currentUserId}
                onConnect={() => {}}
              />
            ))
          )}
        </div>
        <div className="px-5 pb-4">
          <Link href="/dashboard/network">
            <button
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: C.blueDim, color: C.blueLight, border: `1px solid rgba(37,99,235,0.2)` }}
            >
              View all connections →
            </button>
          </Link>
        </div>
      </div>

      {/* Trending topics */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: C.gold }} />
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.gold }}>Trending</p>
          </div>
        </div>
        <div className="pb-4">
          {trending.map((tag, i) => (
            <div
              key={tag}
              className="flex items-center justify-between px-5 py-2.5 transition-colors cursor-pointer"
              style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.cardHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: C.blueLight }}>{tag}</p>
                <p className="text-xs" style={{ color: C.textDim }}>{Math.floor(Math.random() * 200 + 50)} posts</p>
              </div>
              <span className="text-xs font-bold" style={{ color: C.textDim }}>#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community stats */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.textDim }}>Community</p>
        {[
          { label: 'Founders',    value: `${stats.members.toLocaleString()}+`, icon: Users, color: C.blueLight },
          { label: 'Posts',       value: `${stats.posts.toLocaleString()}`,    icon: BookOpen, color: C.gold },
          { label: 'Live Now',    value: stats.live.toString(),                icon: Radio, color: C.red },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-xs" style={{ color: C.textMuted }}>{s.label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main feed page ───────────────────────────────────────────────────────────
export default function FeedPage() {
  const [currentUser,    setCurrentUser]    = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [posts,          setPosts]          = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [loadingMore,    setLoadingMore]    = useState(false)
  const [hasMore,        setHasMore]        = useState(true)
  const PAGE_SIZE = 10

  const loadPosts = useCallback(async (userId: string | null, offset = 0) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, image_urls, created_at, user_id, likes_count, comments_count,
        users ( id, email, full_name, photo_url, role, username )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error || !data) return []

    // Check which posts current user has liked
    let likedIds = new Set<string>()
    if (userId && data.length > 0) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', data.map(p => p.id))
      likedIds = new Set((likes || []).map((l: any) => l.post_id))
    }

    return data.map(p => ({ ...p, liked_by_me: likedIds.has(p.id) }))
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setCurrentUser(u)

      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setCurrentProfile(prof)

      const initial = await loadPosts(u.id, 0)
      setPosts(initial)
      setHasMore(initial.length === PAGE_SIZE)
      setLoading(false)
    })

    // Realtime — new posts appear instantly
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        supabase.auth.getUser().then(({ data: { user: u } }) => {
          loadPosts(u?.id || null, 0).then(fresh => {
            setPosts(fresh)
          })
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadPosts])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const more = await loadPosts(currentUser?.id || null, posts.length)
    setPosts(prev => [...prev, ...more])
    setHasMore(more.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  const handleDelete = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleLike = async (postId: string, alreadyLiked: boolean) => {
    if (!currentUser) return
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked_by_me: !alreadyLiked, likes_count: p.likes_count + (alreadyLiked ? -1 : 1) }
      : p
    ))
    if (alreadyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id)
      await supabase.from('posts').update({ likes_count: Math.max(0, (posts.find(p => p.id === postId)?.likes_count || 1) - 1) }).eq('id', postId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id })
      await supabase.from('posts').update({ likes_count: (posts.find(p => p.id === postId)?.likes_count || 0) + 1 }).eq('id', postId)
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (!currentUser) return
    await supabase.from('post_comments').insert({ post_id: postId, user_id: currentUser.id, content })
    await supabase.from('posts').update({ comments_count: (posts.find(p => p.id === postId)?.comments_count || 0) + 1 }).eq('id', postId)
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
  }

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <div className="grid lg:grid-cols-3 gap-5">

            {/* ── Feed (2/3) ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Header */}
              <div className="mb-1">
                <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.blueLight }}>Feed</p>
                <h1 className="text-xl font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
                  Founder Community
                </h1>
              </div>

              {/* Composer */}
              {currentUser && (
                <PostComposer
                  currentUser={currentUser}
                  currentProfile={currentProfile}
                  onPost={() => loadPosts(currentUser.id, 0).then(setPosts)}
                />
              )}

              {/* Posts */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: C.card }} />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ background: C.card, border: `1px solid ${C.border}` }}
                >
                  <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
                  <p className="font-semibold mb-1" style={{ color: C.text }}>No posts yet</p>
                  <p className="text-sm" style={{ color: C.textMuted }}>Be the first to share something!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUser?.id || null}
                        onDelete={handleDelete}
                        onLike={handleLike}
                        onComment={handleComment}
                      />
                    ))}
                  </div>

                  {/* Load more */}
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: C.card, color: C.textMuted, border: `1px solid ${C.border}` }}
                    >
                      {loadingMore
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                        : <><ChevronDown className="w-4 h-4" /> Load more posts</>
                      }
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── Right sidebar (1/3) ── */}
            <div className="hidden lg:block">
              <RightSidebar currentUserId={currentUser?.id || null} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
