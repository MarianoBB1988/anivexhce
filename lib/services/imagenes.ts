// Servicios de Imágenes Diagnósticas
import { supabase } from '../supabase'
import { ImagenDiagnostica, ApiResponse } from '../types'

export async function getImagenes(clinicaId: string): Promise<ApiResponse<ImagenDiagnostica[]>> {
  try {
    const { data, error } = await supabase
      .from('imagenes_diagnosticas')
      .select('*, mascotas(nombre, especie), usuarios(nombre)')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function getImagenesByMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<ImagenDiagnostica[]>> {
  try {
    const { data, error } = await supabase
      .from('imagenes_diagnosticas')
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

export async function createImagen(imagen: Omit<ImagenDiagnostica, 'id' | 'created_at'>): Promise<ApiResponse<ImagenDiagnostica>> {
  try {
    const payload = Object.fromEntries(Object.entries(imagen).filter(([, v]) => v !== undefined && v !== ''))
    const { data, error } = await supabase
      .from('imagenes_diagnosticas')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}

export async function updateImagen(id: string, clinicaId: string, imagen: Partial<ImagenDiagnostica>): Promise<ApiResponse<ImagenDiagnostica>> {
  try {
    const payload = Object.fromEntries(Object.entries(imagen).filter(([, v]) => v !== undefined))
    const { data, error } = await supabase
      .from('imagenes_diagnosticas')
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

export async function deleteImagen(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('imagenes_diagnosticas')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || String(error), success: false }
  }
}
