import { supabase } from '../supabase'
import { Raza, ApiResponse } from '../types'

export async function getRazas(): Promise<ApiResponse<Raza[]>> {
  try {
    const { data, error } = await supabase
      .from('razas')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
