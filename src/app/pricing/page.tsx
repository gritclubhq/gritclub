'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Check, X, Crown, Zap, Building2, Users, Video, Lock, Radio, Star } from 'lucide-react'
import Link from 'next/link'

const C = {
  bg:'#0A1120', surface:'#0F172A', card:'#0F172A',
  cardHover:'#1E293B', border:'rgba(255,255,255,0.06)',
  text:'#E5E7EB', textMuted:'#9CA3AF', textDim:'#6B7280',
  blue:'#3B82F6', blueL:'#9CA3AF',
  purple:'#2563EB', purpleL:'#2563EB',
  gold:'#94A3B8', goldL:'#94A3B8',
  red:'#EF4444', green:'#34D399',
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Users,
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: C.blueL,
    glow: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(167,141,120,0.2)',
    highlight: false,
    badge: null,
    description: 'Start exploring GritClub',
    cta: 'Get Started Free',
    ctaStyle: 'outline',
    features: [
      '1 free event per week',
      'Public chat in events',
      'Groups (max 5 members)',
      'Community feed access',
      'Basic networking',
      'Mobile + desktop',
    ],
    missing: [
      'Session recordings',
      'Private groups',
      'Host events',
      'No ticket needed for events',
      'Priority support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    monthlyPrice: 10,
    yearlyPrice: 70,
    yearlySaving: '42%',
    color: C.blueL,
    glow: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(59,130,246,0.35)',
    highlight: false,
    badge: null,
    description: 'For founders getting started',
    cta: 'Get Basic',
    ctaStyle: 'blue',
    features: [
      'Unlimited live events',
      'Unlimited group members',
      'Private group chat',
      'Premium member badge',
      'Full networking features',
      'Community feed + images',
    ],
    missing: [
      'Session recordings',
      'No ticket needed for events',
      'Host events',
      'Priority support',
    ],
  },
  {
    id: 'premium_plus',
    name: 'Premium Plus',
    icon: Crown,
    monthlyPrice: 17,
    yearlyPrice: 204,
    yearlySaving: '20%',
    color: C.gold,
    glow: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.5)',
    highlight: true,
    badge: '★ Most Popular',
    description: 'Total freedom on GritClub',
    cta: 'Get Premium Plus',
    ctaStyle: 'gold',
    features: [
      'Everything in Basic',
      'No event tickets needed — attend all events free',
      'Full session recordings (30 days)',
      'Download recordings',
      'Host events — keep 50% revenue',
      'VIP badge + priority access',
      'Private group calls + notes',
    ],
    missing: [
      'White-label branding',
      'Dedicated manager',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    monthlyPrice: null,
    yearlyPrice: null,
    color: '#6B7280',
    glow: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(167,139,250,0.3)',
    highlight: false,
    badge: null,
    description: 'Custom for teams & agencies',
    cta: 'Schedule Demo',
    ctaStyle: 'purple',
    features: [
      'Everything in Premium Plus',
      'Unlimited group members',
      'White-label event branding',
      'Custom event creation tools',
      'Priority 1:1 support',
      'Dedicated account manager',
      'Advanced analytics',
      'Host referrals — earn 20%',
    ],
    missing: [],
  },
]

const TABLE_ROWS = [
  { label:'5-Member Group Limit',         free:true,    basic:false,  pro:false,    ent:false   },
  { label:'Unlimited Groups & Members',   free:false,   basic:true,   pro:true,     ent:true    },
  { label:'Session Recordings',           free:false,   basic:false,  pro:true,     ent:true    },
  { label:'No Event Tickets Needed',      free:false,   basic:false,  pro:true,     ent:true    },
  { label:'Unlimited Live Events',        free:false,   basic:true,   pro:true,     ent:true    },
  { label:'Private Chat',                 free:false,   basic:true,   pro:true,     ent:true    },
  { label:'Host Events (50% revenue)',    free:false,   basic:false,  pro:true,     ent:true    },
  { label:'Download Recordings',          free:false,   basic:false,  pro:true,     ent:true    },
  { label:'Priority Support',             free:false,   basic:false,  pro:false,    ent:true    },
  { label:'White-label Branding',         free:false,   basic:false,  pro:false,    ent:true    },
  { label:'Dedicated Manager',            free:false,   basic:false,  pro:false,    ent:true    },
]

function Cell({ val }: { val: boolean | string }) {
  if(val === true)  return <span style={{color:C.green,fontSize:18}}>✓</span>
  if(val === false) return <span style={{color:'rgba(255,255,255,0.09)',fontSize:16}}>—</span>
  return <span style={{fontSize:12,color:C.textMuted,fontFamily:'Inter,sans-serif'}}>{val}</span>
}

