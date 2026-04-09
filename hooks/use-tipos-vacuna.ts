'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTiposVacuna } from '@/lib/services'
import { TipoVacuna } from '@/lib/types'

export function useTiposVacuna() {
  const [data, setData] = useState<TipoVacuna[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const refetch = useCallback(async () => {
    try {
      if (!hasLoaded.current) setLoading(true)
      const response = await getTiposVacuna()
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
