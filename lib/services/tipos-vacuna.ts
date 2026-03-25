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