export default function PricingPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string|null>(null)

  const handleCta = async (plan: typeof PLANS[0]) => {
    if(plan.id === 'free'){
      router.push('/auth/login')
      return
    }
    if(plan.id === 'enterprise'){
      window.location.href = 'mailto:gritclubhq@gmail.com?subject=Enterprise Inquiry'
      return
    }

    setLoading(plan.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if(!user){
        router.push(`/auth/login?plan=${plan.id}&billing=${annual?'yearly':'monthly'}`)
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId:    plan.id,
          billing:   annual ? 'yearly' : 'monthly',
          userId:    user.id,
          userEmail: user.email,
        }),
      })
      const data = await res.json()
      if(data.url) window.location.href = data.url
      else alert('Checkout error: ' + (data.error || 'Unknown error'))
    } catch(e:any) {
      alert('Error: ' + e.message)
    }
    setLoading(null)
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'Inter,sans-serif'}}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .plan-card { animation: fadeUp 0.5s ease both; }
        .plan-card:nth-child(1) { animation-delay: 0.05s }
        .plan-card:nth-child(2) { animation-delay: 0.15s }
        .plan-card:nth-child(3) { animation-delay: 0.25s }
        .plan-card:nth-child(4) { animation-delay: 0.35s }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:50,height:60,background:'rgba(7,11,20,0.9)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,background:'#3B82F6',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontWeight:800,fontSize:13,color:'#fff',clipPath:'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)'}}>G</div>
          <span style={{fontFamily:'Syne',fontWeight:800,fontSize:17,letterSpacing:'-0.02em'}}>GRIT<span style={{color:'#3B82F6'}}>CLUB</span></span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Link href="/auth/login" style={{textDecoration:'none',fontSize:13,color:C.textMuted,padding:'7px 16px',borderRadius:8,border:`1px solid ${C.border}`}}>Sign In</Link>
          <Link href="/auth/login" style={{textDecoration:'none',fontSize:13,fontWeight:700,color:'#fff',padding:'7px 16px',borderRadius:8,background:'#3B82F6'}}>Join Free</Link>
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'100px 16px 60px'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',borderRadius:20,background:'rgba(148,163,184,0.12)',border:'1px solid rgba(245,158,11,0.3)',marginBottom:20}}>
            <Star style={{width:12,height:12,color:C.gold}}/>
            <span style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:'0.1em',textTransform:'uppercase'}}>Simple, Transparent Pricing</span>
          </div>
          <h1 style={{fontSize:'clamp(28px,5vw,52px)',fontWeight:800,fontFamily:'Syne',letterSpacing:'-0.02em',marginBottom:14,lineHeight:1.1}}>
            Choose your <span style={{color:C.gold}}>GritClub</span> plan
          </h1>
          <p style={{fontSize:16,color:C.textMuted,maxWidth:520,margin:'0 auto',lineHeight:1.7}}>
            Start free. Upgrade when you're ready to host, record, and access every event without buying tickets.
          </p>

          {/* Annual toggle */}
          <div style={{display:'inline-flex',alignItems:'center',gap:12,marginTop:28,padding:'6px 6px 6px 16px',borderRadius:40,background:C.surface,border:`1px solid ${C.border}`}}>
            <span style={{fontSize:13,color:annual?C.textMuted:C.text,fontWeight:annual?400:700}}>Monthly</span>
            <button onClick={()=>setAnnual(p=>!p)}
              style={{width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',background:annual?C.gold:'rgba(255,255,255,0.1)',transition:'background .2s'}}>
              <div style={{position:'absolute',top:3,left:annual?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
            </button>
            <span style={{fontSize:13,color:annual?C.text:C.textMuted,fontWeight:annual?700:400}}>Annual</span>
            {annual && <span style={{fontSize:11,fontWeight:700,color:'#fff',background:C.green,padding:'2px 8px',borderRadius:10}}>Save up to 42%</span>}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16,marginBottom:64}}>
          {PLANS.map((plan) => {
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice
            const Icon = plan.icon
            return (
              <div key={plan.id} className="plan-card"
                style={{borderRadius:24,padding:24,background:plan.highlight?`linear-gradient(145deg,${C.card},#161f2e)`:C.card,border:`1px solid ${plan.highlight?plan.borderColor:C.border}`,position:'relative',display:'flex',flexDirection:'column',boxShadow:plan.highlight?`0 0 40px ${plan.glow}`:'none',transform:plan.highlight?'scale(1.03)':'scale(1)',transition:'transform .2s,box-shadow .2s'}}>

                {plan.badge && (
                  <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',padding:'4px 14px',borderRadius:20,background:`linear-gradient(135deg,${C.gold},#F97316)`,fontSize:11,fontWeight:800,color:'#fff',whiteSpace:'nowrap',fontFamily:'Syne',letterSpacing:'0.05em'}}>
                    {plan.badge}
                  </div>
                )}

                <div style={{marginBottom:16}}>
                  <div style={{width:40,height:40,borderRadius:12,background:plan.glow||'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12,border:`1px solid ${plan.borderColor}`}}>
                    <Icon style={{width:20,height:20,color:plan.color}}/>
                  </div>
                  <h2 style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:'Syne',marginBottom:4}}>{plan.name}</h2>
                  <p style={{fontSize:12,color:C.textMuted,lineHeight:1.5}}>{plan.description}</p>
                </div>

                {/* Price */}
                <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}>
                  {price === null ? (
                    <div style={{fontSize:24,fontWeight:800,color:C.text,fontFamily:'Syne'}}>Custom</div>
                  ) : price === 0 ? (
                    <div style={{fontSize:30,fontWeight:800,color:C.text,fontFamily:'Syne'}}>Free</div>
                  ) : (
                    <div>
                      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                        <span style={{fontSize:13,color:C.textMuted,marginTop:4}}>$</span>
                        <span style={{fontSize:36,fontWeight:800,color:plan.highlight?C.gold:C.text,fontFamily:'Syne',lineHeight:1}}>{price}</span>
                        <span style={{fontSize:12,color:C.textMuted}}>/{annual?'yr':'mo'}</span>
                      </div>
                      {annual && plan.yearlySaving && (
                        <div style={{fontSize:11,color:C.green,fontWeight:700,marginTop:4}}>
                          Save {plan.yearlySaving} vs monthly
                        </div>
                      )}
                      {!annual && plan.yearlyPrice && (
                        <div style={{fontSize:11,color:C.textDim,marginTop:4}}>
                          ${plan.yearlyPrice}/yr billed annually
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                  {plan.features.map(f => (
                    <div key={f} style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:plan.highlight?'rgba(245,158,11,0.15)':'rgba(52,211,153,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        <Check style={{width:9,height:9,color:plan.highlight?C.gold:C.green}}/>
                      </div>
                      <span style={{fontSize:12,color:C.textMuted,lineHeight:1.5}}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.slice(0,2).map(f => (
                    <div key={f} style={{display:'flex',alignItems:'flex-start',gap:8,opacity:0.4}}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        <X style={{width:9,height:9,color:C.textDim}}/>
                      </div>
                      <span style={{fontSize:12,color:C.textDim,lineHeight:1.5}}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={()=>handleCta(plan)}
                  disabled={loading === plan.id}
                  style={{
                    width:'100%',padding:'12px',borderRadius:12,cursor:'pointer',
                    fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                    transition:'opacity .15s, transform .15s',
                    opacity: loading===plan.id ? 0.7 : 1,
                    background:
                      plan.ctaStyle==='gold'   ? `linear-gradient(135deg,${C.gold},#F97316)` :
                      plan.ctaStyle==='blue'   ? `linear-gradient(135deg,${C.blue},${C.blueL})` :
                      plan.ctaStyle==='purple' ? `linear-gradient(135deg,${C.purple},#6D28D9)` :
                      'transparent',
                    border: plan.ctaStyle==='outline' ? `1px solid ${C.border}` : 'none',
                    color: plan.ctaStyle==='outline' ? C.textMuted : '#fff',
                  }}
                  onMouseEnter={e=>{if(loading!==plan.id)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}
                >
                  {loading===plan.id ? (
                    <div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                  ) : (
                    <>{plan.id!=='free'&&plan.id!=='enterprise'&&<Crown style={{width:14,height:14}}/> }{plan.cta}</>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <div style={{borderRadius:20,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:48}}>
          <div style={{padding:'16px 20px',background:C.surface,borderBottom:`1px solid ${C.border}`}}>
            <h2 style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:'Syne',margin:0}}>Full Feature Comparison</h2>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:C.surface}}>
                  <th style={{padding:'12px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:C.textMuted,letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:`1px solid ${C.border}`,width:'40%'}}>Feature</th>
                  {['Free','Basic','Premium Plus','Enterprise'].map((h,i)=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:'center',fontSize:12,fontWeight:700,borderBottom:`1px solid ${C.border}`,color:i===2?C.gold:C.textMuted,letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row,i)=>(
                  <tr key={row.label} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                    <td style={{padding:'12px 20px',fontSize:13,color:C.textMuted,fontFamily:'Inter,sans-serif'}}>{row.label}</td>
                    {[row.free,row.basic,row.pro,row.ent].map((v,j)=>(
                      <td key={j} style={{padding:'12px 16px',textAlign:'center'}}><Cell val={v}/></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ strip */}
        <div style={{textAlign:'center',padding:'40px 0',borderTop:`1px solid ${C.border}`}}>
          <p style={{fontSize:14,color:C.textMuted,marginBottom:8}}>Questions about pricing?</p>
          <a href="mailto:gritclubhq@gmail.com" style={{fontSize:14,color:C.blueL,textDecoration:'none',fontWeight:600}}>gritclubhq@gmail.com →</a>
        </div>

      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
