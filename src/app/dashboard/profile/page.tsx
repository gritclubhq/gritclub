'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Camera, Upload, Save, Loader2, Check, AlertCircle,
  Mail, Phone, Eye, EyeOff, Link2, User, AtSign,
  FileText, Globe, Shield, LogOut, X, ExternalLink,
  Instagram, Twitter, Linkedin
} from 'lucide-react'

const C = {
  bg:'#0A0F1E', surface:'#0D1428', card:'#111827',
  border:'rgba(255,255,255,0.06)', borderFocus:'rgba(37,99,235,0.5)',
  text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E',
  blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)',
  gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)',
  red:'#EF4444', redDim:'rgba(239,68,68,0.1)',
  green:'#10B981', greenDim:'rgba(16,185,129,0.1)',
}

// Security helpers
const SQL_KEYWORDS = ['select','insert','update','delete','drop','union','script','exec']
const sanitizeText = (s: string) => s.replace(/<[^>]*>/g, '').replace(/[<>'"`;]/g, '').slice(0, 1000)
const sanitizeUsername = (raw: string) => raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)

function validateUsername(val: string): string | null {
  if (!val) return 'Username is required'
  if (val.length < 3) return 'At least 3 characters'
  if (val.length > 30) return 'Max 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Letters, numbers and underscores only'
  // Only block if the ENTIRE username is a SQL keyword — not if it contains one
  const lower = val.toLowerCase()
  for (const kw of SQL_KEYWORDS) {
    if (lower === kw) return `"${kw}" is not allowed as a username`
  }
  return null
}

function validateUrl(val: string): string | null {
  if (!val) return null
  if (val.length > 300) return 'URL too long'
  if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('@')) {
    return 'Must start with https:// or @handle'
  }
  return null
}

function ImageDrop({ current, onFile, loading, rounded, label }: {
  current: string | null; onFile: (f: File) => void; loading: boolean
  rounded?: boolean; label: string
}) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) onFile(f)
  }, [onFile])

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: rounded ? '50%' : 16,
        border: `2px dashed ${drag ? C.blueLight : C.border}`,
        background: current ? 'transparent' : C.card,
        cursor: 'pointer', aspectRatio: rounded ? '1/1' : '4/1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
    >
      {current && <img src={current} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: rounded ? '50%' : 14 }} />}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          background: current ? 'rgba(0,0,0,0.55)' : 'transparent',
          opacity: drag || !current ? 1 : 0, transition: 'opacity 0.2s',
          borderRadius: rounded ? '50%' : 14,
        }}
        onMouseEnter={e => { if (current) (e.currentTarget as HTMLElement).style.opacity = '1' }}
        onMouseLeave={e => { if (current) (e.currentTarget as HTMLElement).style.opacity = '0' }}
      >
        {loading
          ? <Loader2 style={{ width: 18, height: 18, color: '#fff', animation: 'spin 1s linear infinite' }} />
          : <><Upload style={{ width: 16, height: 16, color: '#fff' }} /><span style={{ fontSize: 11, color: '#fff', fontFamily: 'DM Sans,sans-serif' }}>{label}</span></>
        }
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
    </div>
  )
}

