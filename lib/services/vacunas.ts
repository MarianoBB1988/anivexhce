// Servicios de Vacunas
import { supabase } from '../supabase'
import { Vacuna, ApiResponse } from '../types'

export async function getVacunas(clinicaId: string): Promise<ApiResponse<Vacuna[]>> {
  try {
    const { data, error } = await supabase
      .from('vacunas')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getVacunasByMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<Vacuna[]>> {
  try {
    const { data, error } = await supabase
      .from('vacunas')
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

export async function getVacunasProximas(clinicaId: string, diasAnticipacion: number = 30): Promise<ApiResponse<Vacuna[]>> {
  try {
    const proximaFecha = new Date()
    proximaFecha.setDate(proximaFecha.getDate() + diasAnticipacion)
    
    const { data, error } = await supabase
      .from('vacunas')
      .select('*')
      .eq('id_clinica', clinicaId)
      .lt('proxima_dosis', proximaFecha.toISOString().split('T')[0])
      .order('proxima_dosis', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createVacuna(vacuna: Omit<Vacuna, 'id' | 'created_at'>): Promise<ApiResponse<Vacuna>> {
  try {
    const { data, error } = await supabase
      .from('vacunas')
      .insert([vacuna])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateVacuna(id: string, clinicaId: string, vacuna: Partial<Vacuna>): Promise<ApiResponse<Vacuna>> {
  try {
    const { data, error } = await supabase
      .from('vacunas')
      .update(vacuna)
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

export async function deleteVacuna(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('vacunas')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
