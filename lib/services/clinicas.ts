// Servicios de Clinicas
import { supabase } from '../supabase'
import { Clinica, ApiResponse } from '../types'

export async function getClinicas(): Promise<ApiResponse<Clinica[]>> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getClinicaById(id: string): Promise<ApiResponse<Clinica>> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createClinica(clinica: Omit<Clinica, 'id' | 'created_at'>): Promise<ApiResponse<Clinica>> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .insert([clinica])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateClinica(id: string, clinica: Partial<Clinica>): Promise<ApiResponse<Clinica>> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .update(clinica)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteClinica(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('clinicas')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
