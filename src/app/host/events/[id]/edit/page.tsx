'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Save, CheckCircle, ArrowLeft } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState({ title: '', description: '', price: '', capacity: '', start_time: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('host_id', user.id)
        .single()

      if (!event) { router.push('/host'); return }

      setForm({
        title: event.title || '',
        description: event.description || '',
        price: event.price ? (event.price / 100).toString() : '',
        capacity: event.capacity?.toString() || '',
        start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
      })
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: form.title,
        description: form.description,
        price: Math.round(parseFloat(form.price) * 100),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => { setSaved(false); router.push('/host') }, 1500)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />)}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/host')} className="p-2 rounded-xl" style={{ background: '#1E293B' }}>
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Edit Event</h1>
            <p className="text-slate-400 text-sm">Update your event details</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#1E293B' }}>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Event Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
              style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Ticket Price ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                placeholder="Unlimited"
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

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !form.title}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: saved ? 'rgba(74,222,128,0.2)' : '#38BDF8', color: saved ? '#4ADE80' : '#0F172A' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
