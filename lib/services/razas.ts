// Servicios de Razas
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

export async function createRaza(nombre: string, id_especie: string): Promise<ApiResponse<Raza>> {
  try {
    const { data, error } = await supabase
      .from('razas')
      .insert([{ nombre, id_especie }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateRaza(id: string, nombre: string, id_especie: string): Promise<ApiResponse<Raza>> {
  try {
    const { data, error } = await supabase
      .from('razas')
      .update({ nombre, id_especie })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteRaza(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('razas')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
