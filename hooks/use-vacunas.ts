'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getVacunas, getVacunasByMascota } from '@/lib/services'
import { Vacuna } from '@/lib/types'

interface UseVacunasOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

const _vacunasCache = new Map<string, Vacuna[]>()

export function useVacunas(options: UseVacunasOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = (user?.id_clinica || '') + (options.mascotaId || '')
  const [data, setData] = useState<Vacuna[]>(() => _vacunasCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_vacunasCache.has(cacheKey))
  const hasLoadedOnce = useRef(_vacunasCache.has(cacheKey))

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = options.mascotaId
        ? await getVacunasByMascota(options.mascotaId, user.id_clinica)
        : await getVacunas(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Vacuna[])
        setError(null)
        _vacunasCache.set(cacheKey, response.data as Vacuna[])
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
