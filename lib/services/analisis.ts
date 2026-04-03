// Servicios de Análisis de Laboratorio
import { supabase } from '../supabase'
import { Analisis, ApiResponse } from '../types'

export async function getAnalisis(clinicaId: string): Promise<ApiResponse<Analisis[]>> {
  try {
    const { data, error } = await supabase
      .from('analisis')
      .select('*, mascotas(nombre, especie), usuarios(nombre)')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function getAnalisisByMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<Analisis[]>> {
  try {
    const { data, error } = await supabase
      .from('analisis')
      .select('*')
      .eq('id_mascota', mascotaId)
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function createAnalisis(analisis: Omit<Analisis, 'id' | 'created_at'>): Promise<ApiResponse<Analisis>> {
  try {
    const payload = Object.fromEntries(Object.entries(analisis).filter(([, v]) => v !== undefined && v !== ''))
    const { data, error } = await supabase
      .from('analisis')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function updateAnalisis(id: string, clinicaId: string, analisis: Partial<Analisis>): Promise<ApiResponse<Analisis>> {
  try {
    const payload = Object.fromEntries(Object.entries(analisis).filter(([, v]) => v !== undefined))
    const { data, error } = await supabase
      .from('analisis')
      .update(payload)
      .eq('id', id)
      .eq('id_clinica', clinicaId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function deleteAnalisis(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('analisis')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}
