import { supabase } from '../supabase'
import { Especie, ApiResponse } from '../types'

export async function getEspecies(): Promise<ApiResponse<Especie[]>> {
  try {
    const { data, error } = await supabase
      .from('especies')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
