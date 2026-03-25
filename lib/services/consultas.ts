// Servicios de Consultas (Historia Clínica)
import { supabase } from '../supabase'
import { Consulta, ApiResponse } from '../types'

export interface ConsultaConDatos extends Consulta {
  mascotas?: { nombre: string; especie: string }
  usuarios?: { nombre: string }
}

export async function getConsultas(clinicaId: string): Promise<ApiResponse<Consulta[]>> {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getConsultasConDatos(clinicaId: string): Promise<ApiResponse<ConsultaConDatos[]>> {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .select('*, mascotas(nombre, especie), usuarios(nombre)')
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data: data as ConsultaConDatos[], error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getConsultasByMascota(mascotaId: string, clinicaId: string): Promise<ApiResponse<Consulta[]>> {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('id_mascota', mascotaId)
      .eq('id_clinica', clinicaId)
      .order('fecha', { ascending: false })
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getConsultaById(id: string, clinicaId: string): Promise<ApiResponse<Consulta>> {
  try {
    const { data, error } = await supabase
      .from('consultas')
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

export async function createConsulta(consulta: Omit<Consulta, 'id' | 'created_at'>): Promise<ApiResponse<Consulta>> {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .insert([consulta])
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function updateConsulta(id: string, clinicaId: string, consulta: Partial<Consulta>): Promise<ApiResponse<Consulta>> {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .update(consulta)
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

export async function deleteConsulta(id: string, clinicaId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('consultas')
      .delete()
      .eq('id', id)
      .eq('id_clinica', clinicaId)
    
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}
