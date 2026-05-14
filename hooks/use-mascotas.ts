'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getMascotas, getMascotaById, getMascotasByDueno } from '@/lib/services'
import { Mascota } from '@/lib/types'

interface UseMascotasOptions {
  skip?: boolean
  autoFetch?: boolean
  duenoId?: string
}

const _mascotasCache = new Map<string, Mascota[]>()

export function useMascotas(options: UseMascotasOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = (user?.id_clinica || '') + (options.duenoId || '')
  const [data, setData] = useState<Mascota[]>(() => _mascotasCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_mascotasCache.has(cacheKey))
  const hasLoadedOnce = useRef(_mascotasCache.has(cacheKey))

  useEffect(() => {
    if (!user || options.skip) {
      hasLoadedOnce.current = false
      setData([])
      setError(null)
      setLoading(false)
      return
    }

    const cachedMascotas = _mascotasCache.get(cacheKey) ?? []
    const hasCachedMascotas = _mascotasCache.has(cacheKey)

    hasLoadedOnce.current = hasCachedMascotas
    setData(cachedMascotas)
    setError(null)
    setLoading(!hasCachedMascotas)
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
      const response = options.duenoId
        ? await getMascotasByDueno(options.duenoId, user.id_clinica)
        : await getMascotas(user.id_clinica)

      clearTimeout(timeoutId)

      if (response.success && response.data) {
        setData(response.data as Mascota[])
        setError(null)
        _mascotasCache.set(cacheKey, response.data as Mascota[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error || 'Error al cargar mascotas')
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId)
      setError(String(err))
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id_clinica, options.skip, options.duenoId, cacheKey])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.duenoId, options.skip, options.autoFetch, refetch, refreshKey])

  return { data, error, loading, refetch }
}