'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { Users, Plus, Search, Lock, Globe } from 'lucide-react'

const CATEGORIES = ['All', 'SaaS', 'Fintech', 'Health', 'E-commerce', 'AI', 'Social', 'Other']

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [myMemberships, setMyMemberships] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: g } = await supabase
        .from('groups')
        .select('*, users(email, photo_url)')
        .order('created_at', { ascending: false })

      const { data: m } = await supabase
        .from('group_members')
        .select('group_id, status, role')
        .eq('user_id', u?.id || '')

      setGroups(g || [])
      setMyMemberships(m || [])
      setLoading(false)
    }
    load()

    const ch = supabase.channel('groups-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const getMembershipStatus = (groupId: string) => {
    const m = myMemberships.find(m => m.group_id === groupId)
    return m ? m : null
  }

  const requestJoin = async (groupId: string) => {
    if (!user) return
    await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
      status: 'pending'
    })
    setMyMemberships(prev => [...prev, { group_id: groupId, status: 'pending', role: 'member' }])
  }

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || g.category === category
    return matchSearch && matchCat
  })

  const myGroups = groups.filter(g => {
    const m = getMembershipStatus(g.id)
    return g.owner_id === user?.id || m?.status === 'active'
  })

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-slate-400 text-sm mt-0.5">Join a startup team or start your own</p>
          </div>
          <Link href="/groups/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: '#FFD700', color: '#0F172A' }}>
            <Plus className="w-4 h-4" /> New Group
          </Link>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">My Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myGroups.map(g => (
                <Link key={g.id} href={`/groups/${g.id}`}
                  className="rounded-xl p-4 flex items-center gap-3 transition-all hover:opacity-80"
                  style={{ background: '#1E293B', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                    {g.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate text-white">{g.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3 h-3" />{g.member_count} members
                      {g.category && <span>· {g.category}</span>}
                    </div>
                  </div>
                  {g.owner_id === user?.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                      style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>Owner</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0"
                style={{
                  background: category === c ? '#38BDF8' : '#1E293B',
                  color: category === c ? '#0F172A' : '#94A3B8'
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* All groups */}
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Discover ({filtered.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#1E293B' }}>
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 font-medium">No groups found</p>
            <p className="text-slate-600 text-sm mt-1">Be the first to create one!</p>
            <Link href="/groups/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#FFD700', color: '#0F172A' }}>
              <Plus className="w-4 h-4" /> Create Group
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(g => {
              const membership = getMembershipStatus(g.id)
              const isOwner = g.owner_id === user?.id

              return (
                <div key={g.id} className="rounded-xl p-4" style={{ background: '#1E293B' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', color: 'white' }}>
                      {g.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">{g.name}</span>
                        {g.is_private
                          ? <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          : <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3 h-3" />{g.member_count} members
                        {g.category && <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8' }}>{g.category}</span>}
                      </div>
                    </div>
                  </div>
                  {g.description && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{g.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      by {g.users?.email?.split('@')[0]}
                    </div>
                    {isOwner || membership?.status === 'active' ? (
                      <Link href={`/groups/${g.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8' }}>
                        Open Room →
                      </Link>
                    ) : membership?.status === 'pending' ? (
                      <span className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                        Pending...
                      </span>
                    ) : (
                      <button onClick={() => requestJoin(g.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
