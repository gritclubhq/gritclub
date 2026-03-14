'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Camera, Upload, Save, Loader2, Check, AlertCircle,
  Instagram, Twitter, Linkedin, Mail, Phone, Eye, EyeOff,
  Link2, User, AtSign, FileText, Globe, Shield, LogOut,
  X, ExternalLink
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#0A0F1E',
  surface:    '#0D1428',
  card:       '#111827',
  border:     'rgba(255,255,255,0.06)',
  borderFocus:'rgba(37,99,235,0.5)',
  text:       '#F0F4FF',
  textMuted:  '#7B8DB0',
  textDim:    '#3D4F6E',
  blue:       '#2563EB',
  blueLight:  '#3B82F6',
  blueDim:    'rgba(37,99,235,0.12)',
  gold:       '#F59E0B',
  goldDim:    'rgba(245,158,11,0.1)',
  red:        '#EF4444',
  redDim:     'rgba(239,68,68,0.1)',
  green:      '#10B981',
  greenDim:   'rgba(16,185,129,0.1)',
}

// ─── Security helpers ─────────────────────────────────────────────────────────
const SQL_KEYWORDS = ['select','insert','update','delete','drop','union','script','exec','cast']

function sanitizeUsername(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
}

function validateUsername(val: string): string | null {
  if (!val) return 'Username is required'
  if (val.length < 3) return 'At least 3 characters'
  if (val.length > 30) return 'Max 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Letters, numbers and underscores only'
  const lower = val.toLowerCase()
  for (const kw of SQL_KEYWORDS) {
    if (lower.includes(kw)) return `"${kw}" is not allowed`
  }
  return null
}

function sanitizeText(raw: string): string {
  // Strip HTML tags and dangerous chars
  return raw.replace(/<[^>]*>/g, '').replace(/[<>'"`;]/g, '').slice(0, 1000)
}

function validateUrl(val: string): string | null {
  if (!val) return null
  if (val.length > 200) return 'URL too long'
  if (!/^https?:\/\/.+/.test(val) && !val.startsWith('@')) return 'Must start with https:// or @'
  return null
}

// ─── Image upload dropzone ────────────────────────────────────────────────────
function ImageDropZone({
  current, onFile, loading, rounded = false, aspectRatio = '16/5', label
}: {
  current: string | null
  onFile:  (f: File) => void
  loading: boolean
  rounded?: boolean
  aspectRatio?: string
  label: string
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }, [onFile])

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center cursor-pointer transition-all group ${rounded ? 'rounded-full' : 'rounded-xl'}`}
      style={{
        aspectRatio,
        border: `2px dashed ${dragging ? C.blueLight : C.border}`,
        background: current ? 'transparent' : C.card,
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {current && (
        <img
          src={current}
          alt={label}
          className={`w-full h-full object-cover ${rounded ? 'rounded-full' : ''}`}
        />
      )}

      {/* Overlay */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-opacity ${rounded ? 'rounded-full' : ''}`}
        style={{ background: current ? 'rgba(0,0,0,0.55)' : 'transparent', opacity: dragging || !current ? 1 : 0 }}
        // Show overlay on hover too
        onMouseEnter={e => { if (current) (e.currentTarget as HTMLElement).style.opacity = '1' }}
        onMouseLeave={e => { if (current) (e.currentTarget as HTMLElement).style.opacity = '0' }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <>
            <Upload className="w-5 h-5 text-white" />
            <span className="text-xs font-medium text-white">{label}</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, prefix, icon: Icon,
  error, hint, maxLength, type = 'text', multiline = false, rows = 3
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; prefix?: string; icon?: any
  error?: string | null; hint?: string; maxLength?: number
  type?: string; multiline?: boolean; rows?: number
}) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? C.red : focused ? C.blueLight : C.border

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
        {label}
      </label>
      <div
        className="flex items-start rounded-xl overflow-hidden transition-all"
        style={{ border: `1px solid ${borderColor}`, background: C.card }}
      >
        {Icon && (
          <div className="pl-3 pt-3 flex-shrink-0">
            <Icon className="w-4 h-4" style={{ color: C.textDim }} />
          </div>
        )}
        {prefix && (
          <span className="pl-3 pt-3 text-sm flex-shrink-0" style={{ color: C.textDim }}>{prefix}</span>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            className="flex-1 px-3 py-3 bg-transparent text-sm outline-none resize-none leading-relaxed"
            style={{ color: C.text }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="flex-1 px-3 py-3 bg-transparent text-sm outline-none"
            style={{ color: C.text }}
            autoComplete="off"
            spellCheck={false}
          />
        )}
        {maxLength && (
          <span className="pr-3 pt-3 text-xs flex-shrink-0" style={{ color: C.textDim }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: C.textDim }}>{hint}</p>
      )}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({
  label, description, value, onChange, icon: Icon, color = C.green
}: {
  label: string; description: string; value: boolean
  onChange: (v: boolean) => void; icon?: any; color?: string
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-xl transition-all cursor-pointer"
      style={{ background: C.card, border: `1px solid ${value ? color + '30' : C.border}` }}
      onClick={() => onChange(!value)}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: value ? color + '15' : C.border }}>
            <Icon className="w-4 h-4" style={{ color: value ? color : C.textDim }} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: C.text }}>{label}</p>
          <p className="text-xs" style={{ color: C.textMuted }}>{description}</p>
        </div>
      </div>
      {/* Toggle pill */}
      <div
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all"
        style={{ background: value ? color : C.border }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-md"
          style={{ background: '#fff', left: value ? '22px' : '2px' }}
        />
      </div>
    </div>
  )
}

