'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function useWindowWidth() {
  const [w, setW] = useState(1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth); h()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = Math.ceil(end / 60)
      const t = setInterval(() => {
        start += step
        if (start >= end) { setVal(end); clearInterval(t) }
        else setVal(start)
      }, 20)
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const width = useWindowWidth()
  const isMobile = width < 768

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const features = [
    { num: '01', title: 'Network with Intent', desc: 'Connect with founders, operators, and builders who share your drive. Browse by industry and mindset. Build relationships that move your business forward.', icon: '🤝', color: '#3B82F6' },
    { num: '02', title: 'Private Groups', desc: 'Create invite-only circles with your trusted network. Video calls, file sharing, shared notes, and persistent chat. First 5 members free forever.', icon: '👥', color: '#F59E0B' },
    { num: '03', title: 'Host Live Events', desc: 'Monetize your expertise. Run ticketed sessions with screen share and whiteboard. Set your price, we handle payments. You keep 50%.', icon: '🎯', color: '#10B981' },
    { num: '04', title: 'Attend & Learn', desc: 'Access exclusive sessions from operators and builders. Every session recorded for Premium Plus members. No ticket needed with Premium Plus.', icon: '🎓', color: '#8B5CF6' },
  ]

  const hostFeatures = [
    { icon: '🎨', title: 'Whiteboard & Screen Share', desc: 'Draw diagrams, share your screen, engage visually with your audience' },
    { icon: '💬', title: 'Live Chat & Moderation', desc: 'Real-time audience chat with slow mode, mute, and ban controls' },
    { icon: '📹', title: 'Auto Recording', desc: 'Every session saved automatically. Premium members replay anytime.' },
    { icon: '💰', title: '50% Revenue Share', desc: 'Transparent pricing. No hidden fees. Payments sent after each event.' },
  ]

  const pricingPlans = [
    {
      name: 'Free', price: '$0', period: 'forever', highlighted: false, color: '#3B82F6',
      features: ['1 free event per week', 'Join groups (up to 5 members)', 'Community feed', 'Profile & networking'],
      cta: 'Get Started Free', ctaLink: '/auth/login',
    },
    {
      name: 'Basic', price: '$10', period: 'per month', highlighted: false, color: '#3B82F6',
      features: ['Unlimited live events', 'Unlimited group members', 'Private group chat', 'Premium badge'],
      cta: 'Get Basic', ctaLink: '/pricing',
    },
    {
      name: 'Premium Plus', price: '$17', period: 'per month', highlighted: true, color: '#F59E0B',
      features: ['Everything in Basic', 'No event tickets needed', 'All session recordings', 'Host events — keep 50%', 'VIP access & badge'],
      cta: 'Get Premium Plus', ctaLink: '/pricing',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }

        .playfair { font-family: 'Playfair Display', serif; }

        .gradient-text {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6, #F59E0B);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.5);
        }

        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 16px 40px; background: linear-gradient(135deg,#3B82F6,#2563EB);
          color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 16px;
          cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 24px rgba(59,130,246,0.3);
          font-family: Inter,sans-serif;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59,130,246,0.4); }

        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 16px 40px; background: transparent; color: #fff;
          border: 2px solid rgba(255,255,255,0.3); border-radius: 12px;
          font-weight: 600; font-size: 16px; cursor: pointer;
          transition: all 0.3s ease; font-family: Inter,sans-serif;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: #fff; transform: translateY(-2px); }

        .section-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.7) 100%);
          z-index: 1;
        }
        .content-z { position: relative; z-index: 2; }

        @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes pulseAnim { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInL { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInR { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }

        .animate-float { animation: floatAnim 6s ease-in-out infinite; }
        .animate-pulse-dot { animation: pulseAnim 2s ease-in-out infinite; }
        .animate-fadeup { animation: fadeUp 0.8s ease both; }
        .animate-fadeup-1 { animation: fadeUp 0.8s 0.15s ease both; }
        .animate-fadeup-2 { animation: fadeUp 0.8s 0.3s ease both; }
        .animate-fadeup-3 { animation: fadeUp 0.8s 0.45s ease both; }

        .nav-link { color: rgba(255,255,255,0.65); transition: color 0.2s; font-size: 15px; font-weight: 500; }
        .nav-link:hover { color: #fff; }

        .pricing-highlight {
          background: rgba(59,130,246,0.05);
          border: 2px solid #3B82F6 !important;
          box-shadow: 0 0 60px rgba(59,130,246,0.2);
        }
        .pricing-card { transition: transform 0.3s ease; }
        .pricing-card:hover { transform: translateY(-8px); }
      `}</style>

      {/* ── NAVIGATION ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 72,
        background: scrolled ? 'rgba(0,0,0,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 clamp(16px,5vw,60px)`,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, fontFamily: 'Inter' }}>G</div>
          <span style={{ fontWeight: 800, fontSize: 20, fontFamily: 'Inter' }}>Grit<span className="gradient-text">Club</span></span>
        </Link>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {[['Features', '#features'], ['Events', '/events'], ['Pricing', '/pricing'], ['Groups', '/groups']].map(([l, h]) => (
              <a key={l} href={h} className="nav-link">{l}</a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/auth/login">
            <button style={{ padding: '9px 22px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter' }}>Sign In</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>Join Free</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Background photo */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1769798643237-8642a3fbe5bc?w=1600&q=80&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="section-overlay" />
          {/* Extra gradient for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.9) 100%)', zIndex: 1 }} />
        </div>

        <div className="content-z" style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: `100px clamp(16px,5vw,60px) 80px`, textAlign: 'center' }}>

          {/* Live badge */}
          <div className="animate-fadeup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 999, marginBottom: 32 }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#34D399', letterSpacing: '0.05em' }}>Live events happening now</span>
          </div>

          {/* Headline */}
          <h1 className={`playfair animate-fadeup-1`} style={{ fontSize: 'clamp(42px,8vw,96px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 28, letterSpacing: '-0.02em' }}>
            Where Founders<br />
            <span className="gradient-text">Build Together</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fadeup-2" style={{ fontSize: 'clamp(16px,2.5vw,22px)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 680, margin: '0 auto 48px' }}>
            The exclusive network for founders and operators. Host paid live events, build private groups, and connect with people who are actually building things.
          </p>

          {/* CTAs */}
          <div className="animate-fadeup-3" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
            <Link href="/auth/login">
              <button className="btn-primary" style={{ fontSize: 17, padding: '17px 44px' }}>Join GritClub Free →</button>
            </Link>
            <Link href="/events">
              <button className="btn-outline" style={{ fontSize: 17, padding: '17px 44px' }}>Browse Events</button>
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4},1fr)`, gap: isMobile ? 24 : 40, maxWidth: 800, margin: '0 auto' }}>
            {[
              { val: 50, suffix: '%', label: 'Revenue You Keep' },
              { val: 0, suffix: ' fees', label: 'No Setup Fees' },
              { val: 30, suffix: 's', label: 'To Go Live' },
              { val: 100, suffix: '%', label: 'Feature Access' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="gradient-text playfair" style={{ fontSize: isMobile ? 40 : 52, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>
                  <Counter end={s.val} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-float" style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
          <div style={{ width: 24, height: 40, border: '2px solid rgba(255,255,255,0.3)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 6 }}>
            <div className="animate-pulse-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────────── */}
      <section id="features" style={{ position: 'relative', padding: `clamp(60px,10vw,120px) clamp(16px,5vw,60px)`, overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1758873268663-5a362616b5a7?w=1600&q=80&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="section-overlay" />
        </div>
        <div className="content-z" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: '#3B82F6', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 13, marginBottom: 16 }}>What You Get</p>
            <h2 className="playfair" style={{ fontSize: 'clamp(32px,6vw,72px)', fontWeight: 800, lineHeight: 1.1 }}>
              Built For <span className="gradient-text">Builders</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="glass-card" style={{ padding: isMobile ? '28px 20px' : '40px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <span style={{ fontSize: 48, flexShrink: 0 }}>{f.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{f.num}</div>
                    <h3 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: f.color, marginBottom: 10 }}>{f.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR HOSTS ───────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: `clamp(60px,10vw,120px) clamp(16px,5vw,60px)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1702047135360-e549c2e1f7df?w=1600&q=80&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="section-overlay" />
        </div>
        <div className="content-z" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'center' }}>
            <div>
              <p style={{ color: '#F59E0B', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 13, marginBottom: 16 }}>For Hosts</p>
              <h2 className="playfair" style={{ fontSize: 'clamp(32px,5vw,68px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
                Monetize Your <span className="gradient-text">Expertise</span>
              </h2>
              <p style={{ fontSize: isMobile ? 16 : 19, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 36 }}>
                Turn your knowledge into revenue. Host ticketed live events with screen sharing, whiteboard, and real-time chat. Set your price, we handle everything else. You keep 50% of every ticket sold.
              </p>
              <Link href="/dashboard/become-host">
                <button className="btn-primary">Start Hosting →</button>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {hostFeatures.map((item, i) => (
                <div key={i} className="glass-card" style={{ padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <span style={{ fontSize: 32, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{item.title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GROUPS ──────────────────────────────────────────────────────────────── */}
      <section style={{ padding: `clamp(60px,10vw,120px) clamp(16px,5vw,60px)`, background: 'linear-gradient(180deg,#000 0%,rgba(37,99,235,0.06) 50%,#000 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: '#F59E0B', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 13, marginBottom: 16 }}>Groups</p>
            <h2 className="playfair" style={{ fontSize: 'clamp(30px,5vw,64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
              Your Private Circle for <span className="gradient-text">Real Work</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto' }}>
              Not just chat — everything your founding team actually needs.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 16, marginBottom: 40 }}>
            {[
              { icon: '💬', title: 'Persistent Chat', desc: 'Full message history. Never lose an important conversation. Realtime sync.' },
              { icon: '📹', title: 'Video Calls Built In', desc: 'Start a group video call directly inside the group. No external app needed.' },
              { icon: '📁', title: 'Shared File Storage', desc: 'Upload decks, contracts, and docs up to 50MB. Your group\'s shared drive.' },
              { icon: '📝', title: 'Collaborative Notes', desc: 'One live note everyone edits together. Real-time changes visible to all.' },
            ].map((f, i) => (
              <div key={i} className="glass-card" style={{ display: 'flex', gap: 18, padding: '24px 20px' }}>
                <span style={{ fontSize: 36, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>First 5 members always free. Upgrade for unlimited.</p>
            <Link href="/groups">
              <button className="btn-primary">Browse Groups →</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: `clamp(60px,10vw,120px) clamp(16px,5vw,60px)`, background: 'linear-gradient(180deg,#000 0%,rgba(37,99,235,0.04) 50%,#000 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#3B82F6', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 13, marginBottom: 16 }}>Pricing</p>
            <h2 className="playfair" style={{ fontSize: 'clamp(30px,5vw,68px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
              Simple, <span className="gradient-text">Transparent Pricing</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)' }}>Start free. Upgrade when you're ready to do more.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20, alignItems: 'stretch' }}>
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`pricing-card glass-card ${plan.highlighted ? 'pricing-highlight' : ''}`}
                style={{ padding: isMobile ? '28px 20px' : '40px 32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {plan.highlighted && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: '#fff', padding: '6px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ★ Most Popular
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 4 }}>
                    <span className="gradient-text playfair" style={{ fontSize: isMobile ? 48 : 60, fontWeight: 800 }}>{plan.price}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{plan.period}</div>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#10B981', marginTop: 2, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.ctaLink}>
                  <button className={plan.highlighted ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/pricing" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>See all pricing details including annual plans →</Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: `clamp(80px,12vw,160px) clamp(16px,5vw,60px)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1659423269061-06b614cbec89?w=1600&q=80&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="section-overlay" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.8) 100%)' }} />
        </div>
        <div className="content-z" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="playfair" style={{ fontSize: 'clamp(36px,7vw,92px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Ready to Build<br />Something <span className="gradient-text">Great?</span>
          </h2>
          <p style={{ fontSize: isMobile ? 16 : 20, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 48, maxWidth: 560, margin: '0 auto 48px' }}>
            Sign up in 30 seconds with Google. No credit card required. Start attending events and building your network today.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/login">
              <button className="btn-primary" style={{ fontSize: 17, padding: '18px 48px' }}>Join GritClub Free →</button>
            </Link>
            <Link href="/events">
              <button className="btn-outline" style={{ fontSize: 17, padding: '18px 48px' }}>Browse Events</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '36px clamp(16px,5vw,60px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>G</div>
            <span style={{ fontWeight: 800, fontSize: 17 }}>Grit<span className="gradient-text">Club</span></span>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['Events', '/events'], ['Groups', '/groups'], ['Pricing', '/pricing'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
              <Link key={l} href={h} style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{l}</Link>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© 2026 GritClub · gritclub.live</div>
        </div>
      </footer>
    </div>
  )
}
