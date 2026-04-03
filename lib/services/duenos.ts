// Servicios de Dueños
import { supabase } from '../supabase'
import { Dueno, ApiResponse } from '../types'

export async function getDuenos(clinicaId: string): Promise<ApiResponse<Dueno[]>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getDuenoById(id: string, clinicaId: string): Promise<ApiResponse<Dueno>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
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

export async function createDueno(dueno: Omit<Dueno, 'id' | 'created_at'>): Promise<ApiResponse<Dueno>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .insert([dueno])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateDueno(id: string, clinicaId: string, dueno: Partial<Dueno>): Promise<ApiResponse<Dueno>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .update(dueno)
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

export async function deleteDueno(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('duenos')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function searchDuenos(clinicaId: string, query: string): Promise<ApiResponse<Dueno[]>> {
  try {
    const { data, error } = await supabase
      .from('duenos')
      .select('*')
      .eq('id_clinica', clinicaId)
      .or(`nombre.ilike.%${query}%,email.ilike.%${query}%,telefono.ilike.%${query}%`)
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

// Genera usuario y contraseña temporal a partir del nombre
export function generateOwnerCredentials(nombre: string): { usuario: string; password: string } {
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const parts = nombre.trim().split(/\s+/)
  const inicial = normalize(parts[0]?.charAt(0) || 'u')
  const apellido = normalize(parts.slice(1).join('')) || normalize(parts[0] || 'user')
  const usuario = inicial + apellido
  const digits = String(Math.floor(10 + Math.random() * 90))
  const letters =
    String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  const password = `${usuario}${digits}${letters}`
  return { usuario, password }
}

// Crea el usuario Supabase Auth para el dueño y guarda las credenciales en la tabla duenos
export async function createOwnerAccess(
  duenoId: string,
  clinicaId: string,
  nombre: string,
): Promise<ApiResponse<{ usuario: string; password: string }>> {
  try {
    const { usuario, password } = generateOwnerCredentials(nombre)
    const fakeEmail = `${usuario}@portal.anivex`

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el acceso')

    const { error: updateError } = await supabase
      .from('duenos')
      .update({
        usuario,
        auth_user_id: authData.user.id,
        primer_login: true,
        password_temp: password,
      })
      .eq('id', duenoId)
      .eq('id_clinica', clinicaId)

    if (updateError) throw updateError

    return { data: { usuario, password }, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
