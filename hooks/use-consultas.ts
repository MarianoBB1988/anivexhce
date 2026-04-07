'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getConsultasConDatos, getConsultasByMascota } from '@/lib/services'
import { Consulta } from '@/lib/types'

interface UseConsultasOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

const _consultasCache = new Map<string, Consulta[]>()

export function useConsultas(options: UseConsultasOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = (user?.id_clinica || '') + (options.mascotaId || '')
  const [data, setData] = useState<Consulta[]>(() => _consultasCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_consultasCache.has(cacheKey))
  const hasLoadedOnce = useRef(_consultasCache.has(cacheKey))

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = options.mascotaId
        ? await getConsultasByMascota(options.mascotaId, user.id_clinica)
        : await getConsultasConDatos(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Consulta[])
        setError(null)
        _consultasCache.set(cacheKey, response.data as Consulta[])
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
  }, [user?.id_clinica, options.skip, options.mascotaId, cacheKey])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.mascotaId, options.skip, options.autoFetch, refetch, refreshKey])

  return { data, error, loading, refetch }
}
