'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, Plus, Users, Lock, Globe, X, Loader2,
  Upload, ChevronRight, Check, AlertCircle, Crown,
  Zap, Shield
} from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:         '#0A0F1E',
  surface:    '#0D1428',
  card:       '#111827',
  cardHover:  '#141E35',
  border:     'rgba(255,255,255,0.06)',
  borderHover:'rgba(37,99,235,0.3)',
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

const CATEGORIES = [
  'All','AI & Tech','SaaS','FinTech','HealthTech','EdTech',
  'E-commerce','Climate Tech','Fundraising','Growth','Product','Web3','Media'
]

const FREE_MEMBER_LIMIT = 5

// ─── Helpers ────────────────────────────────────────────────────────────────
const sanitizeText = (s: string) =>
  s.replace(/<[^>]*>/g, '').replace(/[<>'"`;]/g, '').slice(0, 1000)

// ─── Banner drop zone ────────────────────────────────────────────────────────
function BannerDropZone({ preview, onFile, loading }: {
  preview: string | null
  onFile: (f: File) => void
  loading: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }, [onFile])

  return (
    <div
      className="relative rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all"
      style={{
        aspectRatio: '16/5',
        border: `2px dashed ${dragging ? C.blueLight : C.border}`,
        background: preview ? 'transparent' : C.surface,
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {preview && <img src={preview} alt="banner" className="w-full h-full object-cover" />}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity"
        style={{ background: preview ? 'rgba(0,0,0,0.5)' : 'transparent', opacity: dragging || !preview ? 1 : 0 }}
        onMouseEnter={e => { if (preview) (e.currentTarget as HTMLElement).style.opacity = '1' }}
        onMouseLeave={e => { if (preview) (e.currentTarget as HTMLElement).style.opacity = '0' }}
      >
        {loading
          ? <Loader2 className="w-5 h-5 animate-spin text-white" />
          : <>
              <Upload className="w-5 h-5 text-white" />
              <span className="text-xs font-medium text-white">
                {preview ? 'Change banner' : 'Drag & drop or click to upload banner'}
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                JPG, PNG, WebP · Max 10MB
              </span>
            </>
        }
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

// ─── Upgrade modal ───────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl text-center"
        style={{ background: C.card, border: `1px solid rgba(245,158,11,0.3)` }}
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.08), transparent 60%)' }} />

        <div className="relative">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: C.goldDim, border: `1px solid rgba(245,158,11,0.3)` }}>
            <Crown className="w-7 h-7" style={{ color: C.gold }} />
          </div>

          <h2 className="text-lg font-bold mb-2" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
            Upgrade to Premium
          </h2>
          <p className="text-sm mb-5" style={{ color: C.textMuted }}>
            Your group has reached <strong style={{ color: C.gold }}>5 members</strong> — the free limit.
            Upgrade to add unlimited members and unlock premium features.
          </p>

          <div className="space-y-2 mb-5 text-left">
            {[
              'Unlimited group members',
              'Session recordings',
              'Priority support',
              'Custom group branding',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: C.textMuted }}>
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: C.green }} />
                {f}
              </div>
            ))}
          </div>

          <button
            className="w-full py-3 rounded-xl text-sm font-bold mb-2 transition-all hover:opacity-90"
            style={{ background: C.gold, color: '#0A0F1E' }}
          >
            Upgrade Now →
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-sm font-medium transition-all"
            style={{ color: C.textMuted }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create group modal ──────────────────────────────────────────────────────
function CreateGroupModal({ currentUserId, onClose, onCreated }: {
  currentUserId: string
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('AI & Tech')
  const [isPrivate,   setIsPrivate]   = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile,  setBannerFile]  = useState<File | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [errors,      setErrors]      = useState<Record<string, string>>({})

  const handleBannerFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('Banner must be under 10MB'); return }
    setBannerFile(file)
    const r = new FileReader()
    r.onload = e => setBannerPreview(e.target?.result as string)
    r.readAsDataURL(file)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim())             e.name = 'Group name is required'
    if (name.trim().length > 60)  e.name = 'Max 60 characters'
    if (!description.trim())      e.description = 'Description is required'
    if (description.length > 500) e.description = 'Max 500 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) return
    setCreating(true)

    try {
      let bannerUrl: string | null = null

      if (bannerFile) {
        setUploadingBanner(true)
        const ext  = bannerFile.name.split('.').pop()
        const path = `groups/${currentUserId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('profile-images')
          .upload(path, bannerFile, { upsert: true, contentType: bannerFile.type })
        if (!upErr) {
          const { data } = supabase.storage.from('profile-images').getPublicUrl(path)
          bannerUrl = data.publicUrl
        }
        setUploadingBanner(false)
      }

      // Create group — parameterized insert
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .insert({
          name:        sanitizeText(name.trim()),
          description: sanitizeText(description.trim()),
          category,
          is_private:  isPrivate,
          banner_url:  bannerUrl,
          created_by:  currentUserId,
          max_members: FREE_MEMBER_LIMIT,
          member_count: 1,
        })
        .select()
        .single()

      if (gErr || !group) throw gErr

      // Add creator as owner — always active, never pending
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id:  currentUserId,
        role:     'owner',
        status:   'active',
      })

      onCreated(group.id)
    } catch (err: any) {
      alert('Failed to create group: ' + (err?.message || 'Unknown error'))
    } finally {
      setCreating(false)
    }
  }

  const cats = CATEGORIES.filter(c => c !== 'All')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.blueLight }}>New</p>
            <h2 className="text-base font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
              Create a Group
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.border, color: C.textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Banner */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>
              Group Banner <span style={{ color: C.textDim }}>(optional)</span>
            </label>
            <BannerDropZone
              preview={bannerPreview}
              onFile={handleBannerFile}
              loading={uploadingBanner}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>
              Group Name <span style={{ color: C.red }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => { const n = { ...p }; delete n.name; return n }) }}
              placeholder="e.g. AI Founders Circle"
              maxLength={60}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: C.surface, border: `1px solid ${errors.name ? C.red : C.border}`, color: C.text }}
              onFocus={e => (e.target.style.borderColor = errors.name ? C.red : C.borderHover)}
              onBlur={e => (e.target.style.borderColor = errors.name ? C.red : C.border)}
            />
            {errors.name && (
              <p className="flex items-center gap-1.5 text-xs mt-1" style={{ color: C.red }}>
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>
              Description <span style={{ color: C.red }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => { const n = { ...p }; delete n.description; return n }) }}
              placeholder="What is this group about? Who should join?"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all leading-relaxed"
              style={{ background: C.surface, border: `1px solid ${errors.description ? C.red : C.border}`, color: C.text }}
              onFocus={e => (e.target.style.borderColor = errors.description ? C.red : C.borderHover)}
              onBlur={e => (e.target.style.borderColor = errors.description ? C.red : C.border)}
            />
            <p className="text-xs mt-1 text-right" style={{ color: C.textDim }}>{description.length}/500</p>
            {errors.description && (
              <p className="flex items-center gap-1.5 text-xs mt-1" style={{ color: C.red }}>
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {cats.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: category === cat ? C.blue   : C.surface,
                    color:      category === cat ? '#fff'   : C.textMuted,
                    border:     `1px solid ${category === cat ? C.blue : C.border}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div
            className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
            style={{ background: C.surface, border: `1px solid ${isPrivate ? 'rgba(245,158,11,0.3)' : C.border}` }}
            onClick={() => setIsPrivate(p => !p)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: isPrivate ? C.goldDim : C.border }}>
                {isPrivate
                  ? <Lock className="w-4 h-4" style={{ color: C.gold }} />
                  : <Globe className="w-4 h-4" style={{ color: C.textDim }} />
                }
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>
                  {isPrivate ? 'Private Group' : 'Public Group'}
                </p>
                <p className="text-xs" style={{ color: C.textMuted }}>
                  {isPrivate
                    ? 'Only invited members can join'
                    : 'Anyone can discover and request to join'}
                </p>
              </div>
            </div>
            <div
              className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all"
              style={{ background: isPrivate ? C.gold : C.border }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-md"
                style={{ background: '#fff', left: isPrivate ? '22px' : '2px' }}
              />
            </div>
          </div>

          {/* Free tier notice */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: C.blueDim, border: `1px solid rgba(37,99,235,0.2)` }}
          >
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.blueLight }} />
            <p className="text-xs leading-relaxed" style={{ color: C.blueLight }}>
              <strong>First {FREE_MEMBER_LIMIT} members are free.</strong> When your group grows beyond {FREE_MEMBER_LIMIT},
              you'll be prompted to upgrade to Premium for unlimited members.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: C.surface, color: C.textMuted, border: `1px solid ${C.border}` }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || uploadingBanner}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: C.blue, color: '#fff' }}
            >
              {creating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                : <>Create Group <ChevronRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Group card ──────────────────────────────────────────────────────────────
function GroupCard({ group, currentUserId, onJoin }: {
  group: any
  currentUserId: string
  onJoin: (g: any) => void
}) {
  const router = useRouter()
  const isMember  = group.is_member
  const isPending = group.is_pending
  const isFull    = group.member_count >= FREE_MEMBER_LIMIT && !group.is_premium
  const fillPct   = Math.min((group.member_count / Math.max(group.max_members || FREE_MEMBER_LIMIT, 1)) * 100, 100)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 flex flex-col"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHover; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {/* Banner */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/6' }}>
        {group.banner_url
          ? <img src={group.banner_url} alt="" className="w-full h-full object-cover" />
          : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.card})` }}>
              <Zap className="w-8 h-8" style={{ color: C.textDim }} />
            </div>
          )
        }
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {group.is_private && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(0,0,0,0.7)', color: C.gold }}>
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
          {group.member_count >= FREE_MEMBER_LIMIT && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(0,0,0,0.7)', color: C.gold }}>
              <Crown className="w-2.5 h-2.5" /> Premium
            </span>
          )}
        </div>
        {isMember && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: C.greenDim, color: C.green }}>
              <Check className="w-2.5 h-2.5" /> Joined
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold leading-tight" style={{ color: C.text }}>{group.name}</h3>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-md"
            style={{ background: C.blueDim, color: C.blueLight }}>
            {group.category}
          </span>
          <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: C.textMuted }}>
            {group.description}
          </p>
        </div>

        {/* Member progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: C.textDim }}>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {group.member_count} member{group.member_count !== 1 ? 's' : ''}
            </span>
            {isFull && <span style={{ color: C.gold }}>Free limit reached</span>}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${fillPct}%`,
                background: isFull
                  ? `linear-gradient(to right, ${C.gold}, #FCD34D)`
                  : `linear-gradient(to right, ${C.blue}, ${C.blueLight})`,
              }}
            />
          </div>
        </div>

        {/* Action */}
        <div className="mt-auto">
          {isMember ? (
            <button
              onClick={() => router.push(`/groups/${group.id}`)}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: C.blueDim, color: C.blueLight, border: `1px solid rgba(37,99,235,0.2)` }}
            >
              Open Group →
            </button>
          ) : isPending ? (
            <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
              style={{ background: C.goldDim, color: C.gold, border: `1px solid rgba(245,158,11,0.3)` }}>
              ⏳ Request Pending
            </div>
          ) : (
            <button
              onClick={() => onJoin(group)}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: group.is_private ? C.goldDim : C.blue, color: group.is_private ? C.gold : '#fff', border: group.is_private ? `1px solid rgba(245,158,11,0.3)` : 'none' }}
            >
              {group.is_private ? '🔒 Request to Join' : 'Join Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const router = useRouter()
  const [currentUser,    setCurrentUser]    = useState<any>(null)
  const [groups,         setGroups]         = useState<any[]>([])
  const [myGroups,       setMyGroups]       = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [category,       setCategory]       = useState('All')
  const [activeTab,      setActiveTab]      = useState<'discover'|'mine'>('discover')
  const [showCreate,     setShowCreate]     = useState(false)
  const [showUpgrade,    setShowUpgrade]    = useState(false)
  const [showPendingBanner, setShowPendingBanner] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams?.get('pending') === '1') setShowPendingBanner(true)
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setCurrentUser(u)
      await loadGroups(u.id)
      setLoading(false)
    })
  }, [])

  const loadGroups = async (uid: string) => {
    // All groups
    const { data: allGroups } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false })

    // User's memberships (only active ones count as joined)
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, status, role')
      .eq('user_id', uid)

    // Treat as active: status='active', status=null/undefined (old rows), or owner/admin role
    const activeMemberIds  = new Set((memberships || []).filter((m: any) =>
      m.status === 'active' || !m.status || m.role === 'owner' || m.role === 'admin'
    ).map((m: any) => m.group_id))
    const pendingMemberIds = new Set((memberships || []).filter((m: any) =>
      m.status === 'pending' && m.role !== 'owner' && m.role !== 'admin'
    ).map((m: any) => m.group_id))

    const enriched = (allGroups || []).map(g => ({
      ...g,
      is_member:  activeMemberIds.has(g.id),
      is_pending: pendingMemberIds.has(g.id),
    }))

    setGroups(enriched)
    setMyGroups(enriched.filter(g => activeMemberIds.has(g.id)))
  }

  const handleJoin = async (group: any) => {
    if (!currentUser) return

    // Check member count — free limit
    if (group.member_count >= FREE_MEMBER_LIMIT && !group.is_premium) {
      setShowUpgrade(true)
      return
    }

    if (group.is_private) {
      // Private group — insert with status:'pending', owner approves
      const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id:  currentUser.id,
        role:     'member',
        status:   'pending',
      })
      if (!error) {
        alert('Join request sent! The group owner will review your request.')
        await loadGroups(currentUser.id)
      }
    } else {
      // Public group — join immediately
      const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id:  currentUser.id,
        role:     'member',
        status:   'active',
      })
      if (!error) {
        await supabase.from('groups')
          .update({ member_count: (group.member_count || 0) + 1 })
          .eq('id', group.id)
        await loadGroups(currentUser.id)
        router.push(`/groups/${group.id}`)
      }
    }
  }

  const handleGroupCreated = async (id: string) => {
    setShowCreate(false)
    await loadGroups(currentUser?.id || '')
    router.push(`/groups/${id}`)
  }

  const filtered = (activeTab === 'discover' ? groups : myGroups).filter(g => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      g.name.toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q)
    const matchCat = category === 'All' || g.category === category
    return matchSearch && matchCat
  })

  return (
    <DashboardLayout>
      {showCreate && currentUser && (
        <CreateGroupModal
          currentUserId={currentUser.id}
          onClose={() => setShowCreate(false)}
          onCreated={handleGroupCreated}
        />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="min-h-full" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Pending banner */}
          {showPendingBanner && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 20 }}>⏳</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.gold }}>Join request sent</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>The group owner will review your request. You&apos;ll be notified when approved.</p>
                </div>
              </div>
              <button onClick={() => setShowPendingBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          )}

        {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: C.gold }}>
                Groups
              </p>
              <h1 className="text-2xl font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
                Your Circles
              </h1>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                Build or join groups of like-minded founders
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: C.gold, color: '#0A0F1E' }}
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>

          {/* Free tier info */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: C.blueDim, border: `1px solid rgba(37,99,235,0.2)` }}
          >
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: C.blueLight }} />
            <p className="text-xs" style={{ color: C.blueLight }}>
              <strong>Free groups support up to {FREE_MEMBER_LIMIT} members.</strong>
              {' '}Upgrade to Premium for unlimited membership and session recordings.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {[
              { id: 'discover', label: 'Discover', count: groups.length },
              { id: 'mine',     label: 'My Groups', count: myGroups.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? C.blue   : 'transparent',
                  color:      activeTab === tab.id ? '#fff'   : C.textMuted,
                }}
              >
                {tab.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : C.border,
                    color:      activeTab === tab.id ? '#fff' : C.textDim,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textDim }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
              onFocus={e => (e.target.style.borderColor = C.borderHover)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.textDim }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: category === cat ? C.blue   : C.card,
                  color:      category === cat ? '#fff'   : C.textMuted,
                  border:     `1px solid ${category === cat ? C.blue : C.border}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: C.card }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: C.textDim }} />
              <p className="font-semibold mb-1" style={{ color: C.textMuted }}>
                {activeTab === 'mine' ? 'No groups yet' : 'No groups found'}
              </p>
              <p className="text-sm mb-4" style={{ color: C.textDim }}>
                {activeTab === 'mine'
                  ? 'Create your first group and invite like-minded founders'
                  : 'Try adjusting your search or category filter'}
              </p>
              {activeTab === 'mine' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: C.gold, color: '#0A0F1E' }}
                >
                  <Plus className="w-4 h-4" /> Create First Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(g => (
                <GroupCard
                  key={g.id}
                  group={g}
                  currentUserId={currentUser?.id || ''}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
