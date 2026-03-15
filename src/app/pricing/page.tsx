'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, Star } from 'lucide-react'

const C = {
  bg: '#0A0F1E', surface: '#0D1428', card: '#111827',
  border: 'rgba(255,255,255,0.06)', text: '#F0F4FF',
  muted: '#7B8DB0', dim: '#3D4F6E',
  blue: '#2563EB', blueL: '#3B82F6', blueDim: 'rgba(37,99,235,0.12)',
  purple: '#7C3AED', purpleL: '#8B5CF6',
  gold: '#F59E0B', goldDim: 'rgba(245,158,11,0.1)',
  red: '#EF4444', green: '#10B981', greenDim: 'rgba(16,185,129,0.1)',
}

const PLANS = [
  {
    id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0,
    badge: null, highlight: false,
    description: 'Get started with GritClub',
    cta: 'Get Started Free →', ctaLink: '/auth/login',
    color: C.blueL, borderColor: 'rgba(59,130,246,0.3)',
    features: [
      '1 free live event/week',
      'Public chat only',
      'Join public groups (up to 5 members)',
      'Basic networking',
      'Community feed access',
      'Mobile + desktop access',
    ],
    missing: ['Event replays', 'Download recordings', 'Private groups', 'Host events', 'Referral earnings'],
  },
  {
    id: 'basic', name: 'Basic', monthlyPrice: 9, yearlyPrice: 108,
    badge: null, highlight: false,
    description: 'Unlimited events + replays',
    cta: 'Start 14-day Trial', ctaLink: '/auth/login?plan=basic',
    color: C.blueL, borderColor: 'rgba(59,130,246,0.3)',
    features: [
      'Unlimited live events',
      '7-day replay access',
      'Join unlimited public groups',
      'Full networking features',
      'Community feed + images',
      'Priority chat in events',
    ],
    missing: ['Download recordings', 'Private groups (20+)', 'Host events', 'Referral earnings'],
  },
  {
    id: 'pro', name: 'Pro', monthlyPrice: 29, yearlyPrice: 348,
    badge: '★ Most Popular', highlight: true,
    description: 'Host, earn, and grow',
    cta: 'Start 14-day Trial', ctaLink: '/auth/login?plan=pro',
    color: C.gold, borderColor: 'rgba(245,158,11,0.5)',
    features: [
      'Everything in Basic',
      'Unlimited replay access',
      'Host live events (keep 80%)',
      'Private groups (up to 20 members)',
      'Private group chats + video meet',
      'Host referrals — earn 10%',
      'Co-host events with others',
      'Event analytics dashboard',
    ],
    missing: ['Download recordings', 'Unlimited group members'],
  },
  {
    id: 'enterprise', name: 'Enterprise', monthlyPrice: 99, yearlyPrice: 1188,
    badge: null, highlight: false,
    description: 'For agencies & power users',
    cta: 'Schedule Demo', ctaLink: 'mailto:gritclubhq@gmail.com?subject=Enterprise Inquiry',
    color: '#A78BFA', borderColor: 'rgba(167,139,250,0.3)',
    features: [
      'Everything in Pro',
      'Unlimited group members',
      'Download event recordings',
      'Custom event creation tools',
      'White-label event branding',
      'Priority 1:1 support',
      'Dedicated account manager',
      'Host referrals — earn 20%',
    ],
    missing: [],
  },
]

const FEATURE_TABLE = [
  { feature: '1 Free Event/Week',       free: true,   basic: '—',      pro: '—',      ent: '—'        },
  { feature: 'Unlimited Live Events',   free: false,  basic: true,     pro: true,     ent: true       },
  { feature: 'Replay Access',           free: false,  basic: '7 days', pro: '∞',      ent: '∞'        },
  { feature: 'Download Recordings',     free: false,  basic: false,    pro: false,    ent: true       },
  { feature: 'Private Groups',          free: false,  basic: false,    pro: '20 max', ent: '∞'        },
  { feature: 'Host Events (80% cut)',   free: false,  basic: false,    pro: true,     ent: true       },
  { feature: 'Host Referrals',          free: false,  basic: false,    pro: '10%',    ent: '20%'      },
  { feature: 'Priority Support',        free: false,  basic: false,    pro: false,    ent: true       },
  { feature: 'White-label Events',      free: false,  basic: false,    pro: false,    ent: true       },
]

function CellValue({ val }: { val: any }) {
  if (val === true)  return <Check style={{ width: 16, height: 16, color: C.green, margin: '0 auto' }} />
  if (val === false) return <X style={{ width: 16, height: 16, color: C.dim, margin: '0 auto' }} />
  if (val === '—')   return <span style={{ color: C.dim, fontSize: 13 }}>—</span>
  return <span style={{ color: C.muted, fontSize: 13, fontFamily: 'DM Sans,sans-serif' }}>{val}</span>
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .feature-table { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: C.text }}>
              Grit<span style={{ color: C.gold }}>Club</span>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Dashboard</Link>
            <Link href="/auth/login" style={{ fontSize: 13, color: '#fff', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', padding: '8px 16px', borderRadius: 10, background: C.blue }}>Sign In</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: C.goldDim, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 20 }}>
            <Zap style={{ width: 14, height: 14, color: C.gold }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: 'DM Sans,sans-serif', letterSpacing: '0.08em' }}>GRITCLUB PRICING</span>
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(32px,5vw,54px)', color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Everything you need to<br />
            <span style={{ color: C.gold }}>compound with elite founders</span>
          </h1>
          <p style={{ fontSize: 16, color: C.muted, fontFamily: 'DM Sans,sans-serif', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Event tickets are separate from membership. Your membership unlocks unlimited access — individual event tickets are extra and set by each host.
          </p>

          {/* Annual toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 32, padding: '8px 16px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: annual ? C.muted : C.text, fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>Monthly</span>
            <button
              onClick={() => setAnnual(p => !p)}
              style={{ width: 48, height: 26, borderRadius: 13, background: annual ? C.gold : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', left: annual ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
            <span style={{ fontSize: 13, color: annual ? C.text : C.muted, fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>
              Annual
              <span style={{ marginLeft: 6, fontSize: 11, padding: '2px 7px', borderRadius: 6, background: C.greenDim, color: C.green, fontFamily: 'DM Sans,sans-serif', fontWeight: 700 }}>Save 20%</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 64 }}>
          {PLANS.map(plan => {
            const price = annual ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
            const yearlyTotal = plan.yearlyPrice

            return (
              <div key={plan.id}
                style={{
                  borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  background: plan.highlight ? 'linear-gradient(160deg, #1a1a2e, #111827)' : C.card,
                  border: `1px solid ${plan.highlight ? plan.borderColor : C.border}`,
                  boxShadow: plan.highlight ? `0 0 40px rgba(245,158,11,0.12)` : 'none',
                  transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
                  transition: 'transform 0.2s',
                }}
              >
                {/* Card header */}
                <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
                  {plan.badge ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, background: C.goldDim, border: '1px solid rgba(245,158,11,0.3)', marginBottom: 12 }}>
                      <Star style={{ width: 11, height: 11, color: C.gold, fill: C.gold }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, fontFamily: 'DM Sans,sans-serif', letterSpacing: '0.06em' }}>MOST POPULAR</span>
                    </div>
                  ) : <div style={{ height: 28, marginBottom: 12 }} />}

                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: plan.color, marginBottom: 4 }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Sans,sans-serif', marginBottom: 16 }}>{plan.description}</p>

                  <div>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 36, color: C.text, letterSpacing: '-0.03em' }}>
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && <span style={{ fontSize: 13, color: C.muted, fontFamily: 'DM Sans,sans-serif' }}>/mo</span>}
                  </div>
                  {annual && yearlyTotal > 0 && (
                    <p style={{ fontSize: 11, color: C.dim, fontFamily: 'DM Sans,sans-serif', marginTop: 4 }}>
                      Billed ${yearlyTotal}/yr
                    </p>
                  )}
                </div>

                {/* Features */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 14, height: 14, color: plan.color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: C.muted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, opacity: 0.35 }}>
                      <X style={{ width: 14, height: 14, color: C.dim, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: C.dim, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{ padding: '0 20px 24px' }}>
                  <Link href={plan.ctaLink} style={{ textDecoration: 'none' }}>
                    <button style={{
                      width: '100%', padding: '13px', borderRadius: 12, cursor: 'pointer',
                      background: plan.highlight ? `linear-gradient(135deg, ${C.gold}, #F97316)` : plan.id === 'enterprise' ? 'rgba(167,139,250,0.15)' : C.blueDim,
                      color: plan.highlight ? '#0A0F1E' : plan.id === 'enterprise' ? '#A78BFA' : C.blueL,
                      fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14,
                      border: plan.highlight ? 'none' : `1px solid ${plan.borderColor}`,
                      transition: 'all 0.2s',
                    }}>
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Event ticket clarification */}
        <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: 56 }}>
          <p style={{ fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 12, fontSize: 15 }}>
            💡 How event tickets work with membership
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[
              { plan: 'Free User', ticket: '$27 event ticket', result: 'Pay $27 to attend. 1 free event/week covered already.' },
              { plan: 'Basic Member ($9/mo)', ticket: '$27 event ticket', result: 'Unlimited free event access — no extra ticket needed! 🎫' },
              { plan: 'Pro Member ($29/mo)', ticket: 'Host any event', result: 'Set your own price + keep 80% of ticket revenue. 💰' },
            ].map(row => (
              <div key={row.plan} style={{ padding: '14px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.blueL, marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>{row.plan}</p>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 8, fontFamily: 'DM Mono,monospace' }}>{row.ticket}</p>
                <p style={{ fontSize: 13, color: C.muted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}>{row.result}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="feature-table">
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 24, color: C.text, textAlign: 'center', marginBottom: 32 }}>
            Full Feature Comparison
          </h2>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: C.surface, padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.dim, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>Feature</span>
              {['Free', 'Basic', 'Pro ★', 'Enterprise'].map(h => (
                <span key={h} style={{ fontSize: 12, fontWeight: 700, color: h.includes('Pro') ? C.gold : C.text, fontFamily: 'DM Sans,sans-serif', textAlign: 'center' }}>{h}</span>
              ))}
            </div>
            {FEATURE_TABLE.map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '13px 20px', borderBottom: i < FEATURE_TABLE.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.muted, fontFamily: 'DM Sans,sans-serif' }}>{row.feature}</span>
                {[row.free, row.basic, row.pro, row.ent].map((val, j) => (
                  <div key={j} style={{ textAlign: 'center' }}><CellValue val={val} /></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 64, paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
            {['30-day money-back guarantee', 'Cancel anytime', 'No hidden fees'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted, fontFamily: 'DM Sans,sans-serif' }}>
                <Check style={{ width: 14, height: 14, color: C.green }} /> {t}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.dim, fontFamily: 'DM Sans,sans-serif', marginBottom: 16 }}>
            Questions? <a href="mailto:gritclubhq@gmail.com" style={{ color: C.blueL }}>gritclubhq@gmail.com</a>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <Link href="/terms" style={{ fontSize: 12, color: C.dim, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: C.dim, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
