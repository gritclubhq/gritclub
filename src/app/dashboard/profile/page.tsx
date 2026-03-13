'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { Save, Ticket, Radio, Users, Edit2, CheckCircle, LogOut, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ tickets: 0, connections: 0, events: 0 })
  const [form, setForm] = useState({ profile_bio: '', photo_url: '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(prof)
      setForm({ profile_bio: prof?.profile_bio || '', photo_url: prof?.photo_url || user.user_metadata?.avatar_url || '' })
      const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid')
      setStats({ tickets: ticketCount || 0, connections: 0, events: 0 })
    }
    load()
  }, [])

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photo_url: reader.result as string }))
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    await supabase.from('users').update({ profile_bio: form.profile_bio, photo_url: form.photo_url }).eq('id', user.id)
    setProfile((prev: any) => ({ ...prev, profile_bio: form.profile_bio, photo_url: form.photo_url }))
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Founder'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const roleColor = profile?.role === 'admin' ? '#F87171' : profile?.role === 'host' ? '#FFD700' : '#38BDF8'
  const roleBg = profile?.role === 'admin' ? 'rgba(239,68,68,0.15)' : profile?.role === 'host' ? 'rgba(255,215,0,0.15)' : 'rgba(56,189,248,0.15)'
  const photoUrl = form.photo_url || user?.user_metadata?.avatar_url || ''

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#1E293B' }}>
          <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)' }} />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A', ringColor: '#1E293B' }}>
                {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: editing ? 'rgba(56,189,248,0.15)' : '#334155', color: editing ? '#38BDF8' : '#E2E8F0' }}>
                <Edit2 className="w-3.5 h-3.5" />{editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: roleBg, color: roleColor }}>{profile?.role?.toUpperCase()}</span>
              </div>
              <p className="text-sm text-slate-400">{user?.email}</p>
              {profile?.profile_bio && !editing && <p className="text-sm text-slate-300 mt-2 leading-relaxed">{profile.profile_bio}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Tickets', value: stats.tickets, icon: Ticket },
                { label: 'Connections', value: stats.connections, icon: Users },
                { label: 'Events', value: stats.events, icon: Radio },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: '#0F172A' }}>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {editing && (
              <div className="space-y-4 pt-3" style={{ borderTop: '1px solid #334155' }}>
                {/* Drag & drop photo upload */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">Profile Photo</label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileRef.current?.click()}
                    className="cursor-pointer rounded-xl p-6 text-center transition-all"
                    style={{ background: dragOver ? 'rgba(56,189,248,0.1)' : '#0F172A', border: `2px dashed ${dragOver ? '#38BDF8' : '#334155'}` }}
                  >
                    {uploading ? (
                      <div className="text-sky-400 text-sm">Uploading...</div>
                    ) : photoUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover mx-auto" />
                        <span className="text-xs text-slate-400">Click or drag to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                        <span className="text-sm text-slate-400">Drop photo here or click to upload</span>
                        <span className="text-xs text-slate-600">PNG, JPG up to 5MB</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Bio</label>
                  <textarea value={form.profile_bio} onChange={e => setForm({ ...form, profile_bio: e.target.value })} placeholder="Tell other founders about yourself..." rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }} />
                </div>
                <button onClick={handleSave} disabled={loading} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm" style={{ background: '#38BDF8', color: '#0F172A' }}>
                  {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Changes'}</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Become host CTA */}
        {profile?.role === 'audience' && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.15)' }}>
                <Radio className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">Become a Host</div>
                <div className="text-xs text-slate-400">Keep 80% on every ticket sold</div>
              </div>
            </div>
            <Link href="/dashboard/become-host" className="block text-center w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#FFD700', color: '#0F172A' }}>Apply Now →</Link>
          </div>
        )}

        {/* Sign out — lives here on profile page */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <div className="mt-4 text-center text-xs text-slate-600">
          Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2026'}
        </div>
      </div>
    </DashboardLayout>
  )
}
