'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getMascotas, getMascotaById, getMascotasByDueno } from '@/lib/services'
import { Mascota } from '@/lib/types'
import { usePageVisibility } from './use-page-visibility'

interface UseMascotasOptions {
  skip?: boolean
  autoFetch?: boolean
  duenoId?: string
}

const _mascotasCache = new Map<string, Mascota[]>()

export function useMascotas(options: UseMascotasOptions = {}) {
  const { user, refreshKey } = useAuth()
  const { isVisible } = usePageVisibility()
  const cacheKey = (user?.id_clinica || '') + (options.duenoId || '')
  const [data, setData] = useState<Mascota[]>(() => _mascotasCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_mascotasCache.has(cacheKey))
  const hasLoadedOnce = useRef(_mascotasCache.has(cacheKey))
  const isFetching = useRef(false)

  const refetch = useCallback(async () => {
    // No hacer fetch si la página no está visible
    if (!isVisible) {
      console.log('Skipping fetch: page not visible')
      return
    }
    
    if (!user || options.skip || isFetching.current) {
      // Si no hay usuario o está skip, mantener los datos existentes
      if (!user || options.skip) {
        setData([])
      }
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
      const response = options.duenoId
        ? await getMascotasByDueno(options.duenoId, user.id_clinica)
        : await getMascotas(user.id_clinica)

      clearTimeout(timeoutId);
      
      if (response.success && response.data) {
        setData(response.data as Mascota[])
        setError(null)
        _mascotasCache.set(cacheKey, response.data as Mascota[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error || "Error al cargar mascotas")
        // No vaciar datos si ya teníamos datos cargados
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError(String(err))
      // No vaciar datos si ya teníamos datos cargados
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [user?.id_clinica, options.skip, options.duenoId, cacheKey, isVisible])

  useEffect(() => {
    // Limpiar caché si cambia el usuario
    if (!user) {
      _mascotasCache.clear()
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
  }, [user?.id_clinica, options.duenoId, options.skip, options.autoFetch, refetch, refreshKey, isVisible])

  // Refetch cuando la página vuelve a ser visible
  useEffect(() => {
    if (isVisible && user && !options.skip && hasLoadedOnce.current) {
      // Refetch inmediatamente cuando la página vuelve a ser visible
      console.log('Page became visible, refetching mascotas...')
      // Pequeño delay para asegurar que la página está completamente visible
      const timer = setTimeout(() => {
        refetch()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, user, options.skip, refetch])

  return { data, error, loading, refetch }
}