'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAnalisis, getAnalisisByMascota } from '@/lib/services'
import { Analisis } from '@/lib/types'

interface UseAnalisisOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

const _analisisCache = new Map<string, Analisis[]>()

export function useAnalisis(options: UseAnalisisOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = (user?.id_clinica || '') + (options.mascotaId || '')
  const [data, setData] = useState<Analisis[]>(() => _analisisCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_analisisCache.has(cacheKey))
  const hasLoadedOnce = useRef(_analisisCache.has(cacheKey))

  useEffect(() => {
    if (!user || options.skip) {
      hasLoadedOnce.current = false
      setData([])
      setError(null)
      setLoading(false)
      return
    }

    const cachedAnalisis = _analisisCache.get(cacheKey) ?? []
    const hasCachedAnalisis = _analisisCache.has(cacheKey)

    hasLoadedOnce.current = hasCachedAnalisis
    setData(cachedAnalisis)
    setError(null)
    setLoading(!hasCachedAnalisis)
  }, [user?.id_clinica, options.skip, cacheKey])

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      if (!hasLoadedOnce.current) {
        setError('Timeout: La carga está tomando demasiado tiempo')
        setLoading(false)
      }
    }, 8000)

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = options.mascotaId
        ? await getAnalisisByMascota(options.mascotaId, user.id_clinica)
        : await getAnalisis(user.id_clinica)

      clearTimeout(timeoutId)
      
      if (response.success && response.data) {
        setData(response.data as Analisis[])
        setError(null)
        _analisisCache.set(cacheKey, response.data as Analisis[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error || 'Error al cargar análisis')
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId)
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