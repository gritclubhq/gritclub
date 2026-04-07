'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Upload, Check, X, AlertCircle, User, AtSign, ChevronRight, Loader2 } from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#0B0B0C',
  surface:   '#121214',
  card:      '#121214',
  border:    'rgba(255,255,255,0.06)',
  borderFocus:'rgba(255,255,255,0.12)',
  text:      '#FFFFFF',
  textMuted: '#C7C7CC',
  textDim:   '#C7C7CC',
  blue:      '#C7C7CC',
  blueLight: '#C7C7CC',
  blueDim:   'rgba(255,255,255,0.06)',
  gold:      '#C7C7CC',
  goldDim:   'rgba(199,199,204,0.08)',
  red:       '#FF453A',
  redDim:    'rgba(239,68,68,0.1)',
  green:     '#32D74B',
  greenDim:  'rgba(52,211,153,0.12)',
}

// ─── Security: username sanitisation ─────────────────────────────────────────
// Allows only a-z A-Z 0-9 _ between 3-30 chars
// Blocks SQL injection keywords at client level (DB constraint is the real guard)
const SQL_KEYWORDS = ['select','insert','update','delete','drop','union','script','exec','cast','char','or','and','where']

function sanitizeUsername(raw: string): string {
  // Strip everything except alphanumeric + underscore
  return raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
}

function validateUsername(val: string): string | null {
  if (!val) return 'Username is required'
  if (val.length < 3) return 'At least 3 characters required'
  if (val.length > 30) return 'Maximum 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers and underscores'
  const lower = val.toLowerCase()
  for (const kw of SQL_KEYWORDS) {
    if (lower.includes(kw)) return `"${kw}" is not allowed in usernames`
  }
  return null
}

function validateFullName(val: string): string | null {
  if (!val.trim()) return 'Full name is required'
  if (val.trim().length < 2) return 'Name too short'
  if (val.trim().length > 80) return 'Maximum 80 characters'
  // Strip any HTML/script tags
  if (/<[^>]*>/.test(val)) return 'Invalid characters in name'
  return null
}

// ─── Drag-drop image upload ───────────────────────────────────────────────────
function AvatarUpload({
  preview,
  onFile,
  uploading,
}: {
  preview: string | null
  onFile: (f: File) => void
  uploading: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }, [onFile])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview circle */}
      <div
        className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all"
        style={{
          background: preview ? 'transparent' : C.blueDim,
          border: `2px dashed ${dragging ? C.blueLight : C.border}`,
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.blueLight }} />
        ) : preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <User className="w-8 h-8" style={{ color: C.textDim }} />
            <span className="text-xs" style={{ color: C.textDim }}>Photo</span>
          </div>
        )}

        {/* Overlay on hover */}
        {preview && !uploading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />

      <p className="text-xs text-center" style={{ color: C.textDim }}>
        Drag & drop or click · JPG, PNG, WebP · Max 5MB
      </p>
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, prefix, error, hint, maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  prefix?: string
  error?: string | null
  hint?: string
  maxLength?: number
}) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? C.red : focused ? C.blueLight : C.border

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold" style={{ color: C.text }}>{label}</label>
      <div
        className="flex items-center rounded-xl overflow-hidden transition-all"
        style={{ border: `1px solid ${borderColor}`, background: C.card }}
      >
        {prefix && (
          <span className="pl-3 pr-1 text-sm font-medium" style={{ color: C.textDim }}>{prefix}</span>
        )}
        <input
          type="text"
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
        {maxLength && (
          <span className="pr-3 text-xs" style={{ color: C.textDim }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: C.textDim }}>{hint}</p>
      )}
    </div>
  )
}

