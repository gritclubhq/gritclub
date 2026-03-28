'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Home, Ticket, Users, MessageSquare, MessageCircle, User, BarChart2,
  Calendar, DollarSign, Menu, X, LogOut,
  Radio, Zap, UserCheck, BookOpen, Settings,
  ChevronRight, Crown, Video,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

// ── GritClub Earthy Palette ──────────────────────────────────────────────────
const C = {
  bg:           '#141010',   // Onyx — page bg
  sidebar:      '#1C1410',   // Dark espresso — sidebar bg
  card:         '#291C0E',   // Espresso — cards/panels
  surface:      '#352318',   // Slightly lighter surface
  border:       'rgba(167,141,120,0.15)',
  borderHover:  'rgba(167,141,120,0.3)',
  text:         '#E1D4C2',   // Cream
  textMuted:    '#BEB5A9',   // Sage
  textDim:      '#715451',   // Warm Stone
  primary:      '#A78D78',   // Sandstone
  primaryDim:   'rgba(167,141,120,0.12)',
  accent:       '#6E473B',   // Earthenware
  accentLight:  '#8B6F5E',
  gold:         '#C4956A',   // Warm amber
  goldDim:      'rgba(196,149,106,0.12)',
  red:          '#EF4444',
  redDim:       'rgba(239,68,68,0.1)',
  green:        '#8FAF8A',
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
  { href: '/host/create',          label: 'Create Event', icon: Calendar },
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
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 16px', borderRadius: 8, padding: 28, background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.redDim, border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut style={{ width: 20, height: 20, color: C.red }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: C.text, marginBottom: 4, fontSize: 16 }}>Sign out of GritClub?</p>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>You&apos;ll need to sign back in to continue.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 6, background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 600, fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 6, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700, fontSize: 13 }}>
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

  const NavItem = ({ href, label, Icon }: { href: string; label: string; Icon: any }) => {
    const active = isActive(href)
    return (
      <Link href={href} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 6, margin: '1px 0',
            cursor: 'pointer', transition: 'all 0.15s',
            background: active ? C.primaryDim : 'transparent',
            color: active ? C.primary : C.textDim,
            borderLeft: `2px solid ${active ? C.primary : 'transparent'}`,
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 13, fontWeight: active ? 600 : 400,
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(167,141,120,0.06)'; (e.currentTarget as HTMLElement).style.color = C.textMuted } }}
          onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textDim } }}
        >
          <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
          {label}
          {active && <ChevronRight style={{ width: 11, height: 11, marginLeft: 'auto', opacity: 0.5 }} />}
        </div>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, #6E473B, #A78D78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 14, color: '#141010',
          }}>G</div>
          <div>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em',
              background: 'linear-gradient(135deg, #A78D78, #E1D4C2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              GRITCLUB
            </span>
            {role && (
              <div style={{ marginTop: 1 }}>
                <span style={{
                  fontSize: 9, fontFamily: "'Outfit', system-ui, sans-serif",
                  fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  background: role === 'admin' ? C.redDim : role === 'host' ? C.goldDim : C.primaryDim,
                  color: role === 'admin' ? C.red : role === 'host' ? C.gold : C.primary,
                }}>
                  {role}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {navItems.map(item => <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />)}

        {/* Upgrade */}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <Link href="/pricing" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 6, color: C.gold, fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.goldDim}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <Crown style={{ width: 15, height: 15 }} />
              {profile?.is_premium ? '✦ Premium' : 'Upgrade Plan'}
            </div>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div style={{ flexShrink: 0, padding: 8, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'rgba(167,141,120,0.05)', marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6E473B, #A78D78)',
            fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700, fontSize: 12, color: '#141010',
          }}>
            {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: "'Outfit', system-ui, sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{displayName}</p>
            <p style={{ fontSize: 11, color: C.textDim, fontFamily: "'Space Grotesk', system-ui, sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setShowSignOut(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'transparent', color: C.red,
            fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.redDim}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <LogOut style={{ width: 15, height: 15 }} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,141,120,0.2); border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 240, background: C.sidebar, borderRight: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(167,141,120,0.1)', color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>
        {/* Desktop sidebar */}
        <aside style={{ display: 'none', flexDirection: 'column', width: 220, flexShrink: 0, height: '100%', background: C.sidebar, borderRight: `1px solid ${C.border}` }} className="gc-sidebar">
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

          {/* Desktop topbar */}
          <div className="gc-desktop-bar" style={{ display: 'none', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', height: 46, background: C.sidebar, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {user && <NotificationBell userId={user.id} />}
          </div>

          {/* Mobile topbar */}
          <div className="gc-mobile-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 54, background: C.sidebar, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}>
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, fontSize: 18,
              background: 'linear-gradient(135deg, #A78D78, #E1D4C2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>GRITCLUB</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user && <NotificationBell userId={user.id} />}
              <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #6E473B, #A78D78)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#141010', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
            </div>
          </div>

          {/* Main content */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="gc-mobile-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 60, background: C.sidebar, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            {navItems.slice(0, 5).map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 10px' }}>
                  <item.icon style={{ width: 18, height: 18, color: active ? C.primary : C.textDim }} />
                  <span style={{ fontSize: 9, color: active ? C.primary : C.textDim, fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: active ? 600 : 400, letterSpacing: '0.05em' }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
