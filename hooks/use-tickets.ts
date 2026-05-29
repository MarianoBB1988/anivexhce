'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
  TicketStatus,
  TicketPriority,
} from '@/lib/types'
import { ticketsService } from '@/lib/services/tickets'
import { useAuth } from '@/lib/auth-context'

// ─── Hook: Crear ticket (usuario) ─────────────────────────────────
export function useCreateTicket() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (input: TicketCreateInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await ticketsService.create(input)
      if (!result.success) {
        setError(result.error || 'Error al crear el ticket')
        return null
      }
      return result.data
    } catch (err) {
      const msg = String(err)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}

// ─── Hook: Listar tickets del usuario ─────────────────────────────
export function useMyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetch = useCallback(async () => {
    if (!user) {
      setTickets([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await ticketsService.getMyTickets()
      if (result.success) {
        setTickets(result.data || [])
      } else {
        setError(result.error || 'Error al cargar tickets')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { tickets, loading, error, refetch: fetch }
}

// ─── Hook: Admin - Listar todos los tickets con filtros ───────────
export function useAdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    status?: string
    priority?: string
    search?: string
  }>({})

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await ticketsService.getAll(filters)
      if (result.success) {
        setTickets(result.data || [])
      } else {
        setError(result.error || 'Error al cargar tickets')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetch()
  }, [fetch])

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    const subscription = ticketsService.subscribe((payload) => {
      // Refrescar al recibir cualquier cambio
      fetch()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetch])

  const updateFilters = useCallback((newFilters: typeof filters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  return { tickets, loading, error, filters, updateFilters, clearFilters, refetch: fetch }
}

// ─── Hook: Admin - Actualizar ticket ──────────────────────────────
export function useUpdateTicket() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(async (id: string, input: TicketUpdateInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await ticketsService.update(id, input)
      if (!result.success) {
        setError(result.error || 'Error al actualizar el ticket')
        return null
      }
      return result.data
    } catch (err) {
      const msg = String(err)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { update, loading, error }
}

// ─── Utilidades ───────────────────────────────────────────────────

export const statusLabels: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export const statusColors: Record<TicketStatus, string> = {
  open: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  resolved: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  closed: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
}

export const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  high: 'bg-red-500/15 text-red-600 dark:text-red-400',
}
