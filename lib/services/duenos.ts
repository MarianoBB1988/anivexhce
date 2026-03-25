// Servicios de Dueños
import { supabase } from '../supabase'
import { Dueno, ApiResponse } from '../types'

export async function getDuenos(clinicaId: string): Promise<ApiResponse<Dueno[]>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getDuenoById(id: string, clinicaId: string): Promise<ApiResponse<Dueno>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
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

export async function createDueno(dueno: Omit<Dueno, 'id' | 'created_at'>): Promise<ApiResponse<Dueno>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .insert([dueno])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateDueno(id: string, clinicaId: string, dueno: Partial<Dueno>): Promise<ApiResponse<Dueno>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .update(dueno)
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

export async function deleteDueno(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('duenos')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function searchDuenos(clinicaId: string, query: string): Promise<ApiResponse<Dueno[]>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .or(`nombre.ilike.%${query}%,email.ilike.%${query}%,telefono.ilike.%${query}%`)
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
