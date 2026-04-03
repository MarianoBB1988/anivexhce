'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUsuarios } from '@/lib/services'
import { Usuario } from '@/lib/types'

interface UseUserListOptions {
  skip?: boolean
  autoFetch?: boolean
}

const _usuariosCache = new Map<string, Usuario[]>()

export function useUserList(options: UseUserListOptions = {}) {
  const { user, refreshKey } = useAuth()
  const cacheKey = user?.id_clinica || ''
  const [data, setData] = useState<Usuario[]>(() => _usuariosCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_usuariosCache.has(cacheKey))
  const hasLoadedOnce = useRef(_usuariosCache.has(cacheKey))

  const refetch = useCallback(async () => {
    if (!user || options.skip) {
      setData([])
      setLoading(false)
      return
    }

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = await getUsuarios(user.id_clinica)

      if (response.success && response.data) {
        setData(response.data as Usuario[])
        setError(null)
        _usuariosCache.set(cacheKey, response.data as Usuario[])
        hasLoadedOnce.current = true
      } else {
        setError(response.error)
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      setError(String(err))
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id_clinica, options.skip, cacheKey])

  useEffect(() => {
    if (options.autoFetch !== false && user && !options.skip) {
      refetch()
    }
  }, [user?.id_clinica, options.skip, options.autoFetch, refetch, refreshKey])

  return { data, error, loading, refetch }
}
