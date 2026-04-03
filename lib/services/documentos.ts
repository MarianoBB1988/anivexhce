import { supabase } from '../supabase'
import { Documento, ApiResponse } from '../types'

export async function getDocumentos(
  idEntidad: string,
  tipoEntidad: string,
  clinicaId: string,
): Promise<ApiResponse<Documento[]>> {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('id_entidad', idEntidad)
      .eq('tipo_entidad', tipoEntidad)
      .eq('id_clinica', clinicaId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function uploadDocumento(
  file: File,
  idEntidad: string,
  tipoEntidad: 'consulta' | 'cirugia' | 'analisis' | 'imagen',
  clinicaId: string,
): Promise<ApiResponse<Documento>> {
  try {
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${clinicaId}/${tipoEntidad}/${idEntidad}/${Date.now()}-${safeFilename}`

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, file, { upsert: false })
    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('documentos')
      .insert({
        id_clinica: clinicaId,
        tipo_entidad: tipoEntidad,
        id_entidad: idEntidad,
        nombre: file.name,
        url: storagePath,
      })
      .select()
      .single()
    if (error) {
      await supabase.storage.from('documentos').remove([storagePath])
      throw error
    }
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function deleteDocumento(
  doc: Documento,
  clinicaId: string,
): Promise<ApiResponse<null>> {
  try {
    await supabase.storage.from('documentos').remove([doc.url])
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', doc.id)
      .eq('id_clinica', clinicaId)
    if (error) throw error
    return { data: null, error: null, success: true }
  } catch (error) {
    return { data: null, error: String(error), success: false }
  }
}

export async function getDocumentoUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(storagePath, 60 * 60) // 1 hora de validez
  if (error || !data?.signedUrl) {
    // fallback a URL pública si el bucket es público
    return supabase.storage.from('documentos').getPublicUrl(storagePath).data.publicUrl
  }
  return data.signedUrl
}
