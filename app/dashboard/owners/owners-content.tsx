'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Dog, Cat, Bird, Rabbit, HelpCircle, Stethoscope, Scissors, Syringe, FlaskConical, ScanLine, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useDuenos } from '@/hooks/use-duenos'
import { useAuth } from '@/lib/auth-context'
import { createDueno, updateDueno, deleteDueno, getMascotasByDueno, getConsultasByMascota, getCirugiasByMascota, getVacunasByMascota, getAnalisisByMascota, getImagenesByMascota } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import type { Mascota, Consulta, Cirugia, Vacuna, Analisis, ImagenDiagnostica } from '@/lib/types'

export function OwnersContent() {
  const { data: duenos, loading: duenosLoading, refetch } = useDuenos()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  })

  const filteredDuenos = duenos.filter((d) =>
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.telefono.includes(searchTerm)
  )

  // ── Expandable dueño rows ──
  const [expandedDuenoId, setExpandedDuenoId] = useState<string | null>(null)
  const [expandedMascotas, setExpandedMascotas] = useState<Mascota[]>([])
  const [expandedLoading, setExpandedLoading] = useState(false)

  const toggleDueno = async (duenoId: string) => {
    if (expandedDuenoId === duenoId) {
      setExpandedDuenoId(null)
      setExpandedMascotas([])
      return
    }
    setExpandedDuenoId(duenoId)
    setExpandedMascotas([])
    setExpandedLoading(true)
    if (user) {
      const res = await getMascotasByDueno(duenoId, user.id_clinica)
      setExpandedMascotas(res.data ?? [])
    }
    setExpandedLoading(false)
  }

  // ── Historia sheet ──
  const [historiaOpen, setHistoriaOpen] = useState(false)
  const [historiaPet, setHistoriaPet] = useState<Mascota | null>(null)
  const [historiaLoading, setHistoriaLoading] = useState(false)
  const [hConsultas, setHConsultas] = useState<Consulta[]>([])
  const [hCirugias, setHCirugias] = useState<Cirugia[]>([])
  const [hVacunas, setHVacunas] = useState<Vacuna[]>([])
  const [hAnalisis, setHAnalisis] = useState<Analisis[]>([])
  const [hImagenes, setHImagenes] = useState<ImagenDiagnostica[]>([])
  const [expandedSection, setExpandedSection] = useState<'consultas' | 'cirugias' | 'vacunas' | 'analisis' | 'imagenes' | null>('consultas')

  const openHistoria = async (pet: Mascota) => {
    setHistoriaPet(pet)
    setHistoriaOpen(true)
    setHistoriaLoading(true)
    setHConsultas([]); setHCirugias([]); setHVacunas([]); setHAnalisis([]); setHImagenes([])
    setExpandedSection('consultas')
    if (!user) return
    const [c, ci, v, a, im] = await Promise.all([
      getConsultasByMascota(pet.id, user.id_clinica),
      getCirugiasByMascota(pet.id, user.id_clinica),
      getVacunasByMascota(pet.id, user.id_clinica),
      getAnalisisByMascota(pet.id, user.id_clinica),
      getImagenesByMascota(pet.id, user.id_clinica),
    ])
    setHConsultas(c.data ?? [])
    setHCirugias(ci.data ?? [])
    setHVacunas(v.data ?? [])
    setHAnalisis(a.data ?? [])
    setHImagenes(im.data ?? [])
    setHistoriaLoading(false)
  }

  const toggleSection = (s: typeof expandedSection) => setExpandedSection(prev => prev === s ? null : s)

  const speciesIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    perro: Dog, gato: Cat, pajaro: Bird, conejo: Rabbit,
    Dog, Cat, Bird, Rabbit,
  }

  const estadoBadgeClass = (estado?: string) => {
    const m: Record<string, string> = {
      programado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      en_progreso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      exitosa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      complicaciones: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return m[estado ?? ''] ?? 'bg-muted text-muted-foreground'
  }
  const estadoLabel = (estado?: string) => ({ programado: 'Programado', en_progreso: 'En progreso', exitosa: 'Exitosa', complicaciones: 'Complicaciones' })[estado ?? ''] ?? estado ?? '-'
  const fDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
  const fDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingId) {
        await updateDueno(editingId, user.id_clinica, {
          ...formData,
        } as any)
        toast({ title: 'Dueño actualizado', description: 'Los cambios se han guardado.' })
      } else {
        await createDueno({
          ...formData,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: 'Dueño creado', description: 'El nuevo dueño ha sido registrado.' })
      }

      setFormData({ nombre: '', telefono: '', email: '', direccion: '' })
      setEditingId(null)
      setIsDialogOpen(false)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return

    try {
      await deleteDueno(deletingId, user.id_clinica)
      toast({ title: 'Dueño eliminado', description: 'El dueño ha sido removido.' })
      setDeletingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dueños</h1>
        <p className="text-gray-600 mt-2">Gestión de dueños de mascotas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Dueños</CardTitle>
              <CardDescription>Total: {duenos.length} dueños</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ nombre: '', telefono: '', email: '', direccion: '' })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Dueño
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Dueño' : 'Nuevo Dueño'}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Actualiza los datos del dueño'
                      : 'Registra un nuevo dueño en el sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {duenosLoading ? (
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDuenos.map((dueno) => (
                    <React.Fragment key={dueno.id}>
                      <TableRow className={expandedDuenoId === dueno.id ? 'bg-muted/30' : undefined}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => toggleDueno(dueno.id)}
                            className="flex items-center gap-1.5 hover:underline text-left w-full"
                          >
                            {expandedDuenoId === dueno.id
                              ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            }
                            {dueno.nombre}
                          </button>
                        </TableCell>
                        <TableCell>{dueno.email}</TableCell>
                        <TableCell>{dueno.telefono}</TableCell>
                        <TableCell>{dueno.direccion}</TableCell>
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
                                  setEditingId(dueno.id)
                                  setFormData({
                                    nombre: dueno.nombre,
                                    telefono: dueno.telefono,
                                    email: dueno.email,
                                    direccion: dueno.direccion,
                                  })
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setTimeout(() => setDeletingId(dueno.id), 0)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedDuenoId === dueno.id && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/10 py-3 px-8">
                            {expandedLoading ? (
                              <p className="text-sm text-muted-foreground">Cargando mascotas…</p>
                            ) : expandedMascotas.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Sin mascotas registradas.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {expandedMascotas.map(pet => {
                                  const IconComp = speciesIcons[pet.especie] || HelpCircle
                                  return (
                                    <Button
                                      key={pet.id}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1.5 text-xs"
                                      onClick={() => openHistoria(pet)}
                                    >
                                      <IconComp className="h-3.5 w-3.5" />
                                      {pet.nombre}
                                      <BookOpen className="h-3 w-3 ml-0.5 text-muted-foreground" />
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dueño?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el dueño del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Historia Clínica Sheet ─── */}
      <Sheet open={historiaOpen} onOpenChange={setHistoriaOpen}>
        <SheetContent className="w-full sm:max-w-[680px] p-0" side="right">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {historiaPet && (() => {
                const IconComp = speciesIcons[historiaPet.especie] || HelpCircle
                const edad = historiaPet.fecha_nacimiento
                  ? Math.floor((Date.now() - new Date(historiaPet.fecha_nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365))
                  : null
                return (
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20">
                      <IconComp className="w-14 h-14 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <SheetHeader className="p-0 text-left">
                        <SheetTitle className="text-2xl font-bold">{historiaPet.nombre}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Especie:</span> {historiaPet.especie}</span>
                        {historiaPet.raza && <span><span className="font-medium text-foreground">Raza:</span> {historiaPet.raza}</span>}
                        {historiaPet.sexo && <span><span className="font-medium text-foreground">Sexo:</span> {historiaPet.sexo === 'M' ? 'Macho' : 'Hembra'}</span>}
                        {edad !== null && <span><span className="font-medium text-foreground">Edad:</span> {edad} año{edad !== 1 ? 's' : ''}</span>}
                        {historiaPet.fecha_nacimiento && <span><span className="font-medium text-foreground">Nac.:</span> {fDate(historiaPet.fecha_nacimiento)}</span>}
                        {(historiaPet as any).peso && <span><span className="font-medium text-foreground">Peso:</span> {(historiaPet as any).peso} kg</span>}
                      </div>
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {historiaLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Consultas */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('consultas')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        Consultas
                        <Badge variant="secondary" className="text-xs">{hConsultas.length}</Badge>
                      </div>
                      {expandedSection === 'consultas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'consultas' && (
                      <div className="border-t divide-y">
                        {hConsultas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin consultas registradas.</p>
                        ) : hConsultas.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{c.motivo || '(sin motivo)'}</span>
                              <span className="text-xs text-muted-foreground">{fDateTime(c.fecha)}</span>
                            </div>
                            {c.diagnostico && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Diagnóstico:</span> {c.diagnostico}</p>}
                            {c.tratamiento && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tratamiento:</span> {c.tratamiento}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cirugías */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('cirugias')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Scissors className="h-4 w-4 text-purple-500" />
                        Cirugías
                        <Badge variant="secondary" className="text-xs">{hCirugias.length}</Badge>
                      </div>
                      {expandedSection === 'cirugias' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'cirugias' && (
                      <div className="border-t divide-y">
                        {hCirugias.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin cirugías registradas.</p>
                        ) : hCirugias.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{c.tipo || '(sin tipo)'}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadgeClass((c as any).estado)}`}>{estadoLabel((c as any).estado)}</span>
                                <span className="text-xs text-muted-foreground">{fDate(c.fecha)}</span>
                              </div>
                            </div>
                            {c.descripcion && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Descripción:</span> {c.descripcion}</p>}
                            {c.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {c.resultado}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vacunas */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('vacunas')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Syringe className="h-4 w-4 text-green-500" />
                        Vacunas
                        <Badge variant="secondary" className="text-xs">{hVacunas.length}</Badge>
                      </div>
                      {expandedSection === 'vacunas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'vacunas' && (
                      <div className="border-t divide-y">
                        {hVacunas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin vacunas registradas.</p>
                        ) : hVacunas.map(v => (
                          <div key={v.id} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">Aplicación: {fDate(v.fecha)}</span>
                              {v.proxima_dosis && <span className="text-xs text-muted-foreground">Próxima dosis: <span className="font-medium text-foreground">{fDate(v.proxima_dosis)}</span></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Análisis */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('analisis')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <FlaskConical className="h-4 w-4 text-orange-500" />
                        Análisis
                        <Badge variant="secondary" className="text-xs">{hAnalisis.length}</Badge>
                      </div>
                      {expandedSection === 'analisis' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'analisis' && (
                      <div className="border-t divide-y">
                        {hAnalisis.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin análisis registrados.</p>
                        ) : hAnalisis.map(a => (
                          <div key={a.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{a.tipo}</span>
                              <span className="text-xs text-muted-foreground">{fDate(a.fecha)}</span>
                            </div>
                            {a.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {a.resultado}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Imagenología */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('imagenes')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <ScanLine className="h-4 w-4 text-cyan-500" />
                        Imagenología
                        <Badge variant="secondary" className="text-xs">{hImagenes.length}</Badge>
                      </div>
                      {expandedSection === 'imagenes' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'imagenes' && (
                      <div className="border-t divide-y">
                        {hImagenes.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin estudios de imágenes registrados.</p>
                        ) : hImagenes.map(im => (
                          <div key={im.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{im.tipo}{im.region ? ` — ${im.region}` : ''}</span>
                              <span className="text-xs text-muted-foreground">{fDate(im.fecha)}</span>
                            </div>
                            {im.hallazgos && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Hallazgos:</span> {im.hallazgos}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
