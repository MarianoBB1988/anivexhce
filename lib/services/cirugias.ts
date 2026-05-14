// Servicios de Cirugías
import { supabase } from '../supabase'
import { Cirugia, ApiResponse } from '../types'

function formatSupabaseError(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string }
    return [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter(Boolean)
      .join(' | ')
  }

  return String(error)
}

export async function getCirugias(clinicaId: string): Promise<ApiResponse<Cirugia[]>> {
  try {
    const { data, error } = await supabase
      .from('cirugias')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getCirugiasConDatos(clinicaId: string): Promise<ApiResponse<Cirugia[]>> {
  try {
    const { data, error } = await supabase
      .from('cirugias')
      .select('*, mascotas(nombre)')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getCirugiasbyMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<Cirugia[]>> {
  try {
    const { data, error } = await supabase
      .from('cirugias')
      .select('*')
      .eq('id_mascota', mascotaId)
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

// Alias para consistencia
export const getCirugiasByMascota = getCirugiasbyMascota

export async function getCirugiaById(id: string, clinicaId: string): Promise<ApiResponse<Cirugia>> {
  try {
    const { data, error } = await supabase
      .from('cirugias')
      .select('*')
      .eq('id', id)
      .eq('id_clinica', clinicaId)
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createCirugia(cirugia: Omit<Cirugia, 'id' | 'created_at'>): Promise<ApiResponse<Cirugia>> {
  try {
    const { data, error } = await supabase
      .from('cirugias')
      .insert([cirugia])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateCirugia(id: string, clinicaId: string, cirugia: Partial<Cirugia>): Promise<ApiResponse<Cirugia>> {
  try {
    const payload = Object.fromEntries(Object.entries(cirugia).filter(([, value]) => value !== undefined))
    const { data, error } = await supabase
      .from('cirugias')
      .update(payload)
      .eq('id', id)
      .eq('id_clinica', clinicaId)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: formatSupabaseError(error), success: false }
  }
}

export async function deleteCirugia(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('cirugias')
      .delete()
      .eq('id', id)
      .eq('clinica_id', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
