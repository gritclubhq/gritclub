'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Mic, CheckCircle, Clock, ArrowLeft } from 'lucide-react'

export default function BecomeHostPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [existing, setExisting] = useState<any>(null)
  const [form, setForm] = useState({ reason: '', expertise: '', social_url: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data } = await supabase
        .from('host_applications')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setExisting(data)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await supabase.from('host_applications').insert({
      user_id: user.id,
      email: user.email,
      reason: form.reason,
      expertise: form.expertise,
      social_url: form.social_url,
      status: 'pending',
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (existing || submitted) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-md mx-auto">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(56,189,248,0.15)' }}>
              <Clock className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application Submitted</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your application is under review. You'll be notified once an admin approves your host access.
            </p>
            <button onClick={() => router.back()} className="btn-sky px-6 py-3 rounded-xl text-sm font-semibold">
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.15)' }}>
              <Mic className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Become a Host</h1>
              <p className="text-slate-400 text-sm">Earn from your expertise</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: '50%', label: 'Revenue Share' },
              { value: '$7-99', label: 'Ticket Range' },
              { value: '24hr', label: 'Payout Speed' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: '#0F172A', border: '1px solid #334155' }}>
                <div className="text-lg font-bold" style={{ color: '#FFD700' }}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">Why do you want to host? *</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="What would you teach? What's your story?"
                rows={3}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">Area of expertise *</label>
              <input
                type="text"
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                placeholder="e.g. SaaS growth, fundraising, product-led growth"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">LinkedIn / Twitter (optional)</label>
              <input
                type="url"
                value={form.social_url}
                onChange={(e) => setForm({ ...form, social_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !form.reason || !form.expertise}
              className="btn-gold w-full py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
