// ─── API Route: Mercado Pago Webhook ──────────────────────────────────────────
// RUNS ON: Server-side
// POST /api/mercadopago/webhook
// Receives payment notifications from Mercado Pago

import { NextRequest, NextResponse } from 'next/server'
import {
  getPaymentDetails,
  normalizePaymentStatus,
  validateWebhookSignature,
} from '@/lib/services/mercadopago'
import {
  getPaymentByMpId,
  createPayment,
  getSubscriptionByUserId,
  updateSubscription,
} from '@/lib/services/subscriptions'
import type { MercadoPagoWebhookPayload } from '@/lib/mp-types'

/**
 * Handles incoming webhook notifications from Mercado Pago.
 * Supports both "payment" type notifications and "topic=payment" query param format.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Security: Validate webhook signature ───────────────────────────────
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    if (!validateWebhookSignature(xSignature, xRequestId)) {
      console.warn('[Webhook] Invalid signature')
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
    }

    // ── Parse payload ─────────────────────────────────────────────────────
    let paymentId: string | null = null

    // Handle both JSON body and URL query parameter formats
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const payload: MercadoPagoWebhookPayload = await request.json()
      if (payload.type === 'payment' && payload.data?.id) {
        paymentId = String(payload.data.id)
      }
    }

    // También verificar query params (MP sometimes sends topic/data via query)
    if (!paymentId) {
      const url = new URL(request.url)
      const topic = url.searchParams.get('topic')
      const id = url.searchParams.get('id')
      if (topic === 'payment' && id) {
        paymentId = id
      }
    }

    if (!paymentId) {
      // This is not a payment notification — MP may send other types (plan, subscription)
      console.log('[Webhook] Ignoring non-payment notification')
      return NextResponse.json({ success: true, error: null, data: null })
    }

    console.log(`[Webhook] Processing payment: ${paymentId}`)

    // ── Check for duplicate ───────────────────────────────────────────────
    const existingPayment = await getPaymentByMpId(paymentId)
    if (existingPayment) {
      // Already processed — idempotency
      console.log(`[Webhook] Payment ${paymentId} already processed, skipping`)
      return NextResponse.json({ success: true, error: null, data: existingPayment })
    }

    // ── Fetch payment details from Mercado Pago ───────────────────────────
    const payment = await getPaymentDetails(paymentId)

    if (!payment) {
      console.warn(`[Webhook] Payment ${paymentId} not found in Mercado Pago`)
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 },
      )
    }

    // ── Extract metadata from external_reference ──────────────────────────
    const paymentJson = payment as unknown as Record<string, unknown>
    const extRef = paymentJson.external_reference as string | undefined
    const paymentMetadata = paymentJson.metadata as Record<string, unknown> | undefined

    let metadata: {
      planId?: string
      userId?: string
      clinicaId?: string
      type?: string
    } = {}

    if (extRef) {
      try {
        metadata = JSON.parse(extRef)
      } catch {
        console.warn('[Webhook] Invalid external_reference JSON')
      }
    }

    const userId = metadata.userId || (paymentMetadata?.user_id as string) || ''
    const clinicaId = metadata.clinicaId || (paymentMetadata?.clinica_id as string) || ''
    const planId = metadata.planId || (paymentMetadata?.plan_id as string) || 'sana-vet-monthly'

    if (!userId || !clinicaId) {
      console.error('[Webhook] Missing user or clinica in payment metadata')
      return NextResponse.json(
        { success: false, error: 'Missing user/clinica metadata' },
        { status: 400 },
      )
    }

    // ── Find or create subscription ───────────────────────────────────────
    const subscription = await getSubscriptionByUserId(userId)

    if (!subscription) {
      console.log(`[Webhook] No subscription found for user ${userId}, will be created on first payment`)
    }

    // ── Create payment record ─────────────────────────────────────────────
    const status = normalizePaymentStatus(payment.status as string)
    const transactionAmount = paymentJson.transaction_amount
    const amount = transactionAmount
      ? Math.round(Number(transactionAmount) * 100)
      : 0

    const payer = paymentJson.payer as Record<string, unknown> | undefined
    const paymentMethod = paymentJson.payment_method as Record<string, unknown> | undefined

    const paymentRecord = await createPayment({
      subscriptionId: subscription?.id || 'pending',
      userId,
      clinicaId,
      mpPaymentId: paymentId,
      mpPreferenceId: extRef || undefined,
      status,
      amount,
      currency: (paymentJson.currency_id as string) || 'ARS',
      payerEmail: (payer?.email as string) || undefined,
      paymentMethod: (paymentMethod?.id as string) || undefined,
      paymentType: (paymentJson.payment_type_id as string) || undefined,
      transactionAmount: transactionAmount ? Number(transactionAmount) : undefined,
      description: (paymentJson.description as string) || undefined,
      metadata: metadata as Record<string, unknown>,
      rawResponse: paymentJson as Record<string, unknown>,
    })

    // ── Update subscription status based on payment ───────────────────────
    if (subscription) {
      if (status === 'approved') {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        await updateSubscription(subscription.id, {
          status: 'active',
          mp_subscription_id: paymentId,
          mp_payer_email: (payer?.email as string) || subscription.mp_payer_email,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
      } else if (status === 'rejected' || status === 'cancelled') {
        if (subscription.status !== 'active') {
          await updateSubscription(subscription.id, { status: 'inactive' })
        }
      }
    }

    console.log(
      `[Webhook] Payment ${paymentId} processed successfully. Status: ${status}`,
    )

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        paymentId: paymentRecord.id,
        status,
      },
    })
  } catch (error) {
    console.error('[Webhook] Error processing notification:', error)

    const message =
      error instanceof Error ? error.message : 'Error interno al procesar notificación'

    return NextResponse.json(
      { success: false, error: message, data: null },
      { status: 500 },
    )
  }
}

// Handle GET requests (MP sometimes uses GET for verification)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge')

  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook' })
}
