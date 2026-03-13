'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { Radio, AlertCircle } from 'lucide-react'

export default function CreateEventPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    capacity: '100',
    start_time: '',
    status: 'scheduled',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const priceInCents = Math.round(parseFloat(form.price || '0') * 100)

    const { error: insertError } = await supabase.from('events').insert({
      host_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: priceInCents,
      capacity: parseInt(form.capacity) || 100,
      start_time: form.start_time || null,
      status: form.status,
      total_sold: 0,
      viewer_peak: 0,
    })

    if (insertError) {
      console.error('Create event error:', insertError)
      setError(`Error: ${insertError.message}`)
      setLoading(false)
      return
    }

    router.push('/host')
  }

  const priceNum = parseFloat(form.price || '0')
  const hostEarnings = (priceNum * 0.8).toFixed(2)

  return (
    <DashboardLayout>
      <div className="p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-slate-400 text-sm mt-1">You keep 80% of every ticket sold</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl p-5 space-y-4 mb-4" style={{ background: '#1E293B' }}>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Event Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. How I Hit $10k MRR in 90 Days"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What will attendees learn? What's the agenda?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Ticket Price ($) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
                />
                {priceNum > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: '#4ADE80' }}>
                    You keep ${hostEarnings} per ticket
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Capacity</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Start Time</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0', colorScheme: 'dark' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Status</label>
              <div className="flex gap-2">
                {['draft', 'scheduled'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className="px-4 py-2 rounded-xl text-sm font-medium capitalize"
                    style={{
                      background: form.status === s ? '#38BDF8' : '#0F172A',
                      color: form.status === s ? '#0F172A' : '#94A3B8',
                      border: '1px solid #334155'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.title || !form.price}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#FFD700', color: '#0F172A' }}
          >
            <Radio className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
