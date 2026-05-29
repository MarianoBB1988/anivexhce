// ─── API Route: Check Subscription Status with MP ────────────────────────────
// RUNS ON: Server-side
// GET /api/mercadopago/check-subscription?userId=xxx
// Consulta el estado real de la suscripción recurrente en Mercado Pago.
// MP nos dice si está autorizada, cancelada, etc.

import { NextRequest, NextResponse } from 'next/server'
import { getPreapprovalStatus } from '@/lib/services/mercadopago'
import { getSubscriptionByUserId, updateSubscription } from '@/lib/services/subscriptions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId es requerido', data: null },
        { status: 400 },
      )
    }

    // Get our subscription from DB
    const subscription = await getSubscriptionByUserId(userId)

    if (!subscription) {
      return NextResponse.json({
        success: true,
        error: null,
        data: { status: 'none', message: 'No hay suscripción registrada' },
      })
    }

    // If we have an MP subscription ID, check the real status with MP
    if (subscription.mp_subscription_id) {
      try {
        const mpSubscription = await getPreapprovalStatus(subscription.mp_subscription_id)
        const mpStatus = mpSubscription.status as string

        console.log(`[CheckSubscription] MP status for ${subscription.mp_subscription_id}: ${mpStatus}`)

        // Sync status with MP if different
        if (mpStatus === 'authorized' && subscription.status !== 'active') {
          await updateSubscription(subscription.id, { status: 'active' })
          subscription.status = 'active'
        } else if (mpStatus === 'cancelled' && subscription.status !== 'cancelled') {
          await updateSubscription(subscription.id, {
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          subscription.status = 'cancelled'
        } else if (mpStatus === 'pending' && subscription.status === 'inactive') {
          // First payment hasn't been made yet - subscription is pending authorization
        }

        return NextResponse.json({
          success: true,
          error: null,
          data: {
            ...subscription,
            mp_status: mpStatus,
            synced: true,
          },
        })
      } catch (mpErr: unknown) {
        // MP API might fail if subscription doesn't exist there anymore
        const mpErrorMessage = mpErr instanceof Error ? mpErr.message : String(mpErr)
        console.error(`[CheckSubscription] Error checking MP status: ${mpErrorMessage}`)
      }
    }

    // Return DB status as fallback
    return NextResponse.json({
      success: true,
      error: null,
      data: {
        ...subscription,
        mp_status: 'unknown',
        synced: false,
      },
    })
  } catch (error) {
    console.error('[CheckSubscription] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: message, data: null },
      { status: 500 },
    )
  }
}
