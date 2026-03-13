'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { CheckCircle, XCircle, Clock, User, ExternalLink, Shield } from 'lucide-react'

export default function AdminHostsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
    const channel = supabase.channel('host-apps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'host_applications' }, loadApplications)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadApplications = async () => {
    const { data } = await supabase
      .from('host_applications')
      .select('*')
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  const approve = async (app: any) => {
    await supabase.from('users').update({ role: 'host', host_approved: true }).eq('id', app.user_id)
    await supabase.from('host_applications').update({ status: 'approved' }).eq('id', app.id)
    loadApplications()
  }

  const reject = async (app: any) => {
    await supabase.from('host_applications').update({ status: 'rejected' }).eq('id', app.id)
    loadApplications()
  }

  const pending = applications.filter(a => a.status === 'pending')
  const reviewed = applications.filter(a => a.status !== 'pending')

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.15)' }}>
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Host Approvals</h1>
            <p className="text-slate-400 text-sm">{pending.length} pending · {reviewed.length} reviewed</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: '#1E293B' }} />)}</div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#1E293B' }}>
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-slate-500 text-sm">Host applications will appear here when founders apply</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Pending Review ({pending.length})</h2>
                <div className="space-y-3">
                  {pending.map(app => (
                    <div key={app.id} className="rounded-2xl p-5" style={{ background: '#1E293B', border: '1px solid rgba(56,189,248,0.2)' }}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{app.email}</div>
                            <div className="text-xs text-slate-500">{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approve(app)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}>
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => reject(app)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-xl" style={{ background: '#0F172A' }}>
                          <div className="text-xs text-slate-500 mb-1">Expertise</div>
                          <div className="text-slate-200">{app.expertise}</div>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#0F172A' }}>
                          <div className="text-xs text-slate-500 mb-1">Why they want to host</div>
                          <div className="text-slate-200 line-clamp-2">{app.reason}</div>
                        </div>
                      </div>
                      {app.social_url && (
                        <a href={app.social_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-sky-400 hover:underline">
                          <ExternalLink className="w-3 h-3" /> {app.social_url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewed.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest mt-6">Reviewed ({reviewed.length})</h2>
                <div className="space-y-2">
                  {reviewed.map(app => (
                    <div key={app.id} className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#1E293B' }}>
                      <div>
                        <div className="font-medium text-sm">{app.email}</div>
                        <div className="text-xs text-slate-500">{app.expertise}</div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: app.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: app.status === 'approved' ? '#4ADE80' : '#F87171' }}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
