'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Mic, Home, Calendar, Ticket, Users, Settings, LogOut,
  Radio, DollarSign, BarChart2, Shield, Menu, X, Bell, User
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const AUDIENCE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Discover', icon: Home },
  { href: '/dashboard/tickets', label: 'My Tickets', icon: Ticket },
  { href: '/dashboard/network', label: 'Network', icon: Users },
  { href: '/dashboard/community', label: 'Community', icon: Radio },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

const HOST_NAV: NavItem[] = [
  { href: '/host', label: 'Dashboard', icon: BarChart2 },
  { href: '/host/create', label: 'Create Event', icon: Calendar },
  { href: '/host/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/host/network', label: 'Network', icon: Users },
  { href: '/host/payouts', label: 'Payouts', icon: DollarSign },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: BarChart2 },
  { href: '/admin/hosts', label: 'Host Approvals', icon: Shield },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
]

// ─── Sign Out Modal ───────────────────────────────────────────────────────────
function SignOutModal({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal box */}
      <div className="relative rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border"
        style={{ background: '#1E293B', borderColor: '#334155' }}>
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.12)' }}>
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          {/* Text */}
          <div>
            <h2 className="text-white font-semibold text-lg">Sign out?</h2>
            <p className="text-slate-400 text-sm mt-1">
              You'll need to sign back in to access your dashboard.
            </p>
          </div>
          {/* Buttons */}
          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 border transition-colors hover:bg-white/5"
              style={{ borderColor: '#334155' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ photoUrl, fallback, size = 8 }: { photoUrl?: string | null, fallback: string, size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden`}
      style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      supabase.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data)
      })
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = profile?.role === 'admin' ? ADMIN_NAV : profile?.role === 'host' ? HOST_NAV : AUDIENCE_NAV

  // Fallback initials — prefer DB name, then Google name, then email
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U'
  const initials = getInitials(displayName)
  const photoUrl = profile?.photo_url || null

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: '#334155' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }}>
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            Grit<span style={{ color: '#FFD700' }}>Club</span>
          </span>
        </div>
      </div>

      {/* Role badge */}
      {profile?.role && (
        <div className="px-5 pt-4">
          <span className="text-xs font-semibold px-2 py-1 rounded" style={{
            background: profile.role === 'admin' ? 'rgba(239,68,68,0.15)' : profile.role === 'host' ? 'rgba(255,215,0,0.15)' : 'rgba(56,189,248,0.15)',
            color: profile.role === 'admin' ? '#F87171' : profile.role === 'host' ? '#FFD700' : '#38BDF8',
          }}>
            {profile.role.toUpperCase()}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/host' && item.href !== '/admin' &&
              pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-item ${active ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User profile + sign out */}
      <div className="p-4 border-t" style={{ borderColor: '#334155' }}>
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar — shows photo_url from DB, falls back to initials */}
          <Avatar photoUrl={photoUrl} fallback={initials} size={8} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {profile?.full_name || user?.user_metadata?.full_name || 'User'}
            </div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
        {/* Sign out — now opens modal instead of signing out immediately */}
        <button
          onClick={() => setShowSignOutModal(true)}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Sign out confirmation modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutModal(false)}
      />

      <div className="flex h-screen overflow-hidden" style={{ background: '#0F172A' }}>
        {/* Desktop Sidebar */}
        <aside className="sidebar-desktop w-60 flex-shrink-0 border-r overflow-y-auto"
          style={{ background: '#0F172A', borderColor: '#1E293B' }}>
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 flex-shrink-0 overflow-y-auto"
              style={{ background: '#0F172A', borderRight: '1px solid #1E293B' }}>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between px-4 h-14 border-b flex-shrink-0"
            style={{ borderColor: '#1E293B', background: '#0F172A' }}>
            <button onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <span className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Grit<span style={{ color: '#FFD700' }}>Club</span>
            </span>
            {/* Mobile top-right avatar also uses photo_url */}
            <Avatar photoUrl={photoUrl} fallback={initials} size={8} />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="mobile-bottom-nav border-t flex items-center justify-around h-16 flex-shrink-0"
            style={{ background: '#0F172A', borderColor: '#1E293B' }}>
            {navItems.slice(0, 5).map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-2 px-3">
                  <item.icon className="w-5 h-5" style={{ color: active ? '#38BDF8' : '#64748B' }} />
                  <span className="text-xs" style={{ color: active ? '#38BDF8' : '#64748B' }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
