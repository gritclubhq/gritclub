'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Home, Calendar, Ticket, Users, LogOut,
  Radio, DollarSign, BarChart2, Shield, Menu, User
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [roleReady, setRoleReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      supabase.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data)
        setRoleReady(true)
      })
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Don't render nav until role is loaded — prevents flicker
  const navItems = !roleReady ? [] : profile?.role === 'admin' ? ADMIN_NAV : profile?.role === 'host' ? HOST_NAV : AUDIENCE_NAV

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <img src="/logo.png" alt="GritClub" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
        <span style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>
          Grit<span style={{ color: '#FFD700' }}>Club</span>
        </span>
      </div>

      {/* Role badge — only show when loaded */}
      {roleReady && profile?.role && (
        <div className="px-5 pb-2">
          <span className="text-xs font-semibold px-2 py-1 rounded" style={{
            background: profile.role === 'admin' ? 'rgba(239,68,68,0.15)' : profile.role === 'host' ? 'rgba(255,215,0,0.15)' : 'rgba(56,189,248,0.15)',
            color: profile.role === 'admin' ? '#F87171' : profile.role === 'host' ? '#FFD700' : '#38BDF8',
          }}>
            {profile.role.toUpperCase()}
          </span>
        </div>
      )}

      {/* Nav — skeleton while loading */}
      <nav className="flex-1 p-4 space-y-1">
        {!roleReady ? (
          // Skeleton nav items while role loads
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-9 rounded-lg animate-pulse mb-1" style={{ background: '#1E293B' }} />
          ))
        ) : (
          navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/host' && item.href !== '/admin' && pathname.startsWith(item.href))
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
          })
        )}
      </nav>

      {/* User info — NO sign out button here */}
      <div className="p-4 border-t" style={{ borderColor: '#334155' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
              : getInitials(user?.user_metadata?.full_name || user?.email || 'U')
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0F172A' }}>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop w-60 flex-shrink-0 border-r overflow-y-auto" style={{ background: '#0F172A', borderColor: '#1E293B' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex-shrink-0 overflow-y-auto" style={{ background: '#0F172A', borderRight: '1px solid #1E293B' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b flex-shrink-0" style={{ borderColor: '#1E293B', background: '#0F172A' }}>
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
            <span className="font-bold">Grit<span style={{ color: '#FFD700' }}>Club</span></span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
              : getInitials(user?.user_metadata?.full_name || user?.email || 'U')
            }
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="mobile-bottom-nav border-t flex items-center justify-around h-16 flex-shrink-0" style={{ background: '#0F172A', borderColor: '#1E293B' }}>
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
  )
}
