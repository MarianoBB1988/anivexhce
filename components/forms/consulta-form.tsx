 'use client'

import { useState, useRef } from 'react'
import { Paperclip, X as XIcon, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Dueno, Mascota, Usuario } from '@/lib/types'

export const emptyConsultaForm = {
  id_mascota: '',
  id_usuario: '',
  fecha_date: '',
  fecha_time: '',
  motivo: '',
  diagnostico: '',
  tratamiento: '',
  observaciones: '',
  _duenoId: '',
}

export type ConsultaFormData = typeof emptyConsultaForm

interface Props {
  initial?: Partial<ConsultaFormData>
  duenos?: Dueno[]
  mascotas?: Mascota[]
  usuarios: Usuario[]
  editingId: string | null
  /** Si está definido, oculta los selectores de dueño/mascota y usa esta ID */
  fixedMascotaId?: string
  loading?: boolean
  onSubmit: (data: ConsultaFormData, files: File[]) => Promise<void>
  onCancel: () => void
}

export function ConsultaForm({
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
  const [formData, setFormData] = useState<ConsultaFormData>({
    ...emptyConsultaForm,
    ...initial,
    ...(fixedMascotaId ? { id_mascota: fixedMascotaId } : {}),
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [duenoOpen, setDuenoOpen] = useState(false)
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
            <Popover open={duenoOpen} onOpenChange={setDuenoOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{duenos.find(d => d.id === selectedDuenoId)?.nombre || 'Seleccionar dueño'}</span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar dueño..." />
                  <CommandList>
                    <CommandEmpty>No encontrado.</CommandEmpty>
                    <CommandGroup>
                      {duenos.map(d => (
                        <CommandItem key={d.id} value={d.nombre} onSelect={() => {
                          setSelectedDuenoId(d.id)
                          setFormData(p => ({ ...p, id_mascota: '', _duenoId: d.id }))
                          setDuenoOpen(false)
                        }}>
                          <Check className={cn('mr-2 size-4', selectedDuenoId === d.id ? 'opacity-100' : 'opacity-0')} />
                          {d.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          <Label>Veterinario</Label>
          <Select value={formData.id_usuario} onValueChange={v => setFormData(p => ({ ...p, id_usuario: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar veterinario" /></SelectTrigger>
            <SelectContent>
              {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Fecha <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={formData.fecha_date}
              onChange={e => setFormData(p => ({ ...p, fecha_date: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hora</Label>
            <Input
              type="time"
              value={formData.fecha_time}
              onChange={e => setFormData(p => ({ ...p, fecha_time: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Motivo <span className="text-destructive">*</span></Label>
        <Input
          value={formData.motivo}
          onChange={e => setFormData(p => ({ ...p, motivo: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Diagnóstico</Label>
          <Textarea rows={3} value={formData.diagnostico} onChange={e => setFormData(p => ({ ...p, diagnostico: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Tratamiento</Label>
          <Textarea rows={3} value={formData.tratamiento} onChange={e => setFormData(p => ({ ...p, tratamiento: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Observaciones</Label>
        <Textarea rows={2} value={formData.observaciones} onChange={e => setFormData(p => ({ ...p, observaciones: e.target.value }))} />
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
