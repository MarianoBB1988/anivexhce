// ─── Ticket Service ──────────────────────────────────────────────
import { supabase } from '@/lib/supabase'
import { Ticket, TicketCreateInput, TicketUpdateInput, ApiResponse } from '@/lib/types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export const ticketsService = {
  // ── Usuario: Crear ticket ──
  async create(input: TicketCreateInput): Promise<ApiResponse<Ticket>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          browser_info: input.browser_info || null,
          app_version: input.app_version || null,
          page_url: input.page_url || null,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Ticket, error: null, success: true }
    } catch (error) {
      return { data: null, error: String(error), success: false }
    }
  },

  // ── Usuario: Obtener mis tickets ──
  async getMyTickets(): Promise<ApiResponse<Ticket[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Ticket[], error: null, success: true }
    } catch (error) {
      return { data: null, error: String(error), success: false }
    }
  },

  // ── Admin: Obtener todos los tickets (usa API route para bypass RLS) ──
  async getAll(filters?: {
    status?: string
    priority?: string
    search?: string
  }): Promise<ApiResponse<Ticket[]>> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.priority) params.set('priority', filters.priority)
      if (filters?.search) params.set('search', filters.search)

      const res = await fetch(`/api/tickets?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al obtener tickets')
      }

      const json = await res.json()
      return { data: json.data as Ticket[], error: null, success: true }
    } catch (error) {
      return { data: null, error: String(error), success: false }
    }
  },

  // ── Admin: Obtener un ticket por ID ──
  async getById(id: string): Promise<ApiResponse<Ticket>> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data: data as Ticket, error: null, success: true }
    } catch (error) {
      return { data: null, error: String(error), success: false }
    }
  },

  // ── Admin: Actualizar ticket (status, respuesta, usa API route) ──
  async update(id: string, input: TicketUpdateInput): Promise<ApiResponse<Ticket>> {
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar ticket')
      }

      const json = await res.json()
      return { data: json.data as Ticket, error: null, success: true }
    } catch (error) {
      return { data: null, error: String(error), success: false }
    }
  },


  // ── Realtime: Suscripción a cambios en tickets ──
  subscribe(
    callback: (payload: RealtimePostgresChangesPayload<Ticket>) => void
  ) {
    const subscription = supabase
      .channel('tickets-realtime')
      .on<Ticket>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => callback(payload as RealtimePostgresChangesPayload<Ticket>)
      )
      .subscribe()

    return subscription
  },
}
