'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getCirugias, getCirugiasByMascota } from '@/lib/services'
import { Cirugia } from '@/lib/types'

interface UseCirugiasOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

export function useCirugias(options: UseCirugiasOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<Cirugia[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(options.autoFetch !== false)

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = options.mascotaId
        ? await getCirugiasByMascota(options.mascotaId, user.id_clinica)
        : await getCirugias(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Cirugia[])
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
  }, [user?.id_clinica, options.skip, options.mascotaId])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.mascotaId, options.skip, options.autoFetch, refetch])

  return { data, error, loading, refetch }
}
