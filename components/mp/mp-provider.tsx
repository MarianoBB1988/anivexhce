'use client'

// ─── Mercado Pago SDK Provider ──────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Wraps the app with Mercado Pago's React SDK
// This provider initializes the Brick Builder with the Public Key

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { initMercadoPago } from '@mercadopago/sdk-react'

interface MercadoPagoContextType {
  initialized: boolean
  error: string | null
  publicKey: string
}

const MercadoPagoContext = createContext<MercadoPagoContextType>({
  initialized: false,
  error: null,
  publicKey: '',
})

export function useMercadoPago() {
  return useContext(MercadoPagoContext)
}

export function MercadoPagoProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''

  useEffect(() => {
    if (!publicKey) {
      setError('Falta NEXT_PUBLIC_MP_PUBLIC_KEY en las variables de entorno')
      return
    }

    try {
      initMercadoPago(publicKey, {
        locale: 'es-AR',
      })
      setInitialized(true)
      console.log('[MercadoPago] SDK initialized successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al inicializar Mercado Pago SDK'
      console.error('[MercadoPago] SDK initialization error:', err)
      setError(message)
    }
  }, [publicKey])

  return (
    <MercadoPagoContext.Provider value={{ initialized, error, publicKey }}>
      {children}
    </MercadoPagoContext.Provider>
  )
}
