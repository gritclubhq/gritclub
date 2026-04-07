'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { Users, AlertCircle } from 'lucide-react'

const CATEGORIES = ['SaaS', 'Fintech', 'Health', 'E-commerce', 'AI', 'Social', 'Other']

export default function CreateGroupPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', category: 'SaaS', is_private: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const { data: group, error: gErr } = await supabase
      .from('groups')
      .insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        owner_id: user.id,
        is_private: form.is_private,
        member_count: 1,
      })
      .select()
      .single()

    if (gErr) { setError(gErr.message); setLoading(false); return }

    // Add owner as active member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'owner',
      status: 'active'
    })

    // Create blank shared note
    await supabase.from('group_notes').insert({
      group_id: group.id,
      content: '# Group Notes\n\nStart collaborating here...',
      updated_by: user.id
    })

    router.push(`/groups/${group.id}`)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create a Group</h1>
          <p className="text-slate-400 text-sm mt-1">Build your startup team and collaborate privately</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl p-5 space-y-4 mb-4" style={{ background: '#1C1C1F' }}>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Group Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. AI Scheduling SaaS, DeFi Protocol..."
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#121214', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What are you building? What kind of people are you looking for?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                style={{ background: '#121214', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{
                      background: form.category === c ? '#38BDF8' : '#121214',
                      color: form.category === c ? '#121214' : '#C7C7CC',
                      border: '1px solid #334155'
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#121214' }}>
              <div>
                <div className="text-sm font-medium text-slate-300">Private Group</div>
                <div className="text-xs text-slate-500">Only members you approve can see content</div>
              </div>
              <button type="button" onClick={() => setForm({ ...form, is_private: !form.is_private })}
                className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                style={{ background: form.is_private ? '#38BDF8' : '#334155' }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: form.is_private ? '22px' : '2px' }} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || !form.name}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#C7C7CC', color: '#121214' }}>
            <Users className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
