'use client'

import { useState, useEffect, useCallback } from 'react'

function getCurrentVisibilityState(): DocumentVisibilityState {
  if (typeof document === 'undefined') return 'visible'
  return document.visibilityState
}

/**
 * Hook para detectar cuando la página está visible o oculta
 * Útil para pausar/continuar operaciones cuando el usuario cambia de pestaña
 */
export function usePageVisibility() {
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(getCurrentVisibilityState)
  const [isVisible, setIsVisible] = useState(() => getCurrentVisibilityState() !== 'hidden')

  const handleVisibilityChange = useCallback(() => {
    const newVisibility = getCurrentVisibilityState()
    setVisibilityState(newVisibility)
    setIsVisible(newVisibility !== 'hidden')
  }, [])

  useEffect(() => {
    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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