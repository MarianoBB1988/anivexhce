'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, Bug, FileUp, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { useDuenos } from '@/hooks/use-duenos'
import { useMascotas } from '@/hooks/use-mascotas'
import { useUserList } from '@/hooks/use-usuarios'
import { createImagen, getDocumentos, uploadDocumento } from '@/lib/services'
import { TIPOS_IMAGEN, REGIONES, type TipoImagen } from '@/components/forms/imagen-form'

type LogLevel = 'info' | 'success' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  details?: unknown
}

interface FormState {
  id_dueno: string
  id_mascota: string
  id_usuario: string
  fecha: string
  tipo: TipoImagen | ''
  region: string
  hallazgos: string
  observaciones: string
}

const initialFormState = (): FormState => ({
  id_dueno: '',
  id_mascota: '',
  id_usuario: '',
  fecha: new Date().toISOString().split('T')[0] || '',
  tipo: '',
  region: '',
  hallazgos: '',
  observaciones: '',
})

export default function ImagenesTestPage() {
  const { user } = useAuth()
  const { data: duenos } = useDuenos()
  const { data: mascotas } = useMascotas()
  const { data: usuarios } = useUserList()

  const [form, setForm] = useState<FormState>(initialFormState)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [createdImageId, setCreatedImageId] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  const filteredMascotas = useMemo(
    () => (form.id_dueno ? mascotas.filter((mascota) => mascota.id_dueno === form.id_dueno) : []),
    [mascotas, form.id_dueno]
  )

  const pushLog = (level: LogLevel, message: string, details?: unknown) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    }

    setLogs((current) => [entry, ...current])

    const consoleMethod = level === 'error' ? console.error : level === 'success' ? console.info : console.log
    consoleMethod(`[ImagenesTest] ${message}`, details ?? '')
  }

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const validateCreate = () => {
    if (!user) {
      pushLog('error', 'No hay usuario autenticado.')
      return false
    }

    if (!form.id_mascota || !form.fecha || !form.tipo) {
      pushLog('error', 'Faltan campos requeridos para crear imagenologia.', form)
      return false
    }

    return true
  }

  const handleCreate = async () => {
    if (!validateCreate() || !user) return

    setIsCreating(true)
    try {
      const payload = Object.fromEntries(
        Object.entries({
          id_mascota: form.id_mascota,
          id_usuario: form.id_usuario || undefined,
          fecha: form.fecha,
          tipo: form.tipo,
          region: form.region || undefined,
          hallazgos: form.hallazgos || undefined,
          observaciones: form.observaciones || undefined,
          id_clinica: user.id_clinica,
        }).filter(([, value]) => value !== undefined && value !== '')
      )

      pushLog('info', 'Creando imagenologia...', payload)
      const response = await createImagen(payload as any)
      pushLog(response.success ? 'success' : 'error', 'Respuesta de createImagen', response)

      if (response.success && response.data?.id) {
        setCreatedImageId(response.data.id)
      }
    } catch (error) {
      pushLog('error', 'Excepcion al crear imagenologia', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpload = async () => {
    if (!user) {
      pushLog('error', 'No hay usuario autenticado.')
      return
    }

    if (!createdImageId) {
      pushLog('error', 'Primero creá una imagenologia para obtener el ID.')
      return
    }

    if (!selectedFile) {
      pushLog('error', 'Seleccioná un archivo antes de subirlo.')
      return
    }

    setIsUploading(true)
    try {
      pushLog('info', 'Subiendo archivo con uploadDocumento...', {
        fileName: selectedFile.name,
        imageId: createdImageId,
        clinicaId: user.id_clinica,
      })

      const response = await uploadDocumento(selectedFile, createdImageId, 'imagen', user.id_clinica)
      pushLog(response.success ? 'success' : 'error', 'Respuesta de uploadDocumento', response)
    } catch (error) {
      pushLog('error', 'Excepcion al subir archivo', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateAndUpload = async () => {
    await handleCreate()
  }

  const handleFetchDocuments = async () => {
    if (!user) {
      pushLog('error', 'No hay usuario autenticado.')
      return
    }

    if (!createdImageId) {
      pushLog('error', 'No hay imageId creado todavía.')
      return
    }

    setIsLoadingDocs(true)
    try {
      pushLog('info', 'Consultando documentos asociados...', {
        imageId: createdImageId,
        clinicaId: user.id_clinica,
      })
      const response = await getDocumentos(createdImageId, 'imagen', user.id_clinica)
      pushLog(response.success ? 'success' : 'error', 'Respuesta de getDocumentos', response)
    } catch (error) {
      pushLog('error', 'Excepcion al consultar documentos', error)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prueba de Imagenologias</h1>
        <p className="text-muted-foreground">
          Crea una imagenologia, sube un archivo a Storage y registra el documento mostrando logs detallados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="size-5" />
            Datos de prueba
          </CardTitle>
          <CardDescription>
            Esta pantalla no modifica el flujo productivo. Sirve para aislar el problema de adjuntos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Dueño</Label>
              <Select
                value={form.id_dueno}
                onValueChange={(value) => {
                  updateForm('id_dueno', value)
                  updateForm('id_mascota', '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dueño" />
                </SelectTrigger>
                <SelectContent>
                  {duenos.map((dueno) => (
                    <SelectItem key={dueno.id} value={dueno.id}>{dueno.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mascota</Label>
              <Select value={form.id_mascota} onValueChange={(value) => updateForm('id_mascota', value)} disabled={!form.id_dueno}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mascota" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMascotas.map((mascota) => (
                    <SelectItem key={mascota.id} value={mascota.id}>{mascota.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Veterinario</Label>
              <Select value={form.id_usuario} onValueChange={(value) => updateForm('id_usuario', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar veterinario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>{usuario.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(event) => updateForm('fecha', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(value) => updateForm('tipo', value as TipoImagen)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_IMAGEN.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Región</Label>
              <Select value={form.region} onValueChange={(value) => updateForm('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar región" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONES.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hallazgos</Label>
            <Textarea value={form.hallazgos} onChange={(event) => updateForm('hallazgos', event.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(event) => updateForm('observaciones', event.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Archivo</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {selectedFile.name} ({selectedFile.type || 'sin mime'})
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              <Save className="size-4" />
              {isCreating ? 'Creando...' : '1. Crear imagenologia'}
            </Button>

            <Button onClick={handleUpload} disabled={isUploading || !createdImageId || !selectedFile} variant="secondary" className="gap-2">
              <FileUp className="size-4" />
              {isUploading ? 'Subiendo...' : '2. Subir archivo'}
            </Button>

            <Button onClick={handleFetchDocuments} disabled={isLoadingDocs || !createdImageId} variant="outline" className="gap-2">
              <ArrowUpRight className="size-4" />
              {isLoadingDocs ? 'Consultando...' : '3. Ver documentos'}
            </Button>

            <Button onClick={handleCreateAndUpload} variant="ghost" disabled>
              Crear + subir
            </Button>
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p><strong>imageId creado:</strong> {createdImageId || 'todavía no hay'}</p>
            <p><strong>id_clinica:</strong> {user?.id_clinica || 'sin usuario'}</p>
            <p><strong>tipo_entidad usado para documentos:</strong> imagen</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>También salen en la consola del navegador con prefijo [ImagenesTest].</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay logs.</p>
            ) : (
              logs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={
                      log.level === 'error'
                        ? 'text-sm font-medium text-destructive'
                        : log.level === 'success'
                          ? 'text-sm font-medium text-emerald-600'
                          : 'text-sm font-medium'
                    }>
                      {log.message}
                    </span>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                  {log.details !== undefined && (
                    <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}