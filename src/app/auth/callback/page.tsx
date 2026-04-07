'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      // Wait a moment for Supabase to process the URL hash automatically
      await new Promise(r => setTimeout(r, 500))

      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.replace('/dashboard')
      } else {
        // Try exchanging a code if present
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
          router.replace('/dashboard')
        } else {
          router.replace('/auth/login')
        }
      }
    }

    handle()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: '#0B0B0C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#C7C7CC',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
