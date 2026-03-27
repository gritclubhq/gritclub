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
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 rounded-lg p-6 bg-card border border-border shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground mb-1">Sign out of GritClub?</p>
            <p className="text-sm text-muted-foreground font-body">You&apos;ll need to sign back in to continue.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-2 rounded border border-border bg-transparent text-muted-foreground font-heading text-sm hover:bg-secondary/50 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-2 rounded bg-destructive text-destructive-foreground font-heading text-sm font-semibold hover:bg-destructive/90 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()

  const [user,         setUser]         = useState<any>(null)
  const [profile,      setProfile]      = useState<any>(null)
  const [role,         setRole]         = useState('audience')
  const [showSignOut,  setShowSignOut]  = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)

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
      } else {
        setRole('audience')
      }
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems  = role === 'admin' ? ADMIN_NAV : role === 'host' ? HOST_NAV : AUDIENCE_NAV
  const isActive  = (href: string) => {
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
      <Link href={href} onClick={() => setMobileOpen(false)} className="block no-underline">
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm font-heading transition-all duration-150 my-0.5 border-l-2 ${
          active
            ? 'bg-primary/10 text-primary border-primary font-semibold'
            : 'text-muted-foreground border-transparent hover:bg-secondary/40 hover:text-foreground'
        }`}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
          {active && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
        </div>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-gradient-brand rounded-sm font-display font-bold text-sm text-primary-foreground">
            G
          </div>
          <div>
            <span className="font-display font-bold text-lg text-gradient-brand tracking-wide">
              GRITCLUB
            </span>
            {role && (
              <div className="mt-0.5">
                <span className={`text-[10px] font-heading font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${
                  role === 'admin'
                    ? 'bg-destructive/10 text-destructive'
                    : role === 'host'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {role}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2.5">
        {navItems.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
        <div className="mt-2 pt-2 border-t border-border">
          <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block no-underline">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-heading text-primary hover:bg-primary/10 transition-colors cursor-pointer">
              <Crown className="w-4 h-4" />
              {profile?.is_premium ? '⭐ Premium' : 'Upgrade Plan'}
            </div>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 p-2 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded bg-secondary/30 mb-1">
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-heading font-bold text-primary-foreground bg-gradient-brand">
            {photoUrl
              ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-heading font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground font-body truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setShowSignOut(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-heading text-destructive hover:bg-destructive/10 transition-colors border-none bg-transparent cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-60 bg-card border-r border-border overflow-hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded flex items-center justify-center bg-secondary/50 text-muted-foreground hover:text-foreground z-10 border-none cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-card border-r border-border">
          <SidebarContent />
        </aside>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Desktop topbar */}
          <div className="hidden md:flex items-center justify-end px-5 h-12 bg-card border-b border-border flex-shrink-0">
            {user && <NotificationBell userId={user.id} />}
          </div>

          {/* Mobile topbar */}
          <div className="flex md:hidden items-center justify-between px-4 h-14 bg-card border-b border-border flex-shrink-0">
            <button onClick={() => setMobileOpen(true)} className="bg-transparent border-none cursor-pointer text-muted-foreground p-1">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display font-bold text-lg text-gradient-brand tracking-wide">GRITCLUB</span>
            <div className="flex items-center gap-2">
              {user && <NotificationBell userId={user.id} />}
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-heading font-bold text-primary-foreground bg-gradient-brand">
                {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="flex md:hidden items-center justify-around h-16 bg-card border-t border-border flex-shrink-0">
            {navItems.slice(0, 5).map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1.5 no-underline">
                  <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-heading ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
