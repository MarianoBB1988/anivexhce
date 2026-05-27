-- ─── Mercado Pago Integration — Database Migration ─────────────────────────
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- ============================================================================
-- 1. Subscriptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id TEXT NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'sana-vet-monthly',
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled', 'trial')),
  mp_preference_id TEXT,
  mp_subscription_id TEXT,
  mp_payer_email TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preference_id ON public.subscriptions(mp_preference_id);

-- Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies (adjust as needed for your app)
-- Allow users to read their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role full access (for webhooks and admin operations)
CREATE POLICY "Service role has full access" ON public.subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 2. Payments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id TEXT NOT NULL,
  mp_payment_id TEXT NOT NULL UNIQUE,
  mp_preference_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('approved', 'pending', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back')),
  status_detail TEXT,
  amount BIGINT NOT NULL DEFAULT 0,  -- stored in cents (e.g., 29900 = $299.00)
  currency TEXT NOT NULL DEFAULT 'ARS',
  payer_email TEXT,
  payment_method TEXT,
  payment_type TEXT,
  transaction_amount NUMERIC(12, 2),
  net_amount NUMERIC(12, 2),
  taxes_amount NUMERIC(12, 2),
  shipping_amount NUMERIC(12, 2),
  installment INT,
  description TEXT,
  metadata JSONB,
  raw_response JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON public.payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role has full access" ON public.payments
  FOR ALL
  USING (true)
  WITH CHECK (true);
