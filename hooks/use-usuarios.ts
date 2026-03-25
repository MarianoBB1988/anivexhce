'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUsuarios } from '@/lib/services'
import { Usuario } from '@/lib/types'

interface UseUserListOptions {
  skip?: boolean
  autoFetch?: boolean
}

export function useUserList(options: UseUserListOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<Usuario[]>([])
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
      const response = await getUsuarios(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Usuario[])
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

  return { data, error, loading, refetch }
}
