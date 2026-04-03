'use client'

import { useState, useRef } from 'react'
import { Paperclip, X as XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Dueno, Mascota, Usuario } from '@/lib/types'

export const TIPOS_IMAGEN = ['Radiografía', 'Ecografía', 'TAC', 'Resonancia', 'Otro'] as const
export type TipoImagen = typeof TIPOS_IMAGEN[number]

export const REGIONES = [
  'Tórax',
  'Abdomen',
  'Cabeza',
  'Columna',
  'Pelvis',
  'Miembro anterior derecho',
  'Miembro anterior izquierdo',
  'Miembro posterior derecho',
  'Miembro posterior izquierdo',
  'Cráneo',
  'Nasal',
  'Dental',
  'Otro',
]

export const emptyImagenForm = {
  id_mascota: '',
  id_usuario: '',
  fecha: '',
  tipo: '' as TipoImagen | '',
  region: '',
  hallazgos: '',
  observaciones: '',
  _duenoId: '',
}

export type ImagenFormData = typeof emptyImagenForm

interface Props {
  initial?: Partial<ImagenFormData>
  duenos?: Dueno[]
  mascotas?: Mascota[]
  usuarios: Usuario[]
  editingId: string | null
  /** Si está definido, oculta los selectores de dueño/mascota y usa esta ID */
  fixedMascotaId?: string
  loading?: boolean
  onSubmit: (data: ImagenFormData, files: File[]) => Promise<void>
  onCancel: () => void
}

export function ImagenForm({
  initial = {},
  duenos = [],
  mascotas = [],
  usuarios,
  editingId,
  fixedMascotaId,
  loading = false,
  onSubmit,
  onCancel,
}: Props) {
  const [selectedDuenoId, setSelectedDuenoId] = useState(initial._duenoId || '')
  const [formData, setFormData] = useState<ImagenFormData>({
    ...emptyImagenForm,
    ...initial,
    ...(fixedMascotaId ? { id_mascota: fixedMascotaId } : {}),
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredMascotas = selectedDuenoId
    ? mascotas.filter(m => m.id_dueno === selectedDuenoId)
    : []

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(formData, pendingFiles) }}
      className="space-y-4"
    >
      {!fixedMascotaId && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Dueño</Label>
            <Select
              value={selectedDuenoId}
              onValueChange={(v) => {
                setSelectedDuenoId(v)
                setFormData(p => ({ ...p, id_mascota: '', _duenoId: v }))
              }}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar dueño" /></SelectTrigger>
              <SelectContent>
                {duenos.map(d => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mascota <span className="text-destructive">*</span></Label>
            <Select
              value={formData.id_mascota}
              onValueChange={v => setFormData(p => ({ ...p, id_mascota: v }))}
              disabled={!selectedDuenoId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedDuenoId ? 'Seleccionar mascota' : 'Primero seleccioná el dueño'} />
              </SelectTrigger>
              <SelectContent>
                {filteredMascotas.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo de imagen <span className="text-destructive">*</span></Label>
          <Select value={formData.tipo} onValueChange={v => setFormData(p => ({ ...p, tipo: v as TipoImagen }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
            <SelectContent>
              {TIPOS_IMAGEN.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fecha <span className="text-destructive">*</span></Label>
          <Input
            type="date"
            value={formData.fecha}
            onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Veterinario</Label>
          <Select value={formData.id_usuario} onValueChange={v => setFormData(p => ({ ...p, id_usuario: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar veterinario" /></SelectTrigger>
            <SelectContent>
              {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Región</Label>
          <Select value={formData.region} onValueChange={v => setFormData(p => ({ ...p, region: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar región" /></SelectTrigger>
            <SelectContent>
              {REGIONES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Hallazgos</Label>
        <Textarea
          rows={3}
          placeholder="Describí los hallazgos del estudio..."
          value={formData.hallazgos}
          onChange={e => setFormData(p => ({ ...p, hallazgos: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Observaciones</Label>
        <Textarea
          rows={2}
          placeholder="Notas adicionales..."
          value={formData.observaciones}
          onChange={e => setFormData(p => ({ ...p, observaciones: e.target.value }))}
        />
      </div>

      {!editingId && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Adjuntar archivos (opcional)</Label>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="size-4" />Agregar
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)])
                    e.target.value = ''
                  }
                }}
              />
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-1">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                    <span className="flex-1 truncate text-muted-foreground">{f.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="size-6"
                      onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <XIcon className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>
      </DialogFooter>
    </form>
  )
}
