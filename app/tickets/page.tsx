'use client'

import { Bug, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MyTicketsList } from '@/components/tickets/my-tickets-list'

export default function MyTicketsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mis reportes</h1>
            <p className="text-sm text-muted-foreground">
              Historial de errores que has reportado
            </p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      <MyTicketsList />
    </div>
  )
}
