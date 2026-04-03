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
  refreshKey: number
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
        } else if (event === 'TOKEN_REFRESHED') {
          // Token renovado: actualizar user Y refrescar datos con el nuevo token
          await fetchUser(session)
          setRefreshKey(k => k + 1)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
        }
      }
    )

    // Cuando el tab vuelve a ser visible, esperar 800ms para que Supabase
    // tenga tiempo de renovar el token antes de disparar los fetches
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => setRefreshKey(k => k + 1), 800)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription?.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, refetch: () => fetchUser(), refreshKey }}>
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
