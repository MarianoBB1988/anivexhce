'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Pencil, Trash2, Calendar, Clock, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTurnos } from '@/hooks/use-turnos'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useAuth } from '@/lib/auth-context'
import { createTurno, updateTurno, deleteTurno } from '@/lib/services'
import { getConsultasByMascota } from '@/lib/services/consultas'
import { getCirugiasbyMascota } from '@/lib/services/cirugias'
import { getVacunasByMascota } from '@/lib/services/vacunas'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { SanaLogo } from '@/components/sana-chat'
import type { Turno } from '@/lib/types'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

const statusColors: { [key: string]: string } = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  sin_atender: 'bg-yellow-100 text-yellow-800',
  atendido: 'bg-green-100 text-green-800',
  ausente: 'bg-red-100 text-red-800',
}

const statusLabel: { [key: string]: string } = {
  sin_atender: 'Sin atender',
  atendido: 'Atendido',
  ausente: 'Ausente',
  pendiente: 'Pendiente',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export function AppointmentsContent() {
  const { data: turnos, loading: turnosLoading, refetch } = useTurnos()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDueno, setSelectedDueno] = useState('')
  const [formData, setFormData] = useState({
    id_mascota: '',
    fecha: '',
    hora: '',
    estado: 'sin_atender' as 'sin_atender' | 'atendido' | 'ausente',
    notas: '',
    ubicacion: 'clinica' as 'clinica' | 'domicilio',
  })

  // Modal detalle + Sana
  const [detailTurno, setDetailTurno] = useState<Turno | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [sanaLoading, setSanaLoading] = useState(false)
  const [sanaReport, setSanaReport] = useState<string | null>(null)

  const openDetail = (turno: Turno) => {
    setDetailTurno(turno)
    setSanaReport(null)
    setDetailOpen(true)
  }

  const analizarCitaConSana = async () => {
    if (!detailTurno || !user) return
    setSanaLoading(true)
    setSanaReport(null)

    const mascota = mascotas.find(m => m.id === detailTurno.id_mascota)
    const dueno = duenos.find(d => d.id === mascota?.id_dueno)

    // Cargar historial clínico en paralelo
    const [consultasRes, cirugiasRes, vacunasRes] = await Promise.allSettled([
      getConsultasByMascota(detailTurno.id_mascota, user.id_clinica),
      getCirugiasbyMascota(detailTurno.id_mascota, user.id_clinica),
      getVacunasByMascota(detailTurno.id_mascota, user.id_clinica),
    ])

    const consultas = consultasRes.status === 'fulfilled' ? (consultasRes.value.data ?? []) : []
    const cirugias = cirugiasRes.status === 'fulfilled' ? (cirugiasRes.value.data ?? []) : []
    const vacunas = vacunasRes.status === 'fulfilled' ? (vacunasRes.value.data ?? []) : []

    const fechaCita = new Date(detailTurno.fecha_hora).toLocaleString('es-AR')

    const prompt =
      `Soy un veterinario y tengo una cita programada. Por favor, basándote en el motivo de la cita y el historial clínico completo del paciente, dame:\n` +
      `1. Un posible diagnóstico diferencial\n` +
      `2. Recomendaciones concretas para la consulta\n` +
      `3. Exámenes o estudios sugeridos si aplica\n\n` +
      `**DATOS DE LA CITA**\n` +
      `Fecha: ${fechaCita}\n` +
      `Estado: ${statusLabel[detailTurno.estado] || detailTurno.estado}\n` +
      (detailTurno.notas ? `Motivo / Notas: ${detailTurno.notas}\n` : '') +
      `\n**PACIENTE**\n` +
      `Nombre: ${mascota?.nombre || '-'}\n` +
      `Especie: ${mascota?.especie || '-'}\n` +
      (mascota?.raza ? `Raza: ${mascota.raza}\n` : '') +
      (mascota?.sexo ? `Sexo: ${mascota.sexo === 'M' ? 'Macho' : 'Hembra'}\n` : '') +
      (mascota?.peso ? `Peso: ${mascota.peso} kg\n` : '') +
      (mascota?.fecha_nacimiento ? `Nac.: ${mascota.fecha_nacimiento}\n` : '') +
      (dueno ? `Dueño: ${dueno.nombre}\n` : '') +
      (consultas.length
        ? `\n**CONSULTAS PREVIAS (${consultas.length})**\n` +
          consultas.slice(0, 8).map((c: any) =>
            `- ${c.motivo || '(sin motivo)'}${c.diagnostico ? ` | Dx: ${c.diagnostico}` : ''}${c.tratamiento ? ` | Tx: ${c.tratamiento}` : ''}`
          ).join('\n')
        : '\nSin consultas previas registradas.') +
      (cirugias.length
        ? `\n\n**CIRUGÍAS (${cirugias.length})**\n` +
          cirugias.map((c: any) =>
            `- ${c.tipo || '(sin tipo)'}${c.fecha ? ` (${c.fecha.slice(0, 10)})` : ''}${c.resultado ? ` | ${c.resultado}` : ''}`
          ).join('\n')
        : '') +
      (vacunas.length
        ? `\n\n**VACUNAS (${vacunas.length})**\n` +
          vacunas.map((v: any) =>
            `- ${v.tipo || '(sin tipo)'}${v.fecha ? ` | ${v.fecha.slice(0, 10)}` : ''}${v.proxima_dosis ? ` | Próxima: ${v.proxima_dosis.slice(0, 10)}` : ''}`
          ).join('\n')
        : '')

    try {
      const res = await fetch('/api/sana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setSanaReport(data.reply)
    } catch (err: any) {
      setSanaReport('⚠️ ' + (err.message || 'No se pudo obtener recomendación.'))
    } finally {
      setSanaLoading(false)
    }
  }

  const mascotasFiltradas = selectedDueno
    ? mascotas.filter((m) => m.id_dueno === selectedDueno)
    : mascotas

  const filteredTurnos = turnos.filter((t) => {
    const mascota = mascotas.find((m) => m.id === t.id_mascota)
    return mascota?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getMascotaNombre = (mascotaId: string) => {
    return mascotas.find((m) => m.id === mascotaId)?.nombre || 'No identificada'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { fecha, hora, ...rest } = formData
      const payload = {
        ...rest,
        fecha_hora: fecha + (hora ? 'T' + hora : ''),
      }

      if (editingId) {
        await updateTurno(editingId, user.id_clinica, payload as any)
        toast({ title: 'Turno actualizado', description: 'Los cambios se han guardado.' })
      } else {
        await createTurno({
          ...payload,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: 'Turno creado', description: 'El nuevo turno ha sido registrado.' })
      }

      setFormData({ id_mascota: '', fecha: '', hora: '', estado: 'sin_atender', notas: '', ubicacion: 'clinica' })
      setSelectedDueno('')
      setEditingId(null)
      setIsDialogOpen(false)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      await deleteTurno(id, user.id_clinica)
      toast({ title: 'Turno eliminado', description: 'El turno ha sido removido.' })
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Turnos</h1>
        <p className="text-gray-600 mt-2">Gestión de citas y turnos</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Turnos</CardTitle>
              <CardDescription>Total: {turnos.length} turnos</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setSelectedDueno('')
                    setFormData({ id_mascota: '', fecha: '', hora: '', estado: 'sin_atender', notas: '', ubicacion: 'clinica' })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Turno' : 'Nuevo Turno'}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Actualiza los datos del turno'
                      : 'Registra un nuevo turno en el sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="id_dueno">Dueño</Label>
                    <Select value={selectedDueno} onValueChange={(value) => { setSelectedDueno(value); setFormData({ ...formData, id_mascota: '' }) }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona dueño" />
                      </SelectTrigger>
                      <SelectContent>
                        {duenos.map((dueno) => (
                          <SelectItem key={dueno.id} value={dueno.id}>
                            {dueno.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="id_mascota">Mascota</Label>
                    <Select value={formData.id_mascota} onValueChange={(value) => setFormData({ ...formData, id_mascota: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona mascota" />
                      </SelectTrigger>
                      <SelectContent>
                        {mascotasFiltradas.map((mascota) => (
                          <SelectItem key={mascota.id} value={mascota.id}>
                            {mascota.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hora">Hora</Label>
                      <Input
                        id="hora"
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin_atender">Sin atender</SelectItem>
                        <SelectItem value="atendido">Atendido</SelectItem>
                        <SelectItem value="ausente">Ausente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Select value={formData.ubicacion} onValueChange={(value) => setFormData({ ...formData, ubicacion: value as 'clinica' | 'domicilio' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinica">Clínica</SelectItem>
                        <SelectItem value="domicilio">Domicilio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Input
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingId ? 'Actualizar' : 'Crear'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por mascota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {turnosLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mascota</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">{getMascotaNombre(turno.id_mascota)}</TableCell>
                      <TableCell>{new Date(turno.fecha_hora).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[turno.estado] || 'bg-gray-100 text-gray-800'}>
                          {statusLabel[turno.estado] || turno.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {turno.ubicacion === 'domicilio' ? 'Domicilio' : 'Clínica'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {turno.notas ? (
                            <>
                              <p className="truncate text-sm text-muted-foreground">{turno.notas}</p>
                              <button
                                className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                                onClick={() => openDetail(turno)}
                              >
                                <ExternalLink className="size-3" /> Ver detalle
                              </button>
                            </>
                          ) : (
                            <button
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                              onClick={() => openDetail(turno)}
                            >
                              <ExternalLink className="size-3" /> Ver cita
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ⋮
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(turno.id)
                                const mascota = mascotas.find((m) => m.id === turno.id_mascota)
                                setSelectedDueno(mascota?.id_dueno || '')
                                setFormData({
                                  id_mascota: turno.id_mascota,
                                  fecha: turno.fecha_hora?.split('T')[0] || '',
                                  hora: turno.fecha_hora?.split('T')[1]?.slice(0, 5) || '',
                                  estado: turno.estado,
                                  notas: turno.notas || '',
                                  ubicacion: (turno.ubicacion || 'clinica') as 'clinica' | 'domicilio',
                                })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(turno.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal detalle de cita + Sana ── */}
      <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setSanaReport(null) }}>
        <DialogContent className="max-w-2xl">
          {detailTurno && (() => {
            const mascota = mascotas.find(m => m.id === detailTurno.id_mascota)
            const dueno = duenos.find(d => d.id === mascota?.id_dueno)
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="size-5 text-primary" />
                    Detalle de la cita
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(detailTurno.fecha_hora).toLocaleString('es-AR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-2">
                  {/* Info paciente */}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {mascota?.nombre || 'Mascota no encontrada'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline">
                          {detailTurno.ubicacion === 'domicilio' ? 'Domicilio' : 'Clínica'}
                        </Badge>
                        <Badge className={statusColors[detailTurno.estado] || 'bg-gray-100 text-gray-800'}>
                          {statusLabel[detailTurno.estado] || detailTurno.estado}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {mascota?.especie && <span><span className="font-medium text-foreground">Especie:</span> {mascota.especie}</span>}
                      {mascota?.raza && <span><span className="font-medium text-foreground">Raza:</span> {mascota.raza}</span>}
                      {mascota?.sexo && <span><span className="font-medium text-foreground">Sexo:</span> {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}</span>}
                      {mascota?.peso && <span><span className="font-medium text-foreground">Peso:</span> {mascota.peso} kg</span>}
                    </div>
                    {dueno && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Dueño:</span> {dueno.nombre}
                        {dueno.telefono && ` · ${dueno.telefono}`}
                      </p>
                    )}
                  </div>

                  {/* Motivo / Notas */}
                  {detailTurno.notas && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motivo / Notas</p>
                      <p className="rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                        {detailTurno.notas}
                      </p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Botón Sana */}
                  {!sanaReport && !sanaLoading && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                      <p className="mb-3 text-sm text-muted-foreground">
                        Sana puede cruzar el motivo de esta cita con el historial clínico completo del paciente para darte un posible diagnóstico y recomendaciones.
                      </p>
                      <Button onClick={analizarCitaConSana} className="gap-2">
                        <SanaLogo className="size-4" color="white" />
                        <Sparkles className="size-3.5" />
                        Recomendación de Sana
                      </Button>
                    </div>
                  )}

                  {sanaLoading && (
                    <div className="rounded-lg border bg-muted/50 p-4 my-2 flex items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin shrink-0" />
                      Sana está analizando el historial clínico y el motivo de la cita...
                    </div>
                  )}

                  {sanaReport && (
                    <div className="rounded-lg border bg-background p-4 my-2">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <SanaLogo className="size-5" />
                          Análisis de Sana
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1.5 text-xs text-muted-foreground"
                          onClick={() => { setSanaReport(null) }}
                        >
                          Regenerar
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none text-sm">
                        <ReactMarkdown>{sanaReport}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
