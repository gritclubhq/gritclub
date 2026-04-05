'use client'

/**
 * /auth/callback — handles ALL post-auth redirects:
 *
 *   1. Google OAuth (implicit flow)
 *      Supabase redirects back with tokens in the URL hash: #access_token=...
 *      The Supabase JS client processes the hash automatically on page load.
 *      We just wait for onAuthStateChange to fire.
 *
 *   2. Email magic link / confirmation (PKCE flow)
 *      Supabase redirects back with ?code= in the query string.
 *      supabase.auth.exchangeCodeForSession(code) exchanges it for a session.
 *
 *   3. Already authenticated
 *      Session already in localStorage — just redirect to dashboard.
 *
 * WHY this is a client page and NOT a route handler:
 *   Google OAuth returns tokens in the URL hash (#access_token=...).
 *   URL hashes are never sent to the server — only the browser can read them.
 *   A route.ts handler would never see the Google tokens.
 *   The Supabase browser client handles hash detection automatically.
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router  = useRouter()
  const ranOnce = useRef(false)

  useEffect(() => {
    // Prevent double-run in React Strict Mode
    if (ranOnce.current) return
    ranOnce.current = true

    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code   = params.get('code')
      const next   = params.get('next') || '/dashboard'

      // ── Case 1: PKCE code exchange (email magic link / confirmation) ──────
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace(next)
          return
        }
        // Code exchange failed — fall through to session check
      }

      // ── Case 2: Already have a session (OAuth hash already processed) ─────
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace(next)
        return
      }

      // ── Case 3: Wait for Supabase to process the OAuth hash async ─────────
      // The Supabase SDK detects #access_token in the URL and fires SIGNED_IN
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            router.replace(next)
          }
        }
      )

      // Safety timeout: if nothing fires in 6 seconds → back to login
      const timer = setTimeout(async () => {
        subscription.unsubscribe()
        const { data: { session } } = await supabase.auth.getSession()
        router.replace(session ? next : '/auth/login?error=auth_failed')
      }, 6000)

      // Clean up timer if component unmounts (e.g. fast navigation)
      return () => {
        clearTimeout(timer)
        subscription.unsubscribe()
      }
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
      gap: 18,
    }}>
      {/* Spinner */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '2.5px solid rgba(255,255,255,0.08)',
        borderTopColor: 'rgba(255,255,255,0.55)',
        animation: 'spin 0.75s linear infinite',
      }} />
      <p style={{
        color: '#8A8A8F',
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
