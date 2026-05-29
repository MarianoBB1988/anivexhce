// ─── API Route: Create Preapproval (Recurring Subscription) ────────────────────
// RUNS ON: Server-side
// POST /api/mercadopago/create-preapproval
// Creates a Mercado Pago Preapproval (recurring subscription).
// MP cobrará automáticamente cada mes, no necesita renovación manual.

import { NextRequest, NextResponse } from 'next/server'
import { createPreapproval } from '@/lib/services/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    const preapproval = await createPreapproval(body)

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        preapprovalId: preapproval.preapprovalId,
        initPoint: preapproval.initPoint,
      },
    })
  } catch (error) {
    console.error('[API] create-preapproval error:', error)

    const message =
      error instanceof Error ? error.message : 'Error interno al crear suscripción recurrente'

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
