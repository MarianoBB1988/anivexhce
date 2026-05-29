'use client'

import { useState, useMemo, useEffect, useRef } from 'react'

import {
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bug,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ticket, TicketStatus, TicketPriority } from '@/lib/types'
import { useAdminTickets, statusLabels, statusColors, priorityLabels, priorityColors } from '@/hooks/use-tickets'
import { TicketDetailDialog } from './ticket-detail-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ITEMS_PER_PAGE = 10

export function AdminTicketsTable() {
  const { tickets, loading, error, filters, updateFilters, clearFilters, refetch } = useAdminTickets()
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [page, setPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Paginación
  const totalPages = Math.max(1, Math.ceil(tickets.length / ITEMS_PER_PAGE))
  const paginatedTickets = tickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  // Debounce para búsqueda en tiempo real
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateFilters({ search: value || undefined })
      setPage(1)
    }, 300)
  }

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])


  const handleStatusFilter = (value: string) => {
    updateFilters({ status: value === 'all' ? undefined : value })
    setPage(1)
  }

  const handlePriorityFilter = (value: string) => {
    updateFilters({ priority: value === 'all' ? undefined : value })
    setPage(1)
  }

  const handleClearFilters = () => {
    clearFilters()
    setSearchInput('')
    setPage(1)
  }

  const handleViewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setDetailOpen(true)
  }

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: es })
    } catch {
      return date
    }
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return '—'
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return date
    }
  }

  // Mostrar estado de carga
  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Error al cargar tickets</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={refetch}>
          Reintentar
        </Button>
      </div>
    )
  }

  const hasActiveFilters = filters.status || filters.priority || filters.search

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o descripción..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  updateFilters({ search: undefined })
                  setPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>


        <div className="flex gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abierto</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="resolved">Resuelto</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || 'all'}
            onValueChange={handlePriorityFilter}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={handleClearFilters} title="Limpiar filtros">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Bug className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            {hasActiveFilters ? 'Sin resultados' : 'No hay tickets'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            {hasActiveFilters
              ? 'Intenta con otros filtros o términos de búsqueda'
              : 'Cuando los usuarios reporten errores, aparecerán aquí'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Tabla (desktop) */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Última actualización</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleViewDetail(ticket)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {ticket.user_id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="max-w-[250px] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{ticket.title}</span>
                        {ticket.admin_response && (
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDateTime(ticket.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetail(ticket)
                      }}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="space-y-3 md:hidden">
            {paginatedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                onClick={() => handleViewDetail(ticket)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ticket.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ticket.user_id.substring(0, 8)}...
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${statusColors[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className={priorityColors[ticket.priority]}>
                    {priorityLabels[ticket.priority]}
                  </Badge>
                  <span>{formatDate(ticket.created_at)}</span>
                  {ticket.admin_response && (
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({tickets.length} tickets)
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={p === page ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de detalle */}
      <TicketDetailDialog
        ticket={selectedTicket}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={refetch}
      />
    </div>
  )
}
