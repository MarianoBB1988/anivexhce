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

  useEffect(() => {
    if (!user || options.skip) {
      hasLoadedOnce.current = false
      setData([])
      setError(null)
      setLoading(false)
      return
    }

    const cachedTurnos = _turnosCache.get(cacheKey) ?? []
    const hasCachedTurnos = _turnosCache.has(cacheKey)

    hasLoadedOnce.current = hasCachedTurnos
    setData(cachedTurnos)
    setError(null)
    setLoading(!hasCachedTurnos)
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
      const response = await getTurnosConDatos(user.id_clinica)

      clearTimeout(timeoutId)

      if (response.success && response.data) {
        setData(response.data as Turno[])
        setError(null)
        _turnosCache.set(cacheKey, response.data as Turno[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error || 'Error al cargar turnos')
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId)
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