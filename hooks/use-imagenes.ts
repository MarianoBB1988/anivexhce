'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getImagenes } from '@/lib/services'
import { ImagenDiagnostica } from '@/lib/types'

const _imagenesCache = new Map<string, ImagenDiagnostica[]>()

export function useImagenes() {
  const { user, refreshKey } = useAuth()
  const cacheKey = user?.id_clinica || ''
  const [data, setData] = useState<ImagenDiagnostica[]>(() => _imagenesCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_imagenesCache.has(cacheKey))
  const hasLoadedOnce = useRef(_imagenesCache.has(cacheKey))

  useEffect(() => {
    if (!user) {
      _imagenesCache.clear()
      hasLoadedOnce.current = false
      setData([])
      setError(null)
      setLoading(false)
      return
    }

    const cachedImagenes = _imagenesCache.get(cacheKey) ?? []
    const hasCachedImagenes = _imagenesCache.has(cacheKey)

    hasLoadedOnce.current = hasCachedImagenes
    setData(cachedImagenes)
    setError(null)
    setLoading(!hasCachedImagenes)
  }, [user?.id_clinica, cacheKey])

  const refetch = useCallback(async () => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }
  
    const timeoutId = setTimeout(() => {
      if (!hasLoadedOnce.current) {
        setError('Timeout: La carga está tomando demasiado tiempo')
        setLoading(false)
      }
    }, 8000)

    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = await getImagenes(user.id_clinica)
      clearTimeout(timeoutId)

      if (response.success && response.data) {
        setData(response.data)
        setError(null)
        _imagenesCache.set(cacheKey, response.data)
        hasLoadedOnce.current = true
      } else {
        setError(response.error || 'Error al cargar imágenes')
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId)
      setError(String(err))
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id_clinica, cacheKey])

  useEffect(() => {
    if (user) {
      refetch()
    }
  }, [user?.id_clinica, refetch, refreshKey])

  return { data, error, loading, refetch }
}