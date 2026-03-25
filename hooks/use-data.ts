'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface UseDataOptions {
  skip?: boolean
}

export function useData<T>(
  fetchFn: (clinicaId: string) => Promise<{ data: T[] | T | null; error: string | null; success: boolean }>,
  dependencies: any[] = [],
  options: UseDataOptions = {}
) {
  const [data, setData] = useState<T | T[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchData = async () => {
    if (!user || options.skip) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const response = await fetchFn(user.id_clinica)
    if (response.success) {
      setData(response.data)
      setError(null)
    } else {
      setData(null)
      setError(response.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user?.id, ...dependencies])

  return { data, error, loading, refetch: fetchData }
}
