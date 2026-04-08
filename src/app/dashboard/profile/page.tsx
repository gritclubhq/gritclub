'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Camera, Upload, Loader2, Check, AlertCircle,
  Mail, Shield, LogOut, X, ExternalLink,
  Trash2, AlertTriangle, Eye, EyeOff
} from 'lucide-react'

const C = {
  bg:'#0B0B0C', surface:'#121214', card:'#121214',
  border:'rgba(255,255,255,0.06)', borderFocus:'rgba(255,255,255,0.12)',
  text:'#FFFFFF', textMuted:'#C7C7CC', textDim:'#C7C7CC',
  blue:'#C7C7CC', blueLight:'#C7C7CC', blueDim:'rgba(255,255,255,0.06)',
  gold:'#C7C7CC', goldDim:'rgba(199,199,204,0.08)',
  red:'#FF453A', redDim:'rgba(239,68,68,0.1)',
  green:'#32D74B', greenDim:'rgba(52,211,153,0.12)',
}

const SQL_KEYWORDS = ['select','insert','update','delete','drop','union','script','exec']
const sanitize = (s: string) => s.replace(/<[^>]*>/g,'').replace(/[<>'"`;]/g,'').slice(0,1000)
const sanitizeUsername = (raw: string) => raw.replace(/[^a-zA-Z0-9_]/g,'').slice(0,30)

function validateUsername(val: string): string | null {
  if (!val) return 'Username is required'
  if (val.length < 3) return 'At least 3 characters'
  if (val.length > 30) return 'Max 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Letters, numbers and underscores only'
  const lower = val.toLowerCase()
  for (const kw of SQL_KEYWORDS) { if (lower === kw) return `"${kw}" is not allowed` }
  return null
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────
function DeleteAccountModal({ onConfirm, onCancel, loading }: any) {
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText === 'DELETE'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)' }} onClick={onCancel} />
      <div style={{ position:'relative', width:'100%', maxWidth:440, margin:'0 16px', borderRadius:24, padding:28, background:C.card, border:`1px solid rgba(239,68,68,0.3)`, boxShadow:'0 20px 60px rgba(239,68,68,0.15)' }}>
        {/* Warning icon */}
        <div style={{ width:60, height:60, borderRadius:'50%', background:C.redDim, border:`2px solid rgba(239,68,68,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <AlertTriangle style={{ width:28, height:28, color:C.red }} />
        </div>

        <h2 style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:'Sora,sans-serif', textAlign:'center', marginBottom:10 }}>
          Delete Account
        </h2>
        <p style={{ fontSize:14, color:C.textMuted, fontFamily:'Inter,sans-serif', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>
          This will <strong style={{ color:C.red }}>permanently delete</strong> your account and all data including:
        </p>

        {/* What gets deleted */}
        <div style={{ padding:'14px 16px', borderRadius:12, background:C.redDim, border:'1px solid rgba(239,68,68,0.2)', marginBottom:20 }}>
          {['Your profile and settings','All posts, likes and comments','All connections and follows','Group memberships and messages','Tickets and event history','Any earnings or payout history'].map(item => (
            <div key={item} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0' }}>
              <X style={{ width:12, height:12, color:C.red, flexShrink:0 }} />
              <span style={{ fontSize:13, color:C.red, fontFamily:'Inter,sans-serif' }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize:13, fontWeight:600, color:C.textMuted, fontFamily:'Inter,sans-serif', marginBottom:8 }}>
          Type <strong style={{ color:C.red, letterSpacing:'0.05em' }}>DELETE</strong> to confirm:
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
          style={{ width:'100%', padding:'12px 14px', borderRadius:12, background:C.surface, border:`1px solid ${canDelete ? C.red : C.border}`, color:C.text, fontFamily:'Inter,monospace', fontSize:15, letterSpacing:'0.1em', outline:'none', boxSizing:'border-box', marginBottom:16 }}
          onFocus={e => (e.target.style.borderColor = C.red)}
          onBlur={e => (e.target.style.borderColor = canDelete ? C.red : C.border)}
        />

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', borderRadius:12, background:C.surface, color:C.textMuted, border:`1px solid ${C.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14 }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!canDelete || loading}
            style={{ flex:1, padding:'12px', borderRadius:12, background:canDelete ? C.red : C.border, color:canDelete ? '#fff' : C.textDim, border:'none', cursor:canDelete && !loading ? 'pointer' : 'not-allowed', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.7:1 }}>
            {loading ? <><Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} /> Deleting...</> : <><Trash2 style={{ width:15, height:15 }} /> Delete Forever</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sign Out Modal ────────────────────────────────────────────────────────────
function SignOutModal({ onConfirm, onCancel }: any) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }} onClick={onCancel} />
      <div style={{ position:'relative', width:'100%', maxWidth:360, margin:'0 16px', borderRadius:20, padding:24, background:C.card, border:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:C.redDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <LogOut style={{ width:20, height:20, color:C.red }} />
          </div>
          <div>
            <p style={{ fontWeight:700, color:C.text, fontFamily:'Sora,sans-serif', marginBottom:6 }}>Sign out of GritClub?</p>
            <p style={{ fontSize:13, color:C.textMuted, fontFamily:'Inter,sans-serif' }}>You'll need to sign back in to continue.</p>
          </div>
          <div style={{ display:'flex', gap:12, width:'100%' }}>
            <button onClick={onCancel} style={{ flex:1, padding:'10px', borderRadius:12, background:C.surface, color:C.textMuted, border:`1px solid ${C.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:600 }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex:1, padding:'10px', borderRadius:12, background:C.red, color:'#fff', border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:600 }}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Image Drop zone ──────────────────────────────────────────────────────────
function ImageDrop({ current, onFile, loading, rounded, label }: any) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onFile(f)
  }, [onFile])

  return (
    <div
      style={{ position:'relative', overflow:'hidden', borderRadius:rounded?'50%':16, border:`2px dashed ${drag?C.blueLight:C.border}`, background:current?'transparent':C.card, cursor:'pointer', aspectRatio:rounded?'1/1':'4/1', display:'flex', alignItems:'center', justifyContent:'center' }}
      onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={handleDrop} onClick={()=>ref.current?.click()}>
      {current && <img src={current} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:rounded?'50%':14 }} />}
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, background:current?'rgba(0,0,0,0.55)':'transparent', opacity:drag||!current?1:0, transition:'opacity 0.2s', borderRadius:rounded?'50%':14 }}
        onMouseEnter={e=>{if(current)(e.currentTarget as HTMLElement).style.opacity='1'}}
        onMouseLeave={e=>{if(current)(e.currentTarget as HTMLElement).style.opacity='0'}}>
        {loading ? <Loader2 style={{ width:18, height:18, color:'#fff', animation:'spin 1s linear infinite' }} /> : <><Upload style={{ width:16, height:16, color:'#fff' }} /><span style={{ fontSize:11, color:'#fff', fontFamily:'Inter,sans-serif' }}>{label}</span></>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f);e.target.value=''}} />
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const [user,    setUser]    = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [showSignOut,      setShowSignOut]      = useState(false)
  const [showDeleteModal,  setShowDeleteModal]  = useState(false)
  const [deleting,         setDeleting]         = useState(false)
  const [errors,           setErrors]           = useState<Record<string,string>>({})
  const [uploadingPhoto,   setUploadingPhoto]   = useState(false)

  const [fullName,   setFullName]   = useState('')
  const [username,   setUsername]   = useState('')
  const [bio,        setBio]        = useState('')
  const [instagram,  setInstagram]  = useState('')
  const [twitter,    setTwitter]    = useState('')
  const [linkedin,   setLinkedin]   = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [showEmail,  setShowEmail]  = useState(false)
  const [photoUrl,   setPhotoUrl]   = useState<string|null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const checkTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      if (prof) {
        setProfile(prof)
        setFullName(prof.full_name || u.user_metadata?.full_name || '')
        setUsername(prof.username || '')
        setBio(prof.bio || prof.profile_bio || '')
        setInstagram(prof.instagram || '')
        setTwitter(prof.twitter || '')
        setLinkedin(prof.linkedin || '')
        setWebsiteUrl(prof.website_url || '')
        setShowEmail(prof.show_email || false)
        setPhotoUrl(prof.photo_url || u.user_metadata?.avatar_url || null)
      }
      setLoading(false)
    })
  }, [])

  const handleUsernameChange = (raw: string) => {
    const s = sanitizeUsername(raw); setUsername(s); setUsernameStatus('idle')
    clearTimeout(checkTimeout.current)
    const err = validateUsername(s)
    if (err) { setErrors(p => ({ ...p, username: err })); return }
    setErrors(p => { const n = { ...p }; delete n.username; return n })
    if (s === profile?.username) { setUsernameStatus('available'); return }
    if (s.length >= 3) {
      setUsernameStatus('checking')
      checkTimeout.current = setTimeout(async () => {
        const { data } = await supabase.from('users').select('id').eq('username', s).maybeSingle()
        setUsernameStatus(data ? 'taken' : 'available')
        if (data) setErrors(p => ({ ...p, username: 'Username already taken' }))
      }, 500)
    }
  }

  const uploadImage = async (file: File, path: string) => {
    if (file.size > 5*1024*1024) { alert('Image must be under 5MB'); return null }
    const { error } = await supabase.storage.from('profile-images').upload(path, file, { upsert:true, contentType:file.type })
    if (error) { alert('Upload failed: '+error.message); return null }
    return supabase.storage.from('profile-images').getPublicUrl(path).data.publicUrl
  }

  const handlePhotoFile = async (file: File) => {
    setUploadingPhoto(true)
    const url = await uploadImage(file, `${user.id}/avatar.${file.name.split('.').pop()}`)
    if (url) setPhotoUrl(url); setUploadingPhoto(false)
  }

  const handleSave = async () => {
    if (!user) return
    const errs: Record<string,string> = {}
    const unErr = validateUsername(username); if (unErr) errs.username = unErr
    if (usernameStatus === 'taken') errs.username = 'Username already taken'
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (bio.length > 280) errs.bio = 'Max 280 characters'
    setErrors(errs); if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const updates: Record<string,any> = {
        full_name: sanitize(fullName.trim()), username: username||null,
        bio: sanitize(bio.trim()), profile_bio: sanitize(bio.trim()),
        instagram: sanitize(instagram.trim())||null, twitter: sanitize(twitter.trim())||null,
        linkedin: sanitize(linkedin.trim())||null, website_url: sanitize(websiteUrl.trim())||null,
        show_email: showEmail, updated_at: new Date().toISOString(),
      }
      if (photoUrl)  updates.photo_url  = photoUrl
      const { error } = await supabase.from('users').update(updates).eq('id', user.id)
      if (error) throw error
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err: any) { alert('Failed to save: '+err.message) }
    finally { setSaving(false) }
  }

  // ── Delete entire account ──
  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    try {
      const uid = user.id
      // Delete in order (respecting FK constraints)
      await supabase.from('post_likes').delete().eq('user_id', uid)
      await supabase.from('post_comments').delete().eq('user_id', uid)
      await supabase.from('posts').delete().eq('user_id', uid)
      await supabase.from('follows').delete().or(`follower_id.eq.${uid},following_id.eq.${uid}`)
      await supabase.from('connections').delete().or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      await supabase.from('group_members').delete().eq('user_id', uid)
      await supabase.from('group_messages').delete().eq('user_id', uid)
      await supabase.from('group_files').delete().eq('user_id', uid)
      await supabase.from('tickets').delete().eq('user_id', uid)
      await supabase.from('host_applications').delete().eq('user_id', uid)
      await supabase.from('users').delete().eq('id', uid)
      // Sign out and delete auth user
      await supabase.auth.signOut()
      // Redirect to landing
      router.push('/?deleted=true')
    } catch (err: any) {
      alert('Error deleting account: ' + err.message)
      setDeleting(false)
    }
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:C.bg }}>
        <Loader2 style={{ width:32, height:32, color:C.blueLight, animation:'spin 1s linear infinite' }} />
      </div>
    </DashboardLayout>
  )

  const inp = (err?: boolean) => ({ width:'100%', padding:'12px 14px', borderRadius:12, background:C.surface, border:`1px solid ${err?C.red:C.border}`, color:C.text, fontFamily:'Inter,sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' as const })

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {showSignOut     && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}
      {showDeleteModal && <DeleteAccountModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} loading={deleting} />}

      <div style={{ background:C.bg, minHeight:'100%' }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:C.blueLight, fontFamily:'Inter,sans-serif', marginBottom:2 }}>Account</p>
              <h1 style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:'Sora,sans-serif', letterSpacing:'-0.02em' }}>Your Profile</h1>
            </div>
            <button onClick={handleSave} disabled={saving||uploadingPhoto}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:saved?'1px solid rgba(50,215,75,0.3)':'1px solid rgba(255,255,255,0.15)', cursor:'pointer', background:saved?'rgba(50,215,75,0.1)':'transparent', color:saved?'#32D74B':'#FFFFFF', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14, opacity:(saving||uploadingPhoto)?0.5:1, transition:'all 0.2s' }}>
              {saving?<><Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} /> Saving...</>:saved?<><Check style={{ width:15, height:15 }} /> Saved!</>:'Save Changes'}
            </button>
          </div>

          {/* Avatar */}
          <div style={{ borderRadius:20, padding:20, background:C.card, border:`1px solid ${C.border}` }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textMuted, fontFamily:'Inter,sans-serif', marginBottom:16 }}>Profile Photo</p>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:`3px solid ${C.card}` }}>
                  <ImageDrop current={photoUrl} onFile={handlePhotoFile} loading={uploadingPhoto} rounded label="Photo" />
                </div>
                <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:C.blue, border:`2px solid ${C.card}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Camera style={{ width:12, height:12, color:'#fff' }} />
                </div>
              </div>
              <div>
                <p style={{ fontWeight:700, fontSize:17, color:C.text, fontFamily:'Sora,sans-serif', margin:0 }}>{fullName||'Your Name'}</p>
                {username && <p style={{ fontSize:13, color:C.blueLight, fontFamily:'Inter,sans-serif', margin:'2px 0 0' }}>@{username}</p>}
                <p style={{ fontSize:12, color:C.textMuted, fontFamily:'Inter,sans-serif', margin:'2px 0 0' }}>{user?.email}</p>
                {profile?.role && (
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:profile.role==='admin'?C.redDim:profile.role==='host'?C.goldDim:C.blueDim, color:profile.role==='admin'?C.red:profile.role==='host'?C.gold:C.blueLight, fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.08em', display:'inline-block', marginTop:4 }}>{profile.role}</span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div style={{ borderRadius:20, padding:20, background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:16 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textMuted, fontFamily:'Inter,sans-serif' }}>Basic Info</p>

            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'Inter,sans-serif' }}>Full Name</label>
              <input value={fullName} onChange={e=>setFullName(e.target.value.slice(0,80))} placeholder="Your name" maxLength={80} style={inp(!!errors.fullName)}
                onFocus={e=>(e.target.style.borderColor=C.borderFocus)} onBlur={e=>(e.target.style.borderColor=errors.fullName?C.red:C.border)} />
              {errors.fullName && <p style={{ fontSize:12, color:C.red, marginTop:4, fontFamily:'Inter,sans-serif' }}>{errors.fullName}</p>}
            </div>

            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'Inter,sans-serif' }}>Username</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14, color:C.textDim }}>@</span>
                <input value={username} onChange={e=>handleUsernameChange(e.target.value)}
                  onPaste={e=>{e.preventDefault();handleUsernameChange(sanitizeUsername(e.clipboardData.getData('text')))}}
                  placeholder="yourhandle" maxLength={30}
                  style={{ ...inp(!!errors.username), paddingLeft:32, borderColor:usernameStatus==='available'?C.green:errors.username?C.red:C.border }}
                  onFocus={e=>(e.target.style.borderColor=errors.username?C.red:C.borderFocus)}
                  onBlur={e=>(e.target.style.borderColor=usernameStatus==='available'?C.green:errors.username?C.red:C.border)} />
                <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
                  {usernameStatus==='checking'  && <Loader2 style={{ width:15, height:15, color:C.blueLight, animation:'spin 1s linear infinite' }} />}
                  {usernameStatus==='available' && <Check style={{ width:15, height:15, color:C.green }} />}
                  {usernameStatus==='taken'     && <X style={{ width:15, height:15, color:C.red }} />}
                </div>
              </div>
              {errors.username && <p style={{ fontSize:12, color:C.red, marginTop:4, fontFamily:'Inter,sans-serif' }}>{errors.username}</p>}
            </div>

            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'Inter,sans-serif' }}>Bio</label>
              <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,280))} placeholder="Tell the community who you are..." rows={3} maxLength={280}
                style={{ ...inp(!!errors.bio), resize:'none', lineHeight:1.6 }}
                onFocus={e=>(e.target.style.borderColor=C.borderFocus)} onBlur={e=>(e.target.style.borderColor=C.border)} />
              <p style={{ fontSize:11, color:C.textDim, textAlign:'right', marginTop:4, fontFamily:'Inter,sans-serif' }}>{bio.length}/280</p>
            </div>
          </div>

          {/* Social Links */}
          <div style={{ borderRadius:20, padding:20, background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:14 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textMuted, fontFamily:'Inter,sans-serif' }}>Social Links</p>
            {[
              { label:'Instagram', value:instagram, onChange:setInstagram, icon:'📸', placeholder:'@handle or https://instagram.com/...' },
              { label:'X (Twitter)', value:twitter, onChange:setTwitter, icon:'✕', placeholder:'@handle or https://x.com/...' },
              { label:'LinkedIn', value:linkedin, onChange:setLinkedin, icon:'in', placeholder:'https://linkedin.com/in/...' },
              { label:'Website / Linktree', value:websiteUrl, onChange:setWebsiteUrl, icon:'🔗', placeholder:'https://yourwebsite.com or https://linktr.ee/...' },
            ].map(field => (
              <div key={field.label}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textMuted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'Inter,sans-serif' }}>{field.label}</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:13 }}>{field.icon}</span>
                  <input value={field.value} onChange={e=>field.onChange(sanitize(e.target.value))} placeholder={field.placeholder} maxLength={300}
                    style={{ ...inp(), paddingLeft:38 }}
                    onFocus={e=>(e.target.style.borderColor=C.borderFocus)} onBlur={e=>(e.target.style.borderColor=C.border)} />
                  {field.value && field.value.startsWith('http') && (
                    <a href={field.value} target="_blank" rel="noopener noreferrer" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
                      <ExternalLink style={{ width:14, height:14, color:C.textDim }} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Privacy */}
          <div style={{ borderRadius:20, padding:20, background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textMuted, fontFamily:'Inter,sans-serif' }}>Privacy</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:12, background:C.surface, border:`1px solid ${showEmail?'rgba(59,130,246,0.25)':C.border}`, cursor:'pointer' }}
              onClick={() => setShowEmail(!showEmail)}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Mail style={{ width:15, height:15, color:showEmail?C.red:C.textDim }} />
                <span style={{ fontSize:13, color:C.text, fontFamily:'Inter,sans-serif' }}>Show Email on Profile</span>
              </div>
              <div style={{ width:40, height:22, borderRadius:11, background:showEmail?C.red:C.border, position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                <div style={{ position:'absolute', top:2, width:18, height:18, borderRadius:'50%', background:'#fff', left:showEmail?20:2, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>

          {/* Account & Danger Zone */}
          <div style={{ borderRadius:20, padding:20, background:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textMuted, fontFamily:'Inter,sans-serif' }}>Account</p>

            {/* Email */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:C.surface, border:`1px solid ${C.border}` }}>
              <Mail style={{ width:15, height:15, color:C.textDim }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:11, color:C.textDim, fontFamily:'Inter,sans-serif' }}>Email</p>
                <p style={{ fontSize:13, color:C.textMuted, fontFamily:'Inter,sans-serif' }}>{user?.email}</p>
              </div>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:C.greenDim, color:C.green, fontFamily:'Inter,sans-serif', fontWeight:600 }}>Verified</span>
            </div>

            {/* Plan */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:C.surface, border:`1px solid ${C.border}` }}>
              <Shield style={{ width:15, height:15, color:profile?.is_premium?C.gold:C.textDim }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:11, color:C.textDim, fontFamily:'Inter,sans-serif' }}>Plan</p>
                <p style={{ fontSize:13, color:C.textMuted, fontFamily:'Inter,sans-serif' }}>{profile?.is_premium?'⭐ Premium':'Free plan'}</p>
              </div>
              {!profile?.is_premium && <a href="/pricing" style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:C.goldDim, color:C.gold, fontFamily:'Inter,sans-serif', fontWeight:600, textDecoration:'none' }}>Upgrade</a>}
            </div>

            {/* Sign Out — in profile now */}
            <button onClick={() => setShowSignOut(true)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:'transparent', border:`1px solid ${C.border}`, cursor:'pointer', color:C.textMuted, fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:14 }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.surface}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
              <LogOut style={{ width:15, height:15 }} /> Sign Out
            </button>
          </div>

          {/* Danger Zone */}
          <div style={{ borderRadius:20, padding:20, background:'rgba(239,68,68,0.04)', border:`1px solid rgba(239,68,68,0.2)`, display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, fontFamily:'Inter,sans-serif', marginBottom:4 }}>⚠️ Danger Zone</p>
              <p style={{ fontSize:13, color:C.textMuted, fontFamily:'Inter,sans-serif', lineHeight:1.6 }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button onClick={() => setShowDeleteModal(true)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:C.redDim, border:`1px solid rgba(239,68,68,0.3)`, cursor:'pointer', color:C.red, fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:14 }}>
              <Trash2 style={{ width:16, height:16 }} /> Delete My Account
            </button>
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving||uploadingPhoto}
            style={{ width:'100%', padding:'14px', borderRadius:14, border:saved?'1px solid rgba(50,215,75,0.3)':'1px solid rgba(255,255,255,0.12)', cursor:'pointer', background:saved?'rgba(50,215,75,0.1)':'rgba(255,255,255,0.06)', color:saved?'#32D74B':'#FFFFFF', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:saving?0.5:1, transition:'all 0.2s' }}>
            {saving?<><Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }} /> Saving...</>:saved?<><Check style={{ width:16, height:16 }} /> Saved!</>:'Save Profile'}
          </button>

        </div>
      </div>
    </DashboardLayout>
  )
}
