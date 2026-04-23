'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para detectar cuando la página está visible o oculta
 * Útil para pausar/continuar operaciones cuando el usuario cambia de pestaña
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>('visible')

  const handleVisibilityChange = useCallback(() => {
    const newVisibility = document.visibilityState
    setVisibilityState(newVisibility)
    setIsVisible(newVisibility === 'visible')
    
    // Log para debugging
    console.log('Page visibility changed:', newVisibility)
  }, [])

  useEffect(() => {
    // Configurar listener de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Configurar listener de focus/blur de la ventana
    const handleFocus = () => {
      setIsVisible(true)
      setVisibilityState('visible')
    }
    
    const handleBlur = () => {
      setIsVisible(false)
      setVisibilityState('hidden')
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    // Inicializar estado
    handleVisibilityChange()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleVisibilityChange])

  return { isVisible, visibilityState }
}

/**
 * Hook para pausar operaciones cuando la página no está visible
 * @param enabled Si está habilitado el pausing
 * @param onPause Callback cuando se pausa
 * @param onResume Callback cuando se reanuda
 */
export function usePauseOnHidden(
  enabled: boolean = true,
  onPause?: () => void,
  onResume?: () => void
) {
  const { isVisible } = usePageVisibility()
  const [wasPaused, setWasPaused] = useState(false)

  useEffect(() => {
    if (!enabled) return

    if (!isVisible && !wasPaused) {
      // Pausar operaciones
      console.log('Pausing operations due to page hidden')
      onPause?.()
      setWasPaused(true)
    } else if (isVisible && wasPaused) {
      // Reanudar operaciones
      console.log('Resuming operations due to page visible')
      onResume?.()
      setWasPaused(false)
    }
  }, [isVisible, enabled, wasPaused, onPause, onResume])

  return { isVisible, wasPaused }
}