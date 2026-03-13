'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Send, Users, Video, VideoOff, Mic, MicOff, PhoneCall, PhoneOff,
  FileText, CheckCircle, XCircle, Radio, Crown, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'chat' | 'notes' | 'members'

export default function GroupRoomPage() {
  const { id } = useParams()
  const router = useRouter()

  const [group, setGroup] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [tab, setTab] = useState<Tab>('chat')
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
      setProfile(prof)

      const { data: g } = await supabase.from('groups').select('*').eq('id', id).single()
      if (!g) { router.push('/groups'); return }
      setGroup(g)

      const owner = g.owner_id === u.id || prof?.role === 'admin'
      setIsOwner(owner)

      const { data: myMembership } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id)
        .eq('user_id', u.id)
        .maybeSingle()

      const active = owner || myMembership?.status === 'active'

      if (!active) { setAccessDenied(true); setLoading(false); return }

      const { data: allMembers } = await supabase
        .from('group_members')
        .select('*, users(id, email, photo_url, profile_bio, role)')
        .eq('group_id', id)

      setMembers(allMembers?.filter(m => m.status === 'active') || [])
      setPending(allMembers?.filter(m => m.status === 'pending') || [])

      const { data: msgs } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', id)
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(msgs || [])

      const { data: noteData } = await supabase
        .from('group_notes')
        .select('*')
        .eq('group_id', id)
        .maybeSingle()
      if (noteData) { setNotes(noteData.content); setSavedNotes(noteData.content) }

      setLoading(false)

      const ch = supabase.channel(`group-${id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'group_messages',
          filter: `group_id=eq.${id}`
        }, (p) => {
          setMessages(prev => [...prev, p.new])
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        })
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'group_members',
          filter: `group_id=eq.${id}`
        }, async () => {
          const { data } = await supabase
            .from('group_members')
            .select('*, users(id, email, photo_url, profile_bio, role)')
            .eq('group_id', id)
          setMembers(data?.filter(m => m.status === 'active') || [])
          setPending(data?.filter(m => m.status === 'pending') || [])
        })
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'group_notes',
          filter: `group_id=eq.${id}`
        }, (p) => {
          if (p.new.updated_by !== u.id) {
            setNotes(p.new.content)
            setSavedNotes(p.new.content)
          }
        })
        .subscribe()

      channelRef.current = ch
      setTimeout(() => chatBottomRef.current?.scrollIntoView(), 100)
    }

    init()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [id])

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return
    await supabase.from('group_messages').insert({
      group_id: id,
      user_id: user.id,
      user_name: user.email.split('@')[0],
      user_avatar: user.user_metadata?.avatar_url || '',
      text: newMsg.trim()
    })
    setNewMsg('')
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await supabase.from('group_notes')
      .update({ content: notes, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('group_id', id)
    setSavedNotes(notes)
    setNotesDirty(false)
    setSavingNotes(false)
  }

  const approveMember = async (memberId: string) => {
    await supabase.from('group_members').update({ status: 'active' }).eq('id', memberId)
    await supabase.from('groups').update({ member_count: members.length + 1 }).eq('id', id)
  }

  const rejectMember = async (memberId: string) => {
    await supabase.from('group_members').update({ status: 'rejected' }).eq('id', memberId)
  }

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
      }
      setInCall(true)
    } catch {
      alert('Please allow camera and microphone access')
    }
  }

  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    setInCall(false)
    setMicOn(true)
    setCamOn(true)
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(p => !p)
  }

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(p => !p)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = userName.slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (accessDenied) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-md mx-auto text-center">
          <div className="rounded-2xl p-8" style={{ background: '#1E293B' }}>
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-bold mb-2 text-white">Access Restricted</h2>
            <p className="text-slate-400 text-sm mb-4">Your join request is pending approval from the group owner.</p>
            <Link href="/groups" className="text-sky-400 text-sm hover:underline">← Back to Groups</Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: '#1E293B', borderBottom: '1px solid #334155' }}>
          <div className="flex items-center gap-3">
            <Link href="/groups" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', color: 'white' }}>
              {group?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">{group?.name}</h1>
              <p className="text-xs text-slate-400">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && pending.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full font-bold animate-pulse"
                style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700' }}>
                {pending.length} pending
              </span>
            )}
            {isOwner && (
              <Link href={`/host/create`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                <Radio className="w-3.5 h-3.5" /> Host Event
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Video call */}
            {inCall && (
              <div className="relative flex-shrink-0" style={{ height: '220px', background: '#000' }}>
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="w-full h-full object-cover"
                  style={{ display: camOn ? 'block' : 'none' }} />
                {!camOn && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0F172A' }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                      {initials}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
                  <button onClick={toggleMic}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: micOn ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.8)', color: 'white' }}>
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button onClick={toggleCam}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: camOn ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.8)', color: 'white' }}>
                    {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                  <button onClick={endCall}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: '#EF4444', color: 'white' }}>
                    <PhoneOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0">
              {(['chat', 'notes', 'members'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold capitalize"
                  style={{
                    background: tab === t ? '#38BDF8' : '#1E293B',
                    color: tab === t ? '#0F172A' : '#94A3B8'
                  }}>
                  {t === 'members' ? `Members (${members.length})` : t === 'notes' ? 'Notes' : 'Chat'}
                  {t === 'members' && isOwner && pending.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: '#FFD700', color: '#0F172A' }}>{pending.length}</span>
                  )}
                </button>
              ))}
              {!inCall && (
                <button onClick={startCall}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <PhoneCall className="w-3.5 h-3.5" /> Start Call
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4">

              {tab === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                    {messages.length === 0 && (
                      <div className="text-center pt-8">
                        <p className="text-slate-600 text-sm">No messages yet — say hello! 👋</p>
                      </div>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', color: 'white' }}>
                          {msg.user_avatar
                            ? <img src={msg.user_avatar} alt="" className="w-full h-full object-cover" />
                            : msg.user_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-slate-300">{msg.user_name}</span>
                            <span className="text-xs text-slate-600">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 leading-snug">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Message the group..."
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
                    />
                    <button onClick={sendMessage} disabled={!newMsg.trim()}
                      className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
                      style={{ background: '#38BDF8', color: '#0F172A' }}>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {tab === 'notes' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Shared with all members
                    </span>
                    <button onClick={saveNotes} disabled={!notesDirty || savingNotes}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                      style={{ background: notesDirty ? '#38BDF8' : '#1E293B', color: notesDirty ? '#0F172A' : '#64748B' }}>
                      {savingNotes ? 'Saving...' : notesDirty ? 'Save Notes' : 'Saved ✓'}
                    </button>
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); setNotesDirty(e.target.value !== savedNotes) }}
                    placeholder="Write shared notes, ideas, plans..."
                    className="flex-1 p-4 rounded-xl text-sm outline-none resize-none font-mono leading-relaxed"
                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
                  />
                </div>
              )}

              {tab === 'members' && (
                <div className="flex-1 overflow-y-auto space-y-4">
                  {isOwner && pending.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#FFD700' }}>
                        Join Requests ({pending.length})
                      </h3>
                      <div className="space-y-2">
                        {pending.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: '#1E293B', border: '1px solid rgba(255,215,0,0.2)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', color: '#0F172A' }}>
                                {m.users?.photo_url
                                  ? <img src={m.users.photo_url} alt="" className="w-full h-full object-cover" />
                                  : m.users?.email?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{m.users?.email?.split('@')[0]}</div>
                                <div className="text-xs text-slate-500">{m.users?.email}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => approveMember(m.id)}
                                className="p-1.5 rounded-lg" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => rejectMember(m.id)}
                                className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Active Members ({members.length})
                    </h3>
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1E293B' }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', color: 'white' }}>
                            {m.users?.photo_url
                              ? <img src={m.users.photo_url} alt="" className="w-full h-full object-cover" />
                              : m.users?.email?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{m.users?.email?.split('@')[0]}</div>
                            <div className="text-xs text-slate-500 truncate">{m.users?.profile_bio || m.users?.email}</div>
                          </div>
                          {m.role === 'owner' && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>
                              <Crown className="w-3 h-3" /> Owner
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
