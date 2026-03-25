'use client'

import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser } from '@/lib/types'
import { getCurrentUser } from '@/lib/services/auth'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async (session?: Session | null) => {
    const response = await getCurrentUser(session)
    if (response.success) {
      setUser(response.data)
      setError(null)
    } else {
      setUser(null)
      setError(response.error)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          await fetchUser(session)
          setLoading(false)
        } else if (event === 'SIGNED_IN') {
          await fetchUser(session)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
        }
      }
    )
    return () => { subscription?.unsubscribe() }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, refetch: () => fetchUser() }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
