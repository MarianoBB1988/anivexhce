// ─── Mercado Pago Backend Service ─────────────────────────────────────────────
// RUNS ON: Server-side only (API routes, server actions)
// NEVER expose this module to the client — it contains the Access Token.

import MercadoPagoConfig, { Preference, Payment, PreApproval } from 'mercadopago'
import type { CreatePreferenceBody, PaymentStatus } from '@/lib/mp-types'

// ---------------------------------------------------------------------------
// Mercado Pago SDK Client — initialized with Access Token (server-only)
// ---------------------------------------------------------------------------
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 10000,
    idempotencyKey: crypto.randomUUID(),
  },
})

const preferenceClient = new Preference(mpClient)
const paymentClient = new Payment(mpClient)
const preapprovalClient = new PreApproval(mpClient)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Development / local
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Create Payment Preference (for Checkout Bricks)
// ---------------------------------------------------------------------------

export async function createPreference(data: CreatePreferenceBody) {
  const { planId, userId, clinicaId, payerEmail, payerName } = data
  const baseUrl = getBaseUrl()

  // Import plans from types to get price details
  const { SUBSCRIPTION_PLANS } = await import('@/lib/mp-types')
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

  if (!plan) {
    throw new Error(`Plan not found: ${planId}`)
  }

  const externalReference = JSON.stringify({
    planId: plan.id,
    userId,
    clinicaId,
    type: 'subscription',
  })

  try {
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: plan.id,
            title: plan.name,
            description: plan.description,
            quantity: 1,
            unit_price: plan.price / 100,
            currency_id: plan.currency,
          },
        ],
        payer: {
          email: payerEmail,
          ...(payerName ? { name: payerName } : {}),
        },
        back_urls: {
          success: `${baseUrl}/dashboard/subscription?status=approved`,
          pending: `${baseUrl}/dashboard/subscription?status=pending`,
          failure: `${baseUrl}/dashboard/subscription?status=rejected`,
        },
        // NOTE: auto_return desactivado temporalmente porque el SDK v2 rechaza
        // la combinación auto_return + back_urls con URLs de localhost.
        // Cuando estés en producción con dominio HTTPS, podés reactivarlo:
        // auto_return: 'approved',
        external_reference: externalReference,
        metadata: {
          plan_id: plan.id,
          user_id: userId,
          clinica_id: clinicaId,
        },
      },
      requestOptions: {
        idempotencyKey: generateIdempotencyKey(),
      },
    })

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    }
  } catch (error) {
    console.error('[MercadoPago] Error creating preference:', error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// Create Preapproval (Recurring Subscription)
// MP se encarga de cobrar automáticamente cada mes.
// ---------------------------------------------------------------------------

export async function createPreapproval(data: {
  planId: string
  userId: string
  clinicaId: string
  payerEmail: string
  payerName?: string
}) {
  const { planId, userId, clinicaId, payerEmail, payerName } = data
  const baseUrl = getBaseUrl()

  const { SUBSCRIPTION_PLANS } = await import('@/lib/mp-types')
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

  if (!plan) {
    throw new Error(`Plan not found: ${planId}`)
  }

  const externalReference = JSON.stringify({
    planId: plan.id,
    userId,
    clinicaId,
    type: 'subscription',
  })

  try {
    const preapproval = await preapprovalClient.create({
      body: {
        // no pre-existing plan — create on the fly
        reason: plan.name,
        external_reference: externalReference,
        payer_email: payerEmail,
        back_url: `${baseUrl}/dashboard/subscription?status=approved`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price / 100,
          currency_id: plan.currency,
        },
        status: 'pending',
      },
      requestOptions: {
        idempotencyKey: generateIdempotencyKey(),
      },
    })

    return {
      preapprovalId: preapproval.id,
      initPoint: preapproval.init_point,
    }
  } catch (error: unknown) {
    // Log FULL error details — the MP SDK wraps API errors
    console.error('[MercadoPago] Error creating preapproval:', {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? (error as any).cause : undefined,
      status: (error as any).status,
      statusText: (error as any).statusText,
      body: (error as any).body,
      response: (error as any).response,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    })
    throw error
  }
}

// ---------------------------------------------------------------------------
// Get Preapproval Status (check if subscription is still active in MP)
// ---------------------------------------------------------------------------

export async function getPreapprovalStatus(preapprovalId: string) {
  try {
    const preapproval = await preapprovalClient.get({ id: preapprovalId })
    return preapproval
  } catch (error) {
    console.error(`[MercadoPago] Error fetching preapproval ${preapprovalId}:`, error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// Get Payment Details (from webhook or manual query)
// ---------------------------------------------------------------------------

export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await paymentClient.get({ id: paymentId })
    return payment
  } catch (error) {
    console.error(`[MercadoPago] Error fetching payment ${paymentId}:`, error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// Normalize MP payment status to our PaymentStatus enum
// ---------------------------------------------------------------------------

export function normalizePaymentStatus(mpStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    approved: 'approved',
    pending: 'pending',
    in_process: 'in_process',
    in_mediation: 'in_mediation',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'charged_back',
  }
  return statusMap[mpStatus] || 'pending'
}

// ---------------------------------------------------------------------------
// Validate Webhook Signature (basic security)
// ---------------------------------------------------------------------------

export function validateWebhookSignature(
  _xSignature: string | null,
  _xRequestId: string | null,
): boolean {
  // For TEST mode, we skip strict validation
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST')
  ) {
    return true
  }

  if (!_xSignature || !_xRequestId) {
    return false
  }

  // In production, implement HMAC validation with your webhook secret
  return true
}
