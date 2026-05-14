import { supabase } from '../supabase'
import { Documento, ApiResponse } from '../types'

const STORAGE_UPLOAD_TIMEOUT_BASE_MS = 180000
const STORAGE_UPLOAD_TIMEOUT_MAX_MS = 600000
const DOCUMENTOS_QUERY_TIMEOUT_MS = 15000

function getStorageUploadTimeoutMs(fileSize: number): number {
  const sizeBasedTimeoutMs = Math.ceil(fileSize / 256000) * 1000
  return Math.min(
    STORAGE_UPLOAD_TIMEOUT_MAX_MS,
    Math.max(STORAGE_UPLOAD_TIMEOUT_BASE_MS, sizeBasedTimeoutMs)
  )
}

function formatSupabaseError(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string }
    return [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter(Boolean)
      .join(' | ')
  }

  return String(error)
}

function serializeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>
    return {
      ...candidate,
      message: typeof candidate.message === 'string' ? candidate.message : formatSupabaseError(error),
    }
  }

  return { message: String(error) }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function getDocumentos(
  idEntidad: string,
  tipoEntidad: string,
  clinicaId: string,
): Promise<ApiResponse<Documento[]>> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('documentos')
        .select('*')
        .eq('id_entidad', idEntidad)
        .eq('tipo_entidad', tipoEntidad)
        .eq('id_clinica', clinicaId)
        .order('created_at', { ascending: false }),
      DOCUMENTOS_QUERY_TIMEOUT_MS,
      `Timeout consultando documentos (${DOCUMENTOS_QUERY_TIMEOUT_MS}ms)`
    )
    if (error) throw error
    return { data, error: null, success: true }
  } catch (error) {
    return { data: null, error: formatSupabaseError(error), success: false }
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
    const timeoutMs = getStorageUploadTimeoutMs(file.size)
    const uploadStartedAt = performance.now()

    console.log('[uploadDocumento] storage upload start', {
      fileName: file.name,
      idEntidad,
      tipoEntidad,
      clinicaId,
      storagePath,
      size: file.size,
      mimeType: file.type,
      timeoutMs,
    })

    const { error: uploadError } = await withTimeout(
      supabase.storage
        .from('documentos')
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type || undefined,
        }),
      timeoutMs,
      `Timeout subiendo archivo a storage (${timeoutMs}ms)`
    )

    console.log('[uploadDocumento] storage upload end', {
      fileName: file.name,
      storagePath,
      uploadError,
      elapsedMs: Math.round(performance.now() - uploadStartedAt),
    })

    if (uploadError) throw uploadError

    const rowToInsert = {
      id_clinica: clinicaId,
      tipo_entidad: tipoEntidad,
      id_entidad: idEntidad,
      nombre: file.name,
      url: storagePath,
    }

    const { error } = await supabase
      .from('documentos')
      .insert(rowToInsert)

    console.log('[uploadDocumento] documentos insert end', {
      fileName: file.name,
      rowToInsert,
      error,
    })

    if (error) {
      console.error('[uploadDocumento] insert failed', {
        fileName: file.name,
        idEntidad,
        tipoEntidad,
        clinicaId,
        storagePath,
        rowToInsert,
        error: serializeErrorDetails(error),
      })
      await supabase.storage.from('documentos').remove([storagePath])
      throw error
    }
    return {
      data: {
        id: '',
        created_at: undefined,
        ...rowToInsert,
      },
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('[uploadDocumento] failed', {
      fileName: file.name,
      idEntidad,
      tipoEntidad,
      clinicaId,
      error: serializeErrorDetails(error),
    })
    return { data: null, error: formatSupabaseError(error), success: false }
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
    return { data: null, error: formatSupabaseError(error), success: false }
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
