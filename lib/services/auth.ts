// Servicios de Autenticación
import { supabase } from '../supabase'
import { Usuario, AuthUser, ApiResponse } from '../types'
import { Session } from '@supabase/supabase-js'

export async function getCurrentUser(session?: Session | null): Promise<ApiResponse<AuthUser | null>> {
  try {
    let authUser = session?.user

    if (!authUser) {
      const { data: { session: currentSession }, error: authError } = await supabase.auth.getSession()
      if (authError || !currentSession?.user) {
        return { data: null, error: authError?.message || 'No authenticated', success: false }
      }
      authUser = currentSession.user
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (error) throw error
    
    return { 
      data: { 
        ...(data as Usuario),
        email: authUser.email || ''
      }, 
      error: null, 
      success: true 
    }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function signUp(email: string, password: string): Promise<ApiResponse<{ user: any; session: any }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function signIn(email: string, password: string): Promise<ApiResponse<{ user: any; session: any }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function resetPassword(email: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updatePassword(newPassword: string): Promise<ApiResponse<{ user: any }>> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

// Verificar si usuario tiene permiso para acceder a una clínica
export async function hasAccessToClinica(userId: string, clinicaId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .eq('clinica_id', clinicaId)
      .single()
    
    return !error && !!data
  } catch {
    return false
  }
}

// Obtener clínica del usuario autenticado
export async function getUserClinica(): Promise<string | null> {
  try {
    const user = await getCurrentUser()
    
    if (!user.success || !user.data) return null
    return user.data.id_clinica
  } catch {
    return null
  }
}
