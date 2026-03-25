'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getDuenos, getDuenoById, searchDuenos as searchDuenosService } from '@/lib/services'
import { Dueno } from '@/lib/types'

interface UseDuenosOptions {
  skip?: boolean
  autoFetch?: boolean
}

export function useDuenos(options: UseDuenosOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<Dueno[]>([])
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
      const response = await getDuenos(user.id_clinica)
      if (response.success && response.data) {
        setData(response.data as Dueno[])
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
  }, [user?.id_clinica, options.skip])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.skip, options.autoFetch, refetch])

  const search = useCallback(
    async (query: string) => {
      if (!user) return []
      const response = await searchDuenosService(user.id_clinica, query)
      return response.success && response.data ? (response.data as Dueno[]) : []
    },
    [user?.id_clinica]
  )

  return { data, error, loading, refetch, search }
}

export function useDuenoById(id: string) {
  const { user } = useAuth()
  const [data, setData] = useState<Dueno | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !id) {
      setData(null)
      setLoading(false)
      return
    }

    const fetch = async () => {
      try {
        setLoading(true)
        const response = await getDuenoById(id, user.id_clinica)
        if (response.success) {
          setData(response.data)
          setError(null)
        } else {
          setError(response.error)
        }
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [user, id])

  return { data, error, loading }
}
