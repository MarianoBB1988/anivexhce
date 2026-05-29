// ─── Mercado Pago Client-Side SDK Helper ─────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Safe helper to interact with Mercado Pago from the frontend
// Does NOT expose the Access Token — only uses the Public Key

import type { CreatePreferenceResponse, PaymentApiResponse } from '@/lib/mp-types'

const MP_API_BASE = '/api/mercadopago'

// ---------------------------------------------------------------------------
// Create a payment preference via backend API
// ---------------------------------------------------------------------------

export async function createPaymentPreference(data: {
  planId: string
  userId: string
  clinicaId: string
  payerEmail: string
  payerName?: string
}): Promise<PaymentApiResponse<CreatePreferenceResponse>> {
  try {
    const response = await fetch(`${MP_API_BASE}/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Error al crear preferencia de pago',
        data: null,
      }
    }

    return {
      success: true,
      error: null,
      data: result.data,
    }
  } catch (error) {
    console.error('[MP Client] Error creating preference:', error)
    return {
      success: false,
      error: 'Error de conexión al crear preferencia de pago',
      data: null,
    }
  }
}

// ---------------------------------------------------------------------------
// Get subscription status
// ---------------------------------------------------------------------------

export async function getUserSubscription(userId: string) {
  try {
    const response = await fetch(`${MP_API_BASE}/subscription?userId=${encodeURIComponent(userId)}`)
    return await response.json()
  } catch (error) {
    console.error('[MP Client] Error fetching subscription:', error)
    return { success: false, error: 'Error fetching subscription', data: null }
  }
}

// ---------------------------------------------------------------------------
// Create subscription record
// ---------------------------------------------------------------------------

export async function createUserSubscription(data: {
  userId: string
  clinicaId: string
  planId: string
  payerEmail: string
}) {
  try {
    const response = await fetch(`${MP_API_BASE}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error('[MP Client] Error creating subscription:', error)
    return { success: false, error: 'Error creating subscription', data: null }
  }
}

// ---------------------------------------------------------------------------
// Cancel subscription
// ---------------------------------------------------------------------------

export async function createPreapproval(data: {
  planId: string
  userId: string
  clinicaId: string
  payerEmail: string
  payerName?: string
}): Promise<PaymentApiResponse<{ preapprovalId: string; initPoint: string }>> {
  try {
    const response = await fetch(`${MP_API_BASE}/create-preapproval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Error al crear suscripción recurrente',
        data: null,
      }
    }

    return {
      success: true,
      error: null,
      data: result.data,
    }
  } catch (error) {
    console.error('[MP Client] Error creating preapproval:', error)
    return {
      success: false,
      error: 'Error de conexión al crear suscripción',
      data: null,
    }
  }
}

export async function cancelUserSubscription(subscriptionId: string) {
  try {
    const response = await fetch(`${MP_API_BASE}/subscription`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    })
    return await response.json()
  } catch (error) {
    console.error('[MP Client] Error cancelling subscription:', error)
    return { success: false, error: 'Error cancelling subscription', data: null }
  }
}
