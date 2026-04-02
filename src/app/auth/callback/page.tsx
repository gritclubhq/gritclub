'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Case 1: URL has a hash (implicit/OAuth flow — Google login)
        // Supabase automatically processes the hash and sets the session
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          // Give Supabase SDK a moment to process the hash
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setStatus('Redirecting…')
            router.replace('/dashboard')
            return
          }
        }

        // Case 2: URL has a code param (PKCE flow — email confirmations, magic links)
        const params = new URLSearchParams(window.location.search)
        const code   = params.get('code')
        const next   = params.get('next') || '/dashboard'

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            setStatus('Redirecting…')
            router.replace(next)
            return
          }
          console.error('Code exchange failed:', error.message)
          router.replace('/auth/login?error=auth_failed')
          return
        }

        // Case 3: Neither hash nor code — check if already has session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace('/dashboard')
          return
        }

        // Nothing worked
        router.replace('/auth/login?error=auth_failed')
      } catch (err) {
        console.error('Auth callback error:', err)
        router.replace('/auth/login?error=auth_failed')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: '#0B0B0C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <Loader2 style={{ width: 28, height: 28, color: '#6B7280', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6B7280', fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, letterSpacing: '0.05em' }}>
        {status}
      </p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
