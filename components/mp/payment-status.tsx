'use client'

// ─── Payment Status Handler ──────────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Displays payment status after redirect from Mercado Pago

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { PaymentStatus as PaymentStatusType } from '@/lib/mp-types'

interface PaymentStatusHandlerProps {
  onStatusUpdate?: (status: PaymentStatusType) => void
}

const STATUS_CONFIG: Record<
  PaymentStatusType,
  {
    title: string
    description: string
    icon: React.ReactNode
    iconClass: string
    badgeClass: string
    badgeText: string
  }
> = {
  approved: {
    title: '¡Pago aprobado!',
    description: 'Tu suscripción a SanaVet está activa. Ya podés acceder a todas las funcionalidades.',
    icon: <CheckCircle2 className="h-12 w-12" />,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    badgeText: 'Aprobado',
  },
  pending: {
    title: 'Pago pendiente',
    description: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
    icon: <Clock className="h-12 w-12" />,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    badgeText: 'Pendiente',
  },
  in_process: {
    title: 'Pago en proceso',
    description: 'Estamos procesando tu pago. Esto puede tomar unos minutos.',
    icon: <Loader2 className="h-12 w-12 animate-spin" />,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    badgeText: 'En proceso',
  },
  in_mediation: {
    title: 'Pago en mediación',
    description: 'Tu pago está siendo revisado. Contactanos si tenés dudas.',
    icon: <Clock className="h-12 w-12" />,
    iconClass: 'text-orange-500',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    badgeText: 'En mediación',
  },
  rejected: {
    title: 'Pago rechazado',
    description: 'No se pudo procesar tu pago. Podés intentar con otro medio de pago.',
    icon: <XCircle className="h-12 w-12" />,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    badgeText: 'Rechazado',
  },
  cancelled: {
    title: 'Pago cancelado',
    description: 'Cancelaste el proceso de pago. Podés suscribirte cuando quieras.',
    icon: <XCircle className="h-12 w-12" />,
    iconClass: 'text-slate-400',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    badgeText: 'Cancelado',
  },
  refunded: {
    title: 'Pago reembolsado',
    description: 'Tu pago fue reembolsado correctamente.',
    icon: <CheckCircle2 className="h-12 w-12" />,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    badgeText: 'Reembolsado',
  },
  charged_back: {
    title: 'Contracargo',
    description: 'Se inició un contracargo. Contactanos para más información.',
    icon: <XCircle className="h-12 w-12" />,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    badgeText: 'Contracargo',
  },
}

export function PaymentStatusHandler({ onStatusUpdate }: PaymentStatusHandlerProps) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatusType | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  useEffect(() => {
    const statusParam = searchParams.get('status') as PaymentStatusType | null
    const paymentIdParam = searchParams.get('payment_id')
    const collectionId = searchParams.get('collection_id')

    if (statusParam) {
      setStatus(statusParam)
      onStatusUpdate?.(statusParam)
    }

    if (paymentIdParam) {
      setPaymentId(paymentIdParam)
    } else if (collectionId) {
      setPaymentId(collectionId)
    }
  }, [searchParams, onStatusUpdate])

  if (!status) return null

  const config = STATUS_CONFIG[status]

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <div className={`flex justify-center mb-4 ${config.iconClass}`}>
          {config.icon}
        </div>
        <CardTitle className="text-xl">{config.title}</CardTitle>
        <CardDescription className="text-sm mt-2">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Badge className={config.badgeClass}>{config.badgeText}</Badge>
        </div>

        {paymentId && (
          <p className="text-xs text-center text-muted-foreground">
            ID de pago: {paymentId}
          </p>
        )}

        {status === 'approved' && (
          <Button asChild className="w-full" size="lg">
            <Link href="/dashboard">
              Ir al dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}

        {status === 'rejected' && (
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/subscription">
              Intentar de nuevo
            </Link>
          </Button>
        )}

        {(status === 'pending' || status === 'in_process') && (
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/subscription">
              Ver estado de suscripción
            </Link>
          </Button>
        )}

        {status === 'cancelled' && (
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/subscription">
              Suscribirme ahora
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