// ─── Sign-out modal ───────────────────────────────────────────────────────────
function SignOutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: C.redDim }}>
            <LogOut className="w-5 h-5" style={{ color: C.red }} />
          </div>
          <div>
            <h2 className="font-bold mb-1" style={{ color: C.text }}>Sign out of GritClub?</h2>
            <p className="text-sm" style={{ color: C.textMuted }}>You'll need to sign back in to access your account.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: C.surface, color: C.textMuted, border: `1px solid ${C.border}` }}>
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: C.red, color: '#fff' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    admin:    { bg: C.redDim,    color: C.red,       label: 'Admin',   icon: '🛡' },
    host:     { bg: C.goldDim,   color: C.gold,      label: 'Host',    icon: '⚡' },
    audience: { bg: C.blueDim,   color: C.blueLight, label: 'Member',  icon: '🧠' },
  }
  const s = map[role] || map.audience
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
      style={{ background: s.bg, color: s.color }}>
      {s.icon} {s.label}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [user,         setUser]         = useState<any>(null)
  const [profile,      setProfile]      = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [showSignOut,  setShowSignOut]  = useState(false)
  const [errors,       setErrors]       = useState<Record<string, string>>({})
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false)

  // Form state
  const [fullName,    setFullName]    = useState('')
  const [username,    setUsername]    = useState('')
  const [bio,         setBio]         = useState('')
  const [instagram,   setInstagram]   = useState('')
  const [twitter,     setTwitter]     = useState('')
  const [linkedin,    setLinkedin]    = useState('')
  const [showEmail,   setShowEmail]   = useState(false)
  const [showPhone,   setShowPhone]   = useState(false)
  const [photoUrl,    setPhotoUrl]    = useState<string | null>(null)
  const [bannerUrl,   setBannerUrl]   = useState<string | null>(null)

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const checkTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      if (prof) {
        setProfile(prof)
        setFullName(prof.full_name   || u.user_metadata?.full_name || '')
        setUsername(prof.username    || '')
        setBio(prof.bio              || prof.profile_bio || '')
        setInstagram(prof.instagram  || '')
        setTwitter(prof.twitter      || '')
        setLinkedin(prof.linkedin    || '')
        setShowEmail(prof.show_email || false)
        setShowPhone(prof.show_phone || false)
        setPhotoUrl(prof.photo_url   || u.user_metadata?.avatar_url || null)
        setBannerUrl(prof.banner_url || null)
      }
      setLoading(false)
    })
  }, [])

  // Username change — sanitize + check availability
  const handleUsernameChange = (raw: string) => {
    const sanitized = sanitizeUsername(raw)
    setUsername(sanitized)
    setUsernameStatus('idle')
    clearTimeout(checkTimeout.current)
    const err = validateUsername(sanitized)
    if (err) { setErrors(prev => ({ ...prev, username: err })); return }
    setErrors(prev => { const n = { ...prev }; delete n.username; return n })
    if (sanitized === profile?.username) { setUsernameStatus('available'); return }
    if (sanitized.length >= 3) {
      setUsernameStatus('checking')
      checkTimeout.current = setTimeout(async () => {
        const { data } = await supabase.from('users').select('id').eq('username', sanitized).maybeSingle()
        setUsernameStatus(data ? 'taken' : 'available')
        if (data) setErrors(prev => ({ ...prev, username: 'Username already taken' }))
      }, 500)
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return null }
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
    if (error) { console.error('Upload error:', error); return null }
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

  // Validate all fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    const unErr = validateUsername(username)
    if (unErr) newErrors.username = unErr
    if (usernameStatus === 'taken') newErrors.username = 'Username already taken'
    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (fullName.trim().length > 80) newErrors.fullName = 'Max 80 characters'
    if (bio.length > 280) newErrors.bio = 'Max 280 characters'
    const igErr = validateUrl(instagram)
    if (igErr) newErrors.instagram = igErr
    const twErr = validateUrl(twitter)
    if (twErr) newErrors.twitter = twErr
    const liErr = validateUrl(linkedin)
    if (liErr) newErrors.linkedin = liErr
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    if (usernameStatus === 'checking') return
    setSaving(true)

    try {
      // Sanitize all text inputs before saving — parameterized update, no raw SQL
      const updates = {
        full_name:   sanitizeText(fullName.trim()),
        username:    username,
        bio:         sanitizeText(bio.trim()),
        profile_bio: sanitizeText(bio.trim()),
        instagram:   sanitizeText(instagram.trim()),
        twitter:     sanitizeText(twitter.trim()),
        linkedin:    sanitizeText(linkedin.trim()),
        show_email:  showEmail,
        show_phone:  showPhone,
        photo_url:   photoUrl,
        banner_url:  bannerUrl,
        updated_at:  new Date().toISOString(),
      }

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
    window.location.href = '/'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-full flex items-center justify-center" style={{ background: C.bg }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blueLight }} />
        </div>
      </DashboardLayout>
    )
  }

  const avatarColor = ['#2563EB','#7C3AED','#DB2777','#D97706'][(user?.id?.charCodeAt(0) || 0) % 4]
  const initials = (fullName || user?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <DashboardLayout>
      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.blueLight }}>Account</p>
              <h1 className="text-2xl font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
                Your Profile
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || uploadingBanner || uploadingPhoto}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: saved ? C.green : C.blue, color: '#fff' }}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>

          {/* ── Banner + Avatar ── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {/* Banner */}
            <div style={{ aspectRatio: '4/1', minHeight: 120, position: 'relative' }}>
              <ImageDropZone
                current={bannerUrl}
                onFile={handleBannerFile}
                loading={uploadingBanner}
                aspectRatio="4/1"
                label="Upload Banner"
              />
            </div>

            {/* Avatar + name row */}
            <div className="px-6 pb-5">
              <div className="flex items-end justify-between gap-4 -mt-10 mb-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-4" style={{ ringColor: C.card }}>
                    <ImageDropZone
                      current={photoUrl}
                      onFile={handlePhotoFile}
                      loading={uploadingPhoto}
                      rounded
                      aspectRatio="1/1"
                      label="Photo"
                    />
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: C.blue, border: `2px solid ${C.card}` }}
                  >
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Role badge */}
                {profile?.role && <RoleBadge role={profile.role} />}
              </div>

              <p className="text-lg font-bold" style={{ color: C.text }}>{fullName || 'Your Name'}</p>
              {username && <p className="text-sm" style={{ color: C.blueLight }}>@{username}</p>}
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* ── Basic info ── */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4" style={{ color: C.blueLight }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.text }}>Basic Info</h2>
            </div>

            <Field
              label="Full Name"
              value={fullName}
              onChange={v => { setFullName(v); setErrors(p => { const n = { ...p }; delete n.fullName; return n }) }}
              placeholder="Jake Harris"
              icon={User}
              error={errors.fullName}
              maxLength={80}
            />

            {/* Username with availability */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                Username
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden transition-all"
                style={{ border: `1px solid ${errors.username ? C.red : usernameStatus === 'available' ? C.green : C.border}`, background: C.surface }}
              >
                <AtSign className="ml-3 w-4 h-4 flex-shrink-0" style={{ color: C.textDim }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  onPaste={e => { e.preventDefault(); handleUsernameChange(sanitizeUsername(e.clipboardData.getData('text'))) }}
                  placeholder="yourhandle"
                  maxLength={30}
                  className="flex-1 px-2 py-3 bg-transparent text-sm outline-none"
                  style={{ color: C.text }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="pr-3">
                  {usernameStatus === 'checking'  && <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.blueLight }} />}
                  {usernameStatus === 'available' && <Check className="w-4 h-4" style={{ color: C.green }} />}
                  {usernameStatus === 'taken'     && <X className="w-4 h-4" style={{ color: C.red }} />}
                </div>
              </div>
              {errors.username && (
                <p className="flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
                  <AlertCircle className="w-3 h-3" /> {errors.username}
                </p>
              )}
              {usernameStatus === 'available' && !errors.username && (
                <p className="text-xs" style={{ color: C.green }}>@{username} is available</p>
              )}
              {!errors.username && usernameStatus === 'idle' && (
                <p className="text-xs" style={{ color: C.textDim }}>3–30 chars · letters, numbers, underscores only</p>
              )}
            </div>

            <Field
              label="Bio"
              value={bio}
              onChange={v => { setBio(v); setErrors(p => { const n = { ...p }; delete n.bio; return n }) }}
              placeholder="Tell the community who you are and what you're building..."
              icon={FileText}
              error={errors.bio}
              maxLength={280}
              multiline
              rows={3}
            />
          </div>

          {/* ── Social links ── */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4" style={{ color: C.gold }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.text }}>Social Links</h2>
            </div>

            {[
              {
                label: 'Instagram',
                value: instagram,
                onChange: setInstagram,
                placeholder: '@yourhandle or https://instagram.com/...',
                icon: Instagram,
                error: errors.instagram,
                color: '#E1306C',
              },
              {
                label: 'X (Twitter)',
                value: twitter,
                onChange: setTwitter,
                placeholder: '@yourhandle or https://x.com/...',
                icon: Twitter,
                error: errors.twitter,
                color: '#1DA1F2',
              },
              {
                label: 'LinkedIn',
                value: linkedin,
                onChange: setLinkedin,
                placeholder: 'https://linkedin.com/in/yourprofile',
                icon: Linkedin,
                error: errors.linkedin,
                color: '#0A66C2',
              },
            ].map(field => (
              <div key={field.label} className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                  {field.label}
                </label>
                <div
                  className="flex items-center rounded-xl overflow-hidden transition-all"
                  style={{ border: `1px solid ${field.error ? C.red : C.border}`, background: C.surface }}
                >
                  <field.icon className="ml-3 w-4 h-4 flex-shrink-0" style={{ color: field.color }} />
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => { field.onChange(sanitizeText(e.target.value)); setErrors(p => { const n = { ...p }; delete n[field.label.toLowerCase()]; return n }) }}
                    placeholder={field.placeholder}
                    maxLength={200}
                    className="flex-1 px-3 py-3 bg-transparent text-sm outline-none"
                    style={{ color: C.text }}
                    autoComplete="off"
                  />
                  {field.value && !field.error && (
                    <a
                      href={field.value.startsWith('http') ? field.value : `https://instagram.com/${field.value.replace('@','')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pr-3"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: C.textDim }} />
                    </a>
                  )}
                </div>
                {field.error && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
                    <AlertCircle className="w-3 h-3" /> {field.error}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Privacy ── */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" style={{ color: C.blueLight }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.text }}>Privacy</h2>
            </div>

            <Toggle
              label="Show Email"
              description="Other members can see your email address on your profile"
              value={showEmail}
              onChange={setShowEmail}
              icon={Mail}
              color={C.blueLight}
            />

            <Toggle
              label="Show Phone"
              description="Other members can see your phone number on your profile"
              value={showPhone}
              onChange={setShowPhone}
              icon={Phone}
              color={C.green}
            />
          </div>

          {/* ── Account ── */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4" style={{ color: C.textMuted }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.text }}>Account</h2>
            </div>

            {/* Email (read-only) */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: C.textDim }} />
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>Email</p>
                <p className="text-sm" style={{ color: C.textMuted }}>{user?.email}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.greenDim, color: C.green }}>Verified</span>
            </div>

            {/* Premium status */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Shield className="w-4 h-4 flex-shrink-0" style={{ color: profile?.is_premium ? C.gold : C.textDim }} />
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>Plan</p>
                <p className="text-sm" style={{ color: C.textMuted }}>
                  {profile?.is_premium ? 'Premium — Session recordings unlocked' : 'Free plan'}
                </p>
              </div>
              {!profile?.is_premium && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold cursor-pointer" style={{ background: C.goldDim, color: C.gold }}>
                  Upgrade
                </span>
              )}
              {profile?.is_premium && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: C.goldDim, color: C.gold }}>
                  ⭐ Premium
                </span>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={() => setShowSignOut(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: C.redDim, color: C.red, border: `1px solid rgba(239,68,68,0.2)` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.redDim }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Bottom save button */}
          <button
            onClick={handleSave}
            disabled={saving || uploadingBanner || uploadingPhoto}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: saved ? C.green : C.blue, color: '#fff' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving changes...</>
            ) : saved ? (
              <><Check className="w-4 h-4" /> Changes saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