// ─── Username availability check ──────────────────────────────────────────────
type AvailStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()

  const [step,        setStep]        = useState<1 | 2>(1)
  const [fullName,    setFullName]    = useState('')
  const [username,    setUsername]    = useState('')
  const [avatarFile,  setAvatarFile]  = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [availStatus, setAvailStatus] = useState<AvailStatus>('idle')
  const [nameError,   setNameError]   = useState<string | null>(null)
  const [userError,   setUserError]   = useState<string | null>(null)
  const checkTimeout = useRef<NodeJS.Timeout>()

  // Handle username input — sanitize first, then validate, then check availability
  const handleUsernameChange = (raw: string) => {
    const sanitized = sanitizeUsername(raw)
    setUsername(sanitized)
    setAvailStatus('idle')

    const err = validateUsername(sanitized)
    if (err) { setUserError(err); return }
    setUserError(null)

    // Debounce availability check
    clearTimeout(checkTimeout.current)
    if (sanitized.length >= 3) {
      setAvailStatus('checking')
      checkTimeout.current = setTimeout(async () => {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('username', sanitized)
          .maybeSingle()
        setAvailStatus(data ? 'taken' : 'available')
      }, 500)
    }
  }

  const handleAvatarFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = e => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleStep1 = () => {
    const ne = validateFullName(fullName)
    setNameError(ne)
    if (ne) return
    setStep(2)
  }

  const handleFinish = async () => {
    const ue = validateUsername(username)
    setUserError(ue)
    if (ue) return
    if (availStatus === 'taken') { setUserError('Username already taken'); return }
    if (availStatus === 'checking') return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      let photoUrl: string | null = null

      // Upload avatar if provided
      if (avatarFile) {
        setUploading(true)
        const ext  = avatarFile.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('profile-images')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
        setUploading(false)
      }

      // Save to users table — using parameterised update (no raw SQL)
      const updates: Record<string, any> = {
        full_name:       fullName.trim(),
        username:        username,
        onboarding_done: true,
        updated_at:      new Date().toISOString(),
      }
      if (photoUrl) updates.photo_url = photoUrl

      const { error: saveErr } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (saveErr) {
        console.error('Save error:', saveErr)
        alert('Something went wrong. Please try again.')
        setSaving(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setSaving(false)
    }
  }

  const availIcon = () => {
    if (availStatus === 'checking')  return <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.blueLight }} />
    if (availStatus === 'available') return <Check className="w-4 h-4" style={{ color: C.green }} />
    if (availStatus === 'taken')     return <X     className="w-4 h-4" style={{ color: C.red }} />
    return null
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: C.bg }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-10"
          style={{ background: 'radial-gradient(circle, #8A5F52, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(196,149,106,0.15)', color: C.blueLight, border: `1px solid rgba(59,130,246,0.2)` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            WELCOME TO GRITCLUB
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: C.text, fontFamily: "'Sora', system-ui, sans-serif", letterSpacing: '-0.02em' }}
          >
            Set up your<br />
            <span style={{ color: C.gold }}>profile</span>
          </h1>
          <p className="text-sm" style={{ color: C.textMuted }}>
            This is how the community will see you
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 px-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  background: step >= s ? C.blue : C.card,
                  color:      step >= s ? '#fff' : C.textDim,
                  border:     `1px solid ${step >= s ? C.blue : C.border}`,
                }}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className="text-xs font-medium" style={{ color: step >= s ? C.text : C.textDim }}>
                {s === 1 ? 'Your name' : 'Username & photo'}
              </span>
              {s < 2 && (
                <div className="flex-1 h-px" style={{ background: step > s ? C.blue : C.border }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          {step === 1 ? (
            <>
              <Field
                label="Full Name"
                value={fullName}
                onChange={v => { setFullName(v); setNameError(null) }}
                placeholder="e.g. Jake Harris"
                error={nameError}
                hint="Your real name helps others connect with you"
                maxLength={80}
              />

              <button
                onClick={handleStep1}
                disabled={!fullName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: '#8A8A8F', color: '#fff' }}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Avatar upload */}
              <AvatarUpload
                preview={avatarPreview}
                onFile={handleAvatarFile}
                uploading={uploading}
              />

              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: C.text }}>
                  Username
                </label>
                <div
                  className="flex items-center rounded-xl overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${userError ? C.red : availStatus === 'available' ? C.green : C.border}`,
                    background: C.card,
                  }}
                >
                  <AtSign className="ml-3 w-4 h-4 flex-shrink-0" style={{ color: C.textDim }} />
                  <input
                    type="text"
                    value={username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    placeholder="yourhandle"
                    maxLength={30}
                    className="flex-1 px-2 py-3 bg-transparent text-sm outline-none"
                    style={{ color: C.text }}
                    autoComplete="off"
                    spellCheck={false}
                    // Prevent paste of malicious content by sanitizing on change
                    onPaste={e => {
                      e.preventDefault()
                      const pasted = e.clipboardData.getData('text')
                      handleUsernameChange(sanitizeUsername(pasted))
                    }}
                  />
                  <div className="pr-3">{availIcon()}</div>
                </div>

                {/* Status messages */}
                {userError && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
                    <AlertCircle className="w-3 h-3" /> {userError}
                  </p>
                )}
                {availStatus === 'available' && !userError && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: C.green }}>
                    <Check className="w-3 h-3" /> @{username} is available
                  </p>
                )}
                {availStatus === 'taken' && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: C.red }}>
                    <X className="w-3 h-3" /> @{username} is already taken
                  </p>
                )}
                {!userError && availStatus === 'idle' && (
                  <p className="text-xs" style={{ color: C.textDim }}>
                    3–30 chars · letters, numbers, underscores only
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: C.card, color: C.textMuted, border: `1px solid ${C.border}` }}
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving || uploading || availStatus === 'taken' || availStatus === 'checking' || !username || !!userError}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: C.gold, color: '#0B0B0C' }}
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <>Enter GritClub <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Security note */}
        <p className="text-center text-xs mt-4" style={{ color: C.textDim }}>
          Your data is encrypted and never shared without your consent.
        </p>
      </div>
    </div>
  )
}
