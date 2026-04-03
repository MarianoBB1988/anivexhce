'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTiposAnalisis } from '@/lib/services'
import { TipoAnalisis } from '@/lib/types'

export function useTiposAnalisis() {
  const [data, setData] = useState<TipoAnalisis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getTiposAnalisis()
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
