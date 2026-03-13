'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Mic, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BecomeHostPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [existing, setExisting] = useState<any>(null)
  const [form, setForm] = useState({ expertise: '', reason: '', social_url: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role === 'host' || profile?.role === 'admin') {
        router.push('/host'); return
      }

      const { data: app } = await supabase.from('host_applications').select('*').eq('user_id', user.id).maybeSingle()
      if (app) setExisting(app)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('host_applications').insert({
        user_id: user.id,
        email: user.email,
        expertise: form.expertise,
        reason: form.reason,
        social_url: form.social_url || null,
        status: 'pending',
      })

      if (insertError) {
        console.error('Insert error:', insertError)
        setError(`Failed to submit: ${insertError.message}`)
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  if (submitted || existing?.status === 'pending') {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-lg mx-auto">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1E293B' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(56,189,248,0.15)' }}>
              <CheckCircle className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application Submitted! 🎉</h2>
            <p className="text-slate-400 text-sm">Your host application is under review. The admin will approve you shortly and you'll get instant access to the host dashboard.</p>
            <div className="mt-4 p-3 rounded-xl text-xs text-slate-500" style={{ background: '#0F172A' }}>
              Submitted on {existing ? new Date(existing.created_at).toLocaleDateString() : 'just now'}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (existing?.status === 'approved') {
    router.push('/host')
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Become a Host</h1>
          <p className="text-slate-400 text-sm mt-1">Apply to host live events and keep 80% of every ticket</p>
        </div>

        {/* What you get */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(56,189,248,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: '80%', sub: 'Revenue Share' },
              { label: 'Live', sub: 'Stream Tools' },
              { label: '$5-99', sub: 'Ticket Pricing' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{s.label}</div>
                <div className="text-xs text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#1E293B' }}>
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
                placeholder="What value will you bring to founders? What events will you run?"
                rows={4}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">LinkedIn or Twitter (optional)</label>
              <input
                type="url"
                value={form.social_url}
                onChange={e => setForm({ ...form, social_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.expertise || !form.reason}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#FFD700', color: '#0F172A' }}
          >
            <Mic className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Host Application'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
