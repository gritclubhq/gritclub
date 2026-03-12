'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Radio, Users, Clock, Play, Lock, Shield, CheckCircle, ArrowLeft } from 'lucide-react'

export default function EventDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [hasTicket, setHasTicket] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'basic' | 'vip'>('basic')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: evt } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(evt)

      if (user && evt) {
        const { data: ticket } = await supabase
          .from('tickets')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', evt.id)
          .eq('status', 'paid')
          .single()
        setHasTicket(!!ticket)
      }
      
      setLoading(false)
    }
    init()
  }, [id])

  const handlePurchase = async () => {
    if (!user) { router.push('/auth/login'); return }
    setPurchasing(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tier: selectedTier,
          userId: user.id,
        }),
      })

      const { url } = await response.json()
      if (url) window.location.href = url
    } catch (err) {
      alert('Payment failed. Please try again.')
    }
    setPurchasing(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />
        </div>
      </DashboardLayout>
    )
  }

  if (!event) return (
    <DashboardLayout>
      <div className="p-6 text-center">Event not found</div>
    </DashboardLayout>
  )

  const isLive = event.status === 'live'
  const vipPrice = event.price * 3 // VIP is 3x basic

  const tiers = [
    {
      id: 'basic' as const,
      label: 'Basic Access',
      price: event.price,
      features: ['Live stream access', '7-day replay', 'Chat participation'],
    },
    {
      id: 'vip' as const,
      label: 'VIP Access',
      price: vipPrice,
      features: ['Everything in Basic', 'Lifetime replay access', 'Networking lounge', 'Direct host Q&A', '🏆 VIP badge'],
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="h-48 relative" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}>
                {event.poster_url ? (
                  <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Radio className="w-16 h-16 text-slate-700" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  {isLive ? (
                    <span className="badge-live px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />
                      LIVE NOW
                    </span>
                  ) : (
                    <span className="badge-upcoming px-3 py-1 rounded-full text-xs font-medium">UPCOMING</span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>{event.title}</h1>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                    {event.host_photo ? (
                      <img src={event.host_photo} alt={event.host_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      getInitials(event.host_name || 'H')
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{event.host_name}</div>
                    <span className="badge-host px-2 py-0.5 rounded text-xs">HOST</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {event.start_time ? formatDate(event.start_time) : 'TBD'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {event.total_sold || 0} / {event.capacity || '∞'} sold
                  </span>
                </div>

                {event.description && (
                  <div className="mt-4 pt-4 border-t text-sm text-slate-400 leading-relaxed" style={{ borderColor: '#334155' }}>
                    {event.description}
                  </div>
                )}
              </div>
            </div>

            {/* Mutual connections placeholder */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-medium">Attendees</span>
              </div>
              <p className="text-xs text-slate-500">{event.total_sold || 0} founders registered · {isLive ? `${event.viewer_peak} watching live` : 'Be the first to join'}</p>
            </div>
          </div>

          {/* Checkout sidebar */}
          <div className="space-y-4">
            {hasTicket ? (
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">You're registered!</span>
                </div>
                <a
                  href={`/live/${event.id}`}
                  className="btn-sky w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isLive ? 'Join Live Stream' : 'Enter Room'}
                </a>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Get Access</h3>

                <div className="space-y-3 mb-5">
                  {tiers.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className="w-full p-4 rounded-xl text-left transition-all"
                      style={{
                        background: selectedTier === tier.id ? 'rgba(56,189,248,0.1)' : '#0F172A',
                        border: selectedTier === tier.id ? '1px solid rgba(56,189,248,0.4)' : '1px solid #334155',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{tier.label}</span>
                        <span className="font-bold" style={{ color: '#FFD700' }}>{formatCurrency(tier.price)}</span>
                      </div>
                      <ul className="space-y-1">
                        {tier.features.map(f => (
                          <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="btn-gold w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {purchasing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {purchasing ? 'Redirecting...' : `Buy ${selectedTier === 'vip' ? 'VIP' : 'Basic'} — ${formatCurrency(selectedTier === 'vip' ? vipPrice : event.price)}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                  <Shield className="w-3 h-3" />
                  Secure payment via Stripe
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
