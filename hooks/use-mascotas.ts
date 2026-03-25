'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getMascotas, getMascotaById, getMascotasByDueno } from '@/lib/services'
import { Mascota } from '@/lib/types'

interface UseMascotasOptions {
  skip?: boolean
  autoFetch?: boolean
  duenoId?: string
}

export function useMascotas(options: UseMascotasOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<Mascota[]>([])
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
      const response = options.duenoId
        ? await getMascotasByDueno(options.duenoId, user.id_clinica)
        : await getMascotas(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Mascota[])
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
  }, [user?.id_clinica, options.skip, options.duenoId])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.duenoId, options.skip, options.autoFetch, refetch])

  return { data, error, loading, refetch }
}

export function useMascotaById(id: string) {
  const { user } = useAuth()
  const [data, setData] = useState<Mascota | null>(null)
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
        const response = await getMascotaById(id, user.id_clinica)
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
