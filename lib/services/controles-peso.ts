// Servicios de Controles de Peso
import { supabase } from '../supabase'
import { ApiResponse, ControlPeso } from '../types'

export async function getControlesPeso(clinicaId: string): Promise<ApiResponse<ControlPeso[]>> {
  try {
    const { data, error } = await supabase
      .from('controles_peso')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function getControlesPesoByMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<ControlPeso[]>> {
  try {
    const { data, error } = await supabase
      .from('controles_peso')
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

export async function createControlPeso(control: Omit<ControlPeso, 'id' | 'created_at'>): Promise<ApiResponse<ControlPeso>> {
  try {
    const payload = Object.fromEntries(Object.entries(control).filter(([, value]) => value !== undefined && value !== ''))
    const { data, error } = await supabase
      .from('controles_peso')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function updateControlPeso(id: string, clinicaId: string, control: Partial<ControlPeso>): Promise<ApiResponse<ControlPeso>> {
  try {
    const payload = Object.fromEntries(Object.entries(control).filter(([, value]) => value !== undefined))
    const { data, error } = await supabase
      .from('controles_peso')
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

export async function deleteControlPeso(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('controles_peso')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)

    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}