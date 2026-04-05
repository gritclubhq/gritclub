'use client'

/**
 * AUTH CALLBACK PAGE
 *
 * This MUST be a client page (not a route handler) because:
 * - Google OAuth (implicit flow) returns tokens in the URL HASH (#access_token=...)
 * - URL hashes are never sent to the server — only the browser can read them
 * - The Supabase JS client automatically detects and processes the hash on load
 *
 * This page handles all three callback cases:
 *   1. Google OAuth   → hash contains access_token
 *   2. Email confirm  → URL has ?code= param (PKCE exchange done client-side)
 *   3. Already authed → just redirect to dashboard
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      // Case 1 & 2: Let the Supabase client process whatever is in the URL
      // (hash tokens for OAuth, or ?code= for email confirmation)
      // onAuthStateChange fires automatically when it detects a session in the URL
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session) {
        // Session already established (e.g. came back from a refresh, or
        // Supabase SDK already processed the hash before we called getSession)
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next') || '/dashboard'
        router.replace(next)
        return
      }

      // If no session yet, wait for the auth state change event
      // (Supabase SDK processes the URL hash asynchronously)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          const params = new URLSearchParams(window.location.search)
          const next = params.get('next') || '/dashboard'
          router.replace(next)
        } else if (event === 'SIGNED_OUT' || error) {
          subscription.unsubscribe()
          router.replace('/auth/login?error=auth_failed')
        }
      })

      // Timeout fallback — if nothing happens in 5s, something went wrong
      setTimeout(() => {
        subscription.unsubscribe()
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            const params = new URLSearchParams(window.location.search)
            router.replace(params.get('next') || '/dashboard')
          } else {
            router.replace('/auth/login?error=auth_failed')
          }
        })
      }, 5000)
    }

    run()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0B0C',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      {/* Spinner */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: 'rgba(255,255,255,0.5)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{
        color: '#6B7280',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 14,
        letterSpacing: '0.04em',
      }}>
        Signing you in…
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
