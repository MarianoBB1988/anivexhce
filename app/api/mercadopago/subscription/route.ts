// ─── API Route: Subscription Status ──────────────────────────────────────────
// RUNS ON: Server-side
// GET /api/mercadopago/subscription?userId=xxx
// POST /api/mercadopago/subscription (create new subscription)
// DELETE /api/mercadopago/subscription (cancel subscription)

import { NextRequest, NextResponse } from 'next/server'
import {
  getSubscriptionByUserId,
  createSubscription,
  cancelSubscription,
} from '@/lib/services/subscriptions'
import { SUBSCRIPTION_PLANS } from '@/lib/mp-types'

// ── GET: Get current subscription for a user ──────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required', data: null },
        { status: 400 },
      )
    }

    const subscription = await getSubscriptionByUserId(userId)

    if (!subscription) {
      return NextResponse.json({
        success: true,
        error: null,
        data: null,
      })
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: subscription,
    })
  } catch (error) {
    console.error('[API] subscription GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error fetching subscription',
        data: null,
      },
      { status: 500 },
    )
  }
}

// ── POST: Create a new subscription (pre-checkout) ────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, clinicaId, planId, payerEmail } = body

    if (!userId || !clinicaId || !planId) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos: userId, clinicaId, planId', data: null },
        { status: 400 },
      )
    }

    // Check if user already has an active subscription
    const existing = await getSubscriptionByUserId(userId)
    if (existing && (existing.status === 'active' || existing.status === 'trial')) {
      return NextResponse.json({
        success: true,
        error: null,
        data: existing,
      })
    }

    // Determine if plan has trial period
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
    const trialEnd = plan?.trial_days
      ? new Date(Date.now() + plan.trial_days * 86400000).toISOString()
      : undefined

    const subscription = await createSubscription({
      userId,
      clinicaId,
      planId,
      status: trialEnd ? 'trial' : 'inactive',
      mpPayerEmail: payerEmail,
      trialEnd,
    })

    return NextResponse.json({
      success: true,
      error: null,
      data: subscription,
    })
  } catch (error) {
    console.error('[API] subscription POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error creating subscription',
        data: null,
      },
      { status: 500 },
    )
  }
}

// ── DELETE: Cancel subscription ───────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId is required', data: null },
        { status: 400 },
      )
    }

    const cancelled = await cancelSubscription(subscriptionId)

    return NextResponse.json({
      success: true,
      error: null,
      data: cancelled,
    })
  } catch (error) {
    console.error('[API] subscription DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error cancelling subscription',
        data: null,
      },
      { status: 500 },
    )
  }
}
