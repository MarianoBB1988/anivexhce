'use client'

import { Bug } from 'lucide-react'
import { AdminTicketsTable } from '@/components/tickets/admin-tickets-table'
import { useAuth } from '@/lib/auth-context'
import { redirect } from 'next/navigation'

// Solo usuarios del equipo de desarrollo pueden acceder
const devEmails = ['mariano@anivex.com', 'emanuele@anivex.com', 'matias@sanavet.uy']

export default function TicketsAdminPage() {
  const { user } = useAuth()
  const isDev = user?.email ? devEmails.includes(user.email) : false

  // Redirigir si no es del equipo de desarrollo
  if (user && !isDev) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
          <Bug className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Revisa y gestiona los reportes de errores de los usuarios
          </p>
        </div>
      </div>

      {/* Tabla de tickets */}
      <AdminTicketsTable />
    </div>
  )
}

