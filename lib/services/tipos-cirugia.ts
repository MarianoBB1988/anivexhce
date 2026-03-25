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
