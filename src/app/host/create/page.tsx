'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { Radio, AlertCircle, X, Image } from 'lucide-react'

const C = {
  bg:'#0B0B0C', surface:'#141416', card:'#141416',
  border:'rgba(255,255,255,0.06)', text:'#F5F5F5',
  textMuted:'#B0A8A3', textDim:'#8A817C',
  blue:'#FF4D2D', blueL:'#B0A8A3', blueDim:'rgba(255,255,255,0.06)',
  gold:'#A67C52', red:'#EF4444', redDim:'rgba(239,68,68,0.12)',
  green:'#6B9E6B',
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize:13, fontWeight:600, color:C.textMuted, marginBottom:6, display:'block', fontFamily:'Inter,sans-serif' }}>{children}</label>
}

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:`1px solid ${C.border}`, background:C.surface,
  color:C.text, fontSize:13, fontFamily:'Inter,sans-serif',
  outline:'none', boxSizing:'border-box',
}

export default function CreateEventPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    title:'', description:'', price:'', capacity:'100', start_time:'', status:'scheduled',
  })
  const [bannerFile,    setBannerFile]    = useState<File|null>(null)
  const [bannerPreview, setBannerPreview] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
    })
  }, [])

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5*1024*1024) { setError('Banner must be under 5MB'); return }
    setBannerFile(file); setBannerPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true); setError('')
    const priceInCents = Math.round(parseFloat(form.price||'0') * 100)

    // Upload banner
    let posterUrl: string|null = null
    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop()
      const path = `events/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('event-banners')
        .upload(path, bannerFile, { contentType:bannerFile.type, upsert:true })
      if (upErr) { setError('Banner upload failed: ' + upErr.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('event-banners').getPublicUrl(path)
      posterUrl = urlData.publicUrl
    }

    // Create event
    const { data: ev, error: insertError } = await supabase.from('events').insert({
      host_id: user.id, title: form.title.trim(),
      description: form.description.trim() || null,
      price: priceInCents, capacity: parseInt(form.capacity)||100,
      start_time: form.start_time||null, status: form.status,
      poster_url: posterUrl, total_sold:0, viewer_peak:0,
    }).select('id').single()

    if (insertError) { setError('Error: ' + insertError.message); setLoading(false); return }

    router.push('/host')
  }

  const priceNum = parseFloat(form.price||'0')

  return (
    <DashboardLayout>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:C.blueL, fontFamily:'Inter,sans-serif', marginBottom:4 }}>Host</p>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:'Sora,sans-serif', marginBottom:4 }}>Create Event</h1>
          <p style={{ fontSize:13, color:C.textMuted, fontFamily:'Inter,sans-serif' }}>You keep 80% of every ticket sold</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Banner */}
          <div>
            <Label>Event Banner</Label>
            {bannerPreview ? (
              <div style={{ position:'relative', borderRadius:12, overflow:'hidden', height:180 }}>
                <img src={bannerPreview} alt="Banner" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                <button type="button" onClick={()=>{ setBannerFile(null); setBannerPreview(null) }}
                  style={{ position:'absolute', top:8, right:8, width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(0,0,0,0.7)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X style={{ width:14, height:14 }}/>
                </button>
              </div>
            ) : (
              <div onClick={()=>bannerRef.current?.click()}
                style={{ height:180, borderRadius:12, border:`2px dashed ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', background:C.surface }}>
                <Image style={{ width:32, height:32, color:C.textDim }}/>
                <p style={{ fontSize:13, fontWeight:600, color:C.textMuted, fontFamily:'Inter,sans-serif' }}>Click to upload event banner</p>
                <p style={{ fontSize:11, color:C.textDim, fontFamily:'Inter,sans-serif' }}>JPG, PNG · Max 5MB · Recommended 1280×720</p>
              </div>
            )}
            <input ref={bannerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleBanner}/>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20, borderRadius:16, background:C.card, border:`1px solid ${C.border}` }}>
            {/* Title */}
            <div>
              <Label>Event Title *</Label>
              <input style={inputStyle} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. How I Hit $10k MRR in 90 Days" required/>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <textarea style={{ ...inputStyle, resize:'vertical' }} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What will attendees learn?" rows={3}/>
            </div>

            {/* Price + Capacity */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <Label>Ticket Price ($) *</Label>
                <input style={inputStyle} type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0" min="0" step="0.01" required/>
                {priceNum > 0 && <p style={{ fontSize:11, color:C.green, marginTop:4, fontFamily:'Inter,sans-serif' }}>You keep ${(priceNum*0.8).toFixed(2)} per ticket</p>}
              </div>
              <div>
                <Label>Capacity</Label>
                <input style={inputStyle} type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} min="1"/>
              </div>
            </div>

            {/* Start time */}
            <div>
              <Label>Start Time</Label>
              <input style={{ ...inputStyle, colorScheme:'dark' } as any} type="datetime-local" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/>
            </div>
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px', borderRadius:10, background:C.redDim, border:'1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle style={{ width:15, height:15, color:C.red, flexShrink:0 }}/>
              <p style={{ fontSize:13, color:C.red, fontFamily:'Inter,sans-serif' }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading||!form.title||!form.price}
            style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.gold},#F97316)`, color:'#0B0B0C', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading||!form.title||!form.price?0.5:1 }}>
            <Radio style={{ width:17, height:17 }}/>
            {loading?'Creating...':'Create Event'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
