'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getImagenes } from '@/lib/services'
import { ImagenDiagnostica } from '@/lib/types'
import { usePageVisibility } from './use-page-visibility'

const _imagenesCache = new Map<string, ImagenDiagnostica[]>()

export function useImagenes() {
  const { user, refreshKey } = useAuth()
  const { isVisible } = usePageVisibility()
  const cacheKey = user?.id_clinica || ''
  const [data, setData] = useState<ImagenDiagnostica[]>(() => _imagenesCache.get(cacheKey) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !_imagenesCache.has(cacheKey))
  const hasLoadedOnce = useRef(_imagenesCache.has(cacheKey))
  const isFetching = useRef(false)

  const refetch = useCallback(async () => {
    // No hacer fetch si la página no está visible
    if (!isVisible) {
      console.log('Skipping fetch: page not visible')
      return
    }
    
    if (!user || isFetching.current) { 
      setData([]); 
      setLoading(false); 
      return 
    }
    
    isFetching.current = true
    const timeoutId = setTimeout(() => {
      if (!hasLoadedOnce.current) {
        setError("Timeout: La carga está tomando demasiado tiempo");
        setLoading(false);
        isFetching.current = false
      }
    }, 8000); // 8 segundos
    
    try {
      if (!hasLoadedOnce.current) setLoading(true)
      const response = await getImagenes(user.id_clinica)
      clearTimeout(timeoutId);
      
      if (response.success && response.data) {
        setData(response.data)
        setError(null)
        _imagenesCache.set(cacheKey, response.data)
        hasLoadedOnce.current = true
      } else {
        setError(response.error || "Error al cargar imágenes")
        if (!hasLoadedOnce.current) setData([])
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError(String(err))
      if (!hasLoadedOnce.current) setData([])
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [user?.id_clinica, cacheKey, isVisible])

  useEffect(() => {
    // Limpiar caché si cambia el usuario
    if (!user) {
      _imagenesCache.clear()
      setData([])
      setError(null)
      setLoading(false)
      return
    }
  }, [user?.id_clinica])

  useEffect(() => {
    if (user && isVisible) refetch()
  }, [user?.id_clinica, refetch, refreshKey, isVisible])

  // Refetch cuando la página vuelve a ser visible
  useEffect(() => {
    if (isVisible && user && hasLoadedOnce.current) {
      // Refetch inmediatamente cuando la página vuelve a ser visible
      console.log('Page became visible, refetching imágenes...')
      refetch()
    }
  }, [isVisible, user, refetch])

  return { data, error, loading, refetch }
}