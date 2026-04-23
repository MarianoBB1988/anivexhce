// Servicios de Turnos
import { supabase } from '../supabase'
import { Turno, ApiResponse } from '../types'

export interface TurnoConDatos extends Turno {
  mascotas?: { nombre: string }
}

export async function getTurnos(clinicaId: string): Promise<ApiResponse<Turno[]>> {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('fecha_hora', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getTurnosConDatos(clinicaId: string): Promise<ApiResponse<TurnoConDatos[]>> {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*, mascotas(nombre)')
      .eq('id_clinica', clinicaId)
      .order('fecha_hora', { ascending: true })
    
    if (error) throw error
    return { data: data as TurnoConDatos[], error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getTurnosActivos(clinicaId: string): Promise<ApiResponse<Turno[]>> {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .in('estado', ['pendiente', 'atendido'])
      .order('fecha_hora', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getTurnosByMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<Turno[]>> {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_mascota', mascotaId)
      .eq('id_clinica', clinicaId)
      .order('fecha_hora', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function checkTurnoDisponibilidad(
  clinicaId: string,
  fechaHora: string,
  margenMinutos = 30
): Promise<{ disponible: boolean; conflictos: Turno[] }> {
  try {
    const base = new Date(fechaHora)
    const desde = new Date(base.getTime() - margenMinutos * 60000).toISOString()
    const hasta = new Date(base.getTime() + margenMinutos * 60000).toISOString()

    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .neq('estado', 'ausente')
      .gte('fecha_hora', desde)
      .lte('fecha_hora', hasta)

    if (error) throw error
    return { disponible: !data || data.length === 0, conflictos: data || [] }
  } catch {
    return { disponible: true, conflictos: [] }
  }
}

export async function createTurno(turno: Omit<Turno, 'id' | 'created_at'>): Promise<ApiResponse<Turno>> {
  try {
    const payload = Object.fromEntries(
      Object.entries(turno).filter(([, v]) => v !== undefined)
    )
    const { data, error } = await supabase
      .from('turnos')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateTurno(id: string, clinicaId: string, turno: Partial<Turno>): Promise<ApiResponse<Turno>> {
  try {
    const payload = Object.fromEntries(
      Object.entries(turno).filter(([, v]) => v !== undefined)
    )
    const { data, error } = await supabase
      .from('turnos')
      .update(payload)
      .eq('id', id)
      .eq('id_clinica', clinicaId)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteTurno(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
