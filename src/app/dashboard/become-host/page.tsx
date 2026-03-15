'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Mic, CheckCircle, AlertCircle, Clock, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BecomeHostPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [existing, setExisting] = useState<any>(null)
  const [form, setForm] = useState({ expertise: '', reason: '', social_url: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role === 'host') { router.push('/host'); return }
      if (profile?.role === 'admin') { router.push('/admin'); return }

      const { data: app, error: appErr } = await supabase
        .from('host_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (appErr) console.error('fetch app error:', appErr)
      if (app) setExisting(app)
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError('')

    const payload = {
      user_id: user.id,
      email: user.email,
      expertise: form.expertise.trim(),
      reason: form.reason.trim(),
      social_url: form.social_url.trim() || null,
      status: 'pending',
    }

    const { data, error: insertErr } = await supabase
      .from('host_applications')
      .insert(payload)
      .select()
      .single()

    if (insertErr) {
      setError(`Error: ${insertErr.message} (code: ${insertErr.code})`)
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (done || existing?.status === 'pending') {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-lg mx-auto">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1E293B' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(56,189,248,0.15)' }}>
              <Clock className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your application is under review. The admin will approve you and you'll get instant access to the host dashboard.
            </p>
            {existing && (
              <div className="mt-4 p-3 rounded-xl text-xs text-slate-500" style={{ background: '#0F172A' }}>
                Submitted {new Date(existing.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (existing?.status === 'approved') {
    router.push('/host')
    return null
  }

  if (existing?.status === 'rejected') {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-lg mx-auto">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1E293B' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <X className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application Not Approved</h2>
            <p className="text-slate-400 text-sm">Contact the admin for more information.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Become a Host</h1>
          <p className="text-slate-400 text-sm mt-1">Apply to host live events and keep 80% of every ticket sold</p>
        </div>

        <div className="rounded-2xl p-4 mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(56,189,248,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[{ v: '80%', l: 'Revenue Share' }, { v: 'Live', l: 'Streaming' }, { v: '$5-99', l: 'Your Price' }].map(s => (
              <div key={s.l}>
                <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{s.v}</div>
                <div className="text-xs text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl p-5 space-y-4 mb-4" style={{ background: '#1E293B' }}>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Your Expertise *</label>
              <input
                type="text"
                value={form.expertise}
                onChange={e => setForm({ ...form, expertise: e.target.value })}
                placeholder="e.g. SaaS Growth, Fundraising, Product Strategy"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Why do you want to host? *</label>
              <textarea
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="What value will you bring? What events will you run?"
                rows={4}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">LinkedIn or Twitter (optional)</label>
              <input
                type="text"
                value={form.social_url}
                onChange={e => setForm({ ...form, social_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
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
            disabled={submitting || !form.expertise || !form.reason}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#FFD700', color: '#0F172A' }}>
            <Mic className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Host Application'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
