'use client'

// ─── Checkout Bricks Component ──────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Usa el Payment Brick de Mercado Pago para cobrar el primer mes.
// Cuando MP confirma el pago via webhook, se crea la suscripción en la DB.
// Para cobros recurrentes automáticos, se necesita activar Suscripciones en MP.

import { useState, useCallback, useRef, useEffect } from 'react'
import { Payment } from '@mercadopago/sdk-react'
import { useMercadoPago } from './mp-provider'
import { createPaymentPreference } from '@/lib/services/mp-client'
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/mp-types'
import { Loader2, CreditCard, ShieldCheck, ExternalLink, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CheckoutBrickProps {
  planId: string
  userId: string
  clinicaId: string
  userEmail: string
  userName?: string
  onPaymentApproved?: () => void
  onPaymentError?: (error: string) => void
}

type CheckoutStep = 'idle' | 'creating-preference' | 'brick-ready' | 'error'

export function CheckoutBrick({
  planId,
  userId,
  clinicaId,
  userEmail,
  userName,
  onPaymentApproved,
  onPaymentError,
}: CheckoutBrickProps) {
  const { initialized, error: sdkError } = useMercadoPago()
  const [step, setStep] = useState<CheckoutStep>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [mpEmail, setMpEmail] = useState(userEmail)
  const brickReadyRef = useRef(false)

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

  // ── Create payment preference & show Payment Brick ──────────────────

  const handleStartCheckout = useCallback(async () => {
    if (!plan) {
      setErrorMessage('Plan no encontrado')
      setStep('error')
      return
    }

    // Validate email (also allows MP test users like "TESTUSER123")
    if (!mpEmail) {
      setErrorMessage('Ingresá el email o usuario de tu cuenta de Mercado Pago')
      setStep('error')
      return
    }

    setStep('creating-preference')
    setErrorMessage(null)
    brickReadyRef.current = false

    try {
      const result = await createPaymentPreference({
        planId,
        userId,
        clinicaId,
        payerEmail: mpEmail,
        payerName: userName,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al crear preferencia de pago')
      }

      setPreferenceId(result.data.preferenceId)
      // Wait for the Brick to be ready (via onReady callback)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar el pago'
      setErrorMessage(message)
      setStep('error')
      onPaymentError?.(message)
    }
  }, [planId, userId, clinicaId, userEmail, userName, plan, onPaymentError])

  // ── Brick callbacks ──────────────────────────────────────────────────

  const handleBrickReady = useCallback(() => {
    if (brickReadyRef.current) return // avoid infinite loop from re-renders
    brickReadyRef.current = true
    setStep('brick-ready')
  }, [])

  const handleBrickError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    setErrorMessage(msg)
    setStep('error')
    onPaymentError?.(msg)
  }, [onPaymentError])

  // ── Render nothing if SDK failed ──────────────────────────────────────

  if (sdkError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error de configuración</CardTitle>
          <CardDescription>
            No se pudo inicializar Mercado Pago. Verificá la clave pública en las variables de entorno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{sdkError}</p>
        </CardContent>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-destructive">Plan no encontrado: {planId}</p>
        </CardContent>
      </Card>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────

  if (step === 'error') {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>
            Ocurrió un error al crear la suscripción. Por favor intentá de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <p className="text-sm text-destructive font-medium">{errorMessage}</p>
          )}
          <Button onClick={handleStartCheckout} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {plan.name}
        </CardTitle>
        <CardDescription>
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan details */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Precio</span>
            <span className="text-2xl font-bold">
              {formatPrice(plan.price, plan.currency)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground block text-right">
            {plan.interval === 'monthly' ? 'Por mes' : 'Por año'}
          </span>
          <ul className="space-y-1.5 pt-2 border-t">
            {plan.features.map((feature, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Email de Mercado Pago */}
        {step === 'idle' && (
          <div className="space-y-2">
            <Label htmlFor="mp-email" className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email de tu cuenta de Mercado Pago
            </Label>
            <Input
              id="mp-email"
              type="text"
              placeholder="ej: test_user_123@testuser.com o TESTUSER123"
              value={mpEmail}
              onChange={(e) => setMpEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Email o usuario de tu cuenta de Mercado Pago (en pruebas podés usar el TESTUSER)
            </p>
          </div>
        )}

        {/* Subscription button / loading / Payment Brick */}
        <div className="min-h-[60px]">
          {step === 'idle' && (
            <Button
              onClick={handleStartCheckout}
              className="w-full"
              size="lg"
              disabled={!initialized || !mpEmail}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Suscribirme ahora
            </Button>
          )}

          {step === 'creating-preference' && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Preparando pago...
              </span>
            </div>
          )}

          {preferenceId && (
            <div className="brick-container min-h-[300px]">
              <Payment
                initialization={{
                  amount: plan.price / 100,
                  preferenceId,
                }}
                customization={{
                  paymentMethods: {
                    minInstallments: 1,
                    creditCard: 'all',
                  },
                }}
                onReady={handleBrickReady}
                onError={handleBrickError}
                onSubmit={async () => {
                  onPaymentApproved?.()
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            <ExternalLink className="h-3 w-3 inline mr-1" />
            Pago procesado de forma segura por Mercado Pago.
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Una vez confirmado el pago, se activará tu suscripción por 1 mes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
