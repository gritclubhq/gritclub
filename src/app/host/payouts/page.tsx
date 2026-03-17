'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { DollarSign, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

export default function PayoutsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [pendingPayout, setPendingPayout] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: myEvents } = await supabase.from('events').select('id').eq('host_id', user.id)
      if (myEvents?.length) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount')
          .in('event_id', myEvents.map(e => e.id))
          .eq('status', 'paid')
        const total = tickets?.reduce((sum, t) => sum + t.amount, 0) || 0
        setPendingPayout(Math.floor(total * 0.8))
      }
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const hasStripe = !!profile?.stripe_connect_id

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payouts</h1>
            <p className="text-slate-400 text-sm">Connect Stripe to receive your earnings</p>
          </div>
        </div>

        {/* Pending payout */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: '#1E293B' }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Pending Payout</div>
              <div className="text-3xl font-bold text-green-400">{fmt(pendingPayout)}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500">80% of all ticket sales. Paid out every Monday via Stripe Connect.</p>
        </div>

        {/* Stripe Connect */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: '#1E293B', border: `1px solid ${hasStripe ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <div className="flex items-center gap-3 mb-4">
            {hasStripe ? <CheckCircle className="w-6 h-6 text-green-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />}
            <div>
              <div className="font-semibold">{hasStripe ? 'Stripe Connected ✓' : 'Stripe Not Connected'}</div>
              <div className="text-xs text-slate-500">{hasStripe ? 'You will receive automatic weekly payouts' : 'Connect Stripe to receive your earnings'}</div>
            </div>
          </div>
          {!hasStripe ? (
            <div className="rounded-xl p-4 text-center" style={{ background: '#0F172A' }}>
              <p className="text-sm text-slate-400 mb-3">Contact <span style={{ color: '#38BDF8' }}>admin@gritclub.live</span> to set up your Stripe payout account</p>
              <a href="mailto:admin@gritclub.live?subject=Stripe Payout Setup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: '#635BFF', color: 'white' }}>
                <ExternalLink className="w-4 h-4" />
                Request Payout Setup
              </a>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>
                Connected · {profile.stripe_connect_id}
              </span>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="p-4 rounded-xl text-sm text-slate-400" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)' }}>
          💡 <strong style={{ color: '#38BDF8' }}>How payouts work:</strong> When a ticket sells, 80% goes to you. GritClub keeps 20% as platform fee. We batch payouts every Monday. Minimum payout is $10.
        </div>
      </div>
    </DashboardLayout>
  )
}
