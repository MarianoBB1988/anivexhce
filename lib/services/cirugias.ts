// Servicios de Cirugías
import { supabase } from '../supabase'
import { Cirugia, ApiResponse } from '../types'

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
    const { data, error } = await supabase
      .from('cirugias')
      .update(cirugia)
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
