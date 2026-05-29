'use client'

import { useMyTickets, statusLabels, statusColors, priorityLabels, priorityColors } from '@/hooks/use-tickets'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Bug, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function MyTicketsList() {
  const { tickets, loading, error, refetch } = useMyTickets()

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mb-2 h-6 w-6 text-destructive" />
        <p className="text-sm font-medium text-destructive">Error al cargar tus tickets</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Bug className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">No has reportado errores</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Si encuentras algún problema, usa el botón "Reportar error" en el menú
        </p>
      </div>
    )
  }

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return date
    }
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{ticket.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {ticket.description}
              </p>
            </div>
            <Badge variant="outline" className={`shrink-0 ${statusColors[ticket.status]}`}>
              {statusLabels[ticket.status]}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={priorityColors[ticket.priority]}>
              {priorityLabels[ticket.priority]}
            </Badge>
            <span>{formatDate(ticket.created_at)}</span>
            {ticket.admin_response && (
              <span className="flex items-center gap-1 text-blue-500">
                <MessageSquare className="h-3 w-3" />
                Tiene respuesta
              </span>
            )}
            {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
              <span>· Actualizado {formatDate(ticket.updated_at)}</span>
            )}
          </div>

          {/* Respuesta del admin */}
          {ticket.admin_response && (
            <div className="mt-3 rounded-lg border-l-2 border-blue-500 bg-blue-500/5 p-3">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Respuesta:</p>
              <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                {ticket.admin_response}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
