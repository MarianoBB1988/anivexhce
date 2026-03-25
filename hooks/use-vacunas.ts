'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getVacunas, getVacunasByMascota } from '@/lib/services'
import { Vacuna } from '@/lib/types'

interface UseVacunasOptions {
  skip?: boolean
  autoFetch?: boolean
  mascotaId?: string
}

export function useVacunas(options: UseVacunasOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<Vacuna[]>([])
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
        ? await getVacunasByMascota(options.mascotaId, user.id_clinica)
        : await getVacunas(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Vacuna[])
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
