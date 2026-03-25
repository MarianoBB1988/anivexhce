'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTiposVacuna } from '@/lib/services'
import { TipoVacuna } from '@/lib/types'

export function useTiposVacuna() {
  const [data, setData] = useState<TipoVacuna[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getTiposVacuna()
      console.log('[useTiposVacuna] response:', response)
      if (response.success && response.data) {
        setData(response.data)
        setError(null)
      } else {
        console.error('[useTiposVacuna] error:', response.error)
        setError(response.error)
        setData([])
      }
    } catch (err) {
      setError(String(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
