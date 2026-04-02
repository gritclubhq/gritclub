'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()

  useEffect(() => {
    // Initial session check — getSession() is fine here for speed,
    // the onAuthStateChange will update with validated user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for ALL auth events — this is the source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
