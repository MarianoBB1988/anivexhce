'use client'

// ─── Subscription Card Component ────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Shows the current subscription status and allows user to manage it

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUserSubscription } from '@/lib/services/mp-client'
import { CheckoutBrick } from './checkout-brick'
import { PaymentStatusHandler } from './payment-status'
import {
  SUBSCRIPTION_PLANS,
  formatPrice,
  type SubscriptionDB,
  type PaymentStatus,
} from '@/lib/mp-types'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
  active: { label: 'Activa', variant: 'success' },
  trial: { label: 'Prueba gratis', variant: 'secondary' },
  inactive: { label: 'Inactiva', variant: 'outline' },
  past_due: { label: 'Vencida', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

export function SubscriptionCard() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionDB | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // ── Fetch subscription ──────────────────────────────────────────────────

  const fetchSubscription = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await getUserSubscription(user.id)
      if (result.success) {
        setSubscription(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener suscripción')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user?.id])

  // ── Handle payment success ─────────────────────────────────────────────

  const handlePaymentApproved = () => {
    fetchSubscription()
    setShowCheckout(false)
  }

  const handlePaymentError = (errorMsg: string) => {
    console.error('[Subscription] Payment error:', errorMsg)
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando suscripción...
          </span>
        </CardContent>
      </Card>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchSubscription} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── User has no subscription yet → show plan and checkout ──────────────

  if (!subscription) {
    if (showCheckout) {
      return (
        <div className="space-y-6">
          <Button onClick={() => setShowCheckout(false)} variant="ghost" size="sm">
            ← Volver
          </Button>
          <CheckoutBrick
            planId="sana-vet-monthly"
            userId={user!.id}
            clinicaId={user!.id_clinica}
            userEmail={user!.email}
            userName={user!.nombre}
            onPaymentApproved={handlePaymentApproved}
            onPaymentError={handlePaymentError}
          />
        </div>
      )
    }

    const plan = SUBSCRIPTION_PLANS[0]

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Suscripción a SanaVet
          </CardTitle>
          <CardDescription>
            No tenés una suscripción activa. Suscribite para acceder a todas las funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{plan.name}</span>
              <span className="text-xl font-bold">
                {formatPrice(plan.price, plan.currency)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Por mes</span>
            {plan.trial_days && (
              <Badge variant="secondary">{plan.trial_days} días gratis</Badge>
            )}
            <Separator className="my-2" />
            <ul className="space-y-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={() => setShowCheckout(true)}
            className="w-full"
            size="lg"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Suscribirme ahora
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── User has a subscription → show status ──────────────────────────────

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.plan_id)
  const statusInfo = STATUS_LABELS[subscription.status] || STATUS_LABELS.inactive
  const isActive = subscription.status === 'active' || subscription.status === 'trial'

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isActive ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              )}
              {plan?.name || 'Suscripción'}
            </CardTitle>
            <CardDescription>
              {isActive
                ? 'Tu suscripción está activa'
                : 'Tu suscripción no está activa'}
            </CardDescription>
          </div>
          <Badge variant={statusInfo.variant as 'default' | 'secondary' | 'destructive' | 'outline'}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        {plan && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {formatPrice(plan.price, plan.currency)}
            </span>
            <span className="text-sm text-muted-foreground">/mes</span>
          </div>
        )}

        {/* Period */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Inicio del período
            </span>
            <span className="font-medium">
              {formatDate(subscription.current_period_start)}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Fin del período
            </span>
            <span className="font-medium">
              {formatDate(subscription.current_period_end)}
            </span>
          </div>
        </div>

        {/* Trial */}
        {subscription.trial_end && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm flex items-start gap-2">
            <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-amber-800 dark:text-amber-300">
                Período de prueba
              </span>
              <p className="text-amber-600 dark:text-amber-400">
                Finaliza el {formatDate(subscription.trial_end)}
              </p>
            </div>
          </div>
        )}

        {/* Actions for non-active */}
        {!isActive && (
          <div className="pt-2">
            {showCheckout ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setShowCheckout(false)}
                  variant="ghost"
                  size="sm"
                >
                  ← Volver
                </Button>
                <CheckoutBrick
                  planId={subscription.plan_id}
                  userId={user!.id}
                  clinicaId={user!.id_clinica}
                  userEmail={user!.email}
                  userName={user!.nombre}
                  onPaymentApproved={handlePaymentApproved}
                  onPaymentError={handlePaymentError}
                />
              </div>
            ) : (
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {subscription.status === 'cancelled'
                  ? 'Reactivar suscripción'
                  : 'Pagar ahora'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
