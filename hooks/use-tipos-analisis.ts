'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTiposAnalisis } from '@/lib/services'
import { TipoAnalisis } from '@/lib/types'

export function useTiposAnalisis() {
  const [data, setData] = useState<TipoAnalisis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const refetch = useCallback(async () => {
    try {
      if (!hasLoaded.current) setLoading(true)
      const response = await getTiposAnalisis()
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
