'use client'

// ─── Subscription Page ──────────────────────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Full subscription management page for SanaVet

import { Suspense } from 'react'
import { SubscriptionCard } from '@/components/mp/subscription-card'
import { PaymentStatusHandler } from '@/components/mp/payment-status'
import { ProtectedRoute } from '@/components/protected-route'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function SubscriptionPageContent() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suscripción</h1>
        <p className="text-muted-foreground text-sm">
          Gestioná tu suscripción a SanaVet.
        </p>
      </div>

      {/* Payment status from redirect */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }>
        <PaymentStatusHandler />
      </Suspense>

      {/* Subscription card */}
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
      }>
        <SubscriptionCard />
      </Suspense>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <SubscriptionPageContent />
    </ProtectedRoute>
  )
}
