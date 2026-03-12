'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Calendar, DollarSign, Users, Clock, ArrowLeft, Zap } from 'lucide-react'

export default function CreateEvent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 7,
    capacity: 100,
    start_time: '',
    status: 'scheduled' as 'draft' | 'scheduled',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase.from('events').insert({
      host_id: user.id,
      host_name: user.user_metadata?.full_name || user.email,
      host_photo: user.user_metadata?.avatar_url,
      title: form.title,
      description: form.description,
      price: Math.round(form.price * 100), // store in cents
      capacity: form.capacity,
      start_time: form.start_time || null,
      status: form.status,
      total_sold: 0,
      viewer_peak: 0,
    }).select().single()

    if (error) {
      alert('Error creating event: ' + error.message)
    } else {
      router.push(`/host`)
    }
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors" style={{ background: '#1E293B' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Create Event</h1>
            <p className="text-slate-400 text-sm">Go live in minutes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block text-slate-300">Event Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="How I built a $1M ARR business in 12 months"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block text-slate-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will attendees learn? What makes this valuable?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
            />
          </div>

          {/* Price, Capacity, Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Ticket Price ($)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                min={0}
                max={999}
                step={1}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
              />
              <p className="text-xs text-slate-500 mt-1">You keep 50% = ${(form.price * 0.5).toFixed(2)} per ticket</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Capacity
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 100 })}
                min={1}
                max={10000}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Start Time
              </label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium mb-2 block text-slate-300">Event Status</label>
            <div className="flex gap-3">
              {(['draft', 'scheduled'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize"
                  style={{
                    background: form.status === s ? 'rgba(56,189,248,0.15)' : '#1E293B',
                    color: form.status === s ? '#38BDF8' : '#64748B',
                    border: `1px solid ${form.status === s ? 'rgba(56,189,248,0.4)' : '#334155'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings preview */}
          {form.price > 0 && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">Earnings Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-bold text-white">${(form.price * 10 * 0.5).toFixed(0)}</div>
                  <div className="text-slate-500 text-xs">10 tickets</div>
                </div>
                <div>
                  <div className="font-bold text-white">${(form.price * 50 * 0.5).toFixed(0)}</div>
                  <div className="text-slate-500 text-xs">50 tickets</div>
                </div>
                <div>
                  <div className="font-bold text-white">${(form.price * 100 * 0.5).toFixed(0)}</div>
                  <div className="text-slate-500 text-xs">100 tickets</div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.title}
            className="btn-gold w-full py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
