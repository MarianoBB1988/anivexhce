'use client'

// ─── Checkout Bricks Component ──────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Renders the Mercado Pago Checkout Bricks (Payment Brick)
// This component calls the backend to get a preferenceId and then renders the Brick

import { useEffect, useState, useCallback } from 'react'
import { Payment } from '@mercadopago/sdk-react'
import { useMercadoPago } from './mp-provider'
import { createPaymentPreference, createUserSubscription } from '@/lib/services/mp-client'
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/mp-types'
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CheckoutBrickProps {
  planId: string
  userId: string
  clinicaId: string
  userEmail: string
  userName?: string
  onPaymentApproved?: () => void
  onPaymentError?: (error: string) => void
}

type CheckoutStep = 'idle' | 'creating' | 'ready' | 'processing' | 'success' | 'error'

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
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

  // ── Create preference & subscription ──────────────────────────────────

  const handleStartCheckout = useCallback(async () => {
    if (!plan) {
      setErrorMessage('Plan no encontrado')
      setStep('error')
      return
    }

    setStep('creating')
    setErrorMessage(null)

    try {
      // 1. Create subscription record in DB (first, so webhook can find it)
      await createUserSubscription({
        userId,
        clinicaId,
        planId,
        payerEmail: userEmail,
      })

      // 2. Create payment preference with Mercado Pago
      const result = await createPaymentPreference({
        planId,
        userId,
        clinicaId,
        payerEmail: userEmail,
        payerName: userName,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al crear preferencia de pago')
      }

      setPreferenceId(result.data.preferenceId)
      setStep('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar el pago'
      setErrorMessage(message)
      setStep('error')
      onPaymentError?.(message)
    }
  }, [planId, userId, clinicaId, userEmail, userName, plan, onPaymentError])

  // ── Handle brick readiness ────────────────────────────────────────────

  const handleBrickReady = useCallback(() => {
    console.log('[CheckoutBrick] Brick ready')
  }, [])

  // ── Handle payment error within brick ─────────────────────────────────

  const handleBrickError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error en el brick de pago'
      console.error('[CheckoutBrick] Brick error:', err)
      setErrorMessage(message)
      setStep('error')
      onPaymentError?.(message)
    },
    [onPaymentError],
  )

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

  // ── Success state ─────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <ShieldCheck className="h-6 w-6" />
            ¡Pago exitoso!
          </CardTitle>
          <CardDescription>
            Tu suscripción a {plan.name} está activa. Ya podés disfrutar de todas las funcionalidades.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────

  if (step === 'error') {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error en el pago</CardTitle>
          <CardDescription>
            Ocurrió un error al procesar el pago. Por favor intentá de nuevo.
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

  // ── Main render: idle / creating / ready / processing ─────────────────

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
          {plan.trial_days && (
            <Badge variant="secondary" className="w-full justify-center">
              {plan.trial_days} días de prueba gratis
            </Badge>
          )}
          <ul className="space-y-1.5 pt-2 border-t">
            {plan.features.map((feature, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Checkout Brick */}
        <div className="min-h-[200px]">
          {step === 'idle' && (
            <Button
              onClick={handleStartCheckout}
              className="w-full"
              size="lg"
              disabled={!initialized}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Suscribirme ahora
            </Button>
          )}

          {step === 'creating' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Preparando el pago...
              </span>
            </div>
          )}

          {step === 'ready' && preferenceId && (
            <div className="brick-container">
              <Payment
                initialization={{
                  preferenceId,
                }}
                onReady={handleBrickReady}
                onError={handleBrickError}
                onSubmit={async () => {
                  setStep('processing')
                }}
              />
            </div>
          )}

          {step === 'processing' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Procesando pago...
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Pagos procesados de forma segura por Mercado Pago.
          Tus datos están protegidos.
        </p>
      </CardContent>
    </Card>
  )
}
