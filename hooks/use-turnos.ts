'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getTurnosConDatos } from '@/lib/services'
import { Turno } from '@/lib/types'

interface UseTurnosOptions {
  skip?: boolean
  autoFetch?: boolean
}

const _turnosCache = new Map<string, Turno[]>()

export function useTurnos(options: UseTurnosOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = user?.id_clinica || ''
  const [data, setData] = useState<Turno[]>(() => _turnosCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_turnosCache.has(cacheKey))
  const hasLoadedOnce = useRef(_turnosCache.has(cacheKey))

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = await getTurnosConDatos(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Turno[])
        setError(null)
        _turnosCache.set(cacheKey, response.data as Turno[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error)
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      setError(String(err))
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id_clinica, options.skip, cacheKey])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.skip, options.autoFetch, refetch, refreshKey])

  return { data, error, loading, refetch }
}
