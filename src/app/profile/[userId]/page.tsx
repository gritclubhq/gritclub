'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Heart, MessageCircle, Share2, UserPlus, Check,
  UserCheck, Loader2, ChevronLeft, Globe, ExternalLink,
  Instagram, Twitter, Linkedin, MapPin
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)',
  text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
  purple:'#7C3AED', purpleDim:'rgba(124,58,237,0.1)',
}

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2']
const avatarColor = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
const getName = (u: any) => u?.full_name || u?.email?.split('@')[0] || 'User'
const timeAgo = (ts: string) => {
  const d = Date.now()-new Date(ts).getTime(), m=Math.floor(d/60000)
  if (m<1) return 'just now'; if (m<60) return `${m}m ago`
  const h=Math.floor(m/60); if (h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function Avatar({ u, size=48 }: { u: any; size?: number }) {
  const color = avatarColor(u?.id||'')
  return (
    <div style={{ width:size, height:size, minWidth:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:color+'22', color, fontSize:size*0.35, fontWeight:700, fontFamily:'Syne,sans-serif', border:`2px solid ${color}33` }}>
      {u?.photo_url ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getName(u).slice(0,2).toUpperCase()}
    </div>
  )
}

// ─── Mini post card for profile ───────────────────────────────────────────────
function ProfilePostCard({ post, currentUserId }: any) {
  const imgs = (post.image_urls || []).filter(Boolean)
  const [liked,     setLiked]     = useState(post.my_like||false)
  const [likeCount, setLikeCount] = useState(post.likes_count||0)
  const [liking,    setLiking]    = useState(false)

  const handleLike = async () => {
    if (liking || !currentUserId) return
    setLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked); setLikeCount((c:number) => wasLiked ? Math.max(0,c-1) : c+1)
    try {
      const { data } = await supabase.rpc('toggle_post_like', { p_post_id: post.id, p_user_id: currentUserId })
      if (data?.[0]) { setLiked(data[0].liked); setLikeCount(data[0].new_count) }
    } catch { setLiked(wasLiked); setLikeCount((c:number) => wasLiked ? c+1 : Math.max(0,c-1)) }
    setLiking(false)
  }

  return (
    <div style={{ borderRadius:16, background:C.card, border:`1px solid ${C.border}`, overflow:'hidden' }}>
      {/* Images — always visible */}
      {imgs.length > 0 && (
        <div style={{ display:'grid', gap:2, gridTemplateColumns:imgs.length===1?'1fr':'1fr 1fr' }}>
          {imgs.slice(0,4).map((url:string, i:number) => (
            <div key={i} style={{ position:'relative', aspectRatio:imgs.length===1?'16/9':'1/1', overflow:'hidden', background:C.surface }}>
              <img src={url} alt="" loading="lazy"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              {imgs.length>4 && i===3 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:22, fontWeight:800, color:'#fff' }}>+{imgs.length-4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {post.content && (
        <p style={{ padding:'12px 14px', fontSize:14, color:C.text, fontFamily:'DM Sans,sans-serif', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>
          {post.content}
        </p>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'8px 10px', borderTop:`1px solid ${C.border}` }}>
        <button onClick={handleLike} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color:liked?C.red:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:13 }}>
          <Heart style={{ width:14, height:14, fill:liked?C.red:'none', stroke:liked?C.red:'currentColor' }} /> {likeCount||''}
        </button>
        <span style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', fontSize:13, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>
          <MessageCircle style={{ width:14, height:14 }} /> {post.comments_count||''}
        </span>
        <span style={{ marginLeft:'auto', fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif' }}>{timeAgo(post.created_at)}</span>
      </div>
    </div>
  )
}

// ─── Main Public Profile Page ─────────────────────────────────────────────────
export default function PublicProfilePage() {
  const { userId } = useParams()
  const router     = useRouter()
  const targetId   = userId as string

  const [currentUser,   setCurrentUser]   = useState<any>(null)
  const [profile,       setProfile]       = useState<any>(null)
  const [posts,         setPosts]         = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)
  const [connStatus,    setConnStatus]    = useState<'none'|'requested'|'accepted'|'incoming'>('none')
  const [isFollowing,   setIsFollowing]   = useState(false)
  const [connLoading,   setConnLoading]   = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [connCount,     setConnCount]     = useState(0)
  const [followerCount, setFollowerCount] = useState(0)
  const [likedIds,      setLikedIds]      = useState<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setCurrentUser(u)

      // If viewing own profile, redirect to profile settings
      if (u && u.id === targetId) { router.push('/dashboard/profile'); return }

      // Load profile
      const { data: prof } = await supabase
        .from('users')
        .select('id, full_name, email, photo_url, banner_url, username, role, bio, website_url, instagram, twitter, linkedin, show_email, is_premium')
        .eq('id', targetId)
        .single()
      setProfile(prof)

      // Load posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id, content, image_urls, created_at, user_id, likes_count, comments_count')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false })
        .limit(20)
      setPosts(userPosts || [])

      if (u) {
        // Connection status
        const { data: conn } = await supabase
          .from('connections')
          .select('id, status, user1_id, user2_id')
          .or(`and(user1_id.eq.${u.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${u.id})`)
          .maybeSingle()

        if (conn) {
          if (conn.status === 'accepted') setConnStatus('accepted')
          else if (conn.user1_id === u.id) setConnStatus('requested')
          else setConnStatus('incoming')
        }

        // Follow status
        const { data: fol } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', u.id)
          .eq('following_id', targetId)
          .maybeSingle()
        setIsFollowing(!!fol)

        // My liked posts
        const { data: likes } = await supabase
          .from('post_likes').select('post_id').eq('user_id', u.id)
        setLikedIds(new Set((likes||[]).map((l:any) => l.post_id)))
      }

      // Counts
      const [{ count: cc }, { count: fc }] = await Promise.all([
        supabase.from('connections').select('id', { count:'exact', head:true }).or(`and(user1_id.eq.${targetId},status.eq.accepted),and(user2_id.eq.${targetId},status.eq.accepted)`),
        supabase.from('follows').select('id', { count:'exact', head:true }).eq('following_id', targetId),
      ])
      setConnCount(cc||0)
      setFollowerCount(fc||0)

      setLoading(false)
    }
    init()
  }, [targetId])

  const handleConnect = async () => {
    if (!currentUser || connLoading) return
    setConnLoading(true)
    if (connStatus === 'none') {
      await supabase.from('connections').insert({ user1_id: currentUser.id, user2_id: targetId, status: 'requested' })
      setConnStatus('requested')
    } else if (connStatus === 'requested') {
      await supabase.from('connections').delete().match({ user1_id: currentUser.id, user2_id: targetId })
      setConnStatus('none')
    } else if (connStatus === 'incoming') {
      await supabase.from('connections')
        .update({ status: 'accepted' })
        .or(`and(user1_id.eq.${targetId},user2_id.eq.${currentUser.id})`)
      setConnStatus('accepted')
      setConnCount(c => c+1)
    }
    setConnLoading(false)
  }

  const handleFollow = async () => {
    if (!currentUser || followLoading) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUser.id, following_id: targetId })
      setIsFollowing(false); setFollowerCount(c => Math.max(0,c-1))
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetId })
      setIsFollowing(true); setFollowerCount(c => c+1)
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:C.bg }}>
        <Loader2 style={{ width:28, height:28, color:C.blueLight, animation:'spin 1s linear infinite' }} />
      </div>
    </DashboardLayout>
  )

  if (!profile) return (
    <DashboardLayout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:C.bg }}>
        <p style={{ color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>User not found</p>
      </div>
    </DashboardLayout>
  )

  const postsWithLikes = posts.map(p => ({ ...p, my_like: likedIds.has(p.id) }))
  const isOwn = currentUser?.id === targetId

  const connectBtn = () => {
    if (connStatus==='accepted') return { label:'✓ Connected', bg:C.greenDim, color:C.green, border:C.green }
    if (connStatus==='requested') return { label:'Pending', bg:C.surface, color:C.textMuted, border:C.border }
    if (connStatus==='incoming') return { label:'Accept Request', bg:C.blueDim, color:C.blueLight, border:C.blue }
    return { label:'Connect', bg:C.blue, color:'#fff', border:C.blue }
  }
  const cb = connectBtn()

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:C.bg, minHeight:'100%' }}>

        {/* Back */}
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}` }}>
          <button onClick={() => router.back()} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontFamily:'DM Sans,sans-serif', fontSize:14 }}>
            <ChevronLeft style={{ width:16, height:16 }} /> Back
          </button>
        </div>

        <div style={{ maxWidth:720, margin:'0 auto', padding:'0 0 40px' }}>

          {/* Banner */}
          <div style={{ height:160, background:`linear-gradient(135deg, ${avatarColor(profile.id)}22, ${C.surface})`, overflow:'hidden', position:'relative' }}>
            {profile.banner_url && <img src={profile.banner_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
          </div>

          {/* Profile header */}
          <div style={{ padding:'0 24px 20px', background:C.card, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:-36, marginBottom:16 }}>
              <div style={{ border:`3px solid ${C.card}`, borderRadius:'50%' }}>
                <Avatar u={profile} size={72} />
              </div>
              {!isOwn && currentUser && (
                <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
                  <button onClick={handleFollow} disabled={followLoading}
                    style={{ padding:'8px 16px', borderRadius:10, border:`1px solid ${isFollowing?C.purple:C.border}`, cursor:'pointer', background:isFollowing?C.purpleDim:'transparent', color:isFollowing?C.purple:C.textMuted, fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:13, opacity:followLoading?0.6:1 }}>
                    {followLoading ? <Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }} /> : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={handleConnect} disabled={connLoading || connStatus==='accepted'}
                    style={{ padding:'8px 18px', borderRadius:10, border:`1px solid ${cb.border}`, cursor:connStatus==='accepted'?'default':'pointer', background:cb.bg, color:cb.color, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, opacity:connLoading?0.6:1, display:'flex', alignItems:'center', gap:6 }}>
                    {connLoading ? <Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }} /> : connStatus==='accepted' ? <UserCheck style={{ width:13, height:13 }} /> : connStatus==='none' ? <UserPlus style={{ width:13, height:13 }} /> : null}
                    {cb.label}
                  </button>
                </div>
              )}
            </div>

            {/* Name + role */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', letterSpacing:'-0.02em', margin:0 }}>{getName(profile)}</h1>
              {profile.role==='host'  && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:C.goldDim,   color:C.gold,      fontFamily:'DM Sans,sans-serif', fontWeight:700 }}>HOST</span>}
              {profile.role==='admin' && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:C.redDim,    color:C.red,       fontFamily:'DM Sans,sans-serif', fontWeight:700 }}>ADMIN</span>}
              {profile.is_premium     && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:C.goldDim,   color:C.gold,      fontFamily:'DM Sans,sans-serif', fontWeight:700 }}>⭐ PRO</span>}
            </div>

            {profile.username && <p style={{ fontSize:13, color:C.blueLight, fontFamily:'DM Sans,sans-serif', marginBottom:8 }}>@{profile.username}</p>}
            {profile.bio      && <p style={{ fontSize:14, color:C.textMuted, fontFamily:'DM Sans,sans-serif', lineHeight:1.7, marginBottom:12, maxWidth:500 }}>{profile.bio}</p>}

            {/* Stats */}
            <div style={{ display:'flex', gap:20, marginBottom:14 }}>
              {[
                { label:'Posts',       value: posts.length },
                { label:'Connections', value: connCount },
                { label:'Followers',   value: followerCount },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize:17, fontWeight:800, color:C.text, fontFamily:'Syne,sans-serif', margin:0 }}>{s.value}</p>
                  <p style={{ fontSize:11, color:C.textDim, fontFamily:'DM Sans,sans-serif', margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.blueLight, fontFamily:'DM Sans,sans-serif', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:C.blueDim, border:`1px solid rgba(37,99,235,0.2)` }}>
                  <Globe style={{ width:12, height:12 }} /> Website
                </a>
              )}
              {profile.instagram && (
                <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#E1306C', fontFamily:'DM Sans,sans-serif', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'rgba(225,48,108,0.08)', border:'1px solid rgba(225,48,108,0.2)' }}>
                  <Instagram style={{ width:12, height:12 }} /> Instagram
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://x.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.text, fontFamily:'DM Sans,sans-serif', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:C.surface, border:`1px solid ${C.border}` }}>
                  <Twitter style={{ width:12, height:12 }} /> X
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#0A66C2', fontFamily:'DM Sans,sans-serif', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'rgba(10,102,194,0.08)', border:'1px solid rgba(10,102,194,0.2)' }}>
                  <Linkedin style={{ width:12, height:12 }} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Posts */}
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.textMuted, fontFamily:'Syne,sans-serif', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>
              Posts · {posts.length}
            </p>
            {postsWithLikes.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:C.textDim, fontFamily:'DM Sans,sans-serif', background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
                No posts yet
              </div>
            ) : (
              postsWithLikes.map(post => (
                <ProfilePostCard key={post.id} post={post} currentUserId={currentUser?.id} />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