function Toggle({ label, desc, value, onChange, icon: Icon, color = C.green }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 16px', borderRadius: 14, background: C.surface, border: `1px solid ${value ? color+'30' : C.border}`, cursor: 'pointer' }}
      onClick={() => onChange(!value)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {Icon && <div style={{ width: 32, height: 32, borderRadius: 10, background: value ? color+'15' : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 15, height: 15, color: value ? color : C.textDim }} />
        </div>}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>{label}</p>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{desc}</p>
        </div>
      </div>
      <div style={{ width: 42, height: 24, borderRadius: 12, background: value ? color : C.border, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', left: value ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  )
}

function SignOutModal({ onConfirm, onCancel }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, margin: '0 16px', borderRadius: 20, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut style={{ width: 20, height: 20, color: C.red }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>Sign out of GritClub?</p>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>You'll need to sign back in to access your account.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 12, background: C.surface, color: C.textMuted, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 12, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [fullName,  setFullName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [bio,       setBio]       = useState('')
  const [instagram, setInstagram] = useState('')
  const [twitter,   setTwitter]   = useState('')
  const [linkedin,  setLinkedin]  = useState('')
  const [websiteUrl,setWebsiteUrl]= useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const checkTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      if (prof) {
        setProfile(prof)
        setFullName(prof.full_name   || u.user_metadata?.full_name || '')
        setUsername(prof.username    || '')
        // Support both 'bio' and 'profile_bio' columns
        setBio(prof.bio || prof.profile_bio || '')
        setInstagram(prof.instagram  || '')
        setTwitter(prof.twitter      || '')
        setLinkedin(prof.linkedin    || '')
        setWebsiteUrl(prof.website_url || '')
        setShowEmail(prof.show_email || false)
        setShowPhone(prof.show_phone || false)
        setPhotoUrl(prof.photo_url   || u.user_metadata?.avatar_url || null)
        setBannerUrl(prof.banner_url || null)
      }
      setLoading(false)
    })
  }, [])

  const handleUsernameChange = (raw: string) => {
    const sanitized = sanitizeUsername(raw)
    setUsername(sanitized)
    setUsernameStatus('idle')
    clearTimeout(checkTimeout.current)
    const err = validateUsername(sanitized)
    if (err) { setErrors(p => ({ ...p, username: err })); return }
    setErrors(p => { const n = { ...p }; delete n.username; return n })
    if (sanitized === profile?.username) { setUsernameStatus('available'); return }
    if (sanitized.length >= 3) {
      setUsernameStatus('checking')
      checkTimeout.current = setTimeout(async () => {
        const { data } = await supabase.from('users').select('id').eq('username', sanitized).maybeSingle()
        setUsernameStatus(data ? 'taken' : 'available')
        if (data) setErrors(p => ({ ...p, username: 'Username already taken' }))
      }, 500)
    }
  }

  const uploadImage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return null }
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
    if (error) { console.error('Upload error:', error); alert('Upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleBannerFile = async (file: File) => {
    setUploadingBanner(true)
    const url = await uploadImage(file, 'profile-images', `${user.id}/banner.${file.name.split('.').pop()}`)
    if (url) setBannerUrl(url)
    setUploadingBanner(false)
  }

  const handlePhotoFile = async (file: File) => {
    setUploadingPhoto(true)
    const url = await uploadImage(file, 'profile-images', `${user.id}/avatar.${file.name.split('.').pop()}`)
    if (url) setPhotoUrl(url)
    setUploadingPhoto(false)
  }

  const handleSave = async () => {
    if (!user) return
    // Validate
    const newErrors: Record<string, string> = {}
    const unErr = validateUsername(username)
    if (unErr) newErrors.username = unErr
    if (usernameStatus === 'taken') newErrors.username = 'Username already taken'
    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (bio.length > 280) newErrors.bio = 'Max 280 characters'
    const urlErr = validateUrl(websiteUrl)
    if (urlErr) newErrors.websiteUrl = urlErr
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    if (usernameStatus === 'checking') return

    setSaving(true)
    try {
      // Build update object — include ALL possible column names for bio
      const updates: Record<string, any> = {
        full_name:   sanitizeText(fullName.trim()),
        username:    username || null,
        bio:         sanitizeText(bio.trim()),        // new column
        profile_bio: sanitizeText(bio.trim()),        // old column (backward compat)
        instagram:   sanitizeText(instagram.trim()) || null,
        twitter:     sanitizeText(twitter.trim())   || null,
        linkedin:    sanitizeText(linkedin.trim())   || null,
        website_url: sanitizeText(websiteUrl.trim()) || null,
        show_email:  showEmail,
        show_phone:  showPhone,
        updated_at:  new Date().toISOString(),
      }
      if (photoUrl)  updates.photo_url  = photoUrl
      if (bannerUrl) updates.banner_url = bannerUrl

      const { error } = await supabase.from('users').update(updates).eq('id', user.id)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <Loader2 style={{ width: 32, height: 32, color: C.blueLight, animation: 'spin 1s linear infinite' }} />
      </div>
    </DashboardLayout>
  )

  const initials = (fullName || user?.email || 'U').slice(0, 2).toUpperCase()

  const inputStyle = (hasError?: boolean) => ({
    width: '100%', padding: '12px 14px', borderRadius: 12,
    background: C.surface, border: `1px solid ${hasError ? C.red : C.border}`,
    color: C.text, fontFamily: 'DM Sans,sans-serif', fontSize: 14, outline: 'none',
  })

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.blueLight, fontFamily: 'DM Sans,sans-serif', marginBottom: 2 }}>Account</p>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>Your Profile</h1>
            </div>
            <button onClick={handleSave} disabled={saving || uploadingBanner || uploadingPhoto}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: saved ? C.green : C.blue, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, opacity: (saving||uploadingBanner||uploadingPhoto) ? 0.6 : 1 }}>
              {saving ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving...</> : saved ? <><Check style={{ width: 16, height: 16 }} /> Saved!</> : <><Save style={{ width: 16, height: 16 }} /> Save Changes</>}
            </button>
          </div>

          {/* Banner + Avatar */}
          <div style={{ borderRadius: 20, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{ aspectRatio: '4/1', minHeight: 100 }}>
              <ImageDrop current={bannerUrl} onFile={handleBannerFile} loading={uploadingBanner} label="Upload Banner" />
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 12 }}>
                <div style={{ position: 'relative', width: 72, height: 72 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.card}` }}>
                    <ImageDrop current={photoUrl} onFile={handlePhotoFile} loading={uploadingPhoto} rounded label="Photo" />
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: C.blue, border: `2px solid ${C.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera style={{ width: 12, height: 12, color: '#fff' }} />
                  </div>
                </div>
                {profile?.role && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: profile.role==='admin' ? C.redDim : profile.role==='host' ? C.goldDim : C.blueDim, color: profile.role==='admin' ? C.red : profile.role==='host' ? C.gold : C.blueLight, fontFamily: 'DM Sans,sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {profile.role}
                  </span>
                )}
              </div>
              <p style={{ fontWeight: 700, fontSize: 17, color: C.text, fontFamily: 'Syne,sans-serif' }}>{fullName || 'Your Name'}</p>
              {username && <p style={{ fontSize: 13, color: C.blueLight, fontFamily: 'DM Sans,sans-serif' }}>@{username}</p>}
              <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginTop: 2 }}>{user?.email}</p>
            </div>
          </div>

          {/* Basic Info */}
          <div style={{ borderRadius: 20, padding: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Basic Info</p>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans,sans-serif' }}>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value.slice(0,80))} placeholder="Jake Harris" maxLength={80} style={inputStyle(!!errors.fullName)}
                onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = errors.fullName ? C.red : C.border)} />
              {errors.fullName && <p style={{ fontSize: 12, color: C.red, marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>{errors.fullName}</p>}
            </div>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans,sans-serif' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>@</span>
                <input value={username} onChange={e => handleUsernameChange(e.target.value)}
                  onPaste={e => { e.preventDefault(); handleUsernameChange(sanitizeUsername(e.clipboardData.getData('text'))) }}
                  placeholder="yourhandle" maxLength={30}
                  style={{ ...inputStyle(!!errors.username), paddingLeft: 32, borderColor: usernameStatus === 'available' ? C.green : errors.username ? C.red : C.border }}
                  onFocus={e => (e.target.style.borderColor = errors.username ? C.red : C.borderFocus)}
                  onBlur={e => (e.target.style.borderColor = usernameStatus==='available' ? C.green : errors.username ? C.red : C.border)} />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  {usernameStatus==='checking'  && <Loader2 style={{ width: 16, height: 16, color: C.blueLight, animation: 'spin 1s linear infinite' }} />}
                  {usernameStatus==='available' && <Check style={{ width: 16, height: 16, color: C.green }} />}
                  {usernameStatus==='taken'     && <X style={{ width: 16, height: 16, color: C.red }} />}
                </div>
              </div>
              {errors.username && <p style={{ fontSize: 12, color: C.red, marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>{errors.username}</p>}
              {usernameStatus==='available' && !errors.username && <p style={{ fontSize: 12, color: C.green, marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>@{username} is available</p>}
              {!errors.username && usernameStatus==='idle' && <p style={{ fontSize: 12, color: C.textDim, marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>3–30 chars · letters, numbers, underscores</p>}
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans,sans-serif' }}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value.slice(0,280))} placeholder="Tell the community who you are and what you're building..." rows={3} maxLength={280}
                style={{ ...inputStyle(!!errors.bio), resize: 'none', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
              <p style={{ fontSize: 11, color: C.textDim, textAlign: 'right', marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>{bio.length}/280</p>
            </div>
          </div>

          {/* Social Links */}
          <div style={{ borderRadius: 20, padding: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Social Links</p>
            {[
              { label: 'Instagram', value: instagram, onChange: setInstagram, icon: '📸', color: '#E1306C', placeholder: '@handle or https://instagram.com/...' },
              { label: 'X (Twitter)', value: twitter, onChange: setTwitter, icon: '✕', color: '#1DA1F2', placeholder: '@handle or https://x.com/...' },
              { label: 'LinkedIn', value: linkedin, onChange: setLinkedin, icon: 'in', color: '#0A66C2', placeholder: 'https://linkedin.com/in/...' },
              { label: 'Website / Linktree', value: websiteUrl, onChange: setWebsiteUrl, icon: '🔗', color: C.blueLight, placeholder: 'https://yourwebsite.com or https://linktr.ee/...' },
            ].map(field => (
              <div key={field.label}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans,sans-serif' }}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: field.color, fontFamily: 'DM Mono,monospace' }}>{field.icon}</span>
                  <input value={field.value} onChange={e => { field.onChange(sanitizeText(e.target.value)) }} placeholder={field.placeholder} maxLength={300}
                    style={{ ...inputStyle(), paddingLeft: 38 }}
                    onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
                  {field.value && (
                    <a href={field.value.startsWith('http') ? field.value : '#'} target="_blank" rel="noopener noreferrer"
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
                      onClick={e => !field.value.startsWith('http') && e.preventDefault()}>
                      <ExternalLink style={{ width: 14, height: 14, color: C.textDim }} />
                    </a>
                  )}
                </div>
                {errors[field.label] && <p style={{ fontSize: 12, color: C.red, marginTop: 4, fontFamily: 'DM Sans,sans-serif' }}>{errors[field.label]}</p>}
              </div>
            ))}
          </div>

          {/* Privacy toggles */}
          <div style={{ borderRadius: 20, padding: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Privacy</p>
            <Toggle label="Show Email" desc="Others can see your email on your profile" value={showEmail} onChange={setShowEmail} icon={Mail} color={C.blueLight} />
            <Toggle label="Show Phone" desc="Others can see your phone number on your profile" value={showPhone} onChange={setShowPhone} icon={Phone} color={C.green} />
          </div>

          {/* Account */}
          <div style={{ borderRadius: 20, padding: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>Account</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
              <Mail style={{ width: 16, height: 16, color: C.textDim, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', marginBottom: 2 }}>Email</p>
                <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{user?.email}</p>
              </div>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: C.greenDim, color: C.green, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>Verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
              <Shield style={{ width: 16, height: 16, color: profile?.is_premium ? C.gold : C.textDim, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', marginBottom: 2 }}>Plan</p>
                <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>
                  {profile?.is_premium ? '⭐ Premium — Recordings unlocked' : 'Free plan'}
                </p>
              </div>
              {!profile?.is_premium && (
                <a href="/pricing" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: C.goldDim, color: C.gold, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, textDecoration: 'none' }}>Upgrade</a>
              )}
            </div>
            <button onClick={() => setShowSignOut(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: C.redDim, border: `1px solid rgba(239,68,68,0.2)`, cursor: 'pointer', color: C.red, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 14 }}>
              <LogOut style={{ width: 16, height: 16 }} /> Sign Out
            </button>
          </div>

          {/* Bottom save */}
          <button onClick={handleSave} disabled={saving || uploadingBanner || uploadingPhoto}
            style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: saved ? C.green : C.blue, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving...</> : saved ? <><Check style={{ width: 16, height: 16 }} /> Saved!</> : 'Save Profile'}
          </button>

        </div>
      </div>
    </DashboardLayout>
  )
}
