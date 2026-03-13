'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Heart, MessageCircle, Bookmark, TrendingUp, Plus, Search, Users, Radio, Send } from 'lucide-react'

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [stats, setStats] = useState({ members: 0, events: 0, hosts: 0 })
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const trending = ['#SaaS', '#Fundraising', '#ProductLaunch', '#Bootstrap', '#GrowthHacking', '#MRR']

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: users } = await supabase.from('users').select('id, email, role, profile_bio, photo_url').order('created_at', { ascending: false }).limit(10)
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true })
      const hostCount = users?.filter(u => u.role === 'host' || u.role === 'admin').length || 0
      setMembers(users || [])
      setStats({ members: users?.length || 0, events: eventCount || 0, hosts: hostCount })
      setPosts([
        { id: '1', author: 'Jake Harris', avatar: null, email: 'jake@gritclub.live', time: '2h ago', content: 'Just crossed $10k MRR! The GritClub event last week gave me the framework to finally nail my pricing strategy. 🚀', likes: 47, comments: 12, tags: ['#SaaS', '#MRR'] },
        { id: '2', author: 'Sarah Chen', avatar: null, email: 'sarah@startup.com', time: '4h ago', content: "Fundraising tip from yesterday's session: Lead with traction, not vision. Investors fund momentum, not ideas. Changed everything for my pitch deck.", likes: 83, comments: 28, tags: ['#Fundraising'] },
        { id: '3', author: 'Marcus Reeves', avatar: null, email: 'marcus@buildfast.io', time: '6h ago', content: 'Launched my first product on Product Hunt today! 347 upvotes in 6 hours. The community here helped me prep the launch strategy 🔥', likes: 124, comments: 41, tags: ['#ProductLaunch', '#Bootstrap'] },
      ])
      setLoading(false)
    }
    load()
  }, [])

  const getInitials = (email: string) => email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'GC'

  const toggleLike = (postId: string) => {
    setLiked(prev => { const next = new Set(prev); if (next.has(postId)) next.delete(postId); else next.add(postId); return next })
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: liked.has(postId) ? p.likes - 1 : p.likes + 1 } : p))
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Community</h1>
            <p className="text-slate-400 text-sm mt-0.5">Founders building in public</p>
          </div>
          <button className="p-2 rounded-xl" style={{ background: '#1E293B' }}>
            <Search className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Stories */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
            <div className="flex flex-col items-center gap-1.5">
              <button className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-dashed" style={{ borderColor: '#334155', background: '#1E293B' }}>
                <Plus className="w-5 h-5 text-slate-400" />
              </button>
              <span className="text-xs text-slate-500">You</span>
            </div>
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold ring-2 overflow-hidden" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A'}}>
                  {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> : getInitials(m.email)}
                </div>
                <span className="text-xs text-slate-400 max-w-[56px] truncate">{m.email?.split('@')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Post composer */}
            <div className="rounded-2xl p-4" style={{ background: '#1E293B' }}>
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Share a win, insight, or question..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none mb-2"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!newPost.trim()) return
                    setPosts(prev => [{ id: Date.now().toString(), author: user?.email?.split('@')[0] || 'You', avatar: user?.user_metadata?.avatar_url, email: user?.email || '', time: 'Just now', content: newPost, likes: 0, comments: 0, tags: [] }, ...prev])
                    setNewPost('')
                  }}
                  disabled={!newPost.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: '#38BDF8', color: '#0F172A' }}
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </div>
            </div>

            {/* Posts */}
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />) : posts.map(post => (
              <div key={post.id} className="rounded-2xl p-5" style={{ background: '#1E293B' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', color: 'white' }}>
                    {post.avatar ? <img src={post.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(post.email)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{post.author}</div>
                    <div className="text-xs text-slate-500">{post.time}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed mb-3">{post.content}</p>
                {post.tags.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8' }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid #334155' }}>
                  <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: liked.has(post.id) ? '#F87171' : '#64748B' }}>
                    <Heart className="w-4 h-4" fill={liked.has(post.id) ? 'currentColor' : 'none'} />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MessageCircle className="w-4 h-4" />{post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-slate-500 ml-auto">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: '#1E293B' }}>
              <h3 className="font-semibold text-sm mb-3">Community Stats</h3>
              {[
                { label: 'Members', value: stats.members, icon: Users, color: '#38BDF8' },
                { label: 'Events Hosted', value: stats.events, icon: Radio, color: '#FFD700' },
                { label: 'Active Hosts', value: stats.hosts, icon: TrendingUp, color: '#4ADE80' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400"><s.icon className="w-4 h-4" style={{ color: s.color }} />{s.label}</div>
                  <span className="font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#1E293B' }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-sky-400" />Now Trending</h3>
              <div className="flex flex-wrap gap-2">
                {trending.map(tag => (
                  <button key={tag} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(56,189,248,0.08)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>{tag}</button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#1E293B' }}>
              <h3 className="font-semibold text-sm mb-3">Top Members</h3>
              {members.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                    {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> : getInitials(m.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.email?.split('@')[0]}</div>
                    <div className="text-xs text-slate-500">{m.profile_bio || 'Founder'}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: m.role === 'host' ? 'rgba(255,215,0,0.15)' : 'rgba(56,189,248,0.1)', color: m.role === 'host' ? '#FFD700' : '#38BDF8' }}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
