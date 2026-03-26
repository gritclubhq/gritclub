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
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState<number | null>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    const scroll = () => setScrollY(window.scrollY)
    window.addEventListener('mousemove', move)
    window.addEventListener('scroll', scroll)
    // Random glitch
    const glitch = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 120)
    }, 4000)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('scroll', scroll)
      clearInterval(glitch)
    }
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
      desc: 'Ticket-gated live sessions. Screen share, whiteboard, blackboard, greenboard. You keep 80% of every dollar.',
      icon: '▶',
      color: '#38BDF8',
    },
    {
      num: '04',
      title: 'DIRECT MESSAGES',
      sub: 'Real conversations',
      desc: 'Slide into DMs with founders who matter. One-on-one or group threads. No algorithm. No noise. Just signal.',
      icon: '◉',
      color: '#A78BFA',
    },
  ]

  const stats = [
    { val: 80, suffix: '%', label: 'Host Revenue Share' },
    { val: 0, suffix: '', label: 'Setup Fees' },
    { val: 30, suffix: 's', label: 'To Go Live' },
    { val: 100, suffix: '%', label: 'Feature Access' },
  ]

  const testimonials = [
    { name: 'Early Member', role: 'SaaS Founder', text: 'Finally a platform where the conversations are worth having. No noise, no vanity — just builders talking real numbers.' },
    { name: 'Beta Host', role: 'Operator & Educator', text: 'The live room is incredibly smooth. I ran my first paid session within 24 hours of signing up and kept 80% of revenue.' },
    { name: 'Founding Member', role: 'Product Builder', text: 'GritClub DMs are where my best co-founder conversations happen. Direct, private, no distractions.' },
  ]

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: '#070B14',
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

        .glitch-text { position: relative; }
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
          transition: transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
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
          background: rgba(255,255,255,0.25);
          transform: translateX(-100%);
          transition: transform 0.3s;
        }
        .btn-primary:hover::before { transform: translateX(0); }
        .btn-primary:hover { transform: scale(1.03); }

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
          33% { transform: translateY(-14px) rotate(1deg); }
          66% { transform: translateY(7px) rotate(-1deg); }
        }
        .float { animation: float 8s ease-in-out infinite; }
        .float-delay { animation: float 8s ease-in-out infinite 2.5s; }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-inner {
          animation: ticker 28s linear infinite;
          display: flex;
          white-space: nowrap;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.35;
          mix-blend-mode: overlay;
        }

        /* Animated grid lines */
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }

        /* Shine sweep on cards */
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        .card-shine:hover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          animation: shine 0.6s ease forwards;
          pointer-events: none;
          overflow: hidden;
        }

        /* Orbit animation for hero decoration */
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(140px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          0% { transform: rotate(120deg) translateX(200px) rotate(-120deg); }
          100% { transform: rotate(480deg) translateX(200px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          0% { transform: rotate(240deg) translateX(260px) rotate(-240deg); }
          100% { transform: rotate(600deg) translateX(260px) rotate(-600deg); }
        }
        .orb1 { animation: orbit 12s linear infinite; }
        .orb2 { animation: orbit2 18s linear infinite; }
        .orb3 { animation: orbit3 24s linear infinite; }

        /* Fade-in on scroll */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease forwards; }

        /* DM bubble animation */
        @keyframes bubble-in {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dm-bubble { animation: bubble-in 0.4s ease forwards; }
        .dm-bubble:nth-child(2) { animation-delay: 0.6s; opacity: 0; }
        .dm-bubble:nth-child(3) { animation-delay: 1.2s; opacity: 0; }
        .dm-bubble:nth-child(4) { animation-delay: 1.8s; opacity: 0; }

        @keyframes typing {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typing-dot { animation: typing 1s ease infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* Noise */}
      <div className="noise-overlay" />

      {/* Radial glow following cursor */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,59,59,0.07), transparent 60%)`,
          transition: 'background 0.08s',
        }}
      />

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{
          height: '64px',
          background: scrollY > 20 ? 'rgba(7,11,20,0.95)' : 'rgba(7,11,20,0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${scrollY > 20 ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          transition: 'all 0.3s',
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
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 scan-line overflow-hidden"
        style={{ paddingTop: '64px' }}
      >
        {/* Animated moving grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'grid-move 4s linear infinite',
          }}
        />

        {/* Hero background — boardroom founders image blended */}
        <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
          {/* Use the provided boardroom image at the bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '55%',
              background: 'linear-gradient(to bottom, #070B14 0%, rgba(7,11,20,0.6) 30%, rgba(7,11,20,0.4) 70%, rgba(7,11,20,0.7) 100%)',
              zIndex: 1,
            }}
          />
          {/* Founders in boardroom — evoke the image with CSS art */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(13,20,32,0.95) 0%, transparent 100%)',
            zIndex: 2,
          }}/>

          {/* Network SVG graph — professional founder/networking theme */}
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0, opacity: 0.22 }}>
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
            <line x1="200" y1="150" x2="420" y2="280" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.5"/>
            <line x1="420" y1="280" x2="650" y2="180" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.5"/>
            <line x1="650" y1="180" x2="850" y2="320" stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.4"/>
            <line x1="850" y1="320" x2="1100" y2="200" stroke="#FF3B3B" strokeWidth="0.8" strokeOpacity="0.4"/>
            <line x1="1100" y1="200" x2="1280" y2="350" stroke="#FF3B3B" strokeWidth="0.8" strokeOpacity="0.4"/>
            <line x1="420" y1="280" x2="380" y2="500" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="380" y1="500" x2="580" y2="620" stroke="#2563EB" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="580" y1="620" x2="780" y2="520" stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="780" y1="520" x2="1050" y2="600" stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="1050" y1="600" x2="1280" y2="350" stroke="#FF3B3B" strokeWidth="0.8" strokeOpacity="0.35"/>
            <line x1="650" y1="180" x2="580" y2="620" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6"/>
            <line x1="850" y1="320" x2="780" y2="520" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6"/>
            <line x1="140" y1="620" x2="380" y2="500" stroke="#38BDF8" strokeWidth="0.7" strokeOpacity="0.3"/>
            <line x1="140" y1="620" x2="200" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            <line x1="1050" y1="600" x2="1050" y2="750" stroke="#FF3B3B" strokeWidth="0.7" strokeOpacity="0.3"/>
            <line x1="780" y1="520" x2="850" y2="750" stroke="#FFD700" strokeWidth="0.7" strokeOpacity="0.3"/>
            <line x1="300" y1="750" x2="580" y2="620" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
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
                <circle cx={cx} cy={(cy as number)-(r as number)*0.25} r={(r as number)*0.28} fill={color as string} opacity="0.55"/>
                <path d={`M ${(cx as number)-(r as number)*0.45} ${(cy as number)+(r as number)*0.5} Q ${cx} ${(cy as number)+(r as number)*0.15} ${(cx as number)+(r as number)*0.45} ${(cy as number)+(r as number)*0.5}`}
                  fill={color as string} opacity="0.35"/>
              </g>
            ))}
            <circle cx="420" cy="280" r="40" fill="url(#nodeBlue)" opacity="0.35"/>
            <circle cx="850" cy="320" r="35" fill="url(#nodeRed)" opacity="0.3"/>
            <circle cx="780" cy="520" r="35" fill="url(#nodeGold)" opacity="0.28"/>
            <circle cx="1100" cy="200" r="30" fill="url(#nodeRed)" opacity="0.25"/>
          </svg>

          {/* Color atmosphere */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(37,99,235,0.07) 0%, transparent 45%, rgba(255,59,59,0.06) 100%)' }}/>

          {/* Radial deep glow center */}
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', background: 'radial-gradient(ellipse, rgba(255,59,59,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        </div>

        {/* Orbiting particles */}
        <div className="absolute hidden lg:block" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '1px', height: '1px' }}>
          <div className="orb1" style={{ position: 'absolute' }}>
            <div style={{ width: '6px', height: '6px', background: '#FF3B3B', borderRadius: '50%', opacity: 0.6, boxShadow: '0 0 8px #FF3B3B' }}/>
          </div>
          <div className="orb2" style={{ position: 'absolute' }}>
            <div style={{ width: '5px', height: '5px', background: '#38BDF8', borderRadius: '50%', opacity: 0.5, boxShadow: '0 0 8px #38BDF8' }}/>
          </div>
          <div className="orb3" style={{ position: 'absolute' }}>
            <div style={{ width: '4px', height: '4px', background: '#FFD700', borderRadius: '50%', opacity: 0.4, boxShadow: '0 0 8px #FFD700' }}/>
          </div>
        </div>

        {/* Live counter badge */}
        <div
          className="relative inline-flex items-center gap-2 px-4 py-2 mb-10"
          style={{
            background: 'rgba(255,59,59,0.1)',
            border: '1px solid rgba(255,59,59,0.35)',
            fontFamily: 'DM Mono',
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: '#FF3B3B',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 absolute left-[14px]" />
          <span className="w-2 h-2 rounded-full" style={{ background: '#FF3B3B', animation: 'pulse-ring 1.5s ease-out infinite', display: 'inline-block' }} />
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
        <div style={{ width: 'min(400px, 80vw)', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)', margin: '24px auto' }} />

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
            maxWidth: '560px',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}
        >
          An exclusive circle for founders, operators, and builders who are{' '}
          <em style={{ color: 'rgba(232,234,240,0.85)', fontStyle: 'normal', fontWeight: 400 }}>actually building.</em>
          {' '}Host events, form groups, DM founders, and network with people who share your obsession.
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
            width: '200px', height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,59,59,0.12) 0%, transparent 70%)',
            border: '1px solid rgba(255,59,59,0.12)',
          }}
        />
        <div
          className="float-delay absolute hidden md:block"
          style={{
            bottom: '22%', right: '7%',
            width: '260px', height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
            border: '1px solid rgba(56,189,248,0.08)',
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
              {['NETWORK WITH BUILDERS', 'HOST LIVE EVENTS', 'KEEP 80%', 'CREATE GROUPS', 'SEND DIRECT MESSAGES', 'WHITEBOARD & SCREEN SHARE', 'FIRST 5 MEMBERS FREE', 'BUILD IN PUBLIC', '80% REVENUE YOURS'].map(t => (
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
              <div key={i} className="text-center px-8 py-6 relative">
                {/* Subtle top accent */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '2px', background: i % 2 === 0 ? '#FF3B3B' : '#FFD700', opacity: 0.6 }}/>
                <div
                  style={{
                    fontFamily: 'Syne',
                    fontWeight: 800,
                    fontSize: 'clamp(36px, 5vw, 60px)',
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
            {features.map((f, idx) => (
              <div
                key={f.num}
                className="feature-card card-shine relative p-8 overflow-hidden"
                style={{
                  background: '#0D1420',
                  border: `1px solid ${activeFeature === idx ? f.color + '40' : 'rgba(255,255,255,0.06)'}`,
                  cursor: 'default',
                }}
                onMouseEnter={() => setActiveFeature(idx)}
                onMouseLeave={() => setActiveFeature(null)}
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
                    width: '52px', height: '52px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', color: f.color,
                    background: f.color + '14',
                    marginBottom: '20px',
                    clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                    transition: 'transform 0.3s',
                    transform: activeFeature === idx ? 'scale(1.1)' : 'scale(1)',
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
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, ${f.color}50, transparent)`, opacity: activeFeature === idx ? 1 : 0.3, transition: 'opacity 0.3s' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIRECT MESSAGES FEATURE ── */}
      <section className="px-6 md:px-12 py-24" style={{ background: '#09101D' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#A78BFA', marginBottom: '12px' }}>// DIRECT MESSAGES</p>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
                TALK TO<br /><span style={{ color: '#A78BFA' }}>WHO MATTERS</span>
              </h2>
              <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '15px', color: 'rgba(232,234,240,0.55)', lineHeight: 1.8, marginBottom: '24px' }}>
                Send direct messages to any founder on the platform. One-on-one or group threads — the fastest way to go from a live session to a real conversation.
              </p>
              <div className="space-y-3" style={{ marginBottom: '32px' }}>
                {[
                  { icon: '◎', label: 'Instant 1-on-1 DMs', desc: 'Reach any founder directly, no gatekeeping' },
                  { icon: '⬡', label: 'Group Threads', desc: 'Loop in your mastermind or accountability crew' },
                  { icon: '▶', label: 'Event Follow-Ups', desc: 'DM speakers right after a live session' },
                  { icon: '◈', label: 'No Algorithm', desc: 'Your message arrives — no shadow-banning, no delays' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span style={{ color: '#A78BFA', fontFamily: 'DM Mono', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', color: '#E8EAF0' }}>{item.label} </span>
                      <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.45)' }}>— {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/auth/login">
                <button className="btn-primary" style={{ background: '#A78BFA', color: '#070B14' }}>Start Messaging →</button>
              </Link>
            </div>

            {/* DM UI Mock */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  background: '#0D1420',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.1)',
                }}
              >
                {/* DM header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px', background: '#0A0F1C' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF3B3B, #FF6B6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: '13px', color: '#fff' }}>J</div>
                  <div>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', color: '#E8EAF0', margin: 0 }}>Jake Harris</p>
                    <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: '#22C55E', margin: 0 }}>● Online</p>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(232,234,240,0.2)' }}>⋯</div>
                </div>

                {/* Messages */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '240px' }}>
                  <div className="dm-bubble" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF3B3B, #FF6B6B)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontSize: '10px', fontWeight: 800, color: '#fff' }}>J</div>
                    <div style={{ background: '#1A2333', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', maxWidth: '75%' }}>
                      <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.8)', margin: 0, lineHeight: 1.5 }}>Loved your session on SaaS pricing — how did you get to that $297 price point?</p>
                    </div>
                  </div>

                  <div className="dm-bubble" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: 'row-reverse' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontSize: '10px', fontWeight: 800, color: '#fff' }}>Y</div>
                    <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.2)', padding: '10px 14px', borderRadius: '12px 12px 2px 12px', maxWidth: '75%' }}>
                      <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.8)', margin: 0, lineHeight: 1.5 }}>Ran 3 cohorts at different prices. $297 had the least churn and best ROI conversations 🔥</p>
                    </div>
                  </div>

                  <div className="dm-bubble" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF3B3B, #FF6B6B)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontSize: '10px', fontWeight: 800, color: '#fff' }}>J</div>
                    <div style={{ background: '#1A2333', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', maxWidth: '75%' }}>
                      <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(232,234,240,0.8)', margin: 0, lineHeight: 1.5 }}>That's gold. Want to hop on a call this week?</p>
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', flexShrink: 0 }}/>
                    <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', padding: '12px 16px', borderRadius: '12px 12px 2px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A78BFA', display: 'inline-block' }}/>
                      <span className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A78BFA', display: 'inline-block' }}/>
                      <span className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A78BFA', display: 'inline-block' }}/>
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', alignItems: 'center', background: '#0A0F1C' }}>
                  <div style={{ flex: 1, background: '#1A2333', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', fontFamily: 'DM Sans', fontSize: '12px', color: 'rgba(232,234,240,0.35)' }}>
                    Message Jake...
                  </div>
                  <div style={{ width: '32px', height: '32px', background: '#A78BFA', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <span style={{ color: '#070B14', fontSize: '14px' }}>→</span>
                  </div>
                </div>
              </div>

              {/* Glow */}
              <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: -1 }}/>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDERS BOARDROOM (image section) ── */}
      <section className="relative py-20 overflow-hidden" style={{ background: '#070B14' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#38BDF8', marginBottom: '12px' }}>// THE ROOM</p>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
              WHERE <span style={{ color: '#38BDF8' }}>REAL DEALS</span> HAPPEN
            </h2>
            <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '15px', color: 'rgba(232,234,240,0.5)', maxWidth: '480px', margin: '16px auto 0', lineHeight: 1.7 }}>
              Not just online. The connections made on GritClub happen in boardrooms, calls, and co-founder meetups.
            </p>
          </div>

          {/* Two image cards side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1 — Boardroom meeting evoked with CSS */}
            <div
              style={{
                position: 'relative',
                height: '280px',
                background: 'linear-gradient(135deg, #0D1A2D 0%, #162030 100%)',
                border: '1px solid rgba(56,189,248,0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Laptop / meeting scene abstraction */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Simplified boardroom scene */}
                <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%', opacity: 0.6 }}>
                  {/* Table */}
                  <ellipse cx="200" cy="155" rx="160" ry="35" fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="1"/>
                  {/* Laptops on table */}
                  {[60, 120, 180, 240, 300, 340].map((x, i) => (
                    <g key={i}>
                      <rect x={x-16} y="130" width="32" height="22" rx="2" fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.25)" strokeWidth="0.8"/>
                      <rect x={x-14} y="132" width="28" height="18" rx="1" fill="rgba(56,189,248,0.08)"/>
                      {/* Screen glow */}
                      <rect x={x-10} y="134" width="20" height="14" rx="1" fill={i % 2 === 0 ? 'rgba(56,189,248,0.15)' : 'rgba(255,59,59,0.12)'}/>
                    </g>
                  ))}
                  {/* People silhouettes sitting */}
                  {[70, 130, 200, 270, 330].map((x, i) => (
                    <g key={i}>
                      {/* Head */}
                      <circle cx={x} cy="105" r="10" fill={i === 2 ? 'rgba(255,215,0,0.4)' : 'rgba(56,189,248,0.25)'}/>
                      {/* Body */}
                      <path d={`M ${x-14} 145 Q ${x-6} 125 ${x} 115 Q ${x+6} 125 ${x+14} 145`} fill={i === 2 ? 'rgba(255,215,0,0.2)' : 'rgba(56,189,248,0.12)'} stroke="none"/>
                    </g>
                  ))}
                  {/* Presenter standing */}
                  <circle cx="200" cy="65" r="13" fill="rgba(255,59,59,0.5)"/>
                  <path d="M 178 110 Q 188 85 200 75 Q 212 85 222 110" fill="rgba(255,59,59,0.25)"/>
                  {/* Screen behind presenter */}
                  <rect x="155" y="30" width="90" height="55" rx="2" fill="rgba(255,59,59,0.08)" stroke="rgba(255,59,59,0.2)" strokeWidth="1"/>
                  <text x="200" y="60" textAnchor="middle" fontFamily="DM Mono" fontSize="8" fill="rgba(255,59,59,0.5)">GRITCLUB</text>
                  {/* Gift bags (from original image) */}
                  {[100, 155, 245, 300].map((x, i) => (
                    <g key={i}>
                      <rect x={x-6} y="138" width="12" height="14" rx="1" fill={i % 2 === 0 ? 'rgba(255,107,53,0.3)' : 'rgba(255,215,0,0.25)'} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                      <path d={`M ${x-4} 138 Q ${x} 134 ${x+4} 138`} stroke={i % 2 === 0 ? '#FF6B35' : '#FFD700'} strokeWidth="0.8" fill="none"/>
                    </g>
                  ))}
                </svg>
              </div>
              {/* Overlay gradient */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,11,20,0.8) 0%, transparent 50%)' }}/>
              <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', color: '#38BDF8', letterSpacing: '0.05em' }}>IN-PERSON MEETUPS</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'rgba(232,234,240,0.45)' }}>GritClub members connecting IRL</p>
              </div>
            </div>

            {/* Card 2 — Energy / collaboration scene */}
            <div
              style={{
                position: 'relative',
                height: '280px',
                background: 'linear-gradient(135deg, #0D1A2D 0%, #1A1230 100%)',
                border: '1px solid rgba(255,215,0,0.12)',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%', opacity: 0.7 }}>
                  {/* Energy wave visualization — referencing the glowing overhead view image */}
                  <defs>
                    <radialGradient id="waveGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#FF6B35" stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  {/* Flowing energy waves between tables */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <path
                      key={i}
                      d={`M 20 ${60 + i*24} C 80 ${40 + i*24}, 160 ${90 + i*18}, 200 ${55 + i*22} S 320 ${30 + i*28}, 380 ${60 + i*20}`}
                      fill="none"
                      stroke={i % 2 === 0 ? `rgba(255,215,0,${0.4 - i*0.05})` : `rgba(56,189,248,${0.35 - i*0.04})`}
                      strokeWidth={1.5 - i*0.2}
                    />
                  ))}
                  {/* Table shapes (overhead view) */}
                  {[
                    { x: 60, y: 90, w: 80, h: 45 },
                    { x: 200, y: 70, w: 80, h: 45 },
                    { x: 310, y: 110, w: 70, h: 40 },
                  ].map((t, i) => (
                    <g key={i}>
                      <rect x={t.x} y={t.y} width={t.w} height={t.h} rx="4" fill="rgba(26,36,56,0.8)" stroke={i === 0 ? 'rgba(255,215,0,0.25)' : 'rgba(56,189,248,0.2)'} strokeWidth="1"/>
                      {/* People around table (overhead dots) */}
                      {[[-20,0],[20,0],[0,-20],[0,20]].map(([dx,dy], j) => (
                        <circle key={j} cx={t.x + t.w/2 + dx} cy={t.y + t.h/2 + dy} r="6"
                          fill={`rgba(${i === 1 ? '255,215,0' : '56,189,248'},0.4)`}/>
                      ))}
                      {/* Globe/monitor at center */}
                      <circle cx={t.x + t.w/2} cy={t.y + t.h/2} r="8" fill={`rgba(${i === 2 ? '255,59,59' : '255,215,0'},0.15)`} stroke={`rgba(${i === 2 ? '255,59,59' : '255,215,0'},0.3)`} strokeWidth="1"/>
                    </g>
                  ))}
                  {/* Central energy glow */}
                  <circle cx="200" cy="115" r="30" fill="url(#waveGrad)" opacity="0.4"/>
                </svg>
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,11,20,0.8) 0%, transparent 50%)' }}/>
              <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', color: '#FFD700', letterSpacing: '0.05em' }}>COLLABORATIVE ENERGY</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'rgba(232,234,240,0.45)' }}>Real collaboration, real results</p>
              </div>
            </div>
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

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="absolute top-8 left-[12%] right-[12%] hidden md:block" style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.3), rgba(56,189,248,0.3), transparent)' }} />

            {[
              { step: '01', title: 'JOIN', desc: 'Sign in with Google or magic link. Your profile is your reputation.' },
              { step: '02', title: 'CONNECT', desc: 'Browse founders. Send a DM. Form a group. Start building together.' },
              { step: '03', title: 'ATTEND', desc: 'Buy a ticket to a live session. Learn, network, ask questions in chat.' },
              { step: '04', title: 'HOST & EARN', desc: 'Create a ticketed event. Go live. Keep 80% of every dollar earned.' },
            ].map((s) => (
              <div key={s.step} className="relative text-center px-4">
                <div
                  className="relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-6"
                  style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
                >
                  <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '20px', color: '#38BDF8' }}>{s.step}</span>
                </div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', letterSpacing: '0.12em', marginBottom: '10px', color: '#E8EAF0' }}>{s.title}</h3>
                <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '13px', color: 'rgba(232,234,240,0.5)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVENUE 80% SPOTLIGHT ── */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#FFD700', marginBottom: '12px' }}>// HOST EARNINGS</p>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
                YOU KEEP<br /><span style={{ color: '#FFD700', fontSize: 'clamp(48px, 7vw, 96px)' }}>80%</span><br />
                <span style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>OF EVERY DOLLAR</span>
              </h2>
              <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '15px', color: 'rgba(232,234,240,0.55)', lineHeight: 1.8, marginBottom: '28px' }}>
                We take just 20% to keep the platform running. Your expertise, your audience, your money. No complicated tiers, no hidden fees.
              </p>
              <div style={{ background: '#0D1420', border: '1px solid rgba(255,215,0,0.15)', padding: '20px', marginBottom: '28px' }}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'If you sell 50 tickets at $29', you: '$1,160', platform: '$290' },
                    { label: 'If you sell 100 tickets at $49', you: '$3,920', platform: '$980' },
                  ].map((ex, i) => (
                    <div key={i}>
                      <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(232,234,240,0.3)', marginBottom: '8px' }}>{ex.label}</p>
                      <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '22px', color: '#FFD700' }}>You: {ex.you}</p>
                      <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(232,234,240,0.3)' }}>Platform: {ex.platform}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/auth/login">
                <button className="btn-primary">Become a Host →</button>
              </Link>
            </div>

            {/* Visual representation */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '280px', height: '280px' }}>
                {/* Pie chart SVG */}
                <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <radialGradient id="goldGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="#FF8C00" stopOpacity="0.7"/>
                    </radialGradient>
                  </defs>
                  {/* Background circle */}
                  <circle cx="100" cy="100" r="90" fill="#0D1420" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                  {/* 80% arc — gold */}
                  <path
                    d="M 100 10 A 90 90 0 1 1 38.2 162.8 L 100 100 Z"
                    fill="url(#goldGrad)"
                    opacity="0.85"
                  />
                  {/* 20% arc — dark */}
                  <path
                    d="M 38.2 162.8 A 90 90 0 0 1 100 10 L 100 100 Z"
                    fill="rgba(255,59,59,0.2)"
                    stroke="rgba(255,59,59,0.2)"
                    strokeWidth="0.5"
                  />
                  {/* Center circle */}
                  <circle cx="100" cy="100" r="55" fill="#070B14"/>
                  <text x="100" y="92" textAnchor="middle" fontFamily="Syne" fontWeight="800" fontSize="28" fill="#FFD700">80%</text>
                  <text x="100" y="110" textAnchor="middle" fontFamily="DM Mono" fontSize="9" fill="rgba(232,234,240,0.4)">YOUR SHARE</text>
                </svg>
                {/* Labels */}
                <div style={{ position: 'absolute', top: '15%', right: '-30px', fontFamily: 'DM Mono', fontSize: '10px', color: '#FFD700', letterSpacing: '0.1em' }}>HOST</div>
                <div style={{ position: 'absolute', bottom: '18%', left: '-10px', fontFamily: 'DM Mono', fontSize: '10px', color: '#FF3B3B', letterSpacing: '0.1em' }}>PLATFORM</div>
              </div>
              {/* Outer glow */}
              <div style={{ position: 'absolute', inset: '-40px', background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}/>
            </div>
          </div>
        </div>
      </section>

      {/* ── EVENT OPTIONS ── */}
      <section className="px-6 md:px-12 py-24" style={{ background: '#09101D' }}>
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
              ].map((b, i) => (
                <div
                  key={b.board}
                  className="feature-card flex items-center gap-4 p-4"
                  style={{ background: b.bg, border: `1px solid ${b.color}20`, cursor: 'default' }}
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
                className="feature-card p-6 relative"
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
        {/* Animated shimmer */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`, transition: 'background 0.1s' }}/>
        <div className="relative">
          <p style={{ fontFamily: 'DM Mono', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(7,11,20,0.5)', marginBottom: '16px' }}>// YOUR MOVE</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(36px, 7vw, 88px)', letterSpacing: '-0.04em', color: '#070B14', lineHeight: 0.9, marginBottom: '24px' }}>
            READY TO<br />BUILD?
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: '16px', color: 'rgba(7,11,20,0.7)', maxWidth: '400px', margin: '0 auto 16px', lineHeight: 1.7 }}>
            Join 2,400+ founders already inside GritClub.
            No credit card required to join.
          </p>
          <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: 'rgba(7,11,20,0.55)', marginBottom: '40px', letterSpacing: '0.08em' }}>
            HOST? KEEP 80% OF EVERY DOLLAR YOU EARN.
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
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '24px clamp(16px,5vw,48px)', background: '#080D1A' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
            <div style={{ width: '24px', height: '24px', background: '#FF3B3B', clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: '11px', color: '#fff' }}>G</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em' }}>GRIT<span style={{ color: '#FF3B3B' }}>CLUB</span></span>
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            <a href="/privacy" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'rgba(240,244,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.4)')}>Privacy Policy</a>
            <a href="/terms" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'rgba(240,244,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.4)')}>Terms of Service</a>
          </div>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(240,244,255,0.2)' }}>© 2026 GritClub · gritclub.live · Hosts keep 80%</p>
        </div>
      </footer>
    </div>
  )
}
