'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRazas } from '@/lib/services'
import { Raza } from '@/lib/types'

export function useRazas() {
  const [data, setData] = useState<Raza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getRazas()
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
