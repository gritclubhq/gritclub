'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import {
  ThumbsUp, MessageCircle, Share2, Send, Trash2,
  MoreHorizontal, Globe, Bookmark, Repeat2, TrendingUp
} from 'lucide-react'

const C = {
  bg: '#0A0A0F',
  surface: '#13131A',
  surfaceHover: '#1A1A24',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(145,70,255,0.3)',
  text: '#F0F0FF',
  textMuted: '#8888A0',
  textDim: '#55556A',
  purple: '#9146FF',
  purpleLight: '#B07FFF',
  purpleDim: 'rgba(145,70,255,0.12)',
  gold: '#FCD34D',
  goldDim: 'rgba(252,211,77,0.1)',
  red: '#FF4444',
  sky: '#38BDF8',
  skyDim: 'rgba(56,189,248,0.1)',
  green: '#4ADE80',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const getInitials = (email: string) => {
  const name = email?.split('@')[0] || 'U'
  return name.slice(0, 2).toUpperCase()
}

const getName = (email: string) => email?.split('@')[0] || 'User'

// Color hash for avatar backgrounds
const avatarColor = (str: string) => {
  const colors = [C.purple, C.sky, C.green, C.gold, '#F472B6', '#FB923C']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photoUrl, email, size = 40 }: { photoUrl?: string | null; email: string; size?: number }) {
  const color = avatarColor(email)
  return (
    <div
      className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold"
      style={{ width: size, height: size, background: color + '25', color, fontSize: size * 0.35, border: `1.5px solid ${color}30` }}
    >
      {photoUrl
        ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        : getInitials(email)
      }
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
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

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  users: { email: string; photo_url: string | null }
}

function PostCard({ post, currentUserId, onDelete, onLike, onComment }: {
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

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    await onComment(post.id, commentText.trim())
    setCommentText('')
    setSubmitting(false)
    setShowComments(true)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {/* Post header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar photoUrl={post.users?.photo_url} email={post.users?.email} size={40} />
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: C.text }}>{getName(post.users?.email)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3" style={{ color: C.textDim }} />
                <span className="text-xs" style={{ color: C.textDim }}>{formatTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(p => !p)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: C.textMuted }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 w-44 rounded-xl overflow-hidden z-10 shadow-2xl" style={{ background: '#1E1E2A', border: `1px solid ${C.border}` }}>
                {isOwner && (
                  <button
                    onClick={() => { onDelete(post.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left"
                    style={{ color: C.red }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,0.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete post
                  </button>
                )}
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left"
                  style={{ color: C.textMuted }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Bookmark className="w-3.5 h-3.5" /> Save post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#D0D0E8' }}>
          {post.content}
        </p>
      </div>

      {/* Stats row */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-5 py-2 text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.textDim }}>
          {post.likes_count > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.sky})` }}>👍</div>
              <span>{post.likes_count}</span>
            </div>
          )}
          {post.comments_count > 0 && (
            <button onClick={() => setShowComments(p => !p)} className="ml-auto transition-colors hover:underline" style={{ color: C.textMuted }}>
              {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center px-2" style={{ borderTop: `1px solid ${C.border}` }}>
        {[
          {
            label: 'Like', icon: ThumbsUp, active: post.liked_by_me, color: C.purpleLight,
            onClick: () => onLike(post.id, !!post.liked_by_me),
          },
          {
            label: 'Comment', icon: MessageCircle, active: false, color: C.sky,
            onClick: () => setShowComments(p => !p),
          },
          {
            label: 'Repost', icon: Repeat2, active: false, color: C.green,
            onClick: () => {},
          },
          {
            label: 'Share', icon: Share2, active: false, color: C.gold,
            onClick: () => {},
          },
        ].map(({ label, icon: Icon, active, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ color: active ? color : C.textMuted }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = color + '10'; (e.currentTarget as HTMLElement).style.color = color }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = active ? color : C.textMuted }}
          >
            <Icon className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>

          {/* Comment input */}
          {currentUserId && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: C.purpleDim, color: C.purpleLight }}>
                Y
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                  onFocus={e => (e.target.style.borderColor = C.borderHover)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{ background: C.purple, color: '#fff' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Comments list */}
          {(post.comments || []).map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar photoUrl={c.users?.photo_url} email={c.users?.email} size={32} />
              <div className="flex-1 px-3.5 py-2.5 rounded-xl" style={{ background: C.bg }}>
                <p className="text-xs font-semibold mb-1" style={{ color: C.purpleLight }}>{getName(c.users?.email)}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Trending Sidebar ─────────────────────────────────────────────────────────
function TrendingSidebar() {
  const topics = [
    { tag: '#AIFounders', posts: 142 },
    { tag: '#SaaSGrowth', posts: 98 },
    { tag: '#Fundraising', posts: 76 },
    { tag: '#ProductMarketFit', posts: 61 },
    { tag: '#BootstrappedLife', posts: 45 },
  ]
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: C.purple }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.purple }}>Trending</p>
        </div>
        <h2 className="text-sm font-bold" style={{ color: C.text }}>Topics for you</h2>
      </div>
      <div className="pb-4">
        {topics.map((t, i) => (
          <div key={t.tag} className="flex items-center justify-between px-5 py-2.5 transition-colors cursor-pointer"
            style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: C.purpleLight }}>{t.tag}</p>
              <p className="text-xs" style={{ color: C.textDim }}>{t.posts} posts</p>
            </div>
            <span className="text-xs font-bold" style={{ color: C.textDim }}>#{i + 1}</span>
          </div>
        ))}
      </div>
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

    const channel = supabase
      .channel('community-realtime')
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
      .select(`id, content, created_at, user_id, likes_count, comments_count,
        users ( email, photo_url ),
        post_comments ( id, content, created_at, user_id, users ( email, photo_url ) )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) return

    let likedIds = new Set<string>()
    if (userId) {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', userId)
      likedIds = new Set((likes || []).map((l: any) => l.post_id))
    }

    setPosts(data.map((p: any) => ({
      ...p,
      liked_by_me: likedIds.has(p.id),
      comments: (p.post_comments || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    })))
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

  const handleDelete = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
  }

  const handleLike = async (postId: string, alreadyLiked: boolean) => {
    if (!currentUserId) return
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, liked_by_me: !alreadyLiked, likes_count: p.likes_count + (alreadyLiked ? -1 : 1),
    } : p))
    if (alreadyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId)
      await supabase.from('posts').update({ likes_count: Math.max(0, (posts.find(p => p.id === postId)?.likes_count ?? 1) - 1) }).eq('id', postId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId })
      await supabase.from('posts').update({ likes_count: (posts.find(p => p.id === postId)?.likes_count ?? 0) + 1 }).eq('id', postId)
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (!currentUserId) return
    await supabase.from('post_comments').insert({ post_id: postId, user_id: currentUserId, content })
    await supabase.from('posts').update({ comments_count: (posts.find(p => p.id === postId)?.comments_count ?? 0) + 1 }).eq('id', postId)
    await fetchPosts(currentUserId)
  }

  const photoUrl = currentProfile?.photo_url || currentUser?.user_metadata?.avatar_url || null

  return (
    <DashboardLayout>
      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="grid lg:grid-cols-3 gap-5">

            {/* ── Feed (2/3) ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Header */}
              <div className="mb-1">
                <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.purple }}>Community</p>
                <h1 className="text-xl font-bold" style={{ color: C.text }}>Founder Feed</h1>
                <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>Share insights with the founder community</p>
              </div>

              {/* ── Composer ── */}
              <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="p-4">
                  <div className="flex gap-3">
                    <Avatar photoUrl={photoUrl} email={currentUser?.email || 'user@gritclub.com'} size={40} />
                    <textarea
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      placeholder="Share something with the founder community..."
                      maxLength={1000}
                      rows={3}
                      className="flex-1 bg-transparent text-sm outline-none leading-relaxed resize-none"
                      style={{ color: C.text, caretColor: C.purple }}
                      onFocus={e => { (e.target.closest('.rounded-xl') as HTMLElement).style.borderColor = C.borderHover }}
                      onBlur={e => { (e.target.closest('.rounded-xl') as HTMLElement).style.borderColor = C.border }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-1">
                    {['🖼', '🔗', '#'].map(icon => (
                      <button key={icon} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors" style={{ color: C.textMuted }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; (e.currentTarget as HTMLElement).style.color = C.purpleLight }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: C.textDim }}>{newPost.length}/1000</span>
                    <button
                      onClick={submitPost}
                      disabled={!newPost.trim() || posting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ background: C.gold, color: '#0A0A0F' }}
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
                    <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: C.surface }} />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl p-12 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: C.purpleDim }}>
                    <MessageCircle className="w-7 h-7" style={{ color: C.purpleLight }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: C.text }}>No posts yet</p>
                  <p className="text-sm" style={{ color: C.textMuted }}>Be the first to share something with the community!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId}
                      onDelete={handleDelete}
                      onLike={handleLike}
                      onComment={handleComment}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Sidebar (1/3) ── */}
            <div className="hidden lg:block space-y-4">
              <TrendingSidebar />

              {/* Community stats */}
              <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.gold }}>Community</p>
                {[
                  { label: 'Members', value: '2,400+', color: C.purpleLight },
                  { label: 'Posts this week', value: '340', color: C.sky },
                  { label: 'Events live', value: '3', color: C.red },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
                    <span className="text-sm" style={{ color: C.textMuted }}>{s.label}</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
