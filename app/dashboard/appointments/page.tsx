'use client'

import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, CalendarIcon, List, PawPrint, Clock, Check, X, Dog, Cat, Bird, Rabbit, Stethoscope, Syringe, Scissors, ChevronsUpDown, Filter } from 'lucide-react'
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useTurnos } from "@/hooks/use-turnos"
import { useDuenos } from "@/hooks/use-duenos"
import { useMascotas } from "@/hooks/use-mascotas"
import { useUserList } from "@/hooks/use-usuarios"
import { useTiposVacuna } from "@/hooks/use-tipos-vacuna"
import { useTiposCirugia } from "@/hooks/use-tipos-cirugia"
import { useToast } from "@/hooks/use-toast"
import { createTurno, updateTurno, deleteTurno, createConsulta, createVacuna, createCirugia } from "@/lib/services"
import { Turno, Dueno, Mascota, Usuario, TipoVacuna, TipoCirugia } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const emptyForm = { id_mascota: '', id_usuario: '', fecha: '', hora: '', notas: '' }

const speciesIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Dog, Cat, Bird, Rabbit,
  perro: Dog, gato: Cat, ave: Bird, conejo: Rabbit,
}

type TurnoFormData = typeof emptyForm & { _ownerId?: string }

function TurnoForm({
  initial, duenos, mascotas, usuarios, turnos, editingId, onSubmit, onCancel, t,
}: {
  initial: TurnoFormData
  duenos: Dueno[]
  mascotas: Mascota[]
  usuarios: Usuario[]
  turnos: Turno[]
  editingId: string | null
  onSubmit: (data: TurnoFormData, selectedDate: Date) => Promise<void>
  onCancel: () => void
  t: (key: string) => string
}) {
  const { toast } = useToast()
  const [selectedOwnerId, setSelectedOwnerId] = useState(initial._ownerId || '')
  const [formData, setFormData] = useState(initial)
  const filteredMascotas = useMemo(
    () => mascotas.filter((m) => m.id_dueno === selectedOwnerId),
    [mascotas, selectedOwnerId]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id_mascota || !formData.fecha || !formData.hora) return
    const fecha_hora = `${formData.fecha}T${formData.hora}:00`
    const conflict = formData.id_usuario ? turnos.find(
      (t) =>
        t.id !== editingId &&
        t.estado !== 'ausente' &&
        t.id_usuario === formData.id_usuario &&
        t.fecha_hora.replace(' ', 'T').slice(0, 16) === fecha_hora.slice(0, 16)
    ) : undefined
    if (conflict) {
      toast({ title: t('turnoConflict'), description: t('turnoConflictDesc'), variant: 'destructive' })
      return
    }
    onSubmit(formData, new Date(`${formData.fecha}T12:00:00`))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-1">
        <div className="space-y-1.5">
          <Label>{t('owner')}</Label>
          <Select value={selectedOwnerId} onValueChange={(v) => { setSelectedOwnerId(v); setFormData((f) => ({ ...f, id_mascota: '', _ownerId: v })) }}>
            <SelectTrigger><SelectValue placeholder={t('selectOwner')} /></SelectTrigger>
            <SelectContent>{duenos.map((d) => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('pet')}</Label>
          <Select value={formData.id_mascota} onValueChange={(v) => setFormData((f) => ({ ...f, id_mascota: v }))} disabled={!selectedOwnerId}>
            <SelectTrigger><SelectValue placeholder={selectedOwnerId ? t('selectPet') : t('selectOwnerFirst')} /></SelectTrigger>
            <SelectContent>{filteredMascotas.map((m) => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('veterinarian')}</Label>
          <Select value={formData.id_usuario} onValueChange={(v) => setFormData((f) => ({ ...f, id_usuario: v }))}>
            <SelectTrigger><SelectValue placeholder={t('selectVeterinarian')} /></SelectTrigger>
            <SelectContent>{usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('date')}</Label>
          <Input type="date" value={formData.fecha} onChange={(e) => setFormData((f) => ({ ...f, fecha: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('time')}</Label>
          <Input type="time" value={formData.hora} onChange={(e) => setFormData((f) => ({ ...f, hora: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t('notes')}</Label>
        <Textarea value={formData.notas} onChange={(e) => setFormData((f) => ({ ...f, notas: e.target.value }))} placeholder={t('appointmentNotes')} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit" disabled={!formData.id_mascota || !formData.fecha || !formData.hora}>
          {editingId ? t('save') : t('scheduleAppointment')}
        </Button>
      </DialogFooter>
    </form>
  )
}

function ProcedureDialog({
  turno, mascotas, duenos, usuarios, tiposVacuna, tiposCirugia, onClose, onMarkAtendido, user, t,
}: {
  turno: Turno | null
  mascotas: Mascota[]
  duenos: Dueno[]
  usuarios: Usuario[]
  tiposVacuna: TipoVacuna[]
  tiposCirugia: TipoCirugia[]
  onClose: () => void
  onMarkAtendido: (id: string) => void
  user: { id_clinica: string } | null
  t: (key: string) => string
}) {
  const { toast } = useToast()
  const [procedureType, setProcedureType] = useState<'consulta' | 'vacuna' | 'cirugia' | null>(null)
  const [tipoVacunaOpen, setTipoVacunaOpen] = useState(false)
  const [tipoCirugiaOpen, setTipoCirugiaOpen] = useState(false)
  const [vetProcOpen, setVetProcOpen] = useState(false)
  const [consultaForm, setConsultaForm] = useState({ motivo: '', diagnostico: '', tratamiento: '', observaciones: '', id_usuario: turno?.id_usuario || '' })
  const [vacunaForm, setVacunaForm] = useState({ id_tipo_vacuna: '', proxima_dosis: '' })
  const [cirugiaForm, setCirugiaForm] = useState({ tipo: '', resultado: 'scheduled', descripcion: '', id_usuario: turno?.id_usuario || '' })

  const getMascotaNombre = (id: string) => mascotas.find((m) => m.id === id)?.nombre || '—'
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find((m) => m.id === mascotaId)
    return duenos.find((d) => d.id === mascota?.id_dueno)?.nombre || '—'
  }

  const handleProcedureSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !turno || !procedureType) return
    const fecha = turno.fecha_hora.slice(0, 10)
    try {
      if (procedureType === 'consulta') {
        const res = await createConsulta({
          id_mascota: turno.id_mascota,
          id_usuario: consultaForm.id_usuario || undefined,
          fecha,
          motivo: consultaForm.motivo,
          diagnostico: consultaForm.diagnostico,
          tratamiento: consultaForm.tratamiento,
          observaciones: consultaForm.observaciones,
          id_clinica: user.id_clinica,
        })
        if (!res.success) throw new Error(res.error || 'Error al guardar')
      } else if (procedureType === 'vacuna') {
        const res = await createVacuna({
          id_mascota: turno.id_mascota,
          id_tipo_vacuna: vacunaForm.id_tipo_vacuna || null,
          fecha,
          proxima_dosis: vacunaForm.proxima_dosis || null,
          id_clinica: user.id_clinica,
        })
        if (!res.success) throw new Error(res.error || 'Error al guardar')
      } else if (procedureType === 'cirugia') {
        const res = await createCirugia({
          id_mascota: turno.id_mascota,
          id_usuario: cirugiaForm.id_usuario || undefined,
          fecha,
          tipo: cirugiaForm.tipo,
          descripcion: cirugiaForm.descripcion || undefined,
          resultado: cirugiaForm.resultado,
          id_clinica: user.id_clinica,
        })
        if (!res.success) throw new Error(res.error || 'Error al guardar')
      }
      toast({ title: 'Procedimiento registrado', description: 'El procedimiento fue guardado exitosamente.' })
      const turnoId = turno.id
      const turnoEstado = turno.estado
      onClose()
      if (turnoEstado !== 'atendido') {
        onMarkAtendido(turnoId)
      }
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!turno} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {!procedureType ? 'Agregar procedimiento'
              : procedureType === 'consulta' ? 'Nueva consulta'
              : procedureType === 'vacuna' ? 'Nueva vacuna'
              : 'Nueva cirugía'}
          </DialogTitle>
          {turno && (
            <DialogDescription>
              {getMascotaNombre(turno.id_mascota)} · {getDuenoNombrePorMascota(turno.id_mascota)}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step 1: choose type */}
        {!procedureType && (
          <div className="grid grid-cols-3 gap-3 py-2">
            {([
              { type: 'consulta', icon: Stethoscope, label: 'Consulta' },
              { type: 'vacuna', icon: Syringe, label: 'Vacuna' },
              { type: 'cirugia', icon: Scissors, label: 'Cirugía' },
            ] as const).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setProcedureType(type)}
                className="flex flex-col items-center gap-3 rounded-lg border border-border p-5 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2a: Consulta */}
        {procedureType === 'consulta' && (
          <form onSubmit={handleProcedureSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Motivo <span className="text-destructive">*</span></Label>
              <Input value={consultaForm.motivo} onChange={(e) => setConsultaForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Motivo de la consulta" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Diagnóstico</Label>
                <Textarea value={consultaForm.diagnostico} onChange={(e) => setConsultaForm(f => ({ ...f, diagnostico: e.target.value }))} placeholder="Diagnóstico" />
              </div>
              <div className="space-y-1.5">
                <Label>Tratamiento</Label>
                <Textarea value={consultaForm.tratamiento} onChange={(e) => setConsultaForm(f => ({ ...f, tratamiento: e.target.value }))} placeholder="Tratamiento indicado" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Input value={consultaForm.observaciones} onChange={(e) => setConsultaForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Observaciones" />
              </div>
              <div className="space-y-1.5">
                <Label>Veterinario</Label>
                <Popover open={vetProcOpen} onOpenChange={setVetProcOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                      <span className="truncate">{consultaForm.id_usuario ? usuarios.find(u => u.id === consultaForm.id_usuario)?.nombre : 'Seleccionar...'}</span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar veterinario..." />
                      <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                          {usuarios.map(u => (
                            <CommandItem key={u.id} value={u.nombre} onSelect={() => { setConsultaForm(f => ({ ...f, id_usuario: u.id })); setVetProcOpen(false) }}>
                              <Check className={cn('mr-2 size-4', consultaForm.id_usuario === u.id ? 'opacity-100' : 'opacity-0')} />
                              {u.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProcedureType(null)}>← Volver</Button>
              <Button type="submit">Guardar consulta</Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2b: Vacuna */}
        {procedureType === 'vacuna' && (
          <form onSubmit={handleProcedureSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de vacuna</Label>
              <Popover open={tipoVacunaOpen} onOpenChange={setTipoVacunaOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                    <span className="truncate">{vacunaForm.id_tipo_vacuna ? tiposVacuna.find(tv => tv.id === vacunaForm.id_tipo_vacuna)?.nombre : 'Seleccionar tipo...'}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar tipo..." />
                    <CommandList>
                      <CommandEmpty>No encontrado.</CommandEmpty>
                      <CommandGroup>
                        {tiposVacuna.map(tv => (
                          <CommandItem key={tv.id} value={tv.nombre} onSelect={() => { setVacunaForm(f => ({ ...f, id_tipo_vacuna: tv.id })); setTipoVacunaOpen(false) }}>
                            <Check className={cn('mr-2 size-4', vacunaForm.id_tipo_vacuna === tv.id ? 'opacity-100' : 'opacity-0')} />
                            {tv.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={turno?.fecha_hora.slice(0, 10) ?? ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Próxima dosis</Label>
                <Input type="date" value={vacunaForm.proxima_dosis} onChange={(e) => setVacunaForm(f => ({ ...f, proxima_dosis: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProcedureType(null)}>← Volver</Button>
              <Button type="submit">Guardar vacuna</Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2c: Cirugía */}
        {procedureType === 'cirugia' && (
          <form onSubmit={handleProcedureSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de cirugía</Label>
                <Popover open={tipoCirugiaOpen} onOpenChange={setTipoCirugiaOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                      <span className="truncate">{cirugiaForm.tipo || 'Seleccionar tipo...'}</span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo..." />
                      <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                          {tiposCirugia.map(tc => (
                            <CommandItem key={tc.id} value={tc.nombre} onSelect={() => { setCirugiaForm(f => ({ ...f, tipo: tc.nombre })); setTipoCirugiaOpen(false) }}>
                              <Check className={cn('mr-2 size-4', cirugiaForm.tipo === tc.nombre ? 'opacity-100' : 'opacity-0')} />
                              {tc.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Veterinario</Label>
                <Popover open={vetProcOpen} onOpenChange={setVetProcOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                      <span className="truncate">{cirugiaForm.id_usuario ? usuarios.find(u => u.id === cirugiaForm.id_usuario)?.nombre : 'Seleccionar...'}</span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar veterinario..." />
                      <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                          {usuarios.map(u => (
                            <CommandItem key={u.id} value={u.nombre} onSelect={() => { setCirugiaForm(f => ({ ...f, id_usuario: u.id })); setVetProcOpen(false) }}>
                              <Check className={cn('mr-2 size-4', cirugiaForm.id_usuario === u.id ? 'opacity-100' : 'opacity-0')} />
                              {u.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={cirugiaForm.resultado} onValueChange={(v) => setCirugiaForm(f => ({ ...f, resultado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="successful">Exitosa</SelectItem>
                    <SelectItem value="in-progress">En curso</SelectItem>
                    <SelectItem value="complications">Con complicaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={turno?.fecha_hora.slice(0, 10) ?? ''} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción / notas</Label>
              <Textarea value={cirugiaForm.descripcion} onChange={(e) => setCirugiaForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción del procedimiento" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProcedureType(null)}>← Volver</Button>
              <Button type="submit">Guardar cirugía</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function AppointmentsPage() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: turnos, loading: turnosLoading, refetch } = useTurnos()
  const { data: duenos } = useDuenos()
  const { data: mascotas } = useMascotas()
  const { data: usuarios } = useUserList()
  const { data: tiposVacuna } = useTiposVacuna()
  const { data: tiposCirugia } = useTiposCirugia()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [initialFormData, setInitialFormData] = useState<TurnoFormData>({ ...emptyForm })
  const [procedureTurno, setProcedureTurno] = useState<Turno | null>(null)
  const [markAtendidoId, setMarkAtendidoId] = useState<string | null>(null)
  const [showOnlyPending, setShowOnlyPending] = useState(false)

  const turnosForDate = useMemo(() => {
    if (!selectedDate) return turnos
    return turnos.filter((t) => new Date(t.fecha_hora).toDateString() === selectedDate.toDateString())
  }, [turnos, selectedDate])

  const appointmentDates = useMemo(() => turnos.map((t) => new Date(t.fecha_hora)), [turnos])

  const getMascotaNombre = (id: string) => mascotas.find((m) => m.id === id)?.nombre || '—'
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find((m) => m.id === mascotaId)
    return duenos.find((d) => d.id === mascota?.id_dueno)?.nombre || '—'
  }
  const getUsuarioNombre = (id?: string) => id ? (usuarios.find((u) => u.id === id)?.nombre || '—') : '—'

  const openCreateDialog = () => {
    setEditingId(null)
    setInitialFormData({ ...emptyForm })
    setDialogKey(k => k + 1)
    setIsDialogOpen(true)
  }

  const openEditDialog = (turno: Turno) => {
    setEditingId(turno.id)
    const mascota = mascotas.find((m) => m.id === turno.id_mascota)
    const dt = turno.fecha_hora ? turno.fecha_hora.slice(0, 16) : ''
    setInitialFormData({
      id_mascota: turno.id_mascota,
      id_usuario: turno.id_usuario || '',
      fecha: dt.slice(0, 10),
      hora: dt.slice(11, 16),
      notas: turno.notas || '',
      _ownerId: mascota?.id_dueno || '',
    })
    setDialogKey(k => k + 1)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: TurnoFormData, newDate: Date) => {
    if (!user || !formData.id_mascota || !formData.fecha || !formData.hora) return
    const fecha_hora = `${formData.fecha}T${formData.hora}:00`
    try {
      if (editingId) {
        await updateTurno(editingId, user.id_clinica, {
          id_mascota: formData.id_mascota,
          id_usuario: formData.id_usuario || undefined,
          fecha_hora,
          notas: formData.notas || undefined,
        })
        toast({ title: t('turnoUpdated'), description: t('turnoUpdatedDesc') })
      } else {
        await createTurno({
          id_mascota: formData.id_mascota,
          id_usuario: formData.id_usuario || undefined,
          fecha_hora,
          notas: formData.notas || undefined,
          estado: 'sin_atender',
          id_clinica: user.id_clinica,
        })
        toast({ title: t('turnoCreated'), description: t('turnoCreatedDesc') })
      }
      setIsDialogOpen(false)
      setSelectedDate(newDate)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleStatusChange = async (id: string, estado: Turno['estado']) => {
    if (!user) return
    try {
      await updateTurno(id, user.id_clinica, { estado })
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      await deleteTurno(deletingId, user.id_clinica)
      toast({ title: t('turnoDeleted'), description: t('turnoDeletedDesc') })
      setDeletingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const openProcedureDialog = (turno: Turno) => {
    setProcedureTurno(turno)
  }

  const getStatusBadge = (estado: Turno['estado']) => {
    const map = {
      sin_atender: { label: t('statusSinAtender'), className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      atendido: { label: t('statusAtendido'), className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      ausente: { label: t('statusAusente'), className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    }
    const s = map[estado] || map.sin_atender
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>
  }

  const TurnoMenu = ({ turno }: { turno: Turno }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openProcedureDialog(turno)}>
          <Stethoscope className="mr-2 size-4" />Agregar procedimiento
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {turno.estado !== 'atendido' && (
          <DropdownMenuItem onClick={() => handleStatusChange(turno.id, 'atendido')}>
            <Check className="mr-2 size-4" />{t('markAtendido')}
          </DropdownMenuItem>
        )}
        {turno.estado !== 'ausente' && (
          <DropdownMenuItem onClick={() => handleStatusChange(turno.id, 'ausente')}>
            <X className="mr-2 size-4" />{t('markAusente')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openEditDialog(turno)}>
          <Pencil className="mr-2 size-4" />{t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => setDeletingId(turno.id)}>
          <Trash2 className="mr-2 size-4" />{t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const TurnoCard = ({ turno }: { turno: Turno }) => (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          {(() => { const m = mascotas.find(x => x.id === turno.id_mascota); const Icon = speciesIcons[m?.especie || ''] || PawPrint; return <Icon className="size-4 text-primary" /> })()}
        </div>
        <div>
          <p className="font-medium text-foreground">{getMascotaNombre(turno.id_mascota)}</p>
          <p className="text-sm text-muted-foreground">{getDuenoNombrePorMascota(turno.id_mascota)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Clock className="size-3" />
            {new Date(turno.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {turno.notas && (
            <p className="mt-0.5 max-w-[160px] truncate text-xs text-muted-foreground">{turno.notas}</p>
          )}
        </div>
        {getStatusBadge(turno.estado)}
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1 text-xs sm:flex"
          onClick={() => openProcedureDialog(turno)}
        >
          <Plus className="size-3" />
          Procedimiento
        </Button>
        <TurnoMenu turno={turno} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('appointments')}</h1>
          <p className="text-muted-foreground">{t('manageAppointments')}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant={showOnlyPending ? 'default' : 'outline'}
            className="flex-1 gap-2 sm:flex-none"
            onClick={() => setShowOnlyPending(v => !v)}
          >
            {showOnlyPending ? <><X className="size-4" />Mostrar todas</> : <><Filter className="size-4" />Solo sin atender</>}
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />{t('scheduleAppointment')}
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t('editAppointment') : t('scheduleAppointment')}</DialogTitle>
            <DialogDescription>{t('bookAppointmentDesc')}</DialogDescription>
          </DialogHeader>
          <TurnoForm
            key={dialogKey}
            initial={initialFormData}
            duenos={duenos}
            mascotas={mascotas}
            usuarios={usuarios}
            turnos={turnos}
            editingId={editingId}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            t={t}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteAppointment')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Procedure Dialog */}
      <ProcedureDialog
        turno={procedureTurno}
        mascotas={mascotas}
        duenos={duenos}
        usuarios={usuarios}
        tiposVacuna={tiposVacuna}
        tiposCirugia={tiposCirugia}
        onClose={() => setProcedureTurno(null)}
        onMarkAtendido={setMarkAtendidoId}
        user={user}
        t={t}
      />

      {/* Mark as attended alert */}
      <AlertDialog open={!!markAtendidoId} onOpenChange={(open) => { if (!open) setMarkAtendidoId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar cita como atendida?</AlertDialogTitle>
            <AlertDialogDescription>
              El procedimiento fue registrado exitosamente. ¿Deseas marcar esta cita como atendida?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarkAtendidoId(null)}>No, mantener estado</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (markAtendidoId) {
                  await handleStatusChange(markAtendidoId, 'atendido')
                  setMarkAtendidoId(null)
                }
              }}
            >
              Sí, marcar como atendida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="size-4" />{t('calendarView')}
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="size-4" />{t('listView')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <Card className="w-fit">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{ hasAppointment: appointmentDates }}
                  modifiersStyles={{ hasAppointment: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' } }}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">
                  {selectedDate
                    ? selectedDate.toLocaleDateString(language === 'es' ? 'es-AR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    : t('selectDate')}
                </CardTitle>
                <CardDescription>{turnosForDate.length} {t('appointmentsScheduled')}</CardDescription>
              </CardHeader>
              <CardContent>
                {turnosLoading ? (
                  <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : turnosForDate.length > 0 ? (
                  <div className="space-y-3">
                    {turnosForDate.filter(t => !showOnlyPending || t.estado === 'sin_atender').sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora)).map((turno) => (
                      <TurnoCard key={turno.id} turno={turno} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <CalendarIcon className="size-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{t('noAppointmentsForDate')}</p>
                    <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                      <Plus className="mr-2 size-4" />{t('scheduleAppointment')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>{t('allAppointments')}</CardTitle>
              <CardDescription>{turnos.length} {t('appointmentsTotal')}</CardDescription>
            </CardHeader>
            <CardContent>
              {turnosLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dateAndTime')}</TableHead>
                        <TableHead>{t('pet')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('owner')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('veterinarian')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {turnos.filter(t => !showOnlyPending || t.estado === 'sin_atender').sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()).map((turno) => (
                        <TableRow key={turno.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">
                              {new Date(turno.fecha_hora).toLocaleDateString(language === 'es' ? 'es-AR' : 'en-US')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(turno.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                                {(() => { const m = mascotas.find(x => x.id === turno.id_mascota); const Icon = speciesIcons[m?.especie || ''] || PawPrint; return <Icon className="size-4 text-primary" /> })()}
                              </div>
                              <p className="font-medium text-foreground">{getMascotaNombre(turno.id_mascota)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{getDuenoNombrePorMascota(turno.id_mascota)}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{getUsuarioNombre(turno.id_usuario)}</TableCell>
                          <TableCell>{getStatusBadge(turno.estado)}</TableCell>
                          <TableCell><TurnoMenu turno={turno} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
