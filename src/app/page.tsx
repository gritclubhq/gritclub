'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ─── Animated counter ────────────────────────────────────────────────────────
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

// ─── Noise texture overlay ────────────────────────────────────────────────────
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(#n)' opacity='0.08'/></svg>`

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [glitchActive, setGlitchActive] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', move)
    // Random glitch
    const glitch = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 120)
    }, 4000)
    return () => { window.removeEventListener('mousemove', move); clearInterval(glitch) }
  }, [])

  const features = [
    {
      num: '01',
      title: 'NETWORK',
      sub: 'Find your tribe',
      desc: 'Connect with founders who share your obsession. No cheerleaders. No tourists. Just builders.',
      icon: '◈',
      color: '#FF3B3B',
    },
    {
      num: '02',
      title: 'GROUPS',
      sub: 'First 5 free forever',
      desc: 'Form private cells with like-minded people. Chat, video call, shared notes. Run your circle like an operation.',
      icon: '⬡',
      color: '#FFD700',
    },
    {
      num: '03',
      title: 'LIVE EVENTS',
      sub: 'Host. Earn. Repeat.',
      desc: 'Ticket-gated live sessions. Screen share, whiteboard, blackboard, greenboard. You keep 50%.',
      icon: '▶',
      color: '#38BDF8',
    },
    {
      num: '04',
      title: 'EXCLUSIVE',
      sub: 'Invite-only rooms',
      desc: 'Host link-only events. Audience gets chat only. Quality over quantity. Always.',
      icon: '⬢',
      color: '#A78BFA',
    },
  ]

  const stats = [
    { val: 50, suffix: '%', label: 'Host Revenue Share' },
    { val: 0, suffix: '', label: 'Setup Fees' },
    { val: 30, suffix: 's', label: 'To Go Live' },
    { val: 100, suffix: '%', label: 'Feature Access' },
  ]

  const testimonials = [
    { name: 'Early Member', role: 'SaaS Founder', text: 'Finally a platform where the conversations are worth having. No noise, no vanity — just builders talking real numbers.' },
    { name: 'Beta Host', role: 'Operator & Educator', text: 'The live room is incredibly smooth. I ran my first paid session within 24 hours of signing up.' },
    { name: 'Founding Member', role: 'Product Builder', text: 'GritClub groups are where my best co-founder conversations happen. The file sharing and calls are built right.' },
  ]

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: '#070B14',
        backgroundImage: 'url(/hero-bg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundBlendMode: 'overlay',
        fontFamily: "'Syne', 'DM Sans', sans-serif",
        color: '#E8EAF0',
      }}
    >
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }

        @media (max-width: 480px) {
          section { padding-left: 16px !important; padding-right: 16px !important; }
          .px-6 { padding-left: 16px !important; padding-right: 16px !important; }
          .px-12 { padding-left: 16px !important; padding-right: 16px !important; }
          .md\\:px-12 { padding-left: 16px !important; padding-right: 16px !important; }
        }

        :root {
          --red: #FF3B3B;
          --gold: #FFD700;
          --sky: #38BDF8;
          --bg: #070B14;
          --card: #0D1420;
          --border: rgba(255,255,255,0.06);
        }

        .glitch-text {
          position: relative;
        }
        .glitch-text.active::before {
          content: attr(data-text);
          position: absolute;
          left: 2px; top: 0;
          color: #FF3B3B;
          clip-path: inset(20% 0 60% 0);
          animation: glitch-a 0.12s steps(2) forwards;
        }
        .glitch-text.active::after {
          content: attr(data-text);
          position: absolute;
          left: -2px; top: 0;
          color: #38BDF8;
          clip-path: inset(60% 0 10% 0);
          animation: glitch-b 0.12s steps(2) forwards;
        }
        @keyframes glitch-a {
          0%   { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 0); }
          50%  { clip-path: inset(40% 0 30% 0); transform: translate(2px, 0); }
          100% { clip-path: inset(20% 0 60% 0); transform: translate(0, 0); }
        }
        @keyframes glitch-b {
          0%   { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
          50%  { clip-path: inset(20% 0 50% 0); transform: translate(-2px, 0); }
          100% { clip-path: inset(60% 0 10% 0); transform: translate(0, 0); }
        }

        .scan-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px
          );
          pointer-events: none;
        }

        .feature-card {
          transition: transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
        }

        .btn-primary {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #070B14;
          background: #FFD700;
          border: none;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.2);
          transform: translateX(-100%);
          transition: transform 0.3s;
        }
        .btn-primary:hover::before { transform: translateX(0); }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 31px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #E8EAF0;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
        }
        .btn-outline:hover {
          border-color: #FFD700;
          color: #FFD700;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(6px) rotate(-1deg); }
        }
        .float { animation: float 8s ease-in-out infinite; }
        .float-delay { animation: float 8s ease-in-out infinite 2s; }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-inner {
          animation: ticker 25s linear infinite;
          display: flex;
          white-space: nowrap;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.4;
          mix-blend-mode: overlay;
        }
      `}</style>

      {/* Noise */}
      <div className="noise-overlay" />

      {/* Radial glow following cursor */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,59,59,0.06), transparent 60%)`,
          transition: 'background 0.1s',
        }}
      />

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{
          height: '64px',
          background: 'rgba(7,11,20,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center font-bold text-sm"
            style={{
              background: '#FF3B3B',
              clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
              color: '#fff',
              fontFamily: 'Syne',
            }}
          >G</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
            GRIT<span style={{ color: '#FF3B3B' }}>CLUB</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Events', href: '/events' },
            { label: 'Groups', href: '/groups' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Sign In', href: '/auth/login' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8EAF0')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,234,240,0.6)')}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <button className="btn-outline" style={{ padding: '9px 20px', fontSize: '12px' }}>Sign In</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '12px' }}>Join Now</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 scan-line"
        style={{ paddingTop: '64px' }}
      >
        {/* Network background — professional founder/networking theme */}
        <div className="absolute inset-0" style={{overflow:'hidden'}}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
            style={{position:'absolute',inset:0,opacity:0.18}}>
            <defs>
              <radialGradient id="nodeBlue" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="nodeRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF3B3B" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#FF3B3B" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="nodeGold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Connection lines */}
            <line x1="200" y1="150" x2="420" y2="280" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.4"/>
            <line x1="420" y1="280" x2="650" y2="180" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.4"/>
            <line x1="650" y1="180" x2="850" y2="320" stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.4"/>
            <line x1="850" y1="320" x2="1100" y2="200" stroke="#FF3B3B" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="1100" y1="200" x2="1280" y2="350" stroke="#FF3B3B" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="420" y1="280" x2="380" y2="500" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.3"/>
            <line x1="380" y1="500" x2="580" y2="620" stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.3"/>
            <line x1="580" y1="620" x2="780" y2="520" stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.3"/>
            <line x1="780" y1="520" x2="1050" y2="600" stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.3"/>
            <line x1="1050" y1="600" x2="1280" y2="350" stroke="#FF3B3B" strokeWidth="0.8" strokeOpacity="0.3"/>
            <line x1="650" y1="180" x2="580" y2="620" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"/>
            <line x1="850" y1="320" x2="780" y2="520" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"/>
            <line x1="140" y1="620" x2="380" y2="500" stroke="#38BDF8" strokeWidth="0.7" strokeOpacity="0.25"/>
            <line x1="140" y1="620" x2="200" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            <line x1="1050" y1="600" x2="1050" y2="750" stroke="#FF3B3B" strokeWidth="0.7" strokeOpacity="0.25"/>
            <line x1="780" y1="520" x2="850" y2="750" stroke="#FFD700" strokeWidth="0.7" strokeOpacity="0.25"/>
            <line x1="300" y1="750" x2="580" y2="620" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            {/* People/avatar nodes — circles with person silhouettes */}
            {[
              [200,150,22,'#38BDF8'],[420,280,28,'#38BDF8'],[650,180,20,'#2563EB'],
              [850,320,24,'#FF3B3B'],[1100,200,26,'#FF3B3B'],[1280,350,18,'#FF3B3B'],
              [380,500,22,'#38BDF8'],[580,620,20,'#2563EB'],[780,520,26,'#FFD700'],
              [1050,600,22,'#FF3B3B'],[140,620,18,'#38BDF8'],[1050,750,18,'#FF3B3B'],
              [850,750,16,'#FFD700'],[300,750,16,'rgba(255,255,255,0.5)'],[720,380,14,'rgba(255,255,255,0.4)'],
              [500,420,14,'rgba(255,255,255,0.4)'],[960,440,14,'rgba(255,255,255,0.4)'],
            ].map(([cx,cy,r,color],i) => (
              <g key={i} filter="url(#glow)">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={color as string} strokeWidth="1.5" opacity="0.7"/>
                <circle cx={cx} cy={cy} r={(r as number)*0.35} fill={color as string} opacity="0.5"/>
                {/* head */}
                <circle cx={cx} cy={(cy as number)-(r as number)*0.25} r={(r as number)*0.28} fill={color as string} opacity="0.55"/>
                {/* shoulders arc */}
                <path d={`M ${(cx as number)-(r as number)*0.45} ${(cy as number)+(r as number)*0.5} Q ${cx} ${(cy as number)+(r as number)*0.15} ${(cx as number)+(r as number)*0.45} ${(cy as number)+(r as number)*0.5}`}
                  fill={color as string} opacity="0.35"/>
              </g>
            ))}
            {/* Glow bursts at key intersections */}
            <circle cx="420" cy="280" r="40" fill="url(#nodeBlue)" opacity="0.35"/>
            <circle cx="850" cy="320" r="35" fill="url(#nodeRed)" opacity="0.3"/>
            <circle cx="780" cy="520" r="35" fill="url(#nodeGold)" opacity="0.28"/>
            <circle cx="1100" cy="200" r="30" fill="url(#nodeRed)" opacity="0.25"/>
          </svg>
          {/* Subtle left-to-right color split: blue left, red-orange right */}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(105deg, rgba(37,99,235,0.08) 0%, transparent 45%, rgba(255,59,59,0.06) 100%)'}}/>
        </div>


        {/* Live counter badge */}
        <div
          className="relative inline-flex items-center gap-2 px-4 py-2 mb-10"
          style={{
            background: 'rgba(255,59,59,0.1)',
            border: '1px solid rgba(255,59,59,0.3)',
            fontFamily: 'DM Mono',
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: '#FF3B3B',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" style={{ animation: 'pulse-ring 1.5s ease-out infinite', display: 'inline-block' }} />
          <span className="w-2 h-2 rounded-full bg-red-500 absolute left-[14px]" />
          LIVE EVENTS AVAILABLE NOW
        </div>

        {/* Main headline */}
        <h1
          className={`glitch-text ${glitchActive ? 'active' : ''} relative`}
          data-text="GRITCLUB"
          style={{
            fontFamily: 'Syne',
            fontWeight: 800,
            fontSize: 'clamp(36px, 11vw, 180px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            color: '#E8EAF0',
            marginBottom: '0px',
            whiteSpace: 'nowrap',
            width: '100%',
            textAlign: 'center',
          }}
        >
          GRIT<span style={{ color: '#FF3B3B', WebkitTextStroke: '0px' }}>CLUB</span>
        </h1>

        {/* Rule line */}
        <div style={{ width: 'min(400px, 80vw)', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '24px auto' }} />

        <p
          style={{
            fontFamily: 'Syne',
            fontWeight: 600,
            fontSize: 'clamp(11px, 3vw, 18px)',
            letterSpacing: '0.2em',
            color: 'rgba(232,234,240,0.5)',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          The first rule of GritClub is:
        </p>
        <p
          style={{
            fontFamily: 'Syne',
            fontWeight: 700,
            fontSize: 'clamp(14px, 4vw, 22px)',
            letterSpacing: '0.15em',
            color: '#FFD700',
            textTransform: 'uppercase',
            marginBottom: '40px',
            padding: '0 16px',
          }}
        >
          You talk about your success.
        </p>

        <p
          style={{
            fontFamily: 'DM Sans',
            fontWeight: 300,
            fontSize: 'clamp(15px, 4vw, 18px)',
            color: 'rgba(232,234,240,0.55)',
            maxWidth: '540px',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}
        >
          An exclusive circle for founders, operators, and builders who are{' '}
          <em style={{ color: 'rgba(232,234,240,0.8)', fontStyle: 'normal', fontWeight: 400 }}>actually building.</em>
          {' '}Host events, form groups, and network with people who share your obsession.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/login">
            <button className="btn-primary" style={{ fontSize: '13px' }}>
              Enter GritClub
              <span style={{ fontSize: '16px' }}>→</span>
            </button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-outline" style={{ fontSize: '13px' }}>Browse Events</button>
          </Link>
        </div>

        {/* Floating orbs */}
        <div
          className="float absolute hidden md:block"
          style={{
            top: '20%', left: '8%',
            width: '180px', height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,59,59,0.12) 0%, transparent 70%)',
            border: '1px solid rgba(255,59,59,0.15)',
          }}
        />
        <div
          className="float-delay absolute hidden md:block"
          style={{
            bottom: '20%', right: '8%',
            width: '240px', height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
            border: '1px solid rgba(56,189,248,0.1)',
          }}
        />

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ fontFamily: 'DM Mono', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(232,234,240,0.3)' }}
        >
          <span>SCROLL</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        style={{
          background: '#FF3B3B',
          padding: '10px 0',
          overflow: 'hidden',
          borderTop: '1px solid rgba(255,59,59,0.5)',
          borderBottom: '1px solid rgba(255,59,59,0.5)',
        }}
      >
        <div className="ticker-inner">
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '12px', letterSpacing: '0.2em', color: '#070B14' }}>
              {['NETWORK WITH BUILDERS', 'HOST LIVE EVENTS', 'KEEP 80%', 'CREATE GROUPS', 'INVITE-ONLY ACCESS', 'WHITEBOARD & SCREEN SHARE', 'FIRST 5 MEMBERS FREE', 'BUILD IN PUBLIC'].map(t => (
                <span key={t} style={{ padding: '0 40px' }}>★ {t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="relative px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {stats.map((s, i) => (
              <div key={i} className="text-center px-8 py-6">
                <div
                  style={{
                    fontFamily: 'Syne',
                    fontWeight: 800,
                    fontSize: 'clamp(36px, 5vw, 56px)',
                    lineHeight: 1,
                    color: i % 2 === 0 ? '#FF3B3B' : '#FFD700',
                    marginBottom: '8px',
                  }}
                >
                  <Counter end={s.val} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#FF3B3B', marginBottom: '12px' }}>// WHAT YOU GET</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              BUILT FOR<br /><span style={{ color: '#FF3B3B' }}>BUILDERS</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.num}
                className="feature-card relative p-8"
                style={{
                  background: '#0D1420',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = f.color + '40' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                {/* Number */}
                <span
                  style={{
                    position: 'absolute', top: '24px', right: '24px',
                    fontFamily: 'DM Mono', fontSize: '11px',
                    color: 'rgba(232,234,240,0.2)', letterSpacing: '0.1em',
                  }}
                >{f.num}</span>

                {/* Icon */}
                <div
                  style={{
                    width: '48px', height: '48px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', color: f.color,
                    background: f.color + '12',
                    marginBottom: '20px',
                    clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                  }}
                >{f.icon}</div>

                <p style={{ fontFamily: 'DM Mono', fontSize: '10px', letterSpacing: '0.2em', color: f.color, marginBottom: '6px', textTransform: 'uppercase' }}>
                  {f.sub}
                </p>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', marginBottom: '12px', color: '#E8EAF0' }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '14px', color: 'rgba(232,234,240,0.5)', lineHeight: 1.7 }}>
                  {f.desc}
                </p>

                {/* Bottom accent line */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, ${f.color}40, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 md:px-12 py-24" style={{ background: '#0D1420' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#38BDF8', marginBottom: '12px' }}>// PROTOCOL</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
              HOW GRITCLUB <span style={{ color: '#38BDF8' }}>WORKS</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="absolute top-8 left-[16%] right-[16%] hidden md:block" style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.3), transparent)' }} />

            {[
              { step: '01', title: 'JOIN THE CIRCLE', desc: 'Sign in with Google or magic link. Your profile is your reputation. Build it.' },
              { step: '02', title: 'FIND YOUR PEOPLE', desc: 'Browse founders by industry and mindset. Send a connection. Form a group. Start building together.' },
              { step: '03', title: 'HOST & EARN', desc: 'Create a ticketed event. Go live. Screen share, whiteboard, chat with your audience. Keep 50%.' },
            ].map((s) => (
              <div key={s.step} className="relative text-center px-6">
                <div
                  className="relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-6"
                  style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
                >
                  <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '20px', color: '#38BDF8' }}>{s.step}</span>
                </div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px', letterSpacing: '0.1em', marginBottom: '12px', color: '#E8EAF0' }}>{s.title}</h3>
                <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '14px', color: 'rgba(232,234,240,0.5)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT OPTIONS ── */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#A78BFA', marginBottom: '12px' }}>// LIVE EVENTS</p>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
                THREE WAYS<br />TO <span style={{ color: '#A78BFA' }}>TEACH</span>
              </h2>
              <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '15px', color: 'rgba(232,234,240,0.55)', lineHeight: 1.8, marginBottom: '32px' }}>
                Every live event gives you full control. Audience gets chat only — you control the stage.
                Invite via link or restrict to your group.
              </p>
              <Link href="/auth/login">
                <button className="btn-primary">Start Hosting →</button>
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { board: 'WHITEBOARD', desc: 'Draw, sketch, diagram ideas in real time', color: '#E8EAF0', bg: 'rgba(232,234,240,0.06)' },
                { board: 'BLACKBOARD', desc: 'Classic dark teaching surface — sharp contrast', color: '#4ADE80', bg: 'rgba(74,222,128,0.06)' },
                { board: 'GREENBOARD', desc: 'The original classroom energy, digital', color: '#34D399', bg: 'rgba(52,211,153,0.06)' },
                { board: 'SCREEN SHARE', desc: 'Share your screen + camera simultaneously', color: '#38BDF8', bg: 'rgba(56,189,248,0.06)' },
              ].map((b) => (
                <div
                  key={b.board}
                  className="flex items-center gap-4 p-4"
                  style={{ background: b.bg, border: `1px solid ${b.color}20` }}
                >
                  <div style={{ width: '36px', height: '36px', background: b.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: b.color, fontSize: '14px', fontFamily: 'DM Mono' }}>▶</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', color: b.color }}>{b.board}</p>
                    <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.45)' }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GROUPS ── */}
      <section className="px-6 md:px-12 py-24" style={{ background: '#0D1420' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#FFD700', marginBottom: '12px' }}>// GROUPS</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
              YOUR <span style={{ color: '#FFD700' }}>INNER CIRCLE</span>
            </h2>
            <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '15px', color: 'rgba(232,234,240,0.5)', maxWidth: '480px', margin: '16px auto 0', lineHeight: 1.7 }}>
              First 5 members free. Scale beyond that and we grow together. Full chat, video call, shared notes — everything to run your operation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'AI Founders Circle', cat: 'AI & Tech', members: 5, premium: true },
              { name: 'SaaS Growth Hackers', cat: 'Growth', members: 4, premium: true },
              { name: 'Fundraising Prep', cat: 'Fundraising', members: 3, premium: false },
              { name: 'Product Builders', cat: 'Product', members: 5, premium: true },
              { name: 'Climate Tech', cat: 'Impact', members: 2, premium: true },
              { name: 'HealthTech Builders', cat: 'HealthTech', members: 3, premium: false },
            ].map((g, i) => (
              <div
                key={i}
                className="feature-card p-5"
                style={{ background: '#070B14', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    style={{
                      width: '40px', height: '40px',
                      background: `hsl(${i * 60}, 70%, 60%)22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px',
                      clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                    }}
                  >
                    ⬡
                  </div>
                  {g.premium && (
                    <span style={{ fontFamily: 'DM Mono', fontSize: '9px', letterSpacing: '0.12em', color: '#FFD700', background: 'rgba(255,215,0,0.1)', padding: '2px 8px', border: '1px solid rgba(255,215,0,0.2)' }}>PREMIUM</span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px', marginBottom: '4px', color: '#E8EAF0' }}>{g.name}</h3>
                <p style={{ fontFamily: 'DM Mono', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(232,234,240,0.35)', marginBottom: '12px' }}>{g.cat}</p>
                <div style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'rgba(232,234,240,0.4)' }}>
                  {g.members} members {g.members >= 5 && <span style={{ color: '#FFD700' }}>· paid</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#FF3B3B', marginBottom: '12px' }}>// FIELD REPORTS</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
              FROM THE <span style={{ color: '#FF3B3B' }}>FRONT LINE</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 relative"
                style={{ background: '#0D1420', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div style={{ fontSize: '40px', color: '#FF3B3B', lineHeight: 1, marginBottom: '16px', fontFamily: 'Georgia', opacity: 0.4 }}>"</div>
                <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '15px', color: 'rgba(232,234,240,0.7)', lineHeight: 1.7, marginBottom: '24px', fontStyle: 'italic' }}>
                  {t.text}
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', color: '#E8EAF0' }}>{t.name}</p>
                  <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'rgba(232,234,240,0.4)', marginTop: '2px' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="relative px-6 md:px-12 py-32 text-center overflow-hidden"
        style={{ background: '#FF3B3B' }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(36px, 7vw, 88px)', letterSpacing: '-0.04em', color: '#070B14', lineHeight: 0.9, marginBottom: '24px' }}>
            READY TO<br />BUILD?
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: '16px', color: 'rgba(7,11,20,0.7)', maxWidth: '400px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join 2,400+ founders already inside GritClub.
            No credit card required to join.
          </p>
          <Link href="/auth/login">
            <button
              style={{
                fontFamily: 'Syne', fontWeight: 800, fontSize: '14px', letterSpacing: '0.15em',
                padding: '16px 48px', background: '#070B14', color: '#FFD700', border: 'none', cursor: 'pointer',
                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                textTransform: 'uppercase', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Enter GritClub →
            </button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-6 md:px-12 py-12"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
            GRIT<span style={{ color: '#FF3B3B' }}>CLUB</span>
          </span>
          <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'rgba(232,234,240,0.25)', letterSpacing: '0.08em' }}>
            © 2026 GRITCLUB · gritclub.live
          </p>
          <div className="flex gap-6">
            <a href="/privacy" style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.35)', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8EAF0')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,234,240,0.35)')}>Privacy</a>
            <a href="/terms" style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.35)', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8EAF0')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,234,240,0.35)')}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
