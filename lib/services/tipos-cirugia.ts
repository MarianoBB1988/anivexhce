// Servicios de Tipos de Cirugía
import { supabase } from '../supabase'
import { TipoCirugia, ApiResponse } from '../types'

export async function getTiposCirugia(): Promise<ApiResponse<TipoCirugia[]>> {
  try {
    const { data, error } = await supabase
      .from('tipos_cirugia')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createTipoCirugia(nombre: string, descripcion?: string): Promise<ApiResponse<TipoCirugia>> {
  try {
    const { data, error } = await supabase
      .from('tipos_cirugia')
      .insert([{ nombre, descripcion: descripcion || null }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateTipoCirugia(id: string, nombre: string, descripcion?: string): Promise<ApiResponse<TipoCirugia>> {
  try {
    const { data, error } = await supabase
      .from('tipos_cirugia')
      .update({ nombre, descripcion: descripcion ?? null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteTipoCirugia(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('tipos_cirugia')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
