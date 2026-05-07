// Servicios de Mascotas
import { supabase } from '../supabase'
import { Mascota, ApiResponse } from '../types'

export interface MascotaConDueno extends Mascota {
  duenos?: { nombre: string; email: string; telefono: string }
}

async function findMascotaByNombreYDueno(
  clinicaId: string,
  duenoId: string,
  nombre: string,
  excludeId?: string,
): Promise<ApiResponse<Mascota | null>> {
  try {
    let query = supabase
      .from('mascotas')
      .select('*')
      .eq('id_clinica', clinicaId)
      .eq('id_dueno', duenoId)
      .ilike('nombre', nombre.trim())

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query.limit(1).maybeSingle()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getMascotas(clinicaId: string): Promise<ApiResponse<Mascota[]>> {
  try {
    const { data, error } = await supabase
      .from('mascotas')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getMascotasConDueno(clinicaId: string): Promise<ApiResponse<MascotaConDueno[]>> {
  try {
    const { data, error } = await supabase
      .from('mascotas')
      .select('*, duenos(nombre, email, telefono)')
      .eq('id_clinica', clinicaId)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return { data: data as MascotaConDueno[], error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getMascotaById(id: string, clinicaId: string): Promise<ApiResponse<Mascota>> {
  try {
    const { data, error } = await supabase
      .from('mascotas')
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

export async function getMascotasByDueno(duenoId: string, clinicaId: string): Promise<ApiResponse<Mascota[]>> {
  try {
    const { data, error } = await supabase
      .from('mascotas')
      .select('*')
      .eq('id_dueno', duenoId)
      .eq('id_clinica', clinicaId)
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function createMascota(mascota: Omit<Mascota, 'id' | 'created_at'>): Promise<ApiResponse<Mascota>> {
  try {
    const duplicateCheck = await findMascotaByNombreYDueno(mascota.id_clinica, mascota.id_dueno, mascota.nombre)
    if (!duplicateCheck.success) {
      return { data: null, error: duplicateCheck.error, success: false }
    }
    if (duplicateCheck.data) {
      return {
        data: null,
        error: 'Ya existe una mascota con ese nombre para el mismo dueño.',
        success: false,
      }
    }

    const { data, error } = await supabase
      .from('mascotas')
      .insert([mascota])
      .select()
      .single()

    if (error) throw error
    return { data, error: null, success: true }
  } catch (error: any) {
    return { data: null, error: error?.message || JSON.stringify(error), success: false }
  }
}

export async function updateMascota(id: string, clinicaId: string, mascota: Partial<Mascota>): Promise<ApiResponse<Mascota>> {
  try {
    if (mascota.nombre || mascota.id_dueno) {
      const currentMascotaResponse = await getMascotaById(id, clinicaId)
      if (!currentMascotaResponse.success || !currentMascotaResponse.data) {
        return {
          data: null,
          error: currentMascotaResponse.error || 'No se pudo validar la mascota actual.',
          success: false,
        }
      }

      const nombreObjetivo = mascota.nombre ?? currentMascotaResponse.data.nombre
      const duenoObjetivo = mascota.id_dueno ?? currentMascotaResponse.data.id_dueno
      const duplicateCheck = await findMascotaByNombreYDueno(clinicaId, duenoObjetivo, nombreObjetivo, id)

      if (!duplicateCheck.success) {
        return { data: null, error: duplicateCheck.error, success: false }
      }

      if (duplicateCheck.data) {
        return {
          data: null,
          error: 'Ya existe una mascota con ese nombre para el mismo dueño.',
          success: false,
        }
      }
    }

    const { data, error } = await supabase
      .from('mascotas')
      .update(mascota)
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

export async function deleteMascota(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('mascotas')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
