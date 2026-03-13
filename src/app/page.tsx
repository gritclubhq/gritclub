'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, Users, TrendingUp, Zap, Star, ArrowRight, Radio, Clock, Lock, DollarSign, Shield, Mic } from 'lucide-react'

const STATS = [
  { label: 'Founders Connected', value: '2,400+' },
  { label: 'Revenue Shared', value: '$84K' },
  { label: 'Events Hosted', value: '340+' },
  { label: 'Avg Event Rating', value: '4.9★' },
]

const FEATURES = [
  {
    icon: Radio,
    title: 'Go Live in Seconds',
    desc: 'Native WebRTC streaming. No OBS, no setup. Camera + screen share + whiteboard ready instantly.',
    color: '#EF4444',
  },
  {
    icon: DollarSign,
    title: 'Keep 80% of Revenue',
    desc: 'You keep 80% of every ticket sold. Platform handles payments, security, and infrastructure — we only take 20%.',
    color: '#FFD700',
  },
  {
    icon: Users,
    title: 'Professional Networking',
    desc: 'See mutual connections at events. Auto-suggest "Connect with speakers?" after sessions.',
    color: '#38BDF8',
  },
  {
    icon: Shield,
    title: 'AI Chat Moderation',
    desc: 'OpenAI-powered AutoMod keeps founder conversations professional. Host /mute /ban controls.',
    color: '#10B981',
  },
  {
    icon: TrendingUp,
    title: 'Tiered Ticket Access',
    desc: '$7 basic (live + 7d replay) or $27 VIP (lifetime access + networking lounge).',
    color: '#A855F7',
  },
  {
    icon: Zap,
    title: 'Realtime Everything',
    desc: 'Earnings tick up live. Viewer counts update every 2s. New events appear across all dashboards instantly.',
    color: '#F59E0B',
  },
]

const TESTIMONIALS = [
  {
    name: 'Jake Harris',
    role: 'Founder, Nifty50',
    quote: 'Made $329 from my first event. Keeping 80% of ticket sales is genuinely fair — no other platform comes close.',
    avatar: 'JH',
  },
  {
    name: 'Sarah Chen',
    role: 'CEO, BuildFast',
    quote: 'GritClub\'s networking features are insane. I made 3 co-founder connections at a single event.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Webb',
    role: 'Investor & Operator',
    quote: 'The audience quality is 10x better than any webinar platform. These are real founders with real capital.',
    avatar: 'MW',
  },
]

export default function Landing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(15,23,42,0.97)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(51,65,85,0.5)' : 'none',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="GritClub"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Grit<span style={{ color: '#FFD700' }}>Club</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/auth/login" className="btn-gold px-5 py-2 rounded-lg text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #38BDF8 0%, transparent 70%)' }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
            <span className="w-2 h-2 rounded-full bg-red-500 live-dot" />
            3 founders live right now
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Where founders come
            <br />
            <span className="gradient-text">to learn & earn</span>
          </h1>

          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto leading-relaxed">
            Host ticketed live business events. Keep 80% of every dollar. Build real relationships with founders who are actually building.
          </p>

          <p className="text-sm mb-10 font-medium" style={{ color: '#FFD700' }}>
            We only take 20% — the lowest cut in the industry.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/login" className="btn-gold px-8 py-4 rounded-xl text-lg w-full sm:w-auto text-center">
              Start Hosting Free →
            </Link>
            <Link href="/auth/login" className="px-8 py-4 rounded-xl text-lg font-semibold w-full sm:w-auto text-center transition-all hover:bg-slate-800" style={{ border: '1px solid rgba(51,65,85,0.8)', color: '#94A3B8' }}>
              Browse Events
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">No credit card required · Free to attend</p>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-20 px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-5 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#38BDF8', fontFamily: 'Space Grotesk' }}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue highlight banner */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(56,189,248,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="text-4xl font-bold mb-2" style={{ color: '#FFD700', fontFamily: 'Space Grotesk' }}>80% yours. Always.</div>
          <p className="text-slate-400 text-lg">Host a $20 event with 50 attendees → you pocket <span style={{ color: '#FFD700', fontWeight: '700' }}>$800</span>. We take $200. Fair and transparent.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Everything a founder needs
            </h2>
            <p className="text-slate-400 text-lg">Built for founders who value their time and their expertise</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6 event-card">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4" style={{ background: 'rgba(30,41,59,0.3)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Space Grotesk' }}>
            Live in 3 steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create your event', desc: 'Set topic, price ($5–$99), capacity, and time. Draft or schedule instantly.' },
              { step: '02', title: 'Go live', desc: 'One click. Camera, screen share, whiteboard, or slides — your choice.' },
              { step: '03', title: 'Keep 80%', desc: 'Ticket revenue auto-splits. You keep 80%, we take 20%. Payouts every week.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-6xl font-bold mb-4 opacity-20" style={{ fontFamily: 'Space Grotesk', color: '#38BDF8' }}>{s.step}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Space Grotesk' }}>
            Founders love GritClub
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk' }}>
            Ready to earn from
            <br />
            <span className="gradient-text">your expertise?</span>
          </h2>
          <p className="text-slate-400 mb-2 text-lg">Join 2,400+ founders already hosting on GritClub</p>
          <p className="text-sm mb-8 font-medium" style={{ color: '#FFD700' }}>Keep 80% of every ticket you sell.</p>

          {!submitted ? (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true) }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
              />
              <button type="submit" className="btn-gold px-6 py-3 rounded-xl text-sm whitespace-nowrap">
                Join Waitlist
              </button>
            </form>
          ) : (
            <div className="text-green-400 font-medium text-lg">🎉 You're on the list! We'll reach out soon.</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 text-center text-slate-500 text-sm" style={{ borderColor: '#334155' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img
            src="/logo.png"
            alt="GritClub"
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>GritClub</span>
        </div>
        <p>© 2025 GritClub · gritclub.live</p>
      </footer>
    </div>
  )
}
