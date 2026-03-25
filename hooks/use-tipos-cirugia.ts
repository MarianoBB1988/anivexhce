'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTiposCirugia } from '@/lib/services'
import { TipoCirugia } from '@/lib/types'

export function useTiposCirugia() {
  const [data, setData] = useState<TipoCirugia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getTiposCirugia()
      if (response.success && response.data) {
        setData(response.data)
        setError(null)
      } else {
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
