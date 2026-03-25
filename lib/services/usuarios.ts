// Servicios de Usuarios
import { supabase } from '../supabase'
import { Usuario, ApiResponse } from '../types'

export async function getUsuarios(clinicaId: string): Promise<ApiResponse<Usuario[]>> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getUsuarioById(id: string, clinicaId: string): Promise<ApiResponse<Usuario>> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .eq('id_clinica', clinicaId)
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getVeterinarios(clinicaId: string): Promise<ApiResponse<Usuario[]>> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_clinica', clinicaId)
      .eq('rol', 'veterinario')
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createUsuario(usuario: Omit<Usuario, 'created_at'>): Promise<ApiResponse<Usuario>> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuario])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateUsuario(id: string, clinicaId: string, usuario: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update(usuario)
      .eq('id', id)
      .eq('id_clinica', clinicaId)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteUsuario(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
