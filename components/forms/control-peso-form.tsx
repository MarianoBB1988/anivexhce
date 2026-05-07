'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronsUpDown, Minus, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Dueno, Mascota, Usuario } from '@/lib/types'

export const emptyControlPesoForm = {
  id_mascota: '',
  id_usuario: '',
  fecha_date: '',
  fecha_time: '',
  peso: '',
  observaciones: '',
  _duenoId: '',
}

export type ControlPesoFormData = typeof emptyControlPesoForm

interface Props {
  initial?: Partial<ControlPesoFormData>
  duenos?: Dueno[]
  mascotas?: Mascota[]
  usuarios: Usuario[]
  editingId: string | null
  fixedMascotaId?: string
  previousPeso?: number | null
  loading?: boolean
  onSubmit: (data: ControlPesoFormData) => Promise<void>
  onCancel: () => void
}

type DatePreset = 'today' | 'yesterday' | 'week'

function getDateParts(offsetDays: number) {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)

  return {
    date: value.toISOString().split('T')[0],
    time: value.toTimeString().slice(0, 5),
  }
}

function formatWeight(weight: number) {
  return `${weight.toFixed(2)} kg`
}

export function ControlPesoForm({
  initial = {},
  duenos = [],
  mascotas = [],
  usuarios,
  editingId,
  fixedMascotaId,
  previousPeso,
  loading = false,
  onSubmit,
  onCancel,
}: Props) {
  const now = getDateParts(0)
  const [selectedDuenoId, setSelectedDuenoId] = useState(initial._duenoId || '')
  const [duenoOpen, setDuenoOpen] = useState(false)
  const [formData, setFormData] = useState<ControlPesoFormData>({
    ...emptyControlPesoForm,
    fecha_date: now.date,
    fecha_time: now.time,
    ...initial,
    ...(fixedMascotaId ? { id_mascota: fixedMascotaId } : {}),
  })

  const filteredMascotas = selectedDuenoId
    ? mascotas.filter((mascota) => mascota.id_dueno === selectedDuenoId)
    : []

  const selectedMascota = useMemo(() => {
    return mascotas.find((mascota) => mascota.id === formData.id_mascota) ?? null
  }, [formData.id_mascota, mascotas])

  const referencePeso = previousPeso ?? selectedMascota?.peso ?? null
  const parsedPeso = formData.peso.trim() ? Number.parseFloat(formData.peso) : null
  const delta = parsedPeso != null && referencePeso != null ? parsedPeso - referencePeso : null

  const deltaMeta = useMemo(() => {
    if (delta == null) return null
    if (Math.abs(delta) < 0.001) {
      return {
        label: 'Sin cambio',
        icon: Minus,
        className: 'border-border text-muted-foreground',
      }
    }

    if (delta > 0) {
      return {
        label: `+${delta.toFixed(2)} kg`,
        icon: TrendingUp,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    }

    return {
      label: `${delta.toFixed(2)} kg`,
      icon: TrendingDown,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    }
  }, [delta])

  const applyPreset = (preset: DatePreset) => {
    const offset = preset === 'today' ? 0 : preset === 'yesterday' ? -1 : -7
    const value = getDateParts(offset)
    setFormData((prev) => ({
      ...prev,
      fecha_date: value.date,
      fecha_time: value.time,
    }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(formData)
      }}
      className="space-y-4"
    >
      {!fixedMascotaId && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Dueño</Label>
            <Popover open={duenoOpen} onOpenChange={setDuenoOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{duenos.find((dueno) => dueno.id === selectedDuenoId)?.nombre || 'Seleccionar dueño'}</span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar dueño..." />
                  <CommandList>
                    <CommandEmpty>No encontrado.</CommandEmpty>
                    <CommandGroup>
                      {duenos.map((dueno) => (
                        <CommandItem
                          key={dueno.id}
                          value={dueno.nombre}
                          onSelect={() => {
                            setSelectedDuenoId(dueno.id)
                            setFormData((prev) => ({ ...prev, id_mascota: '', _duenoId: dueno.id }))
                            setDuenoOpen(false)
                          }}
                        >
                          <Check className={cn('mr-2 size-4', selectedDuenoId === dueno.id ? 'opacity-100' : 'opacity-0')} />
                          {dueno.nombre}
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
              onValueChange={(value) => setFormData((prev) => ({ ...prev, id_mascota: value }))}
              disabled={!selectedDuenoId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedDuenoId ? 'Seleccionar mascota' : 'Primero seleccioná el dueño'} />
              </SelectTrigger>
              <SelectContent>
                {filteredMascotas.map((mascota) => (
                  <SelectItem key={mascota.id} value={mascota.id}>
                    {mascota.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Scale className="size-4 text-muted-foreground" />
                Control de peso
              </div>
              <p className="text-sm text-muted-foreground">
                Registrá el peso actual y comparalo con el último valor conocido.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {referencePeso != null && (
                <Badge variant="secondary">Anterior: {formatWeight(referencePeso)}</Badge>
              )}
              {deltaMeta && (
                <Badge variant="outline" className={cn('gap-1.5', deltaMeta.className)}>
                  <deltaMeta.icon className="size-3.5" />
                  {deltaMeta.label}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-1.5">
              <Label>Peso actual (kg) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  value={formData.peso}
                  onChange={(event) => setFormData((prev) => ({ ...prev, peso: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === ',') event.preventDefault()
                  }}
                  className="pr-12 text-base"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  kg
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Veterinario</Label>
              <Select
                value={formData.id_usuario}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, id_usuario: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar veterinario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4 text-muted-foreground" />
          Fecha del control
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('today')}>Hoy</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('yesterday')}>Ayer</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('week')}>Hace 7 días</Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fecha <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={formData.fecha_date}
              onChange={(event) => setFormData((prev) => ({ ...prev, fecha_date: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hora</Label>
            <Input
              type="time"
              value={formData.fecha_time}
              onChange={(event) => setFormData((prev) => ({ ...prev, fecha_time: event.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Observaciones</Label>
        <Textarea
          rows={3}
          placeholder="Ej: dieta nueva, retención de líquidos, ajuste de medicación..."
          value={formData.observaciones}
          onChange={(event) => setFormData((prev) => ({ ...prev, observaciones: event.target.value }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading || !formData.id_mascota || !formData.peso.trim()}>
          {loading ? 'Guardando…' : editingId ? 'Actualizar control' : 'Guardar control'}
        </Button>
      </DialogFooter>
    </form>
  )
}