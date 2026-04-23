'use client'

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react'
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

  const fetchUser = useCallback(async (session?: Session | null) => {
    try {
      const response = await getCurrentUser(session)
      if (response.success) {
        setUser(response.data)
        setError(null)
      } else {
        setUser(null)
        setError(response.error || 'Error al obtener información del usuario')
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      setUser(null)
      setError('Error de conexión con el servidor')
    }
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    let subscription: { unsubscribe: () => void } | null = null
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // Intentar obtener la sesión actual primero
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          await fetchUser(session)
          setLoading(false)
        } else {
          // Si no hay sesión, dejar de cargar inmediatamente
          setLoading(false)
        }
        
        // Configurar timeout de seguridad
        timeout = setTimeout(() => {
          if (isMounted && loading) {
            setError('Tiempo de espera agotado al conectar con el servidor')
            setLoading(false)
          }
        }, 10000) // Reducido a 10 segundos

        // Configurar listener de cambios de autenticación
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return
            
            console.log('Auth state change:', event)
            
            if (event === 'INITIAL_SESSION') {
              clearTimeout(timeout)
              await fetchUser(session)
              setLoading(false)
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await fetchUser(session)
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              setError(null)
            }
          }
        )
        
        subscription = sub
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (isMounted) {
          setError('Error al inicializar autenticación')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      if (timeout) clearTimeout(timeout)
      if (subscription) subscription.unsubscribe()
    }
  }, [fetchUser])

  const refetch = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetchUser(session)
      setRefreshKey(prev => prev + 1)
    } catch (err) {
      console.error('Error refetching user:', err)
    }
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      refetch, 
      refreshKey 
    }}>
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