'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAnalisis } from '@/lib/services'
import { Analisis } from '@/lib/types'

const _analisisCache = new Map<string, Analisis[]>()

export function useAnalisis() {
  const { user, refreshKey } = useAuth()
  const cacheKey = user?.id_clinica || ''
  const [data, setData] = useState<Analisis[]>(() => _analisisCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_analisisCache.has(cacheKey))
  const hasLoadedOnce = useRef(_analisisCache.has(cacheKey))

  const refetch = useCallback(async () => {
    if (!user) { setData([]); setLoading(false); return }
    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = await getAnalisis(user.id_clinica)
      if (response.success && response.data) {
        setData(response.data)
        setError(null)
        _analisisCache.set(cacheKey, response.data)
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
  }, [user?.id_clinica, cacheKey])

  useEffect(() => {
    if (user) refetch()
  }, [user?.id_clinica, refetch, refreshKey])

  return { data, error, loading, refetch }
}
