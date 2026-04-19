'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Zap, Users, Radio, MessageCircle, ArrowRight, Play, Monitor, PenTool, HelpCircle, ChevronDown, Menu, X, LayoutDashboard, LogOut, UserCircle, Settings, Crown } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase/client'

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

// ── Intro animation ──────────────────────────────────────────────────────────
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

// ── Rotating hero tagline ────────────────────────────────────────────────────
const TAGLINES = [
  { text: 'Average is crowded.', final: false },
  { text: 'Execution is lonely.', final: false },
  { text: 'This is where you find your people.', final: true },
]

function RotatingTagline() {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    if (idx < TAGLINES.length - 1) {
      const t = setTimeout(() => setIdx(i => i + 1), 1400)
      return () => clearTimeout(t)
    } else {
      setDone(true)
    }
  }, [idx, done])

  return (
    <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: TAGLINES[idx].final ? P.text : P.textDim,
            fontWeight: TAGLINES[idx].final ? 500 : 400,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {TAGLINES[idx].text}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// ── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ visible }: { visible: boolean }) => {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => scrollY.on('change', y => setScrolled(y > 50)), [scrollY])
  if (!visible) return null

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  // Nav links: Events, Groups, Pricing — no login required to view
  const navLinks = [
    { label: 'Events', href: '/events' },
    { label: 'Groups', href: '/groups' },
    { label: 'Pricing', href: '/pricing' },
  ]

  return (
    <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.5s', background: scrolled ? 'rgba(11,11,12,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(8px)' : 'none', borderBottom: scrolled ? `1px solid ${P.border}` : 'none' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? '60px' : '88px', transition: 'height 0.5s' }}>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', fontSize: scrolled ? '1.4rem' : '2rem', transition: 'font-size 0.5s', background: 'linear-gradient(135deg, #E8E8E8 0%, #CFCFCF 25%, #FFFFFF 50%, #B8B8B8 75%, #EDEDED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GRITCLUB</span>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href} style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textDim, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = P.text)} onMouseLeave={e => (e.currentTarget.style.color = P.textDim)}>{link.label}</Link>
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
                        {[{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/dashboard/profile', label: 'Profile', icon: UserCircle }].map(({ href, label, icon: Icon }) => (
                          <Link key={href} href={href} onClick={() => setDropOpen(false)}>
                            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, color: P.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = P.text }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.textMuted }}>
                              <Icon size={14} /> {label}
                            </div>
                          </Link>
                        ))}
                        <div style={{ borderTop: `1px solid ${P.border}` }}>
                          <button onClick={() => { setDropOpen(false); logout() }} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#FF453A', cursor: 'pointer', fontSize: 13, background: 'transparent', border: 'none', fontFamily: "'Inter', sans-serif" }}
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
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textDim, textDecoration: 'none' }}>{link.label}</Link>
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

const PillarCard = ({ icon: Icon, title, desc, badge, index }: { icon: any; title: string; desc: string; badge?: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 32, cursor: 'default', transition: 'border-color 0.3s', position: 'relative', overflow: 'hidden' }}
    onMouseEnter={(e: any) => e.currentTarget.style.borderColor = P.borderStr}
    onMouseLeave={(e: any) => e.currentTarget.style.borderColor = P.border}
  >
    {/* Subtle corner glow */}
    <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
      <Icon style={{ width: 22, height: 22, color: P.text }} />
    </div>
    <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: P.text, marginBottom: 10 }}>{title}</h3>
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: P.textDim, lineHeight: 1.75, marginBottom: badge ? 16 : 0 }}>{desc}</p>
    {badge && (
      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, fontSize: 11, color: P.textMuted, fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>
        {badge}
      </span>
    )}
  </motion.div>
)

// ── Live Events + Groups preview ─────────────────────────────────────────────
function LiveEventsPreview() {
  const [events, setEvents] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  useEffect(() => {
    supabase.from('events').select('id,title,start_time,price,is_free,status,users(full_name)').in('status',['scheduled','live']).order('start_time',{ascending:true}).limit(3).then(({data}) => setEvents(data||[]))
    supabase.from('groups').select('id,name,category,member_count,is_private').order('created_at',{ascending:false}).limit(3).then(({data}) => setGroups(data||[]))
  }, [])

  if (events.length === 0 && groups.length === 0) return null

  return (
    <Section style={{ borderTop: `1px solid ${P.border}` }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 12 }}>Happening Now</p>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: P.text }}>Live on <ChromeText>GritClub</ChromeText></h2>
        </div>
        {events.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>Upcoming Events</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {events.map(ev => (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ y: -3 }} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={(e:any) => e.currentTarget.style.borderColor = P.borderStr}
                    onMouseLeave={(e:any) => e.currentTarget.style.borderColor = P.border}>
                    {ev.status === 'live' && <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, background:'rgba(255,69,58,0.12)', color:'#FF453A', fontSize:10, fontWeight:700, marginBottom:10, letterSpacing:'0.1em' }}>● LIVE</span>}
                    <p style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, color:P.text, marginBottom:6, lineHeight:1.4 }}>{ev.title}</p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:P.textDim }}>{ev.is_free||!ev.price ? 'Free' : `$${ev.price}`} · {ev.users?.full_name||'Host'}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {groups.length > 0 && (
          <div>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>Active Groups</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {groups.map(g => (
                <Link key={g.id} href="/groups" style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ y: -3 }} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={(e:any) => e.currentTarget.style.borderColor = P.borderStr}
                    onMouseLeave={(e:any) => e.currentTarget.style.borderColor = P.border}>
                    <p style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, color:P.text, marginBottom:6 }}>{g.name}</p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:P.textDim }}>{g.category} · {g.member_count||0} member{g.member_count!==1?'s':''} {g.is_private?'· Private':''}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div style={{ textAlign:'center', marginTop:32, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/events">
            <button style={{ padding:'10px 24px', background:'transparent', border:`1px solid ${P.borderStr}`, color:P.textMuted, borderRadius:8, fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=P.text; (e.currentTarget as HTMLElement).style.borderColor=P.text}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=P.textMuted; (e.currentTarget as HTMLElement).style.borderColor=P.borderStr}}>
              Browse All Events →
            </button>
          </Link>
          <Link href="/groups">
            <button style={{ padding:'10px 24px', background:'transparent', border:`1px solid ${P.borderStr}`, color:P.textMuted, borderRadius:8, fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=P.text; (e.currentTarget as HTMLElement).style.borderColor=P.text}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=P.textMuted; (e.currentTarget as HTMLElement).style.borderColor=P.borderStr}}>
              Browse All Groups →
            </button>
          </Link>
        </div>
      </div>
    </Section>
  )
}

export default function LandingPage() {
  const [introComplete, setIntroComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -80])

  const pillars = [
    { icon: Radio, title: 'Live Sessions', desc: 'Interactive sessions from founders, operators, coaches, and experts. Real workflows, real decisions — no pre-recorded fluff.', badge: 'Host & earn 80%' },
    { icon: MessageCircle, title: 'Direct Access', desc: 'Message anyone on GritClub directly. No gatekeeping, no vanity walls. Connect with mentors, co-founders, and clients.', badge: 'Text messaging' },
    { icon: Users, title: 'Small Groups', desc: 'Start with 5 members free. Upgrade to grow your group beyond 5 — built for accountability and long-term progress.', badge: 'Free up to 5 · Upgrade for more' },
    { icon: Zap, title: 'Curated Network', desc: 'People filtered by intent — from early builders to experienced operators. Find your co-founder, mentor, or first client.', badge: 'Open to everyone' },
  ]
  const steps = [
    { num: '01', title: 'Enter', desc: 'Sign in with Google in 30 seconds. Set up your profile and enter the network.' },
    { num: '02', title: 'Connect', desc: 'Find people working on similar or higher-level problems. Message them directly.' },
    { num: '03', title: 'Learn', desc: 'Join live sessions and learn directly from people executing in real time.' },
    { num: '04', title: 'Lead', desc: 'Host sessions, share your knowledge, build authority, and earn 80% of ticket revenue.' },
  ]
  const tools = [
    { icon: PenTool, name: 'Whiteboard', desc: 'Draw, diagram, and teach in real-time' },
    { icon: Monitor, name: 'Screen Share', desc: 'Walk through your actual workflow live' },
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
              <img src="/hero-bg.jpg" alt="" style={{ width: '100%', height: '120%', objectFit: 'cover', filter: 'brightness(0.12) saturate(0.2) grayscale(0.6)' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${P.bg} 0%, rgba(11,11,12,0.75) 50%, rgba(11,11,12,0.4) 100%)` }} />
            </motion.div>

            {/* Dot grid overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 10, maxWidth: 860, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginTop: 80 }}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: P.textDim, marginBottom: 32 }}>
                  A Private Network For Serious Builders
                </p>
                <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 'clamp(40px, 7vw, 88px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: P.text, marginBottom: 32 }}>
                  Build With People<br />
                  <ChromeText>Who Refuse Average.</ChromeText>
                </h1>

                {/* Rotating tagline sequence */}
                <RotatingTagline />

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/auth/login">
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#FFFFFF', color: '#000000', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8E8E8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,255,255,0.12)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                      Enter the Network <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  </Link>
                  <Link href="/events">
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
                They fail because they build alone, learn from the wrong people, and never get real feedback. GritClub fixes all three — for founders, coaches, creators, and anyone serious about moving forward.
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
                  { end: 5, label: 'Free founding group size' },
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

          {/* ═══ FOUR PILLARS — full grid, all 4 in a row ═══ */}
          <Section id="pillars">
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>The Framework</p>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: P.text }}>
                  Four Ways to <ChromeText>Grow</ChromeText>
                </h2>
              </div>
              {/* 4 cards in one row on desktop, 2x2 on tablet, 1 col on mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="pillars-grid">
                {pillars.map((p, i) => <PillarCard key={p.title} {...p} index={i} />)}
              </div>
              <style>{`
                @media (max-width: 900px) { .pillars-grid { grid-template-columns: repeat(2,1fr) !important; } }
                @media (max-width: 560px) { .pillars-grid { grid-template-columns: 1fr !important; } }
              `}</style>
            </div>
          </Section>

          {/* ═══ LIVE EVENTS + GROUPS PREVIEW (real data) ═══ */}
          <LiveEventsPreview />

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
                    style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: "'Sora', sans-serif", fontSize: 44, fontWeight: 800, color: 'rgba(255,255,255,0.04)' }}>{step.num}</div>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, color: P.textDim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Step {step.num}</p>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: P.text, marginBottom: 10 }}>{step.title}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: P.textDim, lineHeight: 1.65 }}>{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ HOST REVENUE — clear 80% explanation ═══ */}
          <Section>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textDim, marginBottom: 16 }}>Host Economics</p>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: P.text, marginBottom: 16 }}>
                You Keep <ChromeText>80%</ChromeText> of Every Dollar
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: P.textDim, marginBottom: 16, lineHeight: 1.7 }}>
                GritClub takes a flat 20% platform fee — that's it. No hidden charges, no monthly hosting cost, no per-seat fees.
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: P.textMuted, marginBottom: 48, lineHeight: 1.7 }}>
                Example: Sell 50 tickets at <strong style={{ color: P.text }}>$29</strong> each = <strong style={{ color: P.text }}>$1,450</strong> total revenue.<br />
                GritClub keeps <strong style={{ color: P.text }}>$290</strong> (20%) · You keep <strong style={{ color: P.text }}>$1,160</strong> (80%).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 480, margin: '0 auto 40px' }}>
                {[
                  { label: '50 tickets @ $29', value: '$1,450', sub: 'Total revenue' },
                  { label: 'Platform fee (20%)', value: '$290', sub: 'GritClub keeps' },
                  { label: 'You keep (80%)', value: '$1,160', sub: 'Paid to you' }
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    style={{ background: i === 2 ? 'rgba(255,255,255,0.06)' : P.card, border: `1px solid ${i === 2 ? P.borderStr : P.border}`, borderRadius: 12, padding: 20 }}>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: i === 2 ? P.text : P.textMuted, marginBottom: 4 }}>{item.value}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: P.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{item.sub}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.label}</p>
                  </motion.div>
                ))}
              </div>
              <Link href="/pricing">
                <button style={{ padding: '10px 28px', background: 'transparent', border: `1px solid ${P.borderStr}`, color: P.textMuted, borderRadius: 8, fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = P.text; (e.currentTarget as HTMLElement).style.borderColor = P.text }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = P.textMuted; (e.currentTarget as HTMLElement).style.borderColor = P.borderStr }}>
                  See All Plans →
                </button>
              </Link>
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

          {/* ═══ FOOTER — Privacy · Terms · Pricing only, no "Hosts keep 80%" ═══ */}
          <footer style={{ borderTop: `1px solid ${P.border}`, padding: '40px 24px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, #E8E8E8 0%, #CFCFCF 25%, #FFFFFF 50%, #B8B8B8 75%, #EDEDED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GRITCLUB</span>
              <div style={{ display: 'flex', gap: 28 }}>
                {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Pricing', href: '/pricing' }].map(link => (
                  <Link key={link.label} href={link.href} style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.textDim, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = P.textMuted)}
                    onMouseLeave={e => (e.currentTarget.style.color = P.textDim)}>{link.label}</Link>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 GritClub</p>
            </div>
          </footer>

        </motion.main>
      )}
    </div>
  )
}
