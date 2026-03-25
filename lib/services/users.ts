import { supabase } from '@/lib/supabase'
import { Usuario } from '@/lib/types'

export const usersService = {
  // Obtener usuario actual
  async getCurrentUser(): Promise<Usuario | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data as Usuario
  },

  // Obtener usuario por ID
  async getUser(id: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data as Usuario
  },

  // Obtener todos los usuarios de una clínica
  async getClinicaUsers(clinicaId: string): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('nombre')

    if (error) {
      console.error('Error fetching clinic users:', error)
      return []
    }

    return data as Usuario[]
  },

  // Crear usuario (después del registro en Auth)
  async createUser(
    id: string,
    nombre: string,
    clinicaId: string,
    rol: 'admin' | 'veterinario' | 'asistente' = 'asistente'
  ): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          id,
          nombre,
          id_clinica: clinicaId,
          rol,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data as Usuario
  },

  // Actualizar usuario
  async updateUser(id: string, updates: Partial<Usuario>): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data as Usuario
  },

  // Eliminar usuario
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return false
    }

    return true
  },
}
