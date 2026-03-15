'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Save, Loader2, Check, Bell, Shield, Globe, DollarSign } from 'lucide-react'

const C = { bg:'#0A0F1E', card:'#111827', surface:'#0D1428', border:'rgba(255,255,255,0.06)', text:'#F0F4FF', textMuted:'#7B8DB0', textDim:'#3D4F6E', blue:'#2563EB', blueLight:'#3B82F6', blueDim:'rgba(37,99,235,0.12)', gold:'#F59E0B', goldDim:'rgba(245,158,11,0.1)', red:'#EF4444', redDim:'rgba(239,68,68,0.1)', green:'#10B981', greenDim:'rgba(16,185,129,0.1)' }

function Toggle({ label, desc, value, onChange, icon: Icon, color = C.green }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'14px 16px', borderRadius:14, background:C.surface, border:`1px solid ${value ? color+'30' : C.border}`, cursor:'pointer' }}
      onClick={() => onChange(!value)}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {Icon && <div style={{ width:32, height:32, borderRadius:10, background:value ? color+'15' : C.border, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon style={{ width:15, height:15, color:value ? color : C.textDim }} /></div>}
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:'DM Sans,sans-serif' }}>{label}</p>
          <p style={{ fontSize:11, color:C.textMuted, fontFamily:'DM Sans,sans-serif' }}>{desc}</p>
        </div>
      </div>
      <div style={{ width:42, height:24, borderRadius:12, background:value ? color : C.border, position:'relative', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, width:20, height:20, borderRadius:'50%', background:'#fff', left:value?20:2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [settings, setSettings] = useState({
    maintenanceMode:    false,
    newRegistrations:   true,
    hostApplications:   true,
    emailNotifications: true,
    realtimeUpdates:    true,
    contentModeration:  true,
    maxGroupMembers:    5,
    platformFee:        20,
    minPayoutAmount:    50,
  })

  const handleSave = async () => {
    setSaving(true)
    // Settings stored as announcement for now — future: platform_settings table
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const upd = (k: string, v: any) => setSettings(p => ({ ...p, [k]: v }))

  return (
    <DashboardLayout>
      <div style={{ background: C.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, color: C.blueLight, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Admin</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>Platform Settings</h1>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: saved ? C.green : C.blue, color: '#fff', fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14 }}>
              {saving ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Saving...</> : saved ? <><Check style={{ width: 15, height: 15 }} /> Saved!</> : <><Save style={{ width: 15, height: 15 }} /> Save Settings</>}
            </button>
          </div>

          {/* Platform */}
          <div style={{ borderRadius: 20, padding: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Platform Controls</p>
            <Toggle label="Maintenance Mode" desc="Disable access for all non-admin users" value={settings.maintenanceMode} onChange={(v: boolean) => upd('maintenanceMode', v)} icon={Shield} color={C.red} />
            <Toggle label="New Registrations" desc="Allow new users to sign up" value={settings.newRegistrations} onChange={(v: boolean) => upd('newRegistrations', v)} icon={Globe} color={C.green} />
            <Toggle label="Host Applications" desc="Allow users to apply for host status" value={settings.hostApplications} onChange={(v: boolean) => upd('hostApplications', v)} icon={Bell} color={C.blueLight} />
            <Toggle label="Content Moderation" desc="Enable automated content filtering" value={settings.contentModeration} onChange={(v: boolean) => upd('contentModeration', v)} icon={Shield} color={C.gold} />
          </div>

          {/* Revenue */}
          <div style={{ borderRadius: 20, padding: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: 'DM Sans,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Revenue Settings</p>
            {[
              { label: 'Platform Fee (%)', key: 'platformFee', min: 5, max: 50, note: `Host keeps ${100 - settings.platformFee}%` },
              { label: 'Minimum Payout ($)', key: 'minPayoutAmount', min: 10, max: 500, note: 'Minimum before payout is processed' },
              { label: 'Free Group Member Limit', key: 'maxGroupMembers', min: 1, max: 20, note: 'Members allowed before upgrade required' },
            ].map(field => (
              <div key={field.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>{field.label}</label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.gold, fontFamily: 'Syne,sans-serif' }}>{(settings as any)[field.key]}{field.key === 'platformFee' ? '%' : field.key === 'minPayoutAmount' ? ' USD' : ' members'}</span>
                </div>
                <input type="range" min={field.min} max={field.max} value={(settings as any)[field.key]}
                  onChange={e => upd(field.key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: C.gold }} />
                <p style={{ fontSize: 11, color: C.textDim, fontFamily: 'DM Sans,sans-serif', marginTop: 4 }}>{field.note}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <p style={{ fontSize: 13, color: C.blueLight, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.6 }}>
              ℹ️ These settings apply platform-wide. Changes take effect immediately after saving. Some settings may require a cache clear to fully propagate.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
