'use client'

import { useState, useEffect } from 'react'
import {
  Bug,
  Calendar,
  Globe,
  Monitor,
  Code,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ticket, TicketStatus, TicketUpdateInput } from '@/lib/types'
import { useUpdateTicket } from '@/hooks/use-tickets'
import { statusLabels, statusColors, priorityLabels, priorityColors } from '@/hooks/use-tickets'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function TicketDetailDialog({ ticket, open, onOpenChange, onUpdated }: Props) {
  const { update, loading } = useUpdateTicket()
  const [status, setStatus] = useState<TicketStatus>('open')
  const [adminResponse, setAdminResponse] = useState('')

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status)
      setAdminResponse(ticket.admin_response || '')
    }
  }, [ticket])

  if (!ticket) return null

  const handleSave = async () => {
    const input: TicketUpdateInput = {}
    if (status !== ticket.status) input.status = status
    if (adminResponse !== (ticket.admin_response || '')) input.admin_response = adminResponse

    if (Object.keys(input).length === 0) {
      toast.info('No hay cambios que guardar')
      return
    }

    const result = await update(ticket.id, input)
    if (result) {
      toast.success('Ticket actualizado')
      onUpdated?.()
      onOpenChange(false)
    } else {
      toast.error('Error al actualizar el ticket')
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return date
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <Bug className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">{ticket.title}</DialogTitle>
              <DialogDescription>
                Creado el {formatDate(ticket.created_at)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusColors[ticket.status]}>
              {statusLabels[ticket.status]}
            </Badge>
            <Badge variant="outline" className={priorityColors[ticket.priority]}>
              {priorityLabels[ticket.priority]}
            </Badge>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Info del usuario / navegador */}
          <div className="grid gap-3 sm:grid-cols-2">
            {ticket.browser_info && (
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Info del navegador</p>
                  <p className="text-xs truncate">{ticket.browser_info}</p>
                </div>
              </div>
            )}
            {ticket.app_version && (
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Code className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Versión app</p>
                  <p className="text-xs">{ticket.app_version}</p>
                </div>
              </div>
            )}
            {ticket.page_url && (
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Globe className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">URL</p>
                  <p className="text-xs truncate">{ticket.page_url}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-lg border p-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Última actualización</p>
                <p className="text-xs">{formatDate(ticket.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Estado</label>
            <Select value={status} onValueChange={(val) => setStatus(val as TicketStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Respuesta del admin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Respuesta del administrador
              </div>
            </label>
            <Textarea
              placeholder="Escribe una respuesta para el usuario..."
              rows={4}
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
