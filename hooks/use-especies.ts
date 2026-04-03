'use client'

import { useState, useEffect, useCallback } from 'react'
import { getEspecies } from '@/lib/services'
import { Especie } from '@/lib/types'

export function useEspecies() {
  const [data, setData] = useState<Especie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getEspecies()
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
