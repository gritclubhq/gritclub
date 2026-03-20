'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Home, Ticket, Users, MessageSquare, User, BarChart2,
  Calendar, DollarSign, Shield, Menu, X, LogOut,
  Radio, Mic, Zap, UserCheck, BookOpen, Settings, Bell,
  ChevronRight, Crown, FileText
, Video } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

const C = {
  bg: '#0A0F1E', sidebar: '#0D1428', card: '#111827',
  border: 'rgba(255,255,255,0.06)', hover: 'rgba(255,255,255,0.04)',
  active: 'rgba(37,99,235,0.12)', activeBorder: '#2563EB',
  text: '#F0F4FF', textMuted: '#7B8DB0', textDim: '#3D4F6E',
  blue: '#2563EB', blueLight: '#3B82F6', blueDim: 'rgba(37,99,235,0.12)',
  gold: '#F59E0B', red: '#EF4444', redDim: 'rgba(239,68,68,0.1)',
  green: '#10B981',
}

const AUDIENCE_NAV = [
  { href: '/dashboard',           label: 'Discover',   icon: Home },
  { href: '/dashboard/tickets',   label: 'My Tickets', icon: Ticket },
  { href: '/dashboard/network',   label: 'Network',    icon: Users },
  { href: '/groups',              label: 'Groups',     icon: Zap },
  { href: '/dashboard/community', label: 'Community',  icon: MessageSquare },
  { href: '/dashboard/recordings', label: 'Recordings', icon: Video },
  { href: '/dashboard/profile',   label: 'Profile',    icon: User },
]

const HOST_NAV = [
  { href: '/host',                label: 'Dashboard',   icon: BarChart2 },
  { href: '/host/create',         label: 'Create Event',icon: Calendar },
  { href: '/host/earnings',       label: 'Earnings',    icon: DollarSign },
  { href: '/dashboard/network',   label: 'Network',     icon: Users },
  { href: '/groups',              label: 'Groups',      icon: Zap },
  { href: '/dashboard/community', label: 'Community',   icon: MessageSquare },
  { href: '/dashboard/recordings', label: 'Recordings',  icon: Video },
  { href: '/dashboard/profile',   label: 'Profile',     icon: User },
]

const ADMIN_NAV = [
  { href: '/admin',               label: 'Overview',      icon: BarChart2 },
  { href: '/admin/users',         label: 'Users',          icon: Users },
  { href: '/admin/hosts',         label: 'Host Approvals', icon: UserCheck },
  { href: '/admin/events',        label: 'Events',         icon: Radio },
  { href: '/admin/groups',        label: 'Groups',         icon: Zap },
  { href: '/admin/content',       label: 'Content',        icon: BookOpen },
  { href: '/admin/revenue',       label: 'Revenue',        icon: DollarSign },
  { href: '/admin/settings',      label: 'Settings',       icon: Settings },
]

function SignOutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 16px', borderRadius: 20, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut style={{ width: 20, height: 20, color: C.red }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>Sign out of GritClub?</p>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans,sans-serif' }}>You'll need to sign back in to continue.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: C.textMuted, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 12, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Key fix: store role separately to prevent nav flicker
  const [role,     setRole]     = useState<string | null>(null)
  const [profile,  setProfile]  = useState<any>(null)
  const [user,     setUser]     = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [announcement, setAnnouncement] = useState<any>(null)
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double-load (fixes glitch)
    if (initialized.current) return
    initialized.current = true

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: prof } = await supabase
        .from('users')
        .select('id, email, full_name, photo_url, role, username, is_premium, onboarding_done')
        .eq('id', u.id)
        .single()

      if (prof) {
        setProfile(prof)
        setRole(prof.role || 'audience')

        // Redirect to onboarding if no username
        if (!prof.username && !prof.onboarding_done && pathname !== '/onboarding') {
          router.push('/onboarding')
          return
        }
      } else {
        setRole('audience')
      }

      // Fetch announcement
      try {
        const { data: ann } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (ann) setAnnouncement(ann)
      } catch {}
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Use role to determine nav — stable, no flicker
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
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12,
          margin: '1px 0', cursor: 'pointer', transition: 'background 0.15s',
          background: active ? C.active : 'transparent',
          color: active ? C.blueLight : C.textMuted,
          borderLeft: `2px solid ${active ? C.activeBorder : 'transparent'}`,
          fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: active ? 600 : 400,
        }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.hover }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
          {label}
          {active && <ChevronRight style={{ width: 12, height: 12, marginLeft: 'auto', opacity: 0.4 }} />}
        </div>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mic style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: C.text }}>
              Grit<span style={{ color: C.gold }}>Club</span>
            </span>
            {role && (
              <div style={{ marginTop: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5, fontFamily: 'DM Sans,sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: role==='admin' ? 'rgba(239,68,68,0.12)' : role==='host' ? 'rgba(245,158,11,0.12)' : 'rgba(37,99,235,0.12)',
                  color: role==='admin' ? C.red : role==='host' ? C.gold : C.blueLight,
                }}>{role}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {navItems.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
        {/* Pricing link */}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <Link href="/pricing" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, color: C.gold, fontFamily: 'DM Sans,sans-serif', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <Crown style={{ width: 16, height: 16 }} />
              {profile?.is_premium ? '⭐ Premium' : 'Upgrade Plan'}
            </div>
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div style={{ flexShrink: 0, padding: '8px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.hover, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)', color: '#fff' }}>
            {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
            <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={() => setShowSignOut(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: C.red, fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redDim }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <LogOut style={{ width: 15, height: 15 }} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 240, background: C.sidebar, borderRight: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg }}>
        {/* Desktop sidebar */}
        <aside style={{ display: 'none', flexDirection: 'column', width: 220, flexShrink: 0, height: '100%', background: C.sidebar, borderRight: `1px solid ${C.border}`, position: 'relative' }}
          className="md-sidebar">
          <SidebarContent />
        </aside>

        <style>{`
          @media (min-width: 768px) { .md-sidebar { display: flex !important; } .mobile-top { display: none !important; } .mobile-bottom { display: none !important; } .md-topbar { display: flex !important; } }
        `}</style>

        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Desktop top header — bell + page title area */}
          <div className="md-topbar" style={{ display:'none', alignItems:'center', justifyContent:'flex-end', padding:'0 20px', height:52, background:C.sidebar, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {user && <NotificationBell userId={user.id} />}
          </div>

          {/* Mobile top bar */}
          <div className="mobile-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: C.sidebar, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}>
              <Menu style={{ width: 22, height: 22 }} />
            </button>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: C.text }}>
              Grit<span style={{ color: C.gold }}>Club</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user && <NotificationBell userId={user.id} />}
              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>
                {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
            </div>
          </div>

          {/* Announcement banner */}
          {announcement && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(37,99,235,0.1)', borderBottom: '1px solid rgba(37,99,235,0.2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell style={{ width: 14, height: 14, color: C.blueLight, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.blueLight, fontFamily: 'DM Sans,sans-serif' }}>
                  <strong>{announcement.title}:</strong> {announcement.body}
                </span>
              </div>
              <button onClick={() => setAnnouncement(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 2 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="mobile-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 60, background: C.sidebar, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            {navItems.slice(0, 5).map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 12px' }}>
                  <item.icon style={{ width: 20, height: 20, color: active ? C.blueLight : C.textDim }} />
                  <span style={{ fontSize: 10, color: active ? C.blueLight : C.textDim, fontFamily: 'DM Sans,sans-serif', fontWeight: active ? 600 : 400 }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
