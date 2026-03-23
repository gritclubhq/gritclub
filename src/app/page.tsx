'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function useWindowWidth() {
  const [w, setW] = useState(1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    h(); window.addEventListener('resize', h)
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
      const step = Math.ceil(end / 50)
      const t = setInterval(() => {
        start += step
        if (start >= end) { setVal(end); clearInterval(t) } else setVal(start)
      }, 24)
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const width = useWindowWidth()
  const isMobile = width < 768

  return (
    <div style={{ minHeight: '100vh', background: '#060B16', color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; }
        a { text-decoration: none; color: inherit; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes spin     { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        .fade-up   { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation: fadeUp 0.7s ease 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.7s ease 0.2s both; }
        .fade-up-3 { animation: fadeUp 0.7s ease 0.3s both; }

        .card-hover { transition: transform 0.25s ease, border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); border-color: rgba(37,99,235,0.4) !important; }

        .btn-glow {
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(37,99,235,0.5); }
        .btn-glow::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmer 2s 1s infinite;
        }

        .gold-btn {
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .gold-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(245,158,11,0.4); }

        .nav-link { transition: color 0.2s; color: rgba(232,234,240,0.55); }
        .nav-link:hover { color: #E8EAF0; }

        .feature-card { transition: transform 0.25s, box-shadow 0.25s; }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); }

        .step-line { position: relative; }
        .step-line::before {
          content: ''; position: absolute; left: 20px; top: 44px;
          width: 1px; height: calc(100% + 20px);
          background: linear-gradient(to bottom, rgba(37,99,235,0.4), transparent);
        }
        .step-line:last-child::before { display: none; }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, background: 'rgba(6,11,22,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px,4vw,48px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#fff' }}>G</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Grit<span style={{ color: '#2563EB' }}>Club</span></span>
        </Link>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[['Events', '/events'], ['Groups', '/groups'], ['Pricing', '/pricing']].map(([label, href]) => (
              <Link key={label} href={href} className="nav-link" style={{ fontSize: 14, fontWeight: 500 }}>{label}</Link>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/auth/login">
            <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(232,234,240,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' }}>Sign In</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-glow" style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans' }}>Join Free</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `80px clamp(16px,5vw,80px) 60px`, position: 'relative', overflow: 'hidden' }}>

        {/* Background: SVG network */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="ng1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2563EB" stopOpacity="1"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0"/></radialGradient>
              <radialGradient id="ng2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#F59E0B" stopOpacity="1"/><stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/></radialGradient>
              <radialGradient id="ng3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#10B981" stopOpacity="1"/><stop offset="100%" stopColor="#10B981" stopOpacity="0"/></radialGradient>
            </defs>
            {/* Lines */}
            {[
              [720,380,180,140],[720,380,400,260],[720,380,1050,180],[720,380,1260,340],
              [720,380,980,580],[720,380,460,560],[720,380,200,500],[720,380,600,100],
              [180,140,400,260],[400,260,460,560],[1050,180,1260,340],[1260,340,980,580],
              [200,500,460,560],[980,580,850,700],[460,560,600,700],
            ].map(([x1,y1,x2,y2],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3B82F6" strokeWidth="0.7" strokeOpacity="0.5"/>
            ))}
            {/* Nodes */}
            {[
              [720,380,22,'#2563EB'], [180,140,14,'#3B82F6'], [400,260,16,'#3B82F6'],
              [1050,180,18,'#F59E0B'], [1260,340,14,'#F59E0B'], [980,580,16,'#10B981'],
              [460,560,14,'#3B82F6'], [200,500,12,'#7C3AED'], [600,100,12,'#3B82F6'],
              [850,700,12,'#10B981'], [600,700,10,'#F59E0B'],
            ].map(([cx,cy,r,color],i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={Number(r)*2.5} fill={color as string} opacity="0.08"/>
                <circle cx={cx} cy={cy} r={Number(r)*1.4} fill={color as string} opacity="0.15"/>
                <circle cx={cx} cy={cy} r={r} fill={color as string} opacity="0.85"/>
                {r === 22 && <circle cx={cx} cy={cy} r={6} fill="#fff" opacity="0.9"/>}
              </g>
            ))}
          </svg>
        </div>

        {/* Blue ambient glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Live badge */}
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite', display: 'inline-block' }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Events Available Now</span>
        </div>

        {/* Main headline */}
        <h1 className="fade-up-1" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(36px,7vw,88px)', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: 24, maxWidth: 900 }}>
          Where Founders<br/>
          <span style={{ color: '#2563EB' }}>Host</span>, <span style={{ color: '#F59E0B' }}>Earn</span>, and <span style={{ color: '#10B981' }}>Connect</span>
        </h1>

        {/* Subheadline — honest, specific */}
        <p className="fade-up-2" style={{ fontSize: 'clamp(15px,2.5vw,20px)', color: 'rgba(232,234,240,0.6)', lineHeight: 1.7, maxWidth: 560, marginBottom: 40, fontWeight: 400 }}>
          GritClub is a platform for founders and operators to run paid live events, build exclusive groups, and network with people who are actually building things.
        </p>

        {/* CTAs */}
        <div className="fade-up-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <Link href="/auth/login">
            <button className="btn-glow" style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Start for Free →
            </button>
          </Link>
          <Link href="/pricing">
            <button style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(232,234,240,0.8)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'border-color 0.2s' }}>
              See Pricing
            </button>
          </Link>
        </div>

        {/* Honest stats row */}
        <div style={{ display: 'flex', gap: isMobile ? 24 : 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { val: 50, suffix: '%', label: 'Revenue you keep as host' },
            { val: 0, suffix: ' setup fees', label: 'No contracts or setup fees' },
            { val: 30, suffix: 's', label: 'Average time to go live' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 28 : 36, color: '#fff', lineHeight: 1 }}>
                <Counter end={s.val} suffix={s.suffix}/>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(232,234,240,0.4)', marginTop: 4, maxWidth: 120 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IS GRITCLUB ──────────────────────────────────────────────────── */}
      <section style={{ padding: `80px clamp(16px,5vw,80px)`, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>What We Are</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 28 : 38, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 20 }}>
              LinkedIn is for job titles.<br/>
              <span style={{ color: '#2563EB' }}>GritClub is for builders.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(232,234,240,0.6)', lineHeight: 1.8, marginBottom: 16 }}>
              We built GritClub because founders were doing serious knowledge-sharing on platforms that weren't built for it — Zoom calls that disappear, Twitter threads no one pays for, LinkedIn posts no one reads.
            </p>
            <p style={{ fontSize: 16, color: 'rgba(232,234,240,0.6)', lineHeight: 1.8 }}>
              GritClub gives you a place to host ticketed live events, build private groups with video calls and file sharing, and network with people who are actually building — not just talking about it.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '◈', label: 'Live Events', desc: 'Ticket-gated sessions with chat, screen share, and whiteboard', color: '#2563EB' },
              { icon: '⬡', label: 'Groups', desc: 'Private circles with video calls, file sharing, and shared notes', color: '#F59E0B' },
              { icon: '◉', label: 'Network', desc: 'Connect with founders based on events you both attended', color: '#10B981' },
              { icon: '▶', label: 'Recordings', desc: 'Every session saved — Premium members watch any time', color: '#7C3AED' },
            ].map(f => (
              <div key={f.label} className="card-hover" style={{ padding: '20px 16px', borderRadius: 16, background: '#0D1525', border: '1px solid rgba(255,255,255,0.07)', cursor: 'default' }}>
                <div style={{ fontSize: 22, marginBottom: 10, color: f.color }}>{f.icon}</div>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: '#E8EAF0', marginBottom: 6 }}>{f.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(232,234,240,0.45)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: `80px clamp(16px,5vw,80px)`, background: 'rgba(255,255,255,0.018)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>How It Works</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 26 : 36, letterSpacing: '-0.02em', marginBottom: 48, textAlign: 'center' }}>Up and running in minutes</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Sign in with Google', desc: 'One click with your Google account. No form to fill, no card required. Your profile is live instantly.' },
              { n: '02', title: 'Join or create groups', desc: 'Browse existing founder groups by category — AI, SaaS, HealthTech, Growth — or start your own in 30 seconds.' },
              { n: '03', title: 'Attend live events', desc: 'Buy a ticket to a live session or claim a free one. Join the live room directly from your dashboard.' },
              { n: '04', title: 'Host and earn', desc: 'Apply to be a host. Create a ticketed event, go live, and keep 50% of every ticket sold. No minimums.' },
            ].map((s, i) => (
              <div key={s.n} className="step-line" style={{ display: 'flex', gap: 20, paddingBottom: i < 3 ? 36 : 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>{s.n}</div>
                <div style={{ paddingTop: 8 }}>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 17, color: '#E8EAF0', marginBottom: 6 }}>{s.title}</p>
                  <p style={{ fontSize: 14, color: 'rgba(232,234,240,0.55)', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR HOSTS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: `80px clamp(16px,5vw,80px)`, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ borderRadius: 24, background: 'linear-gradient(135deg, #0D1525, #111827)', border: '1px solid rgba(37,99,235,0.2)', padding: isMobile ? '32px 20px' : '48px 56px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'radial-gradient(ellipse at right, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ maxWidth: 560 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>For Hosts</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 26 : 36, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 20 }}>
              Your knowledge is worth paying for.<br/>
              <span style={{ color: '#F59E0B' }}>Start charging for it.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(232,234,240,0.6)', lineHeight: 1.8, marginBottom: 32 }}>
              Set your ticket price. Go live from your browser. Chat with your audience in real time. Screen share, whiteboard, or just talk. GritClub handles payments — you keep 50% of every ticket.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 32 }}>
              {[
                '50% revenue on every paid ticket',
                'Real-time payments — no delays',
                'Screen share + whiteboard included',
                'Cloud recording for every session',
                'Chat moderation tools built in',
                'Apply in 2 minutes, free to start',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#10B981', fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: 'rgba(232,234,240,0.65)', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/become-host">
              <button className="gold-btn" style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: '#F59E0B', color: '#060B16', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Apply to Host →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ──────────────────────────────────────────────────── */}
      <section style={{ padding: `80px clamp(16px,5vw,80px)`, background: 'rgba(255,255,255,0.018)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 26 : 36, letterSpacing: '-0.02em', marginBottom: 12 }}>Simple, honest pricing</h2>
          <p style={{ fontSize: 16, color: 'rgba(232,234,240,0.5)', marginBottom: 48 }}>Free to join. Upgrade when you're ready to host or go deeper.</p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { name: 'Free', price: '$0', desc: '1 free event/week, join groups up to 5 members, community feed', highlight: false, color: '#3B82F6' },
              { name: 'Premium Plus', price: '$17/mo', desc: 'No event tickets needed, all recordings, host events, private groups, VIP access', highlight: true, color: '#F59E0B' },
              { name: 'Basic', price: '$10/mo', desc: 'Unlimited events, unlimited group members, premium badge, private chat', highlight: false, color: '#3B82F6' },
            ].map(p => (
              <div key={p.name} className="card-hover" style={{ padding: '24px 20px', borderRadius: 20, background: p.highlight ? 'linear-gradient(145deg,#111827,#161f2e)' : '#0D1525', border: `1px solid ${p.highlight ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: p.highlight ? '0 0 32px rgba(245,158,11,0.12)' : 'none' }}>
                {p.highlight && <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>★ Most Popular</div>}
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#E8EAF0', marginBottom: 4 }}>{p.name}</p>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: p.highlight ? '#F59E0B' : '#E8EAF0', marginBottom: 12 }}>{p.price}</p>
                <p style={{ fontSize: 13, color: 'rgba(232,234,240,0.5)', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing">
            <button style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(232,234,240,0.7)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>See Full Pricing →</button>
          </Link>
        </div>
      </section>

      {/* ── GROUPS ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: `80px clamp(16px,5vw,80px)`, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Groups</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 26 : 36, letterSpacing: '-0.02em', marginBottom: 12 }}>Your private circle for serious work</h2>
          <p style={{ fontSize: 16, color: 'rgba(232,234,240,0.5)', maxWidth: 480, margin: '0 auto' }}>Groups have everything your team needs — not just chat.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 12 }}>
          {[
            { icon: '💬', title: 'Persistent group chat', desc: 'Messages stay. No losing important discussions. Full history always available.' },
            { icon: '📹', title: 'Video calls built in', desc: 'Start a video call directly inside your group. No Zoom link needed. Works on mobile.' },
            { icon: '📁', title: 'File sharing', desc: 'Upload decks, docs, and files up to 50MB. Your group\'s shared drive.' },
            { icon: '📝', title: 'Shared notes', desc: 'One live note everyone can edit. Real-time sync across all members.' },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: '#0D1525', border: '1px solid rgba(255,255,255,0.07)', cursor: 'default' }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: '#E8EAF0', marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(232,234,240,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(232,234,240,0.35)', marginBottom: 16 }}>First 5 members free forever. Upgrade for unlimited members.</p>
          <Link href="/groups">
            <button className="btn-glow" style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Browse Groups →</button>
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: `80px clamp(16px,5vw,80px) 100px` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 28 : 44, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
            Ready to build something real?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(232,234,240,0.55)', marginBottom: 36, lineHeight: 1.7 }}>
            Sign up in 30 seconds with Google. No credit card needed. Start attending events and building your network today.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/login">
              <button className="btn-glow" style={{ padding: '15px 36px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                Join GritClub Free →
              </button>
            </Link>
            <Link href="/events">
              <button style={{ padding: '15px 36px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(232,234,240,0.7)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
                Browse Events
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '28px clamp(16px,5vw,80px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15 }}>Grit<span style={{ color: '#2563EB' }}>Club</span></span>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['Events', '/events'], ['Groups', '/groups'], ['Pricing', '/pricing'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 13, color: 'rgba(232,234,240,0.4)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(232,234,240,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,234,240,0.4)')}>{l}</Link>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'rgba(232,234,240,0.25)' }}>© 2026 GritClub</span>
      </footer>

    </div>
  )
}
