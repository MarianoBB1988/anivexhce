// Servicios de Especies
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

export async function createEspecie(nombre: string): Promise<ApiResponse<Especie>> {
  try {
    const { data, error } = await supabase
      .from('especies')
      .insert([{ nombre }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateEspecie(id: string, nombre: string): Promise<ApiResponse<Especie>> {
  try {
    const { data, error } = await supabase
      .from('especies')
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

export async function deleteEspecie(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('especies')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
