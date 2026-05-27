// ─── Mercado Pago Types ───────────────────────────────────────────────────────
// Shared types for the entire Mercado Pago integration

/** Plan de suscripción mensual */
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number // en centavos (ARS/USD)
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  trial_days?: number
}

/** Estados de un pago */
export type PaymentStatus =
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

/** Estados de una suscripción en base de datos */
export type SubscriptionDbStatus =
  | 'active'
  | 'inactive'
  | 'past_due'
  | 'cancelled'
  | 'trial'

/** Suscripción en base de datos */
export interface SubscriptionDB {
  id: string
  user_id: string
  clinica_id: string
  plan_id: string
  status: SubscriptionDbStatus
  mp_preference_id: string | null
  mp_subscription_id: string | null
  mp_payer_email: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

/** Pago individual registrado en base de datos */
export interface PaymentDB {
  id: string
  subscription_id: string
  user_id: string
  clinica_id: string
  mp_payment_id: string
  mp_preference_id: string | null
  status: PaymentStatus
  status_detail: string | null
  amount: number
  currency: string
  payer_email: string | null
  payment_method: string | null
  payment_type: string | null
  transaction_amount: number | null
  net_amount: number | null
  taxes_amount: number | null
  shipping_amount: number | null
  installment: number | null
  description: string | null
  metadata: Record<string, unknown> | null
  raw_response: Record<string, unknown> | null
  processed_at: string | null
  created_at: string
}

/** Respuesta al crear preferencia desde el backend */
export interface CreatePreferenceResponse {
  preferenceId: string
  initPoint: string
}

/** Respuesta genérica de API de pagos */
export interface PaymentApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/** Body para el endpoint /api/mercadopago/create-preference */
export interface CreatePreferenceBody {
  planId: string
  userId: string
  clinicaId: string
  payerEmail: string
  payerName?: string
}

/** Webhook notification payload de Mercado Pago */
export interface MercadoPagoWebhookPayload {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type:
    | 'payment'
    | 'plan'
    | 'subscription'
    | 'subscription_authorized_payment'
    | 'point_integration_wh'
    | 'topic'
  user_id: string
}

/** Planes de suscripción disponibles */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'sana-vet-monthly',
    name: 'SanaVet Mensual',
    description: 'Suscripción mensual a SanaVet — gestión veterinaria integral con IA.',
    price: 29900, // $299.00 (en centavos)
    currency: 'ARS',
    interval: 'monthly',
    features: [
      'Gestión de pacientes ilimitada',
      'Historia clínica digital',
      'Turnos y recordatorios',
      'Análisis de laboratorio',
      'Diagnóstico por IA',
      'Soporte prioritario',
    ],
    trial_days: 7,
  },
]

/** Precio formateado para mostrar en UI */
export function formatPrice(cents: number, currency: string = 'ARS'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
