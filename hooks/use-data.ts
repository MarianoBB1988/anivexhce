'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'

interface UseDataOptions {
  skip?: boolean
  cacheKey?: string
  cacheDuration?: number // en milisegundos
}

const globalCache = new Map<string, { data: any, timestamp: number }>()
const DEFAULT_CACHE_DURATION = 2 * 60 * 1000 // 2 minutos por defecto

export function useData<T>(
  fetchFn: (clinicaId: string) => Promise<{ data: T[] | T | null; error: string | null; success: boolean }>,
  dependencies: any[] = [],
  options: UseDataOptions = {}
) {
  const [data, setData] = useState<T | T[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheKeyRef = useRef<string>('')

  const generateCacheKey = useCallback(() => {
    if (options.cacheKey) return options.cacheKey
    const depsString = dependencies.map(dep => {
      if (typeof dep === 'object') return JSON.stringify(dep)
      return String(dep)
    }).join('|')
    return `useData-${fetchFn.name}-${user?.id_clinica || 'no-user'}-${depsString}`
  }, [options.cacheKey, fetchFn.name, user?.id_clinica, dependencies])

  const fetchData = useCallback(async () => {
    if (!user || options.skip) {
      setData(null)
      setLoading(false)
      return
    }

    // Verificar caché primero
    cacheKeyRef.current = generateCacheKey()
    const cached = globalCache.get(cacheKeyRef.current)
    const cacheDuration = options.cacheDuration || DEFAULT_CACHE_DURATION
    
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setData(cached.data)
      setLoading(false)
      return
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    try {
      const response = await fetchFn(user.id_clinica)
      if (response.success) {
        setData(response.data)
        setError(null)
        // Guardar en caché
        globalCache.set(cacheKeyRef.current, {
          data: response.data,
          timestamp: Date.now()
        })
      } else {
        setData(null)
        setError(response.error)
      }
    } catch (err: any) {
      // Ignorar errores de aborto
      if (err.name === 'AbortError') return
      setData(null)
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [user?.id_clinica, fetchFn, options.skip, options.cacheDuration, generateCacheKey])

  useEffect(() => {
    fetchData()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [user?.id, ...dependencies])

  const refetch = useCallback(async () => {
    // Invalidar caché antes de refetch
    if (cacheKeyRef.current) {
      globalCache.delete(cacheKeyRef.current)
    }
    await fetchData()
  }, [fetchData])

  // Memoizar el resultado para evitar re-renders innecesarios
  const result = useMemo(() => ({ 
    data, 
    error, 
    loading, 
    refetch 
  }), [data, error, loading, refetch])

  return result
}