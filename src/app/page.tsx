'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Zap, Users, Radio, MessageCircle, ArrowRight, Play, Monitor, PenTool, HelpCircle, ChevronDown, Menu, X, LayoutDashboard, LogOut, UserCircle, Settings } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const P = {
  bg:         '#0B0B0C',
  bgSec:      '#111113',
  card:       '#121214',
  cardEl:     '#1C1C1F',
  border:     'rgba(255,255,255,0.06)',
  borderStr:  'rgba(255,255,255,0.12)',
  text:       '#FFFFFF',
  textMuted:  '#C7C7CC',
  textDim:    '#8A8A8F',
}

const ChromeText = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span style={{
    background: 'linear-gradient(135deg, #E8E8E8 0%, #CFCFCF 25%, #FFFFFF 50%, #B8B8B8 75%, #EDEDED 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    ...style,
  }}>{children}</span>
)

const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: P.bg }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
    <motion.div className="flex flex-col items-center gap-4">
      <motion.h1
        style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(60px, 13vw, 160px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, background: 'linear-gradient(135deg, #E8E8E8 0%, #CFCFCF 25%, #FFFFFF 50%, #B8B8B8 75%, #EDEDED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        initial={{ opacity: 0, y: 40, letterSpacing: '0.3em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '-0.03em' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}>
        GRITCLUB
      </motion.h1>
      <motion.div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)' }} initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 0.8, delay: 1 }} />
      <motion.p style={{ fontFamily: "'Inter', sans-serif", color: P.textDim, letterSpacing: '0.4em', fontSize: 12, textTransform: 'uppercase' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        Build With People Who Refuse Average
      </motion.p>
    </motion.div>
    <motion.div className="absolute bottom-0 left-0 right-0 h-px origin-left" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.5, ease: 'linear', delay: 0.5 }} onAnimationComplete={onComplete} />
  </motion.div>
)

