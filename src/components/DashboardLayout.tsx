'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Home, Ticket, Users, MessageSquare, MessageCircle, User, BarChart2,
  Calendar, DollarSign, Menu, X, LogOut,
  Radio, Zap, UserCheck, BookOpen, Settings,
  ChevronRight, Crown, Video, Plus,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

const C = {
  // Backgrounds
  bg:           '#291C0E',
  sidebar:      '#2F2115',
  card:         '#3D2B1F',
  surface:      '#4A3327',
  // Borders
  border:       'rgba(225,212,194,0.08)',
  borderStrong: 'rgba(225,212,194,0.18)',
  // Text
  text:         '#E1D4C2',
  textMuted:    '#BEB5A9',
  textDim:      '#A78D78',
  // Blue — structure / nav / states
  blue:         '#C4956A',
  blueH:        '#E1D4C2',
  blueSoft:     'rgba(196,149,106,0.15)',
  blueDim:      'rgba(196,149,106,0.08)',
  // Ember — action only
  ember:        '#C4956A',
  emberSoft:    'rgba(196,149,106,0.1)',
  // Semantic
  gold:         '#94A3B8',
  goldDim:      'rgba(148,163,184,0.1)',
  red:          '#C0614A',
  redDim:       'rgba(192,97,74,0.09)',
  green:        '#6B9E7A',
  // Fonts
  fontSora:  "'Sora', system-ui, sans-serif",
  fontInter: "'Inter', system-ui, sans-serif",
}

const AUDIENCE_NAV = [
  { href: '/dashboard',            label: 'Discover',   icon: Home },
  { href: '/dashboard/tickets',    label: 'My Tickets', icon: Ticket },
  { href: '/dashboard/network',    label: 'Network',    icon: Users },
  { href: '/groups',               label: 'Groups',     icon: Zap },
  { href: '/dashboard/community',  label: 'Community',  icon: MessageSquare },
  { href: '/dashboard/messages',   label: 'Messages',   icon: MessageCircle },
  { href: '/dashboard/recordings', label: 'Recordings', icon: Video },
  { href: '/dashboard/profile',    label: 'Profile',    icon: User },
]
const HOST_NAV = [
  { href: '/host',                 label: 'Dashboard',    icon: BarChart2 },
  { href: '/host/create',          label: 'Create Event', icon: Calendar, ember: true },
  { href: '/host/earnings',        label: 'Earnings',     icon: DollarSign },
  { href: '/dashboard/network',    label: 'Network',      icon: Users },
  { href: '/groups',               label: 'Groups',       icon: Zap },
  { href: '/dashboard/community',  label: 'Community',    icon: MessageSquare },
  { href: '/dashboard/recordings', label: 'Recordings',   icon: Video },
  { href: '/dashboard/profile',    label: 'Profile',      icon: User },
]
const ADMIN_NAV = [
  { href: '/admin',          label: 'Overview',       icon: BarChart2 },
  { href: '/admin/users',    label: 'Users',          icon: Users },
  { href: '/admin/hosts',    label: 'Host Approvals', icon: UserCheck },
  { href: '/admin/events',   label: 'Events',         icon: Radio },
  { href: '/admin/groups',   label: 'Groups',         icon: Zap },
  { href: '/admin/content',  label: 'Content',        icon: BookOpen },
  { href: '/admin/revenue',  label: 'Revenue',        icon: DollarSign },
  { href: '/admin/settings', label: 'Settings',       icon: Settings },
]

function SignOutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onCancel} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 360, margin: '0 16px',
        borderRadius: 12, padding: 28,
        background: C.card, border: `1px solid ${C.border}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.redDim, border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut style={{ width: 18, height: 18, color: C.red }} />
          </div>
          <div>
            <p style={{ fontFamily: C.fontSora, fontWeight: 600, color: C.text, marginBottom: 5, fontSize: 15 }}>Sign out of GritClub?</p>
            <p style={{ fontSize: 13, color: C.textDim, fontFamily: C.fontInter, lineHeight: 1.5 }}>You&apos;ll need to sign back in to continue.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: C.fontInter, fontWeight: 500, fontSize: 13, transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderStrong)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '9px', borderRadius: 8, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: C.fontInter, fontWeight: 600, fontSize: 13, transition: 'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user,        setUser]        = useState<any>(null)
  const [profile,     setProfile]     = useState<any>(null)
  const [role,        setRole]        = useState('audience')
  const [showSignOut, setShowSignOut] = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      if (prof) {
        setProfile(prof)
        setRole(prof.role || 'audience')
        if (!prof.username && !prof.onboarding_done && pathname !== '/onboarding') {
          router.push('/onboarding'); return
        }
      } else { setRole('audience') }
    })
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const navItems = role === 'admin' ? ADMIN_NAV : role === 'host' ? HOST_NAV : AUDIENCE_NAV
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/host')      return pathname === '/host'
    if (href === '/admin')     return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const photoUrl    = profile?.photo_url || user?.user_metadata?.avatar_url || null
  const initials    = displayName.slice(0, 2).toUpperCase()

  const NavItem = ({ href, label, Icon, isEmber = false }: { href: string; label: string; Icon: any; isEmber?: boolean }) => {
    const active = isActive(href)
    return (
      <Link href={href} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 7, margin: '1px 0',
            cursor: 'pointer', transition: 'all 0.15s',
            background: active ? C.blueSoft : 'transparent',
            color:      active ? C.blue : C.textDim,
            borderLeft: `2px solid ${active ? C.blue : 'transparent'}`,
            fontFamily: C.fontInter,
            fontSize: 13, fontWeight: active ? 500 : 400,
          }}
          onMouseEnter={e => {
            if (!active) {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.04)'
              el.style.color      = C.textMuted
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color      = C.textDim
            }
          }}
        >
          <Icon style={{ width: 15, height: 15, flexShrink: 0, opacity: active ? 1 : 0.65 }} />
          {label}
          {active && <ChevronRight style={{ width: 11, height: 11, marginLeft: 'auto', opacity: 0.4 }} />}
        </div>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{ padding: '18px 14px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: C.fontSora, fontWeight: 800, fontSize: 12, color: '#fff',
          }}>G</div>
          <div>
            <div style={{ fontFamily: C.fontSora, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: C.text }}>
              GRIT<span style={{ color: C.blue }}>CLUB</span>
            </div>
            {role && role !== 'audience' && (
              <span style={{
                display: 'inline-block', marginTop: 2,
                fontSize: 9, fontFamily: C.fontInter, fontWeight: 600,
                padding: '1px 6px', borderRadius: 3,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                background: role === 'admin' ? C.redDim : C.blueDim,
                color:      role === 'admin' ? C.red    : C.blue,
                border: `1px solid ${role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.2)'}`,
              }}>{role}</span>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {navItems.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} isEmber={'ember' in item && !!item.ember} />
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <Link href="/pricing" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 7,
              color: C.gold, fontFamily: C.fontInter, fontSize: 13, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.goldDim}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <Crown style={{ width: 14, height: 14, flexShrink: 0, opacity: 0.8 }} />
              {profile?.is_premium ? '✦ Premium' : 'Upgrade Plan'}
            </div>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div style={{ flexShrink: 0, padding: '6px 6px 8px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', marginBottom: 2 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            fontFamily: C.fontSora, fontWeight: 700, fontSize: 11, color: '#fff',
          }}>
            {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: C.text, fontFamily: C.fontSora, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, letterSpacing: '-0.01em' }}>{displayName}</p>
            <p style={{ fontSize: 11, color: C.textDim, fontFamily: C.fontInter, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={() => setShowSignOut(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 10px', borderRadius: 7,
          border: 'none', cursor: 'pointer',
          background: 'transparent', color: C.textDim,
          fontFamily: C.fontInter, fontSize: 12, fontWeight: 400,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = C.redDim; el.style.color = C.red }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = C.textDim }}>
          <LogOut style={{ width: 13, height: 13, flexShrink: 0 }} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`* { box-sizing: border-box; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 240, background: C.sidebar, borderRight: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>
        <aside style={{ display: 'none', flexDirection: 'column', width: 216, flexShrink: 0, height: '100%', background: C.sidebar, borderRight: `1px solid ${C.border}` }} className="gc-sidebar">
          <SidebarContent />
        </aside>

        <style>{`
          @media (min-width: 768px) {
            .gc-sidebar     { display: flex !important; }
            .gc-mobile-top  { display: none !important; }
            .gc-mobile-nav  { display: none !important; }
            .gc-desktop-bar { display: flex !important; }
          }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="gc-desktop-bar" style={{ display: 'none', alignItems: 'center', justifyContent: 'flex-end', padding: '0 18px', height: 44, background: C.sidebar, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {user && <NotificationBell userId={user.id} />}
          </div>

          <div className="gc-mobile-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 52, background: C.sidebar, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 4, display: 'flex' }}>
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <span style={{ fontFamily: C.fontSora, fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: '-0.02em' }}>
              GRIT<span style={{ color: C.blue }}>CLUB</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user && <NotificationBell userId={user.id} />}
              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563EB, #3B82F6)', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: C.fontSora }}>
                {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
            </div>
          </div>

          <main style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </main>

          <nav className="gc-mobile-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 58, background: C.sidebar, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            {navItems.slice(0, 5).map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '5px 10px' }}>
                  <item.icon style={{ width: 18, height: 18, color: active ? C.blue : C.textDim }} />
                  <span style={{ fontSize: 9, color: active ? C.blue : C.textDim, fontFamily: C.fontInter, fontWeight: active ? 500 : 400 }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
