'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Users, Lock, Globe, X, Loader2,
  Upload, ChevronRight, Check, AlertCircle, Crown,
  Zap, Shield, Star, TrendingUp, BookOpen, Target,
  Bell, ChevronDown, ArrowRight, Filter
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#070B14',
  surface:     '#0D1420',
  card:        '#0F1A2E',
  cardHover:   '#131F35',
  border:      'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  text:        '#E8EAF0',
  textMuted:   '#8A9BBF',
  textDim:     '#3D4F6E',
  red:         '#FF3B3B',
  redDim:      'rgba(255,59,59,0.12)',
  gold:        '#FFD700',
  goldDim:     'rgba(255,215,0,0.10)',
  green:       '#22C55E',
  greenDim:    'rgba(34,197,94,0.12)',
  purple:      '#A78BFA',
  purpleDim:   'rgba(167,139,250,0.12)',
  sky:         '#38BDF8',
  skyDim:      'rgba(56,189,248,0.10)',
}

const CATEGORIES = [
  'All', 'AI & Tech', 'SaaS', 'FinTech', 'HealthTech', 'EdTech',
  'E-commerce', 'Fundraising', 'Growth', 'Product', 'Web3', 'Climate', 'Media',
]

const FREE_MEMBER_LIMIT = 5

const sanitize = (s: string) =>
  s.replace(/<[^>]*>/g, '').replace(/[<>'"`]/g, '').slice(0, 1000)

// ─── Banner drop zone ─────────────────────────────────────────────────────────
function BannerDrop({ preview, onFile, loading }: { preview: string | null; onFile: (f: File) => void; loading: boolean }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      style={{ aspectRatio: '16/5', border: `2px dashed ${drag ? C.red : C.border}`, borderRadius: 12, background: preview ? 'transparent' : C.surface, cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onFile(f) }}
      onClick={() => ref.current?.click()}
    >
      {preview && <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
      <div style={{ position: 'absolute', inset: 0, background: preview ? 'rgba(0,0,0,0.5)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: drag || !preview ? 1 : 0, transition: 'opacity .2s' }}
        onMouseEnter={e => { if (preview) (e.currentTarget as HTMLElement).style.opacity = '1' }}
        onMouseLeave={e => { if (preview) (e.currentTarget as HTMLElement).style.opacity = '0' }}>
        {loading ? <Loader2 style={{ width: 20, height: 20, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <><Upload style={{ width: 18, height: 18, color: '#fff' }} /><span style={{ fontSize: 12, color: '#fff', fontFamily: 'DM Sans,sans-serif' }}>{preview ? 'Change banner' : 'Upload banner (optional)'}</span></>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
    </div>
  )
}

// ─── Create group modal ───────────────────────────────────────────────────────
function CreateGroupModal({ uid, onClose, onCreated }: { uid: string; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('AI & Tech')
  const [isPrivate, setIsPrivate] = useState(false)
  const [requireApproval, setRequireApproval] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { alert('Max 10MB'); return }
    setFile(f)
    const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(f)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Group name is required'
    if (name.trim().length > 60) e.name = 'Max 60 characters'
    if (!desc.trim()) e.desc = 'Description is required'
    if (desc.length > 500) e.desc = 'Max 500 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const create = async () => {
    if (!validate()) return
    setCreating(true)
    try {
      let bannerUrl: string | null = null
      if (file) {
        setUploadingBanner(true)
        const ext = file.name.split('.').pop()
        const path = `groups/${uid}/${Date.now()}.${ext}`
        const { error: ue } = await supabase.storage.from('profile-images').upload(path, file, { upsert: true, contentType: file.type })
        if (!ue) bannerUrl = supabase.storage.from('profile-images').getPublicUrl(path).data.publicUrl
        setUploadingBanner(false)
      }
      const { data: g, error } = await supabase.from('groups').insert({
        name: sanitize(name.trim()),
        description: sanitize(desc.trim()),
        category: cat,
        is_private: isPrivate,
        require_approval: requireApproval,
        banner_url: bannerUrl,
        created_by: uid,
        max_members: FREE_MEMBER_LIMIT,
        member_count: 1,
      }).select().single()
      if (error || !g) throw error
      await supabase.from('group_members').insert({ group_id: g.id, user_id: uid, role: 'owner', status: 'active' })
      onCreated(g.id)
    } catch (err: any) {
      alert('Failed: ' + (err?.message || 'Unknown error'))
    } finally { setCreating(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 520, borderRadius: 20, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.red, fontFamily: 'DM Mono,monospace', marginBottom: 2 }}>New</p>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif' }}>Create a Circle</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: C.border, color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Banner */}
          <BannerDrop preview={preview} onFile={handleFile} loading={uploadingBanner} />

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Circle Name <span style={{ color: C.red }}>*</span></label>
            <input value={name} onChange={e => { setName(e.target.value); setErrors(p => { const n = { ...p }; delete n.name; return n }) }}
              placeholder="e.g. AI Founders Circle" maxLength={60}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${errors.name ? C.red : C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'DM Sans,sans-serif' }}
              onFocus={e => (e.target.style.borderColor = errors.name ? C.red : C.borderHover)}
              onBlur={e => (e.target.style.borderColor = errors.name ? C.red : C.border)} />
            {errors.name && <p style={{ fontSize: 12, color: C.red, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif' }}><AlertCircle style={{ width: 12, height: 12 }} />{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Description <span style={{ color: C.red }}>*</span></label>
            <textarea value={desc} onChange={e => { setDesc(e.target.value); setErrors(p => { const n = { ...p }; delete n.desc; return n }) }}
              placeholder="Who is this circle for? What's the outcome?" maxLength={500} rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${errors.desc ? C.red : C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'DM Sans,sans-serif' }}
              onFocus={e => (e.target.style.borderColor = errors.desc ? C.red : C.borderHover)}
              onBlur={e => (e.target.style.borderColor = errors.desc ? C.red : C.border)} />
            <p style={{ fontSize: 11, color: C.textDim, textAlign: 'right', marginTop: 4, fontFamily: 'DM Mono,monospace' }}>{desc.length}/500</p>
            {errors.desc && <p style={{ fontSize: 12, color: C.red, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Sans,sans-serif' }}><AlertCircle style={{ width: 12, height: 12 }} />{errors.desc}</p>}
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 8, fontFamily: 'DM Sans,sans-serif' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <button key={c} onClick={() => setCat(c)}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${cat === c ? C.red : C.border}`, background: cat === c ? C.redDim : C.surface, color: cat === c ? C.red : C.textMuted, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all .15s' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy toggle */}
          <div onClick={() => setIsPrivate(p => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, border: `1px solid ${isPrivate ? 'rgba(255,215,0,0.3)' : C.border}`, background: C.surface, cursor: 'pointer', transition: 'border-color .15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: isPrivate ? C.goldDim : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPrivate ? <Lock style={{ width: 16, height: 16, color: C.gold }} /> : <Globe style={{ width: 16, height: 16, color: C.textDim }} />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>{isPrivate ? 'Private Circle' : 'Public Circle'}</p>
                <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{isPrivate ? 'Invite-only, hidden from public' : 'Discoverable by anyone'}</p>
              </div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: isPrivate ? C.gold : C.border, position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', left: isPrivate ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>

          {/* Require approval toggle */}
          <div onClick={() => setRequireApproval(p => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, border: `1px solid ${requireApproval ? 'rgba(255,59,59,0.3)' : C.border}`, background: C.surface, cursor: 'pointer', transition: 'border-color .15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: requireApproval ? C.redDim : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ width: 16, height: 16, color: requireApproval ? C.red : C.textDim }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>Owner Approval Required</p>
                <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{requireApproval ? 'You approve every join request' : 'Members join instantly'}</p>
              </div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: requireApproval ? C.red : C.border, position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', left: requireApproval ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>

          {/* Free notice */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: C.redDim, border: `1px solid rgba(255,59,59,0.2)` }}>
            <Zap style={{ width: 14, height: 14, color: C.red, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: C.red, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>
              <strong>First {FREE_MEMBER_LIMIT} members are free.</strong> Beyond that, upgrade to Premium for unlimited membership.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button onClick={create} disabled={creating || uploadingBanner}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: 'none', background: C.red, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: creating ? 0.7 : 1 }}>
              {creating ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />Creating...</> : <>Create Circle <ArrowRight style={{ width: 15, height: 15 }} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upgrade modal ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, margin: '0 16px', borderRadius: 20, padding: '28px 24px', background: C.card, border: `1px solid rgba(255,215,0,0.3)`, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.goldDim, border: `1px solid rgba(255,215,0,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Crown style={{ width: 26, height: 26, color: C.gold }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 8 }}>Upgrade to Premium</h2>
        <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.6, marginBottom: 20 }}>
          Your circle has reached <strong style={{ color: C.gold }}>5 members</strong> — the free limit. Upgrade for unlimited members and premium features.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, textAlign: 'left' }}>
          {['Unlimited circle members', 'Session recordings vault', 'Priority discovery ranking', 'Custom circle branding'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>
              <Check style={{ width: 14, height: 14, color: C.green, flexShrink: 0 }} />{f}
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: C.gold, color: '#0B0B0C', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 8 }}>Upgrade Now →</button>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: 'transparent', color: C.textMuted, fontFamily: 'DM Sans,sans-serif', fontSize: 13, cursor: 'pointer' }}>Maybe later</button>
      </div>
    </div>
  )
}

// ─── Group card ───────────────────────────────────────────────────────────────
function GroupCard({ group, uid, onJoin }: { group: any; uid: string; onJoin: (g: any) => void }) {
  const router = useRouter()
  const isMember  = group.is_member
  const isPending = group.is_pending
  const isFull    = group.member_count >= FREE_MEMBER_LIMIT && !group.is_premium
  const fill      = Math.min(((group.member_count || 0) / (group.max_members || FREE_MEMBER_LIMIT)) * 100, 100)

  const catColors: Record<string, string> = {
    'AI & Tech': '#38BDF8', 'SaaS': '#A78BFA', 'FinTech': '#22C55E',
    'HealthTech': '#F472B6', 'Growth': '#FB923C', 'Fundraising': '#FFD700',
    'Product': '#34D399', 'Web3': '#818CF8', 'EdTech': '#60A5FA',
  }
  const catColor = catColors[group.category] || C.textMuted

  return (
    <div
      style={{ borderRadius: 16, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', transition: 'all .2s', cursor: 'default' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.borderHover; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {/* Banner */}
      <div style={{ position: 'relative', aspectRatio: '16/6', overflow: 'hidden', flexShrink: 0 }}>
        {group.banner_url
          ? <img src={group.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor}18, ${catColor}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap style={{ width: 28, height: 28, color: catColor, opacity: 0.4 }} /></div>
        }
        {/* Top badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
          {group.is_private && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(0,0,0,0.75)', color: C.gold, fontFamily: 'DM Mono,monospace' }}>
              <Lock style={{ width: 9, height: 9 }} />Private
            </span>
          )}
          {group.require_approval && !group.is_private && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(0,0,0,0.75)', color: C.red, fontFamily: 'DM Mono,monospace' }}>
              <Shield style={{ width: 9, height: 9 }} />Approval
            </span>
          )}
        </div>
        {isMember && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: C.greenDim, color: C.green, fontFamily: 'DM Mono,monospace' }}>
              <Check style={{ width: 9, height: 9 }} />Member
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', lineHeight: 1.3 }}>{group.name}</h3>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: catColor + '18', color: catColor, fontFamily: 'DM Mono,monospace', letterSpacing: '0.05em' }}>{group.category}</span>
          <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'DM Sans,sans-serif' }}>{group.description}</p>
        </div>

        {/* Member bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif' }}>
              <Users style={{ width: 11, height: 11 }} />{group.member_count || 0} member{group.member_count !== 1 ? 's' : ''}
            </span>
            {isFull && <span style={{ fontSize: 10, color: C.gold, fontFamily: 'DM Mono,monospace' }}>Limit reached</span>}
          </div>
          <div style={{ height: 3, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${fill}%`, background: isFull ? `linear-gradient(to right, ${C.gold}, #B8860B)` : `linear-gradient(to right, ${C.red}, #FF6B6B)`, transition: 'width .3s' }} />
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto' }}>
          {isMember ? (
            <button onClick={() => router.push(`/groups/${group.id}`)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.borderHover}`, background: 'transparent', color: C.text, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.border }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              Open Circle <ChevronRight style={{ width: 13, height: 13 }} />
            </button>
          ) : isPending ? (
            <div style={{ width: '100%', padding: '10px', borderRadius: 10, background: C.goldDim, border: `1px solid rgba(255,215,0,0.25)`, color: C.gold, fontFamily: 'DM Mono,monospace', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
              ⏳ Request Pending
            </div>
          ) : (
            <button onClick={() => onJoin(group)} disabled={isFull}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: isFull ? C.border : C.redDim, color: isFull ? C.textDim : C.red, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, cursor: isFull ? 'not-allowed' : 'pointer', border: `1px solid ${isFull ? C.border : 'rgba(255,59,59,0.3)'}`, transition: 'all .15s' }}
              onMouseEnter={e => { if (!isFull) (e.currentTarget as HTMLElement).style.background = C.red; (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { if (!isFull) (e.currentTarget as HTMLElement).style.background = C.redDim; (e.currentTarget as HTMLElement).style.color = C.red }}>
              {isFull ? 'Circle Full' : group.is_private ? '🔒 Request Access' : group.require_approval ? '📋 Request to Join' : 'Join Circle'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [tab, setTab] = useState<'discover' | 'mine'>('discover')
  const [showCreate, setShowCreate] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [pendingBanner, setPendingBanner] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('pending=1')) setPendingBanner(true)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      setMe(u || null)
      await load(u?.id || null)
      setLoading(false)
    })
  }, [])

  const load = async (uid: string | null) => {
    const { data: all } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
    const { data: mems } = uid
      ? await supabase.from('group_members').select('group_id,status,role').eq('user_id', uid)
      : { data: [] }

    const activeIds  = new Set((mems || []).filter((m: any) => m.status === 'active' || !m.status || m.role === 'owner' || m.role === 'admin').map((m: any) => m.group_id))
    const pendingIds = new Set((mems || []).filter((m: any) => m.status === 'pending' && m.role !== 'owner' && m.role !== 'admin').map((m: any) => m.group_id))

    const enriched = (all || []).map(g => ({ ...g, is_member: activeIds.has(g.id), is_pending: pendingIds.has(g.id) }))
    setGroups(enriched)
    setMyGroups(enriched.filter(g => activeIds.has(g.id)))
  }

  const handleJoin = async (group: any) => {
    if (!me) { router.push('/auth/login?next=/groups'); return }
    if (group.member_count >= FREE_MEMBER_LIMIT && !group.is_premium) { setShowUpgrade(true); return }

    const needsApproval = group.is_private || group.require_approval
    const status = needsApproval ? 'pending' : 'active'

    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: me.id, role: 'member', status })
    if (error) { console.error(error); return }

    if (!needsApproval) {
      await supabase.from('groups').update({ member_count: (group.member_count || 0) + 1 }).eq('id', group.id)
      await load(me.id)
      router.push(`/groups/${group.id}`)
    } else {
      setPendingBanner(true)
      await load(me.id)
    }
  }

  const filtered = (tab === 'discover' ? groups : myGroups).filter(g => {
    const q = search.toLowerCase()
    return (
      (!q || g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q)) &&
      (cat === 'All' || g.category === cat)
    )
  })

  return (
    <DashboardLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {showCreate && me && <CreateGroupModal uid={me.id} onClose={() => setShowCreate(false)} onCreated={async id => { setShowCreate(false); await load(me.id); router.push(`/groups/${id}`) }} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div style={{ minHeight: '100%', background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Pending banner */}
          {pendingBanner && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderRadius: 14, background: C.goldDim, border: '1px solid rgba(255,215,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bell style={{ width: 18, height: 18, color: C.gold, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.gold, fontFamily: 'Syne,sans-serif' }}>Join request sent</p>
                  <p style={{ fontSize: 12, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>The circle owner will review your request. You'll be notified when approved.</p>
                </div>
              </div>
              <button onClick={() => setPendingBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 20, lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.red, fontFamily: 'DM Mono,monospace', marginBottom: 4 }}>// CIRCLES</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>Your Inner Circles</h1>
              <p style={{ fontSize: 14, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', marginTop: 4 }}>Build or join high-performance communities around shared goals</p>
            </div>
            {me && (
              <button onClick={() => setShowCreate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: C.red, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 20px rgba(255,59,59,0.3)', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(255,59,59,0.45)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,59,59,0.3)' }}>
                <Plus style={{ width: 15, height: 15 }} /> Create Circle
              </button>
            )}
          </div>

          {/* Whop-style feature callouts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: MessageSquareIcon, label: 'Group Chat', desc: 'Real-time conversations', color: C.sky },
              { icon: VideoIcon, label: 'Live Calls', desc: 'Video + screen share', color: C.green },
              { icon: FolderIcon, label: 'File Vault', desc: 'Share resources & decks', color: C.purple },
              { icon: ShieldIcon, label: 'Owner Control', desc: 'Approve every member', color: C.gold },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: f.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>{['💬', '🎥', '📁', '🛡️'][i]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif' }}>{f.label}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, width: 'fit-content' }}>
            {[{ id: 'discover', label: 'Discover', count: groups.length }, { id: 'mine', label: 'My Circles', count: myGroups.length }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === t.id ? C.red : 'transparent', color: tab === t.id ? '#fff' : C.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne,sans-serif', transition: 'all .15s' }}>
                {t.label}
                <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: tab === t.id ? 'rgba(255,255,255,0.2)' : C.border, color: tab === t.id ? '#fff' : C.textDim, fontFamily: 'DM Mono,monospace' }}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.textDim }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search circles..."
                style={{ width: '100%', padding: '11px 12px 11px 36px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'DM Sans,sans-serif' }}
                onFocus={e => (e.target.style.borderColor = C.borderHover)}
                onBlur={e => (e.target.style.borderColor = C.border)} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textDim }}><X style={{ width: 14, height: 14 }} /></button>}
            </div>
            <button onClick={() => setShowFilters(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', borderRadius: 10, border: `1px solid ${showFilters ? C.borderHover : C.border}`, background: showFilters ? C.border : C.card, color: showFilters ? C.text : C.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' }}>
              <Filter style={{ width: 13, height: 13 }} /> Filter {cat !== 'All' && `· ${cat}`}
              <ChevronDown style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {/* Category chips */}
          {showFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${cat === c ? C.red : C.border}`, background: cat === c ? C.redDim : C.card, color: cat === c ? C.red : C.textMuted, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all .15s' }}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ height: 300, borderRadius: 16, background: C.card, animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
              <Zap style={{ width: 40, height: 40, color: C.textDim, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: C.textMuted, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>
                {tab === 'mine' ? 'No circles yet' : 'No circles found'}
              </p>
              <p style={{ fontSize: 13, color: C.textDim, fontFamily: 'DM Sans,sans-serif', marginBottom: 20 }}>
                {tab === 'mine' ? 'Create your first circle and invite your people' : 'Try adjusting your search or filters'}
              </p>
              {tab === 'mine' && me && (
                <button onClick={() => setShowCreate(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, border: 'none', background: C.red, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <Plus style={{ width: 14, height: 14 }} /> Create First Circle
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(g => <GroupCard key={g.id} group={g} uid={me?.id || ''} onJoin={handleJoin} />)}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Placeholder icon components for the feature callouts
const MessageSquareIcon = () => null
const VideoIcon = () => null
const FolderIcon = () => null
const ShieldIcon = () => null