const Navbar = ({ visible }: { visible: boolean }) => {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => scrollY.on('change', y => setScrolled(y > 50)), [scrollY])
  if (!visible) return null

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'
  const navLinks = ['About', 'Pillars', 'How It Works', 'Tools']

  return (
    <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.5s', background: scrolled ? 'rgba(11,11,12,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? `1px solid ${P.border}` : 'none' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? '60px' : '88px', transition: 'height 0.5s' }}>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', fontSize: scrolled ? '1.4rem' : '2rem', transition: 'font-size 0.5s', background: 'linear-gradient(135deg, #E8E8E8 0%, #CFCFCF 25%, #FFFFFF 50%, #B8B8B8 75%, #EDEDED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GRITCLUB</span>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textDim, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = P.text)} onMouseLeave={e => (e.currentTarget.style.color = P.textDim)}>{link}</a>
            ))}

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                <Link href="/dashboard">
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: `1px solid ${P.border}`, background: 'rgba(255,255,255,0.06)', color: P.text, fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <LayoutDashboard size={14} /> Dashboard
                  </button>
                </Link>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setDropOpen(!dropOpen)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFFFFF', border: 'none', color: '#000', fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</button>
                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
                        style={{ position: 'absolute', top: 42, right: 0, minWidth: 180, background: P.cardEl, border: `1px solid ${P.borderStr}`, borderRadius: 12, overflow: 'hidden', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }} onMouseLeave={() => setDropOpen(false)}>
                        {[{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/dashboard/profile', label: 'Profile', icon: UserCircle }, { href: '/dashboard/messages', label: 'Settings', icon: Settings }].map(({ href, label, icon: Icon }) => (
                          <Link key={href} href={href} onClick={() => setDropOpen(false)}>
                            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, color: P.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = P.text }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.textMuted }}>
                              <Icon size={14} /> {label}
                            </div>
                          </Link>
                        ))}
                        <div style={{ borderTop: `1px solid ${P.border}` }}>
                          <button onClick={() => { setDropOpen(false); logout() }} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#FF453A', cursor: 'pointer', fontSize: 13, background: 'transparent', border: 'none', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,69,58,0.06)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
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
                <button style={{ marginLeft: 8, padding: '9px 20px', background: '#FFFFFF', color: '#000000', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#E8E8E8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#FFFFFF')}>
                  Enter the Network
                </button>
              </Link>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden" style={{ color: P.text, background: 'none', border: 'none', cursor: 'pointer' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: 'rgba(11,11,12,0.98)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${P.border}`, overflow: 'hidden' }}>
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map(link => (
                <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileOpen(false)} style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textDim, textDecoration: 'none' }}>{link}</a>
              ))}
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <button style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, color: P.text, fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <LayoutDashboard size={14} /> Dashboard
                    </button>
                  </Link>
                  <button onClick={() => { setMobileOpen(false); logout() }} style={{ padding: '10px', background: 'transparent', border: `1px solid rgba(255,69,58,0.3)`, color: '#FF453A', fontFamily: "'Sora', sans-serif", fontSize: 13, borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <button style={{ width: '100%', padding: '11px', background: '#FFFFFF', color: '#000', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Enter the Network</button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

const Counter = ({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !started) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])
  useEffect(() => {
    if (!started) return
    let current = 0
    const step = Math.ceil(end / 60)
    const interval = setInterval(() => { current += step; if (current >= end) { setCount(end); clearInterval(interval) } else setCount(current) }, 25)
    return () => clearInterval(interval)
  }, [started, end])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

const Section = ({ children, id, style = {} }: { children: React.ReactNode; id?: string; style?: React.CSSProperties }) => (
  <motion.section id={id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', paddingTop: '6rem', paddingBottom: '6rem', ...style }}>
    {children}
  </motion.section>
)

const PillarCard = ({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 28, cursor: 'default', transition: 'border-color 0.3s' }} className="group"
    onMouseEnter={(e: any) => e.currentTarget.style.borderColor = P.borderStr} onMouseLeave={(e: any) => e.currentTarget.style.borderColor = P.border}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <Icon style={{ width: 20, height: 20, color: P.text }} />
    </div>
    <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: P.text, marginBottom: 10 }}>{title}</h3>
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: P.textDim, lineHeight: 1.7 }}>{desc}</p>
  </motion.div>
)

export default function LandingPage() {
  const [introComplete, setIntroComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -80])

  const pillars = [
    { icon: Radio, title: 'Live Sessions', desc: 'Interactive sessions with founders and operators. Real workflows, real decisions — no pre-recorded fluff.' },
    { icon: MessageCircle, title: 'Direct Access', desc: 'Message founders, mentors, and builders directly. No gatekeeping, no vanity walls.' },
    { icon: Users, title: 'Small Groups', desc: 'Groups of 5 with aligned goals. Built for accountability, consistency, and long-term progress.' },
    { icon: Zap, title: 'Curated Network', desc: 'People filtered by intent and stage — from early builders to experienced operators.' },
  ]
  const steps = [
    { num: '01', title: 'Enter', desc: 'Create a simple profile and enter the network.' },
    { num: '02', title: 'Connect', desc: 'Find and connect with people working on similar or higher-level problems.' },
    { num: '03', title: 'Learn', desc: 'Join live sessions and learn directly from people executing in real time.' },
    { num: '04', title: 'Lead', desc: 'Host sessions, share knowledge, and build your own authority.' },
  ]
  const tools = [
    { icon: PenTool, name: 'Whiteboard', desc: 'Draw, diagram, and teach in real-time' },
    { icon: Monitor, name: 'Screen Share', desc: 'Walk through your actual workflow' },
    { icon: HelpCircle, name: 'Live Q&A', desc: 'Audience questions, voted and queued' },
    { icon: Play, name: 'Replays', desc: 'Every session recorded for ticket holders' },
  ]

  return (
    <div style={{ background: P.bg, minHeight: '100vh', overflowX: 'hidden' }}>
      <AnimatePresence mode="wait">
        {!introComplete && <IntroAnimation onComplete={() => { setIntroComplete(true); setTimeout(() => setShowContent(true), 600) }} />}
      </AnimatePresence>

      <Navbar visible={showContent} />

      {showContent && (
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>

          {/* ═══ HERO ═══ */}
          <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <motion.div style={{ position: 'absolute', inset: 0, y: heroParallax }}>
              <img src="/hero-bg.jpg" alt="" style={{ width: '100%', height: '120%', objectFit: 'cover', filter: 'brightness(0.15) saturate(0.3) grayscale(0.5)' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${P.bg} 0%, rgba(11,11,12,0.7) 50%, transparent 100%)` }} />
            </motion.div>
            {/* Subtle dot grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 10, maxWidth: 860, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginTop: 80 }}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: P.textDim, marginBottom: 32 }}>
                  A Private Network For Serious Builders
                </p>
                <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 'clamp(40px, 7vw, 88px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: P.text, marginBottom: 32 }}>
                  Build With People<br />
                  <ChromeText>Who Refuse Average.</ChromeText>
                </h1>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(15px, 2vw, 18px)', color: P.textDim, maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.75 }}>
                  GritClub is where serious builders connect, learn, and execute.<br />
                  No noise. No spectators. Only people moving forward.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/auth/login">
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#FFFFFF', color: '#000000', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8E8E8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,255,255,0.12)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                      Enter the Network <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'transparent', color: P.textMuted, fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 14, border: `1px solid ${P.border}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.borderStr; (e.currentTarget as HTMLElement).style.color = P.text }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.border; (e.currentTarget as HTMLElement).style.color = P.textMuted }}>
                      Explore Sessions
                    </button>
                  </Link>
                </div>
              </motion.div>
              <motion.div style={{ marginTop: 72 }} animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <ChevronDown style={{ width: 20, height: 20, color: P.textDim, margin: '0 auto' }} />
              </motion.div>
            </div>
          </section>

          {/* ═══ ABOUT ═══ */}
          <Section id="about">
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
              <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)', marginBottom: 48 }} />
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: P.text, marginBottom: 20, lineHeight: 1.3 }}>
                Most people don't fail because they lack ambition.
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: P.textDim, lineHeight: 1.75 }}>
                They fail because they build alone, learn from the wrong people, and never get real feedback. GritClub fixes all three.
              </p>
              <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)', marginTop: 48 }} />
            </div>
          </Section>

          {/* ═══ STATS ═══ */}
          <Section style={{ borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
                {[
                  { end: 80, suffix: '%', label: 'Host earnings share' },
                  { end: 0, prefix: '$', label: 'Platform entry cost', display: '$0' },
                  { end: 5, label: 'Founding group size' },
                  { end: 29, prefix: '$', label: 'Typical session price' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, color: P.text, marginBottom: 8 }}>
                      {s.display ?? <Counter end={s.end} suffix={s.suffix} prefix={s.prefix || ''} />}
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: P.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ FOUR PILLARS ═══ */}
          <Section id="pillars">
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>The Framework</p>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: P.text }}>
                  Four Ways to <ChromeText>Grow</ChromeText>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {pillars.map((p, i) => <PillarCard key={p.title} {...p} index={i} />)}
              </div>
            </div>
          </Section>

          {/* ═══ DM MOCKUP ═══ */}
          <Section>
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 12 }}>1:1 Conversations</p>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: P.text }}>Conversations That <ChromeText>Change Trajectories</ChromeText></h2>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ borderBottom: `1px solid ${P.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: P.text, fontFamily: "'Sora', sans-serif" }}>AK</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, color: P.text }}>Alex K. — SaaS Founder</p>
                    <p style={{ fontSize: 11, color: P.textDim }}>Active now</p>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#32D74B' }} />
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { from: true, text: 'Saw your session on cold outbound — the LinkedIn strategy was 🔥' },
                    { from: false, text: 'Thanks! Happy to share my exact sequence. Want to jump on a call this week?' },
                    { from: true, text: "Absolutely. Wednesday work? I'll bring my current metrics for feedback." },
                    { from: false, text: "Good. Bring your numbers. We'll go through it properly." },
                  ].map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: msg.from ? -16 : 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ display: 'flex', justifyContent: msg.from ? 'flex-start' : 'flex-end' }}>
                      <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontFamily: "'Inter', sans-serif", lineHeight: 1.55, background: msg.from ? P.bgSec : 'rgba(255,255,255,0.08)', color: P.text, border: `1px solid ${P.border}` }}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                    {[0, 1, 2].map(i => <motion.div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />)}
                    <span style={{ fontSize: 11, color: P.textDim, fontFamily: "'Inter', sans-serif", marginLeft: 4 }}>Alex is typing...</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </Section>

          {/* ═══ HOW IT WORKS ═══ */}
          <Section id="how-it-works" style={{ borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>The Protocol</p>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: P.text }}>From Zero to <ChromeText>Authority</ChromeText></h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {steps.map((step, i) => (
                  <motion.div key={step.num} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden' }} className="group">
                    <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: "'Sora', sans-serif", fontSize: 44, fontWeight: 800, color: 'rgba(255,255,255,0.04)' }}>{step.num}</div>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: P.textDim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Step {step.num}</p>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: P.text, marginBottom: 10 }}>{step.title}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: P.textDim, lineHeight: 1.65 }}>{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ REVENUE ═══ */}
          <Section>
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>Host Economics</p>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: P.text, marginBottom: 16 }}>
                Built for People Who <ChromeText>Create Value</ChromeText>
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: P.textDim, marginBottom: 48, lineHeight: 1.7 }}>
                If you teach, build, or share real knowledge — the platform is designed to support you, not take from you.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 480, margin: '0 auto' }}>
                {[{ label: '50 tickets sold', value: '$1,450' }, { label: 'Platform fee', value: '$290' }, { label: 'You keep', value: '$1,160' }].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: 20 }}>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: P.text, marginBottom: 6 }}>{item.value}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: P.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ TOOLS ═══ */}
          <Section id="tools" style={{ borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>Arsenal</p>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: P.text }}>Built for <ChromeText>Live Teaching</ChromeText></h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {tools.map((tool, i) => (
                  <motion.div key={tool.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ scale: 1.02 }}
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <tool.icon style={{ width: 22, height: 22, color: P.text }} />
                    </div>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: P.text, marginBottom: 8 }}>{tool.name}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: P.textDim }}>{tool.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ FINAL CTA ═══ */}
          <Section>
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', color: P.text, marginBottom: 24 }}>
                Start Building With<br /><ChromeText>the Right People.</ChromeText>
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: P.textDim, marginBottom: 40, lineHeight: 1.7 }}>
                The right environment changes everything.<br />One conversation can shift your trajectory.
              </p>
              <Link href="/auth/login">
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 40px', background: '#FFFFFF', color: '#000000', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8E8E8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(255,255,255,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  Enter the Network <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </Link>
            </div>
          </Section>

          {/* ═══ FOOTER ═══ */}
          <footer style={{ borderTop: `1px solid ${P.border}`, padding: '40px 24px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, #E8E8E8 0%, #CFCFCF 25%, #FFFFFF 50%, #B8B8B8 75%, #EDEDED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GRITCLUB</span>
              <div style={{ display: 'flex', gap: 24 }}>
                {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }].map(link => (
                  <Link key={link.label} href={link.href} style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.textDim, textDecoration: 'none' }}>{link.label}</Link>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: P.textDim }}>© 2026 GritClub · Hosts keep 80%</p>
            </div>
          </footer>

        </motion.main>
      )}
    </div>
  )
}
