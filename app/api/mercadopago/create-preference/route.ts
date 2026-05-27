// ─── API Route: Create Preference ─────────────────────────────────────────────
// RUNS ON: Server-side
// POST /api/mercadopago/create-preference
// Creates a Mercado Pago payment preference for Checkout Bricks

import { NextRequest, NextResponse } from 'next/server'
import { createPreference } from '@/lib/services/mercadopago'
import type { CreatePreferenceBody } from '@/lib/mp-types'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body: CreatePreferenceBody = await request.json()

    if (!body.planId || !body.userId || !body.clinicaId || !body.payerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: planId, userId, clinicaId, payerEmail',
          data: null,
        },
        { status: 400 },
      )
    }

    // 2. Create preference with Mercado Pago
    const preference = await createPreference(body)

    // 3. Return preference ID to frontend
    return NextResponse.json({
      success: true,
      error: null,
      data: {
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
      },
    })
  } catch (error) {
    console.error('[API] create-preference error:', error)

    const message =
      error instanceof Error ? error.message : 'Error interno al crear la preferencia de pago'

    return NextResponse.json(
      {
        success: false,
        error: message,
        data: null,
      },
      { status: 500 },
    )
  }
}
