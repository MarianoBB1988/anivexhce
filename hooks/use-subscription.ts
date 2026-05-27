'use client'

// ─── useSubscription Hook ────────────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// React hook for subscription state management

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUserSubscription, cancelUserSubscription } from '@/lib/services/mp-client'
import type { SubscriptionDB } from '@/lib/mp-types'

interface UseSubscriptionReturn {
  subscription: SubscriptionDB | null
  loading: boolean
  error: string | null
  isActive: boolean
  isTrial: boolean
  isCancelled: boolean
  refetch: () => Promise<void>
  cancel: () => Promise<boolean>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionDB | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getUserSubscription(user.id)
      if (result.success) {
        setSubscription(result.data)
      } else {
        setError(result.error || 'Error al obtener suscripción')
        setSubscription(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener suscripción')
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const cancel = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false

    try {
      const result = await cancelUserSubscription(subscription.id)
      if (result.success) {
        await fetchSubscription()
        return true
      }
      setError(result.error || 'Error al cancelar suscripción')
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar suscripción')
      return false
    }
  }, [subscription, fetchSubscription])

  return {
    subscription,
    loading,
    error,
    isActive: subscription?.status === 'active',
    isTrial: subscription?.status === 'trial',
    isCancelled: subscription?.status === 'cancelled',
    refetch: fetchSubscription,
    cancel,
  }
}
