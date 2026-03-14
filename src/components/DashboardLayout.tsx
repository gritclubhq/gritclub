'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Home, Ticket, Users, MessageSquare, User, BarChart2,
  Calendar, DollarSign, Shield, Menu, X, LogOut,
  Radio, Mic, Settings, Bell, ChevronRight, Zap,
  BookOpen, UserCheck
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0A0F1E',
  sidebar:     '#0D1428',
  border:      'rgba(255,255,255,0.06)',
  hover:       'rgba(255,255,255,0.05)',
  active:      'rgba(37,99,235,0.15)',
  activeBorder:'rgba(37,99,235,0.6)',
  text:        '#F0F4FF',
  textMuted:   '#7B8DB0',
  textDim:     '#3D4F6E',
  blue:        '#2563EB',
  blueLight:   '#3B82F6',
  blueDim:     'rgba(37,99,235,0.12)',
  gold:        '#F59E0B',
  goldDim:     'rgba(245,158,11,0.12)',
  red:         '#EF4444',
  redDim:      'rgba(239,68,68,0.12)',
  green:       '#10B981',
}

// ─── Nav items per role ────────────────────────────────────────────────────────
const AUDIENCE_NAV = [
  { href: '/dashboard',           label: 'Discover',    icon: Home },
  { href: '/dashboard/tickets',   label: 'My Tickets',  icon: Ticket },
  { href: '/dashboard/network',   label: 'Network',     icon: Users },
  { href: '/groups',              label: 'Groups',      icon: Zap },
  { href: '/dashboard/community', label: 'Community',   icon: MessageSquare },
  { href: '/dashboard/profile',   label: 'Profile',     icon: User },
]

const HOST_NAV = [
  { href: '/host',                label: 'Dashboard',   icon: BarChart2 },
  { href: '/host/create',         label: 'Create Event',icon: Calendar },
  { href: '/host/earnings',       label: 'Earnings',    icon: DollarSign },
  { href: '/dashboard/network',   label: 'Network',     icon: Users },
  { href: '/groups',              label: 'Groups',      icon: Zap },
  { href: '/dashboard/community', label: 'Community',   icon: MessageSquare },
  { href: '/dashboard/profile',   label: 'Profile',     icon: User },
]

const ADMIN_NAV = [
  { href: '/admin',               label: 'Overview',    icon: BarChart2 },
  { href: '/admin/users',         label: 'Users',       icon: Users },
  { href: '/admin/hosts',         label: 'Host Approvals', icon: UserCheck },
  { href: '/admin/events',        label: 'Events',      icon: Radio },
  { href: '/admin/groups',        label: 'Groups',      icon: Zap },
  { href: '/admin/revenue',       label: 'Revenue',     icon: DollarSign },
  { href: '/admin/content',       label: 'Content',     icon: BookOpen },
  { href: '/admin/settings',      label: 'Settings',    icon: Settings },
]

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    admin:    { bg: 'rgba(239,68,68,0.12)',   color: '#F87171', label: 'Admin' },
    host:     { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', label: 'Host' },
    audience: { bg: 'rgba(37,99,235,0.12)',   color: '#3B82F6', label: 'Member' },
  }
  const s = styles[role] || styles.audience
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-md tracking-wider uppercase"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

// ─── Sign-out confirmation modal ──────────────────────────────────────────────
function SignOutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl"
        style={{ background: '#111827', border: `1px solid ${C.border}` }}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: C.redDim }}>
            <LogOut className="w-5 h-5" style={{ color: C.red }} />
          </div>
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: C.text }}>Sign out of GritClub?</h2>
            <p className="text-sm" style={{ color: C.textMuted }}>You'll need to sign back in to access your account.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: C.hover, color: C.textMuted, border: `1px solid ${C.border}` }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: C.red, color: '#fff' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({
  href, label, icon: Icon, active, onClick
}: {
  href: string; label: string; icon: any; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative"
        style={{
          background:  active ? C.active    : 'transparent',
          color:       active ? C.blueLight : C.textMuted,
          borderLeft:  active ? `2px solid ${C.activeBorder}` : '2px solid transparent',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.hover }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{label}</span>
        {active && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
      </div>
    </Link>
  )
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [user,    setUser]    = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [showSignOut,    setShowSignOut]    = useState(false)
  const [announcement,   setAnnouncement]   = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', u.id)
        .single()
      setProfile(prof)

      // Redirect to onboarding if username not set
      if (prof && !prof.username && !prof.onboarding_done) {
        if (pathname !== '/onboarding') router.push('/onboarding')
        return
      }

      // Fetch active announcement
      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (ann) setAnnouncement(ann)
    })
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const role     = profile?.role || 'audience'
  const navItems = role === 'admin' ? ADMIN_NAV : role === 'host' ? HOST_NAV : AUDIENCE_NAV

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const photoUrl    = profile?.photo_url || user?.user_metadata?.avatar_url || null
  const initials    = displayName.slice(0, 2).toUpperCase()

  // Active check
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/host')      return pathname === '/host'
    if (href === '/admin')     return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}
        >
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
            Grit<span style={{ color: C.gold }}>Club</span>
          </span>
          {profile?.role && (
            <div className="mt-0.5">
              <RoleBadge role={profile.role} />
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 p-3 space-y-1" style={{ borderTop: `1px solid ${C.border}` }}>
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: C.hover }}>
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)', color: '#fff' }}
          >
            {photoUrl
              ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{displayName}</p>
            <p className="text-xs truncate" style={{ color: C.textDim }}>{user?.email}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => setShowSignOut(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: C.red }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redDim }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Sign out modal */}
      {showSignOut && (
        <SignOutModal
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOut(false)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative w-64 flex-shrink-0 h-full overflow-hidden"
            style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center z-10"
              style={{ background: C.hover, color: C.textMuted }}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex h-screen overflow-hidden" style={{ background: C.bg }}>
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-60 flex-shrink-0 h-full"
          style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
        >
          <SidebarContent />
        </aside>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Mobile top bar */}
          <div
            className="md:hidden flex items-center justify-between px-4 h-14 flex-shrink-0"
            style={{ background: C.sidebar, borderBottom: `1px solid ${C.border}` }}
          >
            <button onClick={() => setMobileOpen(true)} style={{ color: C.textMuted }}>
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-base font-bold" style={{ color: C.text, fontFamily: 'Syne, sans-serif' }}>
              Grit<span style={{ color: C.gold }}>Club</span>
            </span>
            <div
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)', color: '#fff' }}
            >
              {photoUrl
                ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
          </div>

          {/* Global announcement banner */}
          {announcement && (
            <div
              className="flex items-center justify-between px-4 py-2 flex-shrink-0 text-sm"
              style={{ background: 'rgba(37,99,235,0.12)', borderBottom: `1px solid rgba(37,99,235,0.2)` }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.blueLight }} />
                <span style={{ color: C.blueLight }}>
                  <strong>{announcement.title}:</strong> {announcement.body}
                </span>
              </div>
              <button onClick={() => setAnnouncement(null)} style={{ color: C.textDim }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav
            className="md:hidden flex items-center justify-around h-16 flex-shrink-0"
            style={{ background: C.sidebar, borderTop: `1px solid ${C.border}` }}
          >
            {navItems.slice(0, 5).map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-2">
                  <item.icon className="w-5 h-5" style={{ color: active ? C.blueLight : C.textDim }} />
                  <span className="text-xs" style={{ color: active ? C.blueLight : C.textDim }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
