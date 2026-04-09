'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTiposCirugia } from '@/lib/services'
import { TipoCirugia } from '@/lib/types'

export function useTiposCirugia() {
  const [data, setData] = useState<TipoCirugia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const refetch = useCallback(async () => {
    try {
      if (!hasLoaded.current) setLoading(true)
      const response = await getTiposCirugia()
      if (response.success && response.data) {
        setData(response.data)
        setError(null)
        hasLoaded.current = true
      } else {
        setError(response.error)
        if (!hasLoaded.current) setData([])
      }
    } catch (err) {
      setError(String(err))
      if (!hasLoaded.current) setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
