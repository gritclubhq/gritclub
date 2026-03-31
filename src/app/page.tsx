'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Zap, Users, Radio, MessageCircle, ArrowRight, Play,
  Monitor, PenTool, HelpCircle, ChevronDown, Menu, X, LayoutDashboard, LogOut, UserCircle, Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

/* ─── PALETTE ─── */
const P = {
  bg:          '#291C0E',
  bgSecondary: '#2F2115',
  card:        '#3D2B1F',
  cardEl:      '#4A3327',
  border:      'rgba(225,212,194,0.08)',
  borderStr:   'rgba(225,212,194,0.18)',
  text:        '#E1D4C2',
  textMuted:   '#BEB5A9',
  textDim:     '#A78D78',
  accent:      '#C4956A',
  accentDeep:  '#7A5245',
}

/* ─── INTRO ANIMATION ─── */
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div
    className="fixed inset-0 z-[100] flex items-center justify-center"
    style={{ background: P.bg }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div className="flex flex-col items-center gap-4">
      <motion.h1
        className="font-display text-gradient-brand text-6xl sm:text-8xl md:text-[10rem] lg:text-[13rem] font-bold tracking-tight leading-none select-none"
        initial={{ opacity: 0, y: 40, letterSpacing: '0.3em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '-0.02em' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      >
        GRITCLUB
      </motion.h1>
      <motion.div
        className="h-[1px]"
        style={{ background: `linear-gradient(to right, transparent, ${P.accent}, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: '60%' }}
        transition={{ duration: 0.8, delay: 1 }}
      />
      <motion.p
        className="font-heading tracking-[0.5em] uppercase text-xs md:text-sm"
        style={{ color: P.textDim }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Where ambition meets action
      </motion.p>
    </motion.div>
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-1 origin-left"
      style={{ background: `linear-gradient(to right, ${P.accentDeep}, ${P.accent})` }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 2.5, ease: 'linear', delay: 0.5 }}
      onAnimationComplete={onComplete}
    />
  </motion.div>
)

/* ─── NAVBAR ─── */
const Navbar = ({ visible }: { visible: boolean }) => {
  const { scrollY } = useScroll()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => scrollY.on('change', (y) => setScrolled(y > 50)), [scrollY])

  const navLinks = ['About', 'Pillars', 'How It Works', 'Tools']
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  if (!visible) return null

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.5s',
        background: scrolled ? `${P.bg}F2` : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${P.border}` : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? '64px' : '96px', transition: 'height 0.5s' }}>
          <span className="font-display font-bold tracking-wide text-gradient-brand" style={{ fontSize: scrolled ? '1.5rem' : '2.5rem', transition: 'font-size 0.5s' }}>
            GRITCLUB
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                className="font-heading text-sm tracking-widest uppercase transition-colors duration-300"
                style={{ color: P.textDim }}
                onMouseEnter={e => (e.currentTarget.style.color = P.text)}
                onMouseLeave={e => (e.currentTarget.style.color = P.textDim)}
              >
                {link}
              </a>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-4">
                <Link href="/dashboard">
                  <button
                    className="btn-primary flex items-center gap-2 text-sm"
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                </Link>
                {/* Avatar dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: P.cardEl, border: `1px solid ${P.borderStr}`,
                      color: P.text, fontFamily: "'Sora', sans-serif",
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {initials}
                  </button>
                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute', top: 44, right: 0, minWidth: 180,
                          background: P.cardEl, border: `1px solid ${P.borderStr}`,
                          borderRadius: 10, overflow: 'hidden', zIndex: 100,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                        onMouseLeave={() => setDropOpen(false)}
                      >
                        {[
                          { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard },
                          { href: '/dashboard/profile',  label: 'Profile',   icon: UserCircle },
                          { href: '/dashboard/messages', label: 'Settings',  icon: Settings },
                        ].map(({ href, label, icon: Icon }) => (
                          <Link key={href} href={href} onClick={() => setDropOpen(false)}>
                            <div
                              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, color: P.textMuted, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.bg; (e.currentTarget as HTMLElement).style.color = P.text }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.textMuted }}
                            >
                              <Icon size={14} /> {label}
                            </div>
                          </Link>
                        ))}
                        <div style={{ borderTop: `1px solid ${P.border}` }}>
                          <button
                            onClick={() => { setDropOpen(false); logout() }}
                            style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#C0614A', cursor: 'pointer', fontSize: 13, background: 'transparent', border: 'none', transition: 'all 0.15s' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = P.bg)}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <Link href="/auth/login">
                <button
                  className="btn-primary ml-4 font-heading font-bold tracking-wider uppercase text-sm"
                  style={{ padding: '8px 20px' }}
                >
                  Enter the Network
                </button>
              </Link>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden" style={{ color: P.text }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ background: `${P.bg}F5`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${P.border}`, overflow: 'hidden' }}
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-sm tracking-widest uppercase"
                  style={{ color: P.textDim }}
                >
                  {link}
                </a>
              ))}
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <button className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                      <LayoutDashboard size={15} /> Dashboard
                    </button>
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); logout() }}
                    style={{ background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 10, padding: '8px 16px', color: '#C0614A', fontFamily: "'Sora', sans-serif", fontSize: 13, cursor: 'pointer' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <button className="btn-primary mt-2 w-full font-heading font-bold tracking-wider uppercase text-sm">
                    Enter the Network
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ─── ANIMATED COUNTER ─── */
const Counter = ({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) => {
  const [count,   setCount]   = useState(0)
  const ref                   = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let current = 0
    const step = Math.ceil(end / 60)
    const interval = setInterval(() => {
      current += step
      if (current >= end) { setCount(end); clearInterval(interval) }
      else setCount(current)
    }, 25)
    return () => clearInterval(interval)
  }, [started, end])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ─── SECTION WRAPPER ─── */
const Section = ({ children, id, className = '', style = {} }: { children: React.ReactNode; id?: string; className?: string; style?: React.CSSProperties }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className={`relative py-24 md:py-32 ${className}`}
    style={style}
  >
    {children}
  </motion.section>
)

/* ─── FLOATING PARTICLES ─── */
const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: ((i * 37 + 13) % 100),
    top:  ((i * 53 + 7)  % 100),
    duration: 4 + (i % 4),
    delay: (i % 3),
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full"
          style={{ left: `${p.left}%`, top: `${p.top}%`, background: `${P.accent}33` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </div>
  )
}

/* ─── PILLAR CARD ─── */
const PillarCard = ({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.15 }}
    whileHover={{ y: -6, transition: { duration: 0.3 } }}
    style={{
      position: 'relative', background: P.card,
      border: `1px solid ${P.border}`, borderRadius: 14,
      padding: 32, overflow: 'hidden', cursor: 'default',
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}
    className="group"
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `${P.accent}08` }} />
    <div className="absolute top-0 left-0 w-16 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to right, ${P.accent}, transparent)` }} />
    <div className="absolute top-0 left-0 w-[1px] h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to bottom, ${P.accent}, transparent)` }} />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ background: `${P.accent}18` }}>
        <Icon className="w-6 h-6" style={{ color: P.accent }} />
      </div>
      <h3 className="font-display text-xl font-bold mb-3" style={{ color: P.text }}>{title}</h3>
      <p className="font-body text-sm leading-relaxed" style={{ color: P.textMuted }}>{desc}</p>
    </div>
  </motion.div>
)

/* ─── MAIN PAGE ─── */
export default function LandingPage() {
  const [introComplete, setIntroComplete] = useState(false)
  const [showContent,   setShowContent]   = useState(false)
  const { scrollYProgress }               = useScroll()
  const heroParallax                      = useTransform(scrollYProgress, [0, 0.3], [0, -100])

  const handleIntroComplete = () => {
    setIntroComplete(true)
    setTimeout(() => setShowContent(true), 600)
  }

  const pillars = [
    { icon: Radio,         title: 'Live Sessions',   desc: 'Interactive sessions with founders and operators. Real workflows, real decisions, no pre-recorded content.' },
    { icon: MessageCircle, title: 'Direct Access',   desc: 'Message founders, mentors, and builders directly. No audience walls or artificial barriers.' },
    { icon: Users,         title: 'Small Groups',    desc: 'Groups of 5 with aligned goals. Built for accountability, consistency, and long-term progress.' },
    { icon: Zap,           title: 'Curated Network', desc: 'People filtered by intent and stage — from early builders to experienced operators.' },
  ]

  const steps = [
    { num: '01', title: 'Enter',   desc: 'Create a simple profile and enter the network.' },
    { num: '02', title: 'Connect', desc: 'Find and connect with people working on similar or higher-level problems.' },
    { num: '03', title: 'Learn',   desc: 'Join live sessions and learn directly from people executing in real time.' },
    { num: '04', title: 'Lead',    desc: 'Host sessions, share knowledge, and build your own authority.' },
  ]

  const tools = [
    { icon: PenTool,    name: 'Whiteboard',   desc: 'Draw, diagram, and teach in real-time' },
    { icon: Monitor,    name: 'Screen Share', desc: 'Walk through your actual workflow' },
    { icon: HelpCircle, name: 'Live Q&A',     desc: 'Audience questions, voted and queued' },
    { icon: Play,       name: 'Replays',      desc: 'Every session recorded for ticket holders' },
  ]

  const divider = { borderTop: `1px solid ${P.border}` }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: P.bg }}>
      <AnimatePresence mode="wait">
        {!introComplete && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <Navbar visible={showContent} />

      {showContent && (
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>

          {/* ═══ HERO ═══ */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <motion.div className="absolute inset-0" style={{ y: heroParallax }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hero-bg.jpg" alt="" className="w-full h-[120%] object-cover" style={{ filter: 'brightness(0.35) saturate(0.6)' }} />
              <div className="absolute inset-0" style={{ background: `${P.bg}B0` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${P.bg} 0%, ${P.bg}60 40%, transparent 100%)` }} />
            </motion.div>
            <Particles />
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-24">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}>
                <p className="font-heading tracking-[0.4em] uppercase text-xs md:text-sm mb-8" style={{ color: P.accent }}>
                  A private network for builders
                </p>
                <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-[0.9] mb-8">
                  <span style={{ color: P.text }}>Find the People</span>
                  <br />
                  <span className="text-gradient-brand glow-brand">You Build With</span>
                </h1>
                <p className="font-body text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: P.textMuted }}>
                  A focused environment to connect with founders, learn from operators, and build alongside people who are actually doing the work.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/login">
                    <button
                      className="inline-flex items-center gap-2 text-base px-10 py-5 font-heading font-bold tracking-wider uppercase rounded"
                      style={{ background: `linear-gradient(135deg, ${P.accentDeep}, #6E473B)`, color: P.text, border: `1px solid ${P.borderStr}`, transition: 'all 0.4s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(90,61,46,0.5)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
                    >
                      Enter the Network <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button
                      className="inline-flex items-center gap-2 text-base px-10 py-5 font-heading font-bold tracking-wider uppercase rounded"
                      style={{ background: 'transparent', border: `2px solid ${P.borderStr}`, color: P.textMuted, transition: 'all 0.4s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.accent; (e.currentTarget as HTMLElement).style.color = P.text }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.borderStr; (e.currentTarget as HTMLElement).style.color = P.textMuted }}
                    >
                      Explore Live Sessions
                    </button>
                  </Link>
                </div>
              </motion.div>
              <motion.div className="mt-20" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <ChevronDown className="w-6 h-6 mx-auto" style={{ color: P.accent }} />
              </motion.div>
            </div>
          </section>

          {/* ═══ ABOUT ═══ */}
          <Section id="about">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                className="h-[1px] w-24 mx-auto mb-12 origin-center"
                style={{ background: `linear-gradient(to right, transparent, ${P.accent}, transparent)` }}
              />
              <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: P.text }}>
                Most people don&apos;t fail because they lack ambition.
              </h2>
              <p className="font-body mt-6 text-lg max-w-2xl mx-auto" style={{ color: P.textMuted }}>
                They fail because they build alone, learn from the wrong people, and never get real feedback.
              </p>
              <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                className="h-[1px] w-24 mx-auto mt-12 origin-center"
                style={{ background: `linear-gradient(to right, transparent, ${P.accent}, transparent)` }}
              />
            </div>
          </Section>

          {/* ═══ STATS ═══ */}
          <Section style={divider}>
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {[
                  { end: 80,  suffix: '%', label: 'Host earnings share' },
                  { end: 0,   prefix: '$', suffix: '', label: 'Platform entry cost', display: '$0' },
                  { end: 5,   suffix: '',  label: 'Founding group size' },
                  { end: 29,  prefix: '$', suffix: '', label: 'Typical session price' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                    <div className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-brand glow-brand">
                      {stat.display ?? <Counter end={stat.end} suffix={stat.suffix} prefix={stat.prefix || ''} />}
                    </div>
                    <p className="font-heading text-xs tracking-widest uppercase mt-3" style={{ color: P.textDim }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ FOUR PILLARS ═══ */}
          <Section id="pillars">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading tracking-[0.4em] uppercase text-xs mb-4" style={{ color: P.accent }}>The Framework</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: P.text }}>
                  Four Ways to <span className="text-gradient-brand">Grow</span>
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {pillars.map((p, i) => <PillarCard key={p.title} {...p} index={i} />)}
              </div>
            </div>
          </Section>

          {/* ═══ DM MOCKUP ═══ */}
          <Section>
            <div className="max-w-6xl mx-auto px-6">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <p className="font-heading tracking-[0.4em] uppercase text-xs mb-4" style={{ color: P.accent }}>1:1 Conversations</p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: P.text }}>
                    Conversations That <span className="text-gradient-brand">Change Trajectories</span>
                  </h2>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden' }}
                >
                  <div style={{ borderBottom: `1px solid ${P.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${P.accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: P.accent, fontFamily: "'Sora', sans-serif" }}>AK</span>
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold" style={{ color: P.text }}>Alex K. — SaaS Founder</p>
                      <p className="text-xs font-body" style={{ color: P.textDim }}>Active now</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: '#6B9E7A' }} />
                  </div>
                  <div style={{ padding: 24 }} className="space-y-4">
                    {[
                      { from: true,  text: 'Saw your session on cold outbound — the LinkedIn strategy was 🔥' },
                      { from: false, text: 'Thanks! Happy to share my exact sequence. Want to jump on a call this week?' },
                      { from: true,  text: "Absolutely. Wednesday work? I'll bring my current metrics for feedback." },
                      { from: false, text: "Good. Bring your numbers. We'll go through it properly." },
                    ].map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: msg.from ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i }}
                        style={{ display: 'flex', justifyContent: msg.from ? 'flex-start' : 'flex-end' }}
                      >
                        <div style={{
                          maxWidth: '80%', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontFamily: "'Inter', sans-serif",
                          background: msg.from ? P.bgSecondary : `${P.accent}18`,
                          color: P.text,
                          border: msg.from ? `1px solid ${P.border}` : `1px solid ${P.accent}30`,
                        }}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: `${P.accent}60` }}
                            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-body" style={{ color: P.textDim }}>Alex is typing...</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>

          {/* ═══ HOW IT WORKS ═══ */}
          <Section id="how-it-works" style={divider}>
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading tracking-[0.4em] uppercase text-xs mb-4" style={{ color: P.accent }}>The Protocol</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold" style={{ color: P.text }}>
                  From Zero to <span className="text-gradient-brand">Authority</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, i) => (
                  <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="group relative">
                    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 32, height: '100%', position: 'relative', overflow: 'hidden' }}>
                      <div className="absolute top-4 right-4 font-display text-5xl font-bold" style={{ color: `${P.accent}0D` }}>{step.num}</div>
                      <div className="absolute bottom-0 right-0 w-8 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: P.accent }} />
                      <div className="absolute bottom-0 right-0 w-[1px] h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: P.accent }} />
                      <p className="font-heading text-xs tracking-widest uppercase mb-4" style={{ color: P.accent }}>Step {step.num}</p>
                      <h3 className="font-display text-2xl font-bold mb-3" style={{ color: P.text }}>{step.title}</h3>
                      <p className="font-body text-sm leading-relaxed" style={{ color: P.textMuted }}>{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ REVENUE ═══ */}
          <Section>
            <div className="max-w-4xl mx-auto px-6 text-center">
              <p className="font-heading tracking-[0.4em] uppercase text-xs mb-4" style={{ color: P.accent }}>Host Economics</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: P.text }}>
                Built for People Who <span className="text-gradient-brand glow-brand">Create Value</span>
              </h2>
              <p className="font-body text-lg max-w-xl mx-auto mb-12" style={{ color: P.textMuted }}>
                If you teach, build, or share real knowledge — the platform is designed to support you, not take from you.
              </p>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative inline-block mb-12">
                <div className="relative">
                  <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 mx-auto">
                    <circle cx="100" cy="100" r="85" fill="none" stroke={P.border} strokeWidth="8" />
                    <motion.circle cx="100" cy="100" r="85" fill="none" stroke="url(#warmGrad)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 85}
                      initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                      whileInView={{ strokeDashoffset: 2 * Math.PI * 85 * 0.2 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                      transform="rotate(-90 100 100)"
                    />
                    <defs>
                      <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#7A5245" />
                        <stop offset="50%"  stopColor="#C4956A" />
                        <stop offset="100%" stopColor="#E1D4C2" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <span className="font-display text-5xl md:text-6xl font-bold text-gradient-brand glow-brand">80%</span>
                      <p className="font-heading text-xs tracking-widest uppercase mt-1" style={{ color: P.textDim }}>Yours</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {[
                  { label: '50 tickets sold', value: '$1,450' },
                  { label: 'Platform fee',    value: '$290' },
                  { label: 'You keep',        value: '$1,160' },
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 24 }}
                  >
                    <p className="font-display text-2xl font-bold text-gradient-brand">{item.value}</p>
                    <p className="font-heading text-xs tracking-widest uppercase mt-2" style={{ color: P.textDim }}>{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ LIVE TOOLS ═══ */}
          <Section id="tools" style={divider}>
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading tracking-[0.4em] uppercase text-xs mb-4" style={{ color: P.accent }}>Arsenal</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold" style={{ color: P.text }}>
                  Built for <span className="text-gradient-brand">Live Teaching</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool, i) => (
                  <motion.div key={tool.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.04 }}
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 32, textAlign: 'center', cursor: 'default' }}
                    className="group"
                  >
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-5 transition-shadow duration-500" style={{ background: `${P.accent}18` }}>
                      <tool.icon className="w-7 h-7" style={{ color: P.accent }} />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-2" style={{ color: P.text }}>{tool.name}</h3>
                    <p className="font-body text-sm" style={{ color: P.textMuted }}>{tool.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ MASTERMINDS ═══ */}
          <Section>
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading tracking-[0.4em] uppercase text-xs mb-4" style={{ color: P.accent }}>Inner Circles</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold" style={{ color: P.text }}>
                  Mastermind <span className="text-gradient-brand">Groups</span>
                </h2>
                <p className="font-body text-lg mt-4 max-w-xl mx-auto" style={{ color: P.textMuted }}>
                  5 founding members join free — forever. Work with people who take execution seriously.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'SaaS Founders',    members: 4, tag: 'Building' },
                  { name: 'Content Creators', members: 3, tag: 'Scaling' },
                  { name: 'Agency Owners',    members: 5, tag: 'Full' },
                ].map((group, i) => (
                  <motion.div key={group.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 32, transition: 'border-color 0.4s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = P.borderStr)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = P.border)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                      <h3 className="font-display text-xl font-bold" style={{ color: P.text }}>{group.name}</h3>
                      <span className="font-heading text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
                        style={{ border: `1px solid ${group.tag === 'Full' ? '#C0614A60' : P.borderStr}`, color: group.tag === 'Full' ? '#C0614A' : P.textMuted }}
                      >
                        {group.tag}
                      </span>
                    </div>
                    <div style={{ display: 'flex', marginBottom: 16 }}>
                      {Array.from({ length: group.members }).map((_, j) => (
                        <div key={j} style={{ width: 32, height: 32, borderRadius: '50%', background: P.cardEl, border: `2px solid ${P.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: j > 0 ? -8 : 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: P.textDim, fontFamily: "'Sora', sans-serif" }}>{String.fromCharCode(65 + j)}</span>
                        </div>
                      ))}
                      {group.members < 5 && (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px dashed ${P.borderStr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8 }}>
                          <span style={{ fontSize: 10, color: P.accent }}>+</span>
                        </div>
                      )}
                    </div>
                    <p className="font-body text-sm" style={{ color: P.textDim }}>
                      {group.members}/5 members · {5 - group.members > 0 ? `${5 - group.members} spots left` : 'Waitlist open'}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ ATMOSPHERIC QUOTE ═══ */}
          <Section style={divider}>
            <Particles />
            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
              <blockquote className="font-display text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight" style={{ color: P.text }}>
                &ldquo;You don&apos;t want success — you just{' '}
                <span className="text-gradient-brand">like the idea</span> of it.&rdquo;
              </blockquote>
              <p className="font-heading tracking-[0.3em] uppercase text-sm mt-8" style={{ color: P.textDim }}>
                — Prove everyone wrong.
              </p>
            </div>
          </Section>

          {/* ═══ FINAL CTA ═══ */}
          <Section>
            <div className="max-w-4xl mx-auto px-6 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
                <div className="absolute inset-0 blur-3xl rounded-full animate-pulse-glow" style={{ background: `${P.accent}10` }} />
                <div className="relative z-10">
                  <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6" style={{ color: P.text }}>
                    Start Building With{' '}
                    <span className="text-gradient-brand glow-brand">the Right People.</span>
                  </h2>
                  <p className="font-body text-lg md:text-xl max-w-xl mx-auto mb-12" style={{ color: P.textMuted }}>
                    The right environment changes everything.{' '}
                    One conversation can shift your trajectory.
                  </p>
                  <Link href="/auth/login">
                    <button
                      className="inline-flex items-center gap-2 text-lg px-12 py-6 font-heading font-bold tracking-wider uppercase rounded"
                      style={{ background: `linear-gradient(135deg, ${P.accentDeep}, #6E473B)`, color: P.text, border: `1px solid ${P.borderStr}`, transition: 'all 0.4s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(90,61,46,0.5)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
                    >
                      Enter the Network <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </Section>

          {/* ═══ FOOTER ═══ */}
          <footer style={{ borderTop: `1px solid ${P.border}`, paddingTop: 48, paddingBottom: 48 }}>
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="font-display text-2xl font-bold text-gradient-brand tracking-wide">GRITCLUB</span>
                <div className="flex items-center gap-8">
                  {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }].map((link) => (
                    <Link key={link.label} href={link.href} className="font-heading text-xs tracking-widest uppercase transition-colors" style={{ color: P.textDim }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
                <p className="font-body text-sm" style={{ color: `${P.textDim}99` }}>© 2026 GritClub · Hosts keep 80%</p>
              </div>
            </div>
          </footer>

        </motion.main>
      )}
    </div>
  )
}
