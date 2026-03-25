'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getTurnosConDatos } from '@/lib/services'
import { Turno } from '@/lib/types'

interface UseTurnosOptions {
  skip?: boolean
  autoFetch?: boolean
}

export function useTurnos(options: UseTurnosOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<Turno[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(options.autoFetch !== false)

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await getTurnosConDatos(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Turno[])
        setError(null)
      } else {
        setError(response.error)
        setData([])
      }
    } catch (err) {
      setError(String(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id_clinica, options.skip])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.skip, options.autoFetch, refetch])

  return { data, error, loading, refetch }
}
