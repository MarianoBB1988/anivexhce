'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getCirugias, getCirugiasByMascota } from '@/lib/services'
import { Cirugia } from '@/lib/types'

interface UseCirugiasOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

const _cirugiasCache = new Map<string, Cirugia[]>()

export function useCirugias(options: UseCirugiasOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = (user?.id_clinica || '') + (options.mascotaId || '')
  const [data, setData] = useState<Cirugia[]>(() => _cirugiasCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_cirugiasCache.has(cacheKey))
  const hasLoadedOnce = useRef(_cirugiasCache.has(cacheKey))

  useEffect(() => {
    if (!user || options.skip) {
      hasLoadedOnce.current = false
      setData([])
      setError(null)
      setLoading(false)
      return
    }

    const cachedCirugias = _cirugiasCache.get(cacheKey) ?? []
    const hasCachedCirugias = _cirugiasCache.has(cacheKey)

    hasLoadedOnce.current = hasCachedCirugias
    setData(cachedCirugias)
    setError(null)
    setLoading(!hasCachedCirugias)
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
        ? await getCirugiasByMascota(options.mascotaId, user.id_clinica)
        : await getCirugias(user.id_clinica)

      clearTimeout(timeoutId)

      if (response.success && response.data) {
        setData(response.data as Cirugia[])
        setError(null)
        _cirugiasCache.set(cacheKey, response.data as Cirugia[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error || 'Error al cargar cirugías')
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