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

    // Primero buscar en tabla de usuarios (staff)
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (!userError && userData) {
      return { 
        data: { 
          ...(userData as Usuario),
          email: authUser.email || ''
        }, 
        error: null, 
        success: true 
      }
    }

    // Si no es staff, buscar en tabla de dueños (portal)
    const { data: duenoData, error: duenoError } = await supabase
      .from('duenos')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single()

    if (duenoError) throw duenoError

    return {
      data: {
        id: duenoData.id,
        nombre: duenoData.nombre,
        rol: 'dueno' as const,
        id_clinica: duenoData.id_clinica,
        created_at: duenoData.created_at,
        email: authUser.email || '',
        primer_login: duenoData.primer_login ?? true,
      },
      error: null,
      success: true,
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
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    
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
