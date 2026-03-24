'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Target, Lightbulb, Award, Radio, Crown, MessageCircle } from 'lucide-react'

function useWindowWidth() {
  const [w, setW] = useState(1200)
  useEffect(() => { const h = () => setW(window.innerWidth); h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  return w
}

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      let start = 0; const step = Math.ceil(end / 60)
      const t = setInterval(() => { start += step; if (start >= end) { setVal(end); clearInterval(t) } else setVal(start) }, 20)
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const width = useWindowWidth()
  const isMobile = width < 768

  useEffect(() => {
    const h = () => { setScrolled(window.scrollY > 60); setScrollY(window.scrollY) }
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const features = [
    { icon: Users,     title: 'Network',       desc: 'Connect with founders and operators who share your drive and build real relationships.' },
    { icon: Target,    title: 'Live Events',    desc: 'Attend or host ticketed sessions. Screen share, whiteboard, real-time chat. Keep 50%.' },
    { icon: Lightbulb, title: 'Private Groups', desc: 'Build invite-only circles. Video calls, file sharing, shared notes, persistent chat.' },
    { icon: Award,     title: 'Recordings',     desc: 'Every session saved automatically. Premium Plus members replay any session anytime.' },
  ]

  const stats = [
    { val: 50, suffix: '%', label: 'Revenue you keep as host' },
    { val: 0,  suffix: '',  label: 'Setup fees to get started' },
    { val: 30, suffix: 's', label: 'Average time to go live' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', color: '#F0F4FF', fontFamily: "'DM Sans', 'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }

        @keyframes fadeInUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInL   { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeInR   { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes floatImg  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-16px)} }
        @keyframes rotateBig { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin      { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        .anim-fadeup  { animation: fadeInUp 0.8s ease both; }
        .anim-fadeup1 { animation: fadeInUp 0.8s 0.15s ease both; }
        .anim-fadeup2 { animation: fadeInUp 0.8s 0.3s ease both; }
        .anim-fadeup3 { animation: fadeInUp 0.8s 0.45s ease both; }
        .anim-fadel   { animation: fadeInL 0.8s ease both; }
        .anim-fader   { animation: fadeInR 0.8s 0.2s ease both; }
        .anim-float   { animation: floatImg 5s ease-in-out infinite; }
        .anim-rotate  { animation: rotateBig 20s linear infinite; }
        .anim-pulse   { animation: pulse 2s ease-in-out infinite; }

        .feature-card {
          background: rgba(17,28,50,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 32px 28px;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(37,99,235,0.4);
          box-shadow: 0 20px 48px rgba(0,0,0,0.5);
        }
        .feature-icon-wrap {
          width: 60px; height: 60px; border-radius: 50%;
          background: #1D4ED8;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.6s ease;
        }
        .feature-card:hover .feature-icon-wrap { transform: rotate(360deg); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 36px; border-radius: 10px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #fff; border: none; cursor: pointer;
          font-family: 'DM Sans',sans-serif; font-weight: 700; font-size: 16px;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px rgba(37,99,235,0.35);
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
          animation: shimmer 2s 1s infinite;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,99,235,0.5); }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 36px; border-radius: 10px;
          background: transparent; color: rgba(240,244,255,0.85);
          border: 2px solid rgba(255,255,255,0.25); cursor: pointer;
          font-family: 'DM Sans',sans-serif; font-weight: 600; font-size: 16px;
          transition: all 0.25s ease;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.06); transform: translateY(-2px); }

        .nav-link { color: rgba(240,244,255,0.6); font-size: 15px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #F0F4FF; }

        .stat-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .stat-row:last-child { border-bottom: none; }

        .pricing-card {
          border-radius: 20px;
          background: rgba(17,28,50,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 36px 28px;
          display: flex; flex-direction: column;
          transition: transform 0.3s ease;
        }
        .pricing-card:hover { transform: translateY(-6px); }
        .pricing-card.highlight {
          border: 2px solid #2563EB;
          box-shadow: 0 0 48px rgba(37,99,235,0.18);
          background: rgba(17,28,60,0.95);
        }

        .cta-section {
          background: #0D1428;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 72, transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(10,15,30,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,60px)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: '#fff' }}>G</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Grit<span style={{ color: '#2563EB' }}>Club</span></span>
        </Link>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {[['Features', '#features'], ['Events', '/events'], ['Groups', '/groups'], ['Pricing', '/pricing']].map(([l, h]) => (
              <a key={l} href={h} className="nav-link">{l}</a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login">
            <button style={{ padding: '9px 22px', background: 'transparent', color: 'rgba(240,244,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Sign In</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 14 }}>Join Free</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO — split layout (Figma design) ──────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: `100px clamp(16px,5vw,60px) 80px`, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 80, alignItems: 'center' }}>

          {/* Left — text */}
          <div className="anim-fadel">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 999, marginBottom: 28 }}>
              <span className="anim-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#34D399', letterSpacing: '0.04em' }}>Live events available now</span>
            </div>

            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 'clamp(40px,6vw,76px)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
              Building<br />
              <span style={{ color: '#2563EB' }}>Tomorrow's</span><br />
              Success
            </h1>

            <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'rgba(240,244,255,0.62)', lineHeight: 1.8, marginBottom: 36, maxWidth: 480 }}>
              The exclusive platform where founders host paid live events, build private groups, and connect with people who are actually building things.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/auth/login">
                <button className="btn-primary" style={{ fontSize: 16 }}>
                  Explore More <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/events">
                <button className="btn-outline" style={{ fontSize: 16 }}>Browse Events</button>
              </Link>
            </div>
          </div>

          {/* Right — meeting image with floating animation */}
          <div className="anim-fader" style={{ position: 'relative' }}>
            <div className="anim-float" style={{ position: 'relative', zIndex: 2 }}>
              <img
                src="/hero-meeting.jpg"
                alt="Business Meeting"
                style={{ width: '100%', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', display: 'block', objectFit: 'cover', maxHeight: 440 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            {/* Rotating ring decoration */}
            <div className="anim-rotate" style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, border: '3px solid rgba(37,99,235,0.25)', borderRadius: '50%', zIndex: 1 }} />
            {/* Glow blob */}
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 260, height: 260, background: 'rgba(37,99,235,0.12)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
          </div>
        </div>
      </section>

      {/* ── FEATURES — 4 cards (Figma design) ──────────────────────────────── */}
      <section id="features" style={{ padding: `80px clamp(16px,5vw,60px)`, background: 'rgba(255,255,255,0.018)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>What You Get</p>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,5vw,54px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Our <span style={{ color: '#2563EB' }}>Expertise</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.5)', marginTop: 14, maxWidth: 480, margin: '14px auto 0' }}>Delivering excellence through proven methodologies for founders</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : width < 900 ? 2 : 4}, 1fr)`, gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon-wrap">
                  <f.icon color="#fff" size={28} />
                </div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 10, color: '#F0F4FF' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.5)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLABORATIVE SECTION — aerial image + stats (Figma design) ──────── */}
      <section style={{ padding: `80px clamp(16px,5vw,60px)`, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 80, alignItems: 'center' }}>

          {/* Aerial image with parallax */}
          <div style={{ position: 'relative', transform: `translateY(${scrollY * 0.04}px)` }}>
            <div style={{ position: 'relative', zIndex: 2, transition: 'transform 0.4s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
              <img
                src="/hero-aerial.jpg"
                alt="Collaborative Workspace"
                style={{ width: '100%', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', display: 'block', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="anim-rotate" style={{ position: 'absolute', top: -24, left: -24, width: 120, height: 120, border: '3px solid rgba(37,99,235,0.2)', borderRadius: '50%', zIndex: 1 }} />
          </div>

          {/* Right — text + stats */}
          <div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,4vw,52px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>
              Collaborative<br /><span style={{ color: '#2563EB' }}>Excellence</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.6)', lineHeight: 1.8, marginBottom: 36 }}>
              GritClub brings together founders, operators, and builders to create something bigger. Host events, build your network, and monetise your expertise — all in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stats.map((s, i) => (
                <div key={i} className="stat-row">
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 44, color: '#F0F4FF', minWidth: 120, lineHeight: 1 }}>
                    <Counter end={s.val} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(240,244,255,0.5)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ─────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: `80px clamp(16px,5vw,60px)`, background: 'rgba(255,255,255,0.018)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</p>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,5vw,54px)', letterSpacing: '-0.02em', marginBottom: 12 }}>Simple, Transparent Pricing</h2>
            <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.5)' }}>Start free. Upgrade when you're ready to do more.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
            {[
              { name: 'Free', price: '$0', period: 'forever', highlight: false, features: ['1 free event/week', 'Groups (5 members max)', 'Community feed', 'Direct messaging'], cta: 'Get Started', href: '/auth/login' },
              { name: 'Basic', price: '$10', period: 'per month', highlight: false, features: ['Unlimited live events', 'Unlimited group members', 'Premium badge', 'Priority chat'], cta: 'Get Basic', href: '/pricing' },
              { name: 'Premium Plus', price: '$17', period: 'per month', highlight: true, features: ['No event tickets needed', 'All session recordings', 'Host events — keep 50%', 'VIP access & badge'], cta: 'Get Premium Plus', href: '/pricing' },
            ].map((plan, i) => (
              <div key={i} className={`pricing-card${plan.highlight ? ' highlight' : ''}`}>
                {plan.highlight && (
                  <div style={{ position: 'relative', top: -20, left: '50%', transform: 'translateX(-50%)', width: 'fit-content', padding: '5px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8, whiteSpace: 'nowrap' }}>★ Most Popular</div>
                )}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>{plan.name}</h3>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 52, color: plan.highlight ? '#3B82F6' : '#F0F4FF', lineHeight: 1 }}>{plan.price}</div>
                  <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.4)', marginTop: 6 }}>{plan.period}</div>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span style={{ fontSize: 14, color: 'rgba(240,244,255,0.65)', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <button className={plan.highlight ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}>{plan.cta}</button>
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/pricing" style={{ fontSize: 14, color: '#3B82F6' }}>See full pricing details including annual plans →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION (Figma dark section) ────────────────────────────────── */}
      <section className="cta-section" style={{ padding: `100px clamp(16px,5vw,60px)`, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 400, background: 'rgba(37,99,235,0.06)', borderRadius: '50%', filter: 'blur(80px)', animation: 'floatImg 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 400, height: 400, background: 'rgba(124,58,237,0.06)', borderRadius: '50%', filter: 'blur(80px)', animation: 'floatImg 8s ease-in-out infinite 2s' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 'clamp(36px,7vw,80px)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
            Let's Build<br />Something <span style={{ color: '#2563EB' }}>Great</span>
          </h2>
          <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'rgba(240,244,255,0.55)', lineHeight: 1.7, marginBottom: 44 }}>
            Ready to host your first paid session, build your network, or just explore? Sign up in 30 seconds with Google. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/login">
              <button className="btn-primary" style={{ fontSize: 17, padding: '17px 44px' }}>Join GritClub Free →</button>
            </Link>
            <Link href="/events">
              <button className="btn-outline" style={{ fontSize: 17, padding: '17px 44px' }}>Browse Events</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#060B14', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '28px clamp(16px,5vw,60px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 36 }}>
            <Link href="/privacy" style={{ fontSize: 14, color: 'rgba(240,244,255,0.38)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.38)')}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: 14, color: 'rgba(240,244,255,0.38)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.38)')}>Terms of Service</Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.18)', fontFamily: 'DM Sans,sans-serif' }}>© 2026 GritClub · gritclub.live</p>
        </div>
      </footer>
    </div>
  )
}
