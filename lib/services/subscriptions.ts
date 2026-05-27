// ─── Subscriptions Database Service ───────────────────────────────────────────
// RUNS ON: Server-side (API routes only)
// Handles all database operations for subscriptions and payments
// ⚠️ Uses supabaseAdmin (service role) to bypass RLS for writes
//    Reads use the regular supabase client (RLS applies for user-level queries)

import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  SubscriptionDB,
  PaymentDB,
  SubscriptionDbStatus,
  PaymentStatus,
} from '@/lib/mp-types'

// ---------------------------------------------------------------------------
// Subscriptions CRUD
// ---------------------------------------------------------------------------

export async function createSubscription(data: {
  userId: string
  clinicaId: string
  planId: string
  status: SubscriptionDbStatus
  mpPreferenceId?: string
  mpPayerEmail?: string
  trialEnd?: string
}): Promise<SubscriptionDB> {
  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: data.userId,
      clinica_id: data.clinicaId,
      plan_id: data.planId,
      status: data.status,
      mp_preference_id: data.mpPreferenceId ?? null,
      mp_payer_email: data.mpPayerEmail ?? null,
      trial_end: data.trialEnd ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Error creating subscription: ${error.message}`)
  return subscription
}

export async function getSubscriptionByUserId(
  userId: string,
): Promise<SubscriptionDB | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows
    throw new Error(`Error fetching subscription: ${error.message}`)
  }
  return data
}

export async function getSubscriptionById(
  id: string,
): Promise<SubscriptionDB | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Error fetching subscription: ${error.message}`)
  }
  return data
}

export async function updateSubscription(
  id: string,
  updates: Partial<SubscriptionDB>,
): Promise<SubscriptionDB> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Error updating subscription: ${error.message}`)
  return data
}

export async function cancelSubscription(id: string): Promise<SubscriptionDB> {
  return updateSubscription(id, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
  })
}

// ---------------------------------------------------------------------------
// Payments CRUD
// ---------------------------------------------------------------------------

export async function createPayment(data: {
  subscriptionId: string
  userId: string
  clinicaId: string
  mpPaymentId: string
  mpPreferenceId?: string
  status: PaymentStatus
  amount: number
  currency?: string
  payerEmail?: string
  paymentMethod?: string
  paymentType?: string
  transactionAmount?: number
  netAmount?: number
  taxesAmount?: number
  description?: string
  metadata?: Record<string, unknown>
  rawResponse?: Record<string, unknown>
}): Promise<PaymentDB> {
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .insert({
      subscription_id: data.subscriptionId,
      user_id: data.userId,
      clinica_id: data.clinicaId,
      mp_payment_id: data.mpPaymentId,
      mp_preference_id: data.mpPreferenceId ?? null,
      status: data.status,
      amount: data.amount,
      currency: data.currency ?? 'ARS',
      payer_email: data.payerEmail ?? null,
      payment_method: data.paymentMethod ?? null,
      payment_type: data.paymentType ?? null,
      transaction_amount: data.transactionAmount ?? null,
      net_amount: data.netAmount ?? null,
      taxes_amount: data.taxesAmount ?? null,
      description: data.description ?? null,
      metadata: data.metadata ?? null,
      raw_response: data.rawResponse ?? null,
      processed_at: data.status === 'approved' ? new Date().toISOString() : null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Error creating payment: ${error.message}`)
  return payment
}

export async function getPaymentByMpId(
  mpPaymentId: string,
): Promise<PaymentDB | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('mp_payment_id', mpPaymentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Error fetching payment: ${error.message}`)
  }
  return data
}

export async function getPaymentsBySubscriptionId(
  subscriptionId: string,
): Promise<PaymentDB[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error fetching payments: ${error.message}`)
  return data ?? []
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  statusDetail?: string,
): Promise<PaymentDB> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({
      status,
      status_detail: statusDetail ?? null,
      processed_at: status === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Error updating payment: ${error.message}`)
  return data
}

// ---------------------------------------------------------------------------
// Helper: Check if user has active subscription
// ---------------------------------------------------------------------------

export async function hasActiveSubscription(
  userId: string,
): Promise<boolean> {
  const sub = await getSubscriptionByUserId(userId)
  return sub !== null && (sub.status === 'active' || sub.status === 'trial')
}
