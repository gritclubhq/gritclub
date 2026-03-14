'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  users: {
    email: string
    photo_url: string | null
  }
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
      await fetchPosts()
      setLoading(false)
    }
    init()

    // Realtime subscription — new posts appear instantly for all users
    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, user_id,
        users ( email, photo_url )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setPosts(data as any)
  }

  const submitPost = async () => {
    if (!newPost.trim() || posting) return
    setPosting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('posts')
      .insert({ content: newPost.trim(), user_id: user.id })

    if (!error) setNewPost('')
    setPosting(false)
  }

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId)
  }

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const getInitial = (email: string) => email?.[0]?.toUpperCase() ?? '?'

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Community</h1>

        {/* Post composer */}
        <div className="bg-[#1E293B] rounded-2xl p-4 mb-6 border border-white/10">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Share something with the founder community..."
            maxLength={1000}
            rows={3}
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm 
                       resize-none outline-none"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-slate-500 text-xs">{newPost.length}/1000</span>
            <button
              onClick={submitPost}
              disabled={!newPost.trim() || posting}
              className="px-4 py-2 rounded-xl bg-[#ffd700] text-black text-sm font-semibold
                         disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 
                         transition-colors"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-slate-500 text-center py-12">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-slate-500 text-center py-12">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <div key={post.id}
                className="bg-[#1E293B] rounded-2xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 
                                  bg-[#38BDF8] flex items-center justify-center 
                                  text-white font-bold text-sm">
                    {post.users?.photo_url ? (
                      <img src={post.users.photo_url} alt=""
                        className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitial(post.users?.email)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-sm font-medium truncate">
                        {post.users?.email?.split('@')[0]}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-500 text-xs">
                          {formatTime(post.created_at)}
                        </span>
                        {/* Delete — only for own posts */}
                        {post.user_id === currentUserId && (
                          <button
                            onClick={() => deletePost(post.id)}
                            className="text-slate-600 hover:text-red-400 transition-colors p-1 
                                       rounded-lg hover:bg-red-400/10"
                            title="Delete post"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
