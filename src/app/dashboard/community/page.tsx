'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import {
  ThumbsUp, MessageCircle, Share2, Send, Trash2,
  Image, Link2, Hash, MoreHorizontal, Globe, Users, Lock
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  users: { email: string; photo_url: string | null }
}

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  likes_count: number
  comments_count: number
  users: { email: string; photo_url: string | null }
  liked_by_me?: boolean
  comments?: Comment[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTime = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

const getInitial = (email: string) => email?.[0]?.toUpperCase() ?? '?'
const getName = (email: string) => email?.split('@')[0] ?? 'User'

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ photoUrl, email, size = 10 }: { photoUrl?: string | null; email: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold`}
      style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A', minWidth: size * 4, minHeight: size * 4 }}
    >
      {photoUrl
        ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        : <span>{getInitial(email)}</span>
      }
    </div>
  )
}

// ─── Post Card ───────────────────────────────────────────────────────────────
function PostCard({
  post,
  currentUserId,
  onDelete,
  onLike,
  onComment,
}: {
  post: Post
  currentUserId: string | null
  onDelete: (id: string) => void
  onLike: (id: string, liked: boolean) => void
  onComment: (postId: string, content: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const isOwner = post.user_id === currentUserId

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    await onComment(post.id, commentText.trim())
    setCommentText('')
    setSubmitting(false)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#1E293B', border: '1px solid #334155' }}
    >
      {/* Post header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar photoUrl={post.users?.photo_url} email={post.users?.email} size={10} />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{getName(post.users?.email)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500 text-xs">{formatTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(p => !p)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-9 w-40 rounded-xl overflow-hidden z-10 shadow-xl"
                style={{ background: '#0F172A', border: '1px solid #334155' }}
              >
                {isOwner && (
                  <button
                    onClick={() => { onDelete(post.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete post
                  </button>
                )}
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-700/50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Copy link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-slate-200 text-sm leading-relaxed mt-3 mb-4 whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Stats row */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div
          className="flex items-center justify-between px-4 py-2 text-xs text-slate-500"
          style={{ borderTop: '1px solid #334155' }}
        >
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: '#38BDF8', color: '#0F172A' }}>👍</span>
              {post.likes_count}
            </span>
          )}
          {post.comments_count > 0 && (
            <button
              onClick={() => setShowComments(p => !p)}
              className="hover:text-white transition-colors ml-auto"
            >
              {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div
        className="flex items-center px-2 py-1"
        style={{ borderTop: '1px solid #334155' }}
      >
        <button
          onClick={() => onLike(post.id, !!post.liked_by_me)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 ${post.liked_by_me ? 'text-sky-400' : 'text-slate-400'}`}
        >
          <ThumbsUp className={`w-4 h-4 ${post.liked_by_me ? 'fill-sky-400' : ''}`} />
          Like
        </button>
        <button
          onClick={() => { setShowComments(p => !p) }}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
          {/* Comment input */}
          {currentUserId && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A', minWidth: 32 }}>
                ?
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || submitting}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
                  style={{ background: '#38BDF8', color: '#0F172A' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Comments list */}
          {(post.comments || []).map(c => (
            <div key={c.id} className="flex gap-2">
              <Avatar photoUrl={c.users?.photo_url} email={c.users?.email} size={8} />
              <div
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={{ background: '#0F172A' }}
              >
                <p className="text-white font-medium text-xs mb-0.5">{getName(c.users?.email)}</p>
                <p className="text-slate-300 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setCurrentUser(user)
        const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
        setCurrentProfile(prof)
      }
      await fetchPosts(user?.id ?? null)
      setLoading(false)
    }
    init()

    // Realtime
    const channel = supabase
      .channel('community-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        supabase.auth.getUser().then(({ data: { user } }) => fetchPosts(user?.id ?? null))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => {
        supabase.auth.getUser().then(({ data: { user } }) => fetchPosts(user?.id ?? null))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => {
        supabase.auth.getUser().then(({ data: { user } }) => fetchPosts(user?.id ?? null))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchPosts = async (userId: string | null) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, user_id, likes_count, comments_count,
        users ( email, photo_url ),
        post_comments (
          id, content, created_at, user_id,
          users ( email, photo_url )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) return

    // Check likes
    let likedIds = new Set<string>()
    if (userId) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
      likedIds = new Set((likes || []).map((l: any) => l.post_id))
    }

    const enriched = data.map((p: any) => ({
      ...p,
      liked_by_me: likedIds.has(p.id),
      comments: (p.post_comments || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }))

    setPosts(enriched as Post[])
  }

  const submitPost = async () => {
    if (!newPost.trim() || posting) return
    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('posts').insert({ content: newPost.trim(), user_id: user.id })
    setNewPost('')
    setPosting(false)
  }

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
  }

  const handleLike = async (postId: string, alreadyLiked: boolean) => {
    if (!currentUserId) return
    if (alreadyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId)
      await supabase.from('posts').update({ likes_count: Math.max(0, (posts.find(p => p.id === postId)?.likes_count ?? 1) - 1) }).eq('id', postId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId })
      await supabase.from('posts').update({ likes_count: (posts.find(p => p.id === postId)?.likes_count ?? 0) + 1 }).eq('id', postId)
    }
    // Optimistic local update
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      liked_by_me: !alreadyLiked,
      likes_count: p.likes_count + (alreadyLiked ? -1 : 1),
    } : p))
  }

  const handleComment = async (postId: string, content: string) => {
    if (!currentUserId) return
    await supabase.from('post_comments').insert({ post_id: postId, user_id: currentUserId, content })
    await supabase.from('posts').update({
      comments_count: (posts.find(p => p.id === postId)?.comments_count ?? 0) + 1
    }).eq('id', postId)
    await fetchPosts(currentUserId)
  }

  const displayName = currentProfile?.full_name || currentUser?.user_metadata?.full_name || currentUser?.email || ''
  const photoUrl = currentProfile?.photo_url || currentUser?.user_metadata?.avatar_url || null

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: '#0F172A' }}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Header */}
          <div className="mb-2">
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Community</h1>
            <p className="text-slate-500 text-sm mt-0.5">Share insights with the founder community</p>
          </div>

          {/* ── Composer ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#1E293B', border: '1px solid #334155' }}
          >
            <div className="p-4">
              <div className="flex gap-3">
                {/* Current user avatar */}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A', minWidth: 40 }}
                >
                  {photoUrl
                    ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    : <span>{getInitial(currentUser?.email || 'U')}</span>
                  }
                </div>

                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share something with the founder community..."
                  maxLength={1000}
                  rows={3}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Composer footer */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid #334155' }}
            >
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-all">
                  <Image className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-all">
                  <Link2 className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-all">
                  <Hash className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-600 text-xs">{newPost.length}/1000</span>
                <button
                  onClick={submitPost}
                  disabled={!newPost.trim() || posting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  style={{ background: '#FFD700', color: '#0F172A' }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Feed ── */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl animate-pulse"
                  style={{ background: '#1E293B' }}
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: '#1E293B', border: '1px solid #334155' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(56,189,248,0.08)' }}>
                <Users className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-white font-medium mb-1">No posts yet</p>
              <p className="text-slate-500 text-sm">Be the first to share something with the community!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onDelete={deletePost}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
