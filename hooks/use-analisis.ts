'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAnalisis, getAnalisisByMascota } from '@/lib/services'
import { Analisis } from '@/lib/types'
import { usePageVisibility } from './use-page-visibility'

interface UseAnalisisOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

const _analisisCache = new Map<string, Analisis[]>()

export function useAnalisis(options: UseAnalisisOptions = {}) {
  const { user, refreshKey } = useAuth()
  const { isVisible } = usePageVisibility()
  const cacheKey = (user?.id_clinica || '') + (options.mascotaId || '')
  const [data, setData] = useState<Analisis[]>(() => _analisisCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_analisisCache.has(cacheKey))
  const hasLoadedOnce = useRef(_analisisCache.has(cacheKey))
  const isFetching = useRef(false)

  const refetch = useCallback(async () => {
    // No hacer fetch si la página no está visible
    if (!isVisible) {
      console.log('Skipping fetch: page not visible')
      return
    }
    
    if (!user || options.skip || isFetching.current) {
      setData([])
      setLoading(false)
      return
    }

    isFetching.current = true
    const timeoutId = setTimeout(() => {
      if (!hasLoadedOnce.current) {
        setError("Timeout: La carga está tomando demasiado tiempo");
        setLoading(false);
        isFetching.current = false
      }
    }, 8000); // 8 segundos

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = options.mascotaId
        ? await getAnalisisByMascota(options.mascotaId, user.id_clinica)
        : await getAnalisis(user.id_clinica)

      clearTimeout(timeoutId);
      
      if (response.success && response.data) {
        setData(response.data as Analisis[])
        setError(null)
        _analisisCache.set(cacheKey, response.data as Analisis[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error || "Error al cargar análisis")
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError(String(err))
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [user?.id_clinica, options.skip, options.mascotaId, cacheKey, isVisible])

  useEffect(() => {
    // Limpiar caché si cambia el usuario
    if (!user) {
      _analisisCache.clear()
      setData([])
      setError(null)
      setLoading(false)
      return
    }
  }, [user?.id_clinica])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip && isVisible) {
      refetch()
    }
  }, [user?.id_clinica, options.mascotaId, options.skip, options.autoFetch, refetch, refreshKey, isVisible])

  // Refetch cuando la página vuelve a ser visible
  useEffect(() => {
    if (isVisible && user && !options.skip && hasLoadedOnce.current) {
      // Refetch solo si ya se cargó antes y la página vuelve a ser visible
      const refetchTimer = setTimeout(() => {
        refetch()
      }, 1000) // Esperar 1 segundo después de volver a ser visible
      
      return () => clearTimeout(refetchTimer)
    }
  }, [isVisible, user, options.skip, refetch])

  return { data, error, loading, refetch }
}