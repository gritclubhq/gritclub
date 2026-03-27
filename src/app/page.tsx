'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Zap, Users, Radio, MessageCircle, ArrowRight, Play,
  Monitor, PenTool, HelpCircle, ChevronDown, Menu, X,
} from 'lucide-react'
import Link from 'next/link'

/* ─── INTRO ANIMATION ─── */
const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
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
        className="h-[1px] bg-gradient-brand"
        initial={{ width: 0 }}
        animate={{ width: '60%' }}
        transition={{ duration: 0.8, delay: 1 }}
      />
      <motion.p
        className="font-heading text-muted-foreground tracking-[0.5em] uppercase text-xs md:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Where ambition meets action
      </motion.p>
    </motion.div>
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-brand origin-left"
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
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => scrollY.on('change', (y) => setScrolled(y > 50)), [scrollY])

  const navLinks = ['About', 'Pillars', 'How It Works', 'Tools']

  if (!visible) return null

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? 'h-16' : 'h-24'}`}>
          <span className={`font-display text-gradient-brand font-bold tracking-wide transition-all duration-500 ${scrolled ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
            GRITCLUB
          </span>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                className="font-heading text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {link}
              </a>
            ))}
            <Link href="/auth/login">
              <button className="ml-4 px-5 py-2 bg-gradient-brand text-primary-foreground font-heading font-bold tracking-wider uppercase text-sm rounded hover:shadow-brand transition-all duration-500">
                Enter GritClub
              </button>
            </Link>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
                >
                  {link}
                </a>
              ))}
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <button className="mt-2 w-full px-5 py-2 bg-gradient-brand text-primary-foreground font-heading font-bold tracking-wider uppercase text-sm rounded">
                  Enter GritClub
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ─── ANIMATED COUNTER ─── */
const Counter = ({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
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
const Section = ({ children, id, className = '' }: { children: React.ReactNode; id?: string; className?: string }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className={`relative py-24 md:py-32 ${className}`}
  >
    {children}
  </motion.section>
)

/* ─── FLOATING PARTICLES ─── */
const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: ((i * 37 + 13) % 100),
    top: ((i * 53 + 7) % 100),
    duration: 4 + (i % 4),
    delay: (i % 3),
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
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
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
    className="group relative bg-gradient-card border border-border rounded-lg p-8 overflow-hidden"
  >
    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
    <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 left-0 w-[1px] h-16 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:shadow-brand transition-shadow duration-500">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="font-body text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
)

/* ─── MAIN PAGE ─── */
export default function LandingPage() {
  const [introComplete, setIntroComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -100])

  const handleIntroComplete = () => {
    setIntroComplete(true)
    setTimeout(() => setShowContent(true), 600)
  }

  const pillars = [
    { icon: Radio,          title: 'Live Events',         desc: 'Ticketed sessions with whiteboard, screen share, and live Q&A. Real knowledge transfer, not recorded fluff.' },
    { icon: MessageCircle,  title: '1:1 Conversations',   desc: 'Direct conversations with mentors, co-founders, and industry leaders. No gatekeeping. No vanity metrics.' },
    { icon: Users,          title: 'Masterminds',         desc: 'Curated groups of 5 ambitious people. Weekly accountability. Lifetime access. Zero cost for founding members.' },
    { icon: Zap,            title: 'The Network',         desc: 'Filtered by ambition stage — aspiring, building, scaling, exited. Connect with people at your level or above.' },
  ]

  const steps = [
    { num: '01', title: 'Enter',  desc: 'Create your profile. Zero cost. Instant access to the network.' },
    { num: '02', title: 'Connect',desc: 'Find your people. Message mentors, builders, and leaders directly.' },
    { num: '03', title: 'Learn',  desc: 'Join live sessions. Real strategies from people who\'ve done it.' },
    { num: '04', title: 'Lead',   desc: 'Host your own sessions. Build authority. Keep 80% of every ticket.' },
  ]

  const tools = [
    { icon: PenTool,    name: 'Whiteboard',   desc: 'Draw, diagram, and teach in real-time' },
    { icon: Monitor,    name: 'Screen Share', desc: 'Walk through your actual workflow' },
    { icon: HelpCircle, name: 'Live Q&A',     desc: 'Audience questions, voted and queued' },
    { icon: Play,       name: 'Replays',      desc: 'Every session recorded for ticket holders' },
  ]

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
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
              <img src="/hero-bg.jpg" alt="" className="w-full h-[120%] object-cover" />
              <div className="absolute inset-0 bg-background/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </motion.div>
            <Particles />
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-8">
                  The platform for the relentless
                </p>
                <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-[0.9] mb-8">
                  <span className="text-foreground">Success Is</span>
                  <br />
                  <span className="text-gradient-brand glow-brand">Not Rented.</span>
                </h1>
                <p className="font-body text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                  Where hustlers learn from winners through live sessions, 1:1 conversations with mentors,
                  and mastermind groups that actually hold you accountable.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/login">
                    <button className="inline-flex items-center gap-2 text-base px-10 py-5 bg-gradient-brand text-primary-foreground font-heading font-bold tracking-wider uppercase rounded hover:shadow-brand transition-all duration-500">
                      Enter GritClub <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button className="inline-flex items-center gap-2 text-base px-10 py-5 border-2 border-primary bg-transparent text-primary font-heading font-bold tracking-wider uppercase rounded hover:bg-primary/10 transition-all duration-500">
                      Browse Events
                    </button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="mt-20"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown className="w-6 h-6 text-primary mx-auto" />
              </motion.div>
            </div>
          </section>

          {/* ═══ LAMBORGHINI QUOTE ═══ */}
          <Section id="about">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                className="h-[1px] bg-gradient-brand w-24 mx-auto mb-12 origin-center"
              />
              <blockquote className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold italic leading-tight text-foreground">
                &ldquo;Nobody puts a poster of an{' '}
                <span className="text-gradient-brand">accountant</span>{' '}
                on their wall.&rdquo;
              </blockquote>
              <p className="font-heading text-primary tracking-[0.3em] uppercase text-sm mt-8">
                — Ferruccio Lamborghini
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                className="h-[1px] bg-gradient-brand w-24 mx-auto mt-12 origin-center"
              />
            </div>
          </Section>

          {/* ═══ STATS ═══ */}
          <Section className="border-y border-border">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {[
                  { end: 80, suffix: '%', label: 'Revenue to hosts' },
                  { end: 0, prefix: '$', suffix: '', label: 'Setup fees', display: '$0' },
                  { end: 5, suffix: '', label: 'Free mastermind seats' },
                  { end: 29, prefix: '$', suffix: '', label: 'Per live session' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-brand glow-brand">
                      {stat.display ?? <Counter end={stat.end} suffix={stat.suffix} prefix={stat.prefix || ''} />}
                    </div>
                    <p className="font-heading text-muted-foreground text-xs tracking-widest uppercase mt-3">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ FOUR PILLARS ═══ */}
          <Section id="pillars">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs mb-4">The Framework</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                  Four Ways to <span className="text-gradient-brand">Dominate</span>
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {pillars.map((p, i) => (
                  <PillarCard key={p.title} {...p} index={i} />
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ DM MOCKUP ═══ */}
          <Section>
            <div className="max-w-6xl mx-auto px-6">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs mb-4">1:1 Conversations</p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    Conversations That <span className="text-gradient-brand">Change Trajectories</span>
                  </h2>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-card border border-border rounded-lg overflow-hidden"
                >
                  <div className="border-b border-border px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary font-heading">AK</span>
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold text-foreground">Alex K. — SaaS Founder</p>
                      <p className="text-xs text-muted-foreground font-body">Active now</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { from: true,  text: 'Saw your session on cold outbound — the LinkedIn strategy was 🔥' },
                      { from: false, text: 'Thanks! Happy to share my exact sequence. Want to jump on a call this week?' },
                      { from: true,  text: 'Absolutely. Wednesday work? I\'ll bring my current metrics for feedback.' },
                      { from: false, text: 'Perfect. This is what GritClub is about — no gatekeeping. See you Wed.' },
                    ].map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.from ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * i }}
                        className={`flex ${msg.from ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[80%] px-4 py-3 rounded-lg text-sm font-body ${
                          msg.from
                            ? 'bg-secondary text-foreground'
                            : 'bg-primary/15 text-foreground border border-primary/20'
                        }`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/40"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground font-body">Alex is typing...</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>

          {/* ═══ HOW IT WORKS ═══ */}
          <Section id="how-it-works" className="border-y border-border">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs mb-4">The Protocol</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  From Zero to <span className="text-gradient-brand">Authority</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="group relative"
                  >
                    <div className="bg-gradient-card border border-border rounded-lg p-8 h-full relative overflow-hidden">
                      <div className="absolute top-4 right-4 font-display text-5xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-500">
                        {step.num}
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <p className="font-heading text-primary text-xs tracking-widest uppercase mb-4">Step {step.num}</p>
                      <h3 className="font-display text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                      <p className="font-body text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ 80% REVENUE ═══ */}
          <Section>
            <div className="max-w-4xl mx-auto px-6 text-center">
              <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs mb-4">Host Economics</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
                You Keep <span className="text-gradient-brand glow-brand">Everything</span> You Earn
              </h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative inline-block mb-12"
              >
                <div className="relative">
                  <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 mx-auto">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <motion.circle
                      cx="100" cy="100" r="85"
                      fill="none"
                      stroke="url(#brandGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 85}
                      initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                      whileInView={{ strokeDashoffset: 2 * Math.PI * 85 * 0.2 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                      transform="rotate(-90 100 100)"
                    />
                    <defs>
                      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="hsl(14, 30%, 33%)" />
                        <stop offset="50%"  stopColor="hsl(27, 22%, 56%)" />
                        <stop offset="100%" stopColor="hsl(35, 38%, 82%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <span className="font-display text-5xl md:text-6xl font-bold text-gradient-brand glow-brand">80%</span>
                      <p className="font-heading text-xs text-muted-foreground tracking-widest uppercase mt-1">Yours</p>
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
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gradient-card border border-border rounded-lg p-6"
                  >
                    <p className="font-display text-2xl font-bold text-gradient-brand">{item.value}</p>
                    <p className="font-heading text-xs text-muted-foreground tracking-widest uppercase mt-2">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ LIVE TOOLS ═══ */}
          <Section id="tools" className="border-y border-border">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs mb-4">Arsenal</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  Built for <span className="text-gradient-brand">Live Teaching</span>
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-card border border-border rounded-lg p-8 text-center group cursor-default"
                  >
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:shadow-brand transition-shadow duration-500">
                      <tool.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{tool.name}</h3>
                    <p className="font-body text-muted-foreground text-sm">{tool.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ MASTERMINDS ═══ */}
          <Section>
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="font-heading text-primary tracking-[0.4em] uppercase text-xs mb-4">Inner Circles</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  Mastermind <span className="text-gradient-brand">Groups</span>
                </h2>
                <p className="font-body text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
                  5 founding members join free — forever. Build with people who match your intensity.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'SaaS Founders',    members: 4, tag: 'Building' },
                  { name: 'Content Creators', members: 3, tag: 'Scaling' },
                  { name: 'Agency Owners',    members: 5, tag: 'Full' },
                ].map((group, i) => (
                  <motion.div
                    key={group.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-gradient-card border border-border rounded-lg p-8 group hover:border-primary/30 transition-colors duration-500"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display text-xl font-bold text-foreground">{group.name}</h3>
                      <span className={`font-heading text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border ${
                        group.tag === 'Full' ? 'border-accent text-accent' : 'border-primary/30 text-primary'
                      }`}>
                        {group.tag}
                      </span>
                    </div>
                    <div className="flex -space-x-2 mb-4">
                      {Array.from({ length: group.members }).map((_, j) => (
                        <div key={j} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                          <span className="text-[10px] font-bold text-muted-foreground font-heading">
                            {String.fromCharCode(65 + j)}
                          </span>
                        </div>
                      ))}
                      {group.members < 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                          <span className="text-[10px] text-primary">+</span>
                        </div>
                      )}
                    </div>
                    <p className="font-body text-muted-foreground text-sm">
                      {group.members}/5 members · {5 - group.members > 0 ? `${5 - group.members} spots left` : 'Waitlist open'}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ SECOND QUOTE ═══ */}
          <Section className="border-y border-border">
            <Particles />
            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
              <blockquote className="font-display text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight text-foreground">
                &ldquo;You don&apos;t want success — you just{' '}
                <span className="text-gradient-brand">like the idea</span> of it.&rdquo;
              </blockquote>
              <p className="font-heading text-muted-foreground tracking-[0.3em] uppercase text-sm mt-8">
                — Prove everyone wrong.
              </p>
            </div>
          </Section>

          {/* ═══ FINAL CTA ═══ */}
          <Section>
            <div className="max-w-4xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full animate-pulse-glow" />
                <div className="relative z-10">
                  <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6">
                    Stop <span className="text-gradient-brand glow-brand">Dreaming.</span>
                  </h2>
                  <p className="font-body text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-12">
                    The next session starts soon. The next connection is one message away.
                    The only thing missing is you.
                  </p>
                  <Link href="/auth/login">
                    <button className="inline-flex items-center gap-2 text-lg px-12 py-6 bg-gradient-brand text-primary-foreground font-heading font-bold tracking-wider uppercase rounded hover:shadow-brand transition-all duration-500">
                      Enter GritClub <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </Section>

          {/* ═══ FOOTER ═══ */}
          <footer className="border-t border-border py-12">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="font-display text-2xl font-bold text-gradient-brand tracking-wide">GRITCLUB</span>
                <div className="flex items-center gap-8">
                  {[
                    { label: 'Privacy', href: '/privacy' },
                    { label: 'Terms',   href: '/terms' },
                  ].map((link) => (
                    <Link key={link.label} href={link.href} className="font-heading text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <p className="font-body text-sm text-foreground/60">
                  © 2026 GritClub · Hosts keep 80%
                </p>
              </div>
            </div>
          </footer>

        </motion.main>
      )}
    </div>
  )
}
