// Servicios de Tipos de Vacuna
import { supabase } from '../supabase'
import { TipoVacuna, ApiResponse } from '../types'

export async function getTiposVacuna(): Promise<ApiResponse<TipoVacuna[]>> {
  try {
    const { data, error } = await supabase
      .from('tipos_vacuna')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createTipoVacuna(nombre: string): Promise<ApiResponse<TipoVacuna>> {
  try {
    const { data, error } = await supabase
      .from('tipos_vacuna')
      .insert([{ nombre }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateTipoVacuna(id: string, nombre: string): Promise<ApiResponse<TipoVacuna>> {
  try {
    const { data, error } = await supabase
      .from('tipos_vacuna')
      .update({ nombre })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteTipoVacuna(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('tipos_vacuna')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
