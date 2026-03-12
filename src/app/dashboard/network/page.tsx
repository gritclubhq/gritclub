'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { getInitials } from '@/lib/utils'
import { Users, UserPlus, CheckCircle, Search, Link as LinkIcon } from 'lucide-react'

export default function NetworkPage() {
  const [user, setUser] = useState<any>(null)
  const [connections, setConnections] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // Get accepted connections
      const { data: conns } = await supabase
        .from('connections')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted')

      setConnections(conns || [])

      // Get co-attendees as suggestions (people who attended same events)
      const { data: myTickets } = await supabase
        .from('tickets')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('status', 'paid')

      if (myTickets && myTickets.length > 0) {
        const eventIds = myTickets.map((t: any) => t.event_id)
        const { data: coAttendees } = await supabase
          .from('tickets')
          .select('user_id, events(title)')
          .in('event_id', eventIds)
          .neq('user_id', user.id)
          .eq('status', 'paid')
          .limit(20)

        // Get profiles of co-attendees
        if (coAttendees && coAttendees.length > 0) {
          const ids = [...new Set(coAttendees.map((c: any) => c.user_id))]
          const { data: profiles } = await supabase
            .from('users')
            .select('id, email, profile_bio, photo_url')
            .in('id', ids)
            .limit(10)

          setSuggestions(profiles || [])
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const sendConnection = async (targetId: string) => {
    if (!user) return
    await supabase.from('connections').insert({
      user1_id: user.id,
      user1_name: user.user_metadata?.full_name || user.email,
      user2_id: targetId,
      status: 'requested',
    })
    setSuggestions(prev => prev.filter(s => s.id !== targetId))
  }

  const filteredConnections = connections.filter(c => {
    const name = c.user1_id === user?.id ? c.user2_name : c.user1_name
    return name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Network</h1>
          <p className="text-slate-400 text-sm mt-1">Founders you've connected with at events</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
            style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
          />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              People you met at events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.slice(0, 6).map(person => (
                <div key={person.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                      {person.photo_url ? (
                        <img src={person.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        getInitials(person.email || 'U')
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{person.email?.split('@')[0]}</div>
                      <div className="text-xs text-slate-500 truncate">{person.profile_bio || 'Founder'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => sendConnection(person.id)}
                    className="p-2 rounded-lg text-sky-400 hover:bg-sky-400/10 transition-colors flex-shrink-0"
                    title="Connect"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your Connections ({filteredConnections.length})
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />
              ))}
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-medium mb-2">No connections yet</h3>
              <p className="text-slate-500 text-sm">Attend events to connect with founders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredConnections.map(conn => {
                const isUser1 = conn.user1_id === user?.id
                const name = isUser1 ? conn.user2_name : conn.user1_name
                const photo = isUser1 ? conn.user2_photo : conn.user1_photo
                return (
                  <div key={conn.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', color: 'white' }}>
                      {photo ? <img src={photo} alt="" className="w-10 h-10 rounded-full object-cover" /> : getInitials(name || 'U')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{name || 'Founder'}</div>
                      <div className="flex items-center gap-1 text-xs text-green-400 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
