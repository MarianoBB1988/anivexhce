'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Cat, Dog, Bird, Rabbit, BookOpen, Stethoscope, Scissors, Syringe, HelpCircle, ChevronDown, ChevronRight, FileText, Download } from 'lucide-react'
// Importación dinámica de jsPDF para evitar problemas SSR
let jsPDF: any = null;
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { createMascota, updateMascota, deleteMascota, getConsultasByMascota, getCirugiasByMascota, getVacunasByMascota, updateConsulta, updateCirugia, updateVacuna } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import type { Mascota, Consulta, Cirugia, Vacuna } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'

const speciesIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  perro: Dog,
  gato: Cat,
  pajaro: Bird,
  conejo: Rabbit,
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
}

export function PetsContent() {
  const { data: mascotas, loading: mascotasLoading, refetch } = useMascotas()
  const { data: duenos } = useDuenos()
  // Estado y lógica Sana
  const [sanaLoading, setSanaLoading] = useState(false)
  const [sanaReport, setSanaReport] = useState<string | null>(null)
  // Generar JSON de historia clínica para Sana
  const buildSanaPayload = () => {
    if (!historiaMascota) return null;
    return {
      mascota: {
        nombre: historiaMascota.nombre,
        especie: historiaMascota.especie,
        raza: historiaMascota.raza,
        fecha_nacimiento: historiaMascota.fecha_nacimiento,
        sexo: historiaMascota.sexo,
        peso: historiaMascota.peso,
        observaciones: historiaMascota.observaciones,
      },
      consultas,
      cirugias,
      vacunas,
    };
  };

  // Simulación de llamada a Groq (reemplazar por fetch real)
  const analizarConSana = async () => {
    setSanaLoading(true);
    setSanaReport(null);
    const payload = buildSanaPayload();
    // Aquí iría el fetch real a tu endpoint
    await new Promise(r => setTimeout(r, 1200));
    setSanaReport('Informe clínico generado por Sana para ' + (payload?.mascota.nombre || 'la mascota') + '.\n\n(Respuesta simulada, integrar con Groq aquí)');
    setSanaLoading(false);
  };

  const exportarPDF = async () => {
    if (!sanaReport) return;
    if (!jsPDF) {
      const mod = await import('jspdf');
      jsPDF = mod.default;
    }
    const doc = new jsPDF();
    doc.text(sanaReport, 10, 10);
    doc.save(`informe_${historiaMascota?.nombre || 'mascota'}.pdf`);
  };
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Historia clínica sheet
  const [historiaOpen, setHistoriaOpen] = useState(false)
  const [historiaMascota, setHistoriaMascota] = useState<Mascota | null>(null)
  const [historiaLoading, setHistoriaLoading] = useState(false)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [cirugias, setCirugias] = useState<Cirugia[]>([])
  const [vacunas, setVacunas] = useState<Vacuna[]>([])
  const [expandedSection, setExpandedSection] = useState<'consultas' | 'cirugias' | 'vacunas' | null>('consultas')

  // Historia edit state
  type PetEditTarget = 'consulta' | 'cirugia' | 'vacuna'
  const [petEditTarget, setPetEditTarget] = useState<PetEditTarget | null>(null)
  const [petEditItem, setPetEditItem] = useState<any>(null)
  const [petEditSaving, setPetEditSaving] = useState(false)
  const [editConsultaForm, setEditConsultaForm] = useState({ motivo: '', diagnostico: '', tratamiento: '', observaciones: '', fecha: '' })
  const [editCirugiaForm, setEditCirugiaForm] = useState({ tipo: '', estado: '', descripcion: '', resultado: '', fecha: '' })
  const [editVacunaForm, setEditVacunaForm] = useState({ fecha: '', proxima_dosis: '' })

  const openPetEdit = (target: PetEditTarget, item: any) => {
    setPetEditTarget(target)
    setPetEditItem(item)
    if (target === 'consulta') setEditConsultaForm({ motivo: item.motivo ?? '', diagnostico: item.diagnostico ?? '', tratamiento: item.tratamiento ?? '', observaciones: item.observaciones ?? '', fecha: item.fecha ? item.fecha.slice(0, 16).replace('T', 'T') : '' })
    if (target === 'cirugia') setEditCirugiaForm({ tipo: item.tipo ?? '', estado: (item as any).estado ?? '', descripcion: item.descripcion ?? '', resultado: item.resultado ?? '', fecha: item.fecha ? item.fecha.slice(0, 10) : '' })
    if (target === 'vacuna') setEditVacunaForm({ fecha: item.fecha ? item.fecha.slice(0, 10) : '', proxima_dosis: item.proxima_dosis ? item.proxima_dosis.slice(0, 10) : '' })
  }
  const closePetEdit = () => { setPetEditTarget(null); setPetEditItem(null) }

  const handlePetEditSave = async () => {
    if (!user || !petEditItem || !petEditTarget) return
    setPetEditSaving(true)
    try {
      if (petEditTarget === 'consulta') {
        const res = await updateConsulta(petEditItem.id, user.id_clinica, {
          motivo: editConsultaForm.motivo || undefined,
          diagnostico: editConsultaForm.diagnostico || undefined,
          tratamiento: editConsultaForm.tratamiento || undefined,
          observaciones: editConsultaForm.observaciones || undefined,
        })
        if (!res.success) throw new Error(res.error || 'Error')
        setConsultas(prev => prev.map(c => c.id === petEditItem.id ? { ...c, ...res.data } : c))
        toast({ title: 'Consulta actualizada' })
      } else if (petEditTarget === 'cirugia') {
        const res = await updateCirugia(petEditItem.id, user.id_clinica, {
          tipo: editCirugiaForm.tipo || undefined,
          estado: editCirugiaForm.estado || undefined,
          descripcion: editCirugiaForm.descripcion || undefined,
          resultado: editCirugiaForm.resultado || undefined,
          fecha: editCirugiaForm.fecha || undefined,
        } as any)
        if (!res.success) throw new Error(res.error || 'Error')
        setCirugias(prev => prev.map(c => c.id === petEditItem.id ? { ...c, ...res.data } : c))
        toast({ title: 'Cirugía actualizada' })
      } else if (petEditTarget === 'vacuna') {
        const res = await updateVacuna(petEditItem.id, user.id_clinica, {
          fecha: editVacunaForm.fecha || undefined,
          proxima_dosis: editVacunaForm.proxima_dosis || undefined,
        })
        if (!res.success) throw new Error(res.error || 'Error')
        setVacunas(prev => prev.map(v => v.id === petEditItem.id ? { ...v, ...res.data } : v))
        toast({ title: 'Vacuna actualizada' })
      }
      closePetEdit()
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' })
    } finally {
      setPetEditSaving(false)
    }
  }

  const openHistoria = useCallback(async (mascota: Mascota) => {
    setHistoriaMascota(mascota)
    setHistoriaOpen(true)
    setHistoriaLoading(true)
    setConsultas([])
    setCirugias([])
    setVacunas([])
    setExpandedSection('consultas')
    if (!user) return
    const [c, ci, v] = await Promise.all([
      getConsultasByMascota(mascota.id, user.id_clinica),
      getCirugiasByMascota(mascota.id, user.id_clinica),
      getVacunasByMascota(mascota.id, user.id_clinica),
    ])
    setConsultas(c.data ?? [])
    setCirugias(ci.data ?? [])
    setVacunas(v.data ?? [])
    setHistoriaLoading(false)
  }, [user])

  const toggleSection = (section: 'consultas' | 'cirugias' | 'vacunas') => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  const estadoCirugiaBadge = (estado?: string) => {
    const map: Record<string, string> = {
      programado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      en_progreso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      exitosa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      complicaciones: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return map[estado ?? ''] ?? 'bg-muted text-muted-foreground'
  }

  const estadoCirugiaLabel = (estado?: string) => {
    const map: Record<string, string> = {
      programado: 'Programado', en_progreso: 'En progreso',
      exitosa: 'Exitosa', complicaciones: 'Complicaciones',
    }
    return map[estado ?? ''] ?? estado ?? '-'
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  const [formData, setFormData] = useState({
    nombre: '',
    especie: '',
    raza: '',
    fecha_nacimiento: '',
    sexo: '',
    id_dueno: '',
  })

  // Mapeo de valores de especies a claves de traducción
  const speciesMap = {
    perro: 'dog',
    gato: 'cat',
    pajaro: 'bird',
    conejo: 'rabbit',
    otro: 'other',
    dog: 'dog',
    cat: 'cat',
    bird: 'bird',
    rabbit: 'rabbit',
    other: 'other',
  } as Record<string, string>

  // Obtener el nombre traducido de una especie
  const getSpeciesLabel = (value: string) => {
    const key = speciesMap[value] || value
    return t(key)
  }

  const filteredMascotas = mascotas.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.especie.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDuenoNombre = (duenoId: string) => {
    return duenos.find((d) => d.id === duenoId)?.nombre || 'No asignado'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingId) {
        // Actualizar
        await updateMascota(editingId, user.id_clinica, {
          ...formData,
        } as any)
        toast({ title: t('petUpdated'), description: t('petUpdatedDesc') })
      } else {
        // Crear
        await createMascota({
          ...formData,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: t('petCreated'), description: t('petCreatedDesc') })
      }

      setFormData({ nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: '', id_dueno: '' })
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
      await deleteMascota(deletingId, user.id_clinica)
      toast({ title: t('petDeleted'), description: t('petDeletedDesc') })
      setDeletingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('pets')}</h1>
        <p className="text-gray-600 mt-2">{t('managePetDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('petListTitle')}</CardTitle>
              <CardDescription>Total: {mascotas.length} {t('petsRegistered')}</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  suppressHydrationWarning
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: '', id_dueno: '' })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addNewPet')}
                </Button>
              </DialogTrigger>
              <DialogContent suppressHydrationWarning>
                <DialogHeader>
                  <DialogTitle>{editingId ? t('editPet') : t('newPet')}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? t('updatePetData')
                      : t('registerNewPet')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">{t('petName')}</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="especie">{t('species')}</Label>
                    {language === 'es' ? (
                      <Select value={formData.especie} onValueChange={(value) => setFormData({ ...formData, especie: value })}>
                        <SelectTrigger suppressHydrationWarning>
                          <SelectValue placeholder={t('selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perro">Perro</SelectItem>
                          <SelectItem value="gato">Gato</SelectItem>
                          <SelectItem value="pajaro">Pájaro</SelectItem>
                          <SelectItem value="conejo">Conejo</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={formData.especie} onValueChange={(value) => setFormData({ ...formData, especie: value })}>
                        <SelectTrigger suppressHydrationWarning>
                          <SelectValue placeholder={t('selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perro">Dogy</SelectItem>
                          <SelectItem value="gato">Cat</SelectItem>
                          <SelectItem value="pajaro">Bird</SelectItem>
                          <SelectItem value="conejo">Rabbit</SelectItem>
                          <SelectItem value="otro">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="raza">{t('breed')}</Label>
                    <Input
                      id="raza"
                      value={formData.raza}
                      onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fecha_nacimiento">{t('birthDate')}</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sexo">{t('sex')}</Label>
                    <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })}>
                      <SelectTrigger suppressHydrationWarning>
                        <SelectValue placeholder={t('selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">{t('male')}</SelectItem>
                        <SelectItem value="F">{t('female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="id_dueno">{t('owner')}</Label>
                    <Select value={formData.id_dueno} onValueChange={(value) => setFormData({ ...formData, id_dueno: value })}>
                      <SelectTrigger suppressHydrationWarning>
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
              placeholder={t('searchPets')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {mascotasLoading ? (
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
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('species')}</TableHead>
                    <TableHead>{t('breed')}</TableHead>
                    <TableHead>{t('owner')}</TableHead>
                    <TableHead>{t('birthDateColumn')}</TableHead>
                    <TableHead className="text-right min-w-[180px]">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMascotas.map((mascota) => {
                    const IconComponent = speciesIcons[mascota.especie] || Dog
                    return (
                      <TableRow key={mascota.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 shrink-0" />
                            {mascota.nombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getSpeciesLabel(mascota.especie)}</Badge>
                        </TableCell>
                        <TableCell>{mascota.raza}</TableCell>
                        <TableCell>{getDuenoNombre(mascota.id_dueno)}</TableCell>
                        <TableCell>{new Date(mascota.fecha_nacimiento).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right min-w-[180px]">
                          <div className="flex items-center justify-end gap-1 flex-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openHistoria(mascota)}
                              className="text-xs gap-1 h-8"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              Ver historia
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  ⋮
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingId(mascota.id)
                                    setFormData({
                                      nombre: mascota.nombre,
                                      especie: mascota.especie,
                                      raza: mascota.raza,
                                      fecha_nacimiento: mascota.fecha_nacimiento,
                                      sexo: mascota.sexo || '',
                                      id_dueno: mascota.id_dueno,
                                    })
                                    setIsDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setTimeout(() => setDeletingId(mascota.id), 0)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mascota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la mascota del sistema.
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
        <SheetContent
          className="w-full sm:max-w-[680px] p-0"
          side="right"
          onInteractOutside={e => { if (petEditTarget || isDialogOpen) e.preventDefault() }}
        >
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Header: avatar especie + datos mascota */}
              {historiaMascota && (() => {
                const IconComp = speciesIcons[historiaMascota.especie] || HelpCircle
                const dueno = duenos.find(d => d.id === historiaMascota.id_dueno)
                const edad = historiaMascota.fecha_nacimiento
                  ? Math.floor((Date.now() - new Date(historiaMascota.fecha_nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365))
                  : null
                return (
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20">
                      <IconComp className="w-14 h-14 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <SheetHeader className="p-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SheetTitle className="text-2xl font-bold">{historiaMascota.nombre}</SheetTitle>
                          <Button
                            size="icon" variant="ghost" className="size-7 shrink-0"
                            onClick={() => {
                              setEditingId(historiaMascota.id)
                              setFormData({
                                nombre: historiaMascota.nombre,
                                especie: historiaMascota.especie,
                                raza: historiaMascota.raza ?? '',
                                fecha_nacimiento: historiaMascota.fecha_nacimiento ?? '',
                                sexo: historiaMascota.sexo ?? '',
                                id_dueno: historiaMascota.id_dueno,
                              })
                              setIsDialogOpen(true)
                            }}
                            title="Editar mascota"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={analizarConSana}
                            disabled={sanaLoading}
                            title="Analizar con Sana"
                          >
                            <FileText className="size-4" /> Analizar con Sana
                          </Button>
                          {sanaReport && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-2"
                              onClick={exportarPDF}
                              title="Exportar informe PDF"
                            >
                              <Download className="size-4" /> Exportar PDF
                            </Button>
                          )}
                        </div>
                                    {/* Informe Sana */}
                                    {sanaLoading && (
                                      <div className="rounded-lg border p-4 my-2 bg-muted animate-pulse text-muted-foreground">
                                        Generando informe clínico con Sana...
                                      </div>
                                    )}
                                    {sanaReport && (
                                      <div className="rounded-lg border p-4 my-2 bg-background">
                                        <div className="font-semibold mb-2">Informe generado por Sana</div>
                                        <pre className="whitespace-pre-wrap text-sm">{sanaReport}</pre>
                                      </div>
                                    )}
                      </SheetHeader>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Especie:</span> {getSpeciesLabel(historiaMascota.especie)}</span>
                        {historiaMascota.raza && <span><span className="font-medium text-foreground">Raza:</span> {historiaMascota.raza}</span>}
                        {historiaMascota.sexo && <span><span className="font-medium text-foreground">Sexo:</span> {historiaMascota.sexo === 'M' ? 'Macho' : 'Hembra'}</span>}
                        {edad !== null && <span><span className="font-medium text-foreground">Edad:</span> {edad} año{edad !== 1 ? 's' : ''}</span>}
                        {historiaMascota.fecha_nacimiento && <span><span className="font-medium text-foreground">Nacimiento:</span> {formatDate(historiaMascota.fecha_nacimiento)}</span>}
                      </div>
                      {dueno && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                          <span className="text-muted-foreground">Dueño:</span>
                          <span className="font-medium">{dueno.nombre}</span>
                          {dueno.telefono && <span className="text-muted-foreground">· {dueno.telefono}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {historiaLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              ) : (
                <div className="space-y-3">

                  {/* ─── Consultas ─── */}
                  <div className="rounded-lg border">
                    <button
                      onClick={() => toggleSection('consultas')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        Consultas
                        <Badge variant="secondary" className="text-xs">{consultas.length}</Badge>
                      </div>
                      {expandedSection === 'consultas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'consultas' && (
                      <div className="border-t divide-y">
                        {consultas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin consultas registradas.</p>
                        ) : consultas.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{c.motivo || '(sin motivo)'}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{formatDateTime(c.fecha)}</span>
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openPetEdit('consulta', c)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
                            {c.diagnostico && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Diagnóstico:</span> {c.diagnostico}</p>}
                            {c.tratamiento && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tratamiento:</span> {c.tratamiento}</p>}
                            {c.observaciones && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Observaciones:</span> {c.observaciones}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ─── Cirugías ─── */}
                  <div className="rounded-lg border">
                    <button
                      onClick={() => toggleSection('cirugias')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Scissors className="h-4 w-4 text-purple-500" />
                        Cirugías
                        <Badge variant="secondary" className="text-xs">{cirugias.length}</Badge>
                      </div>
                      {expandedSection === 'cirugias' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'cirugias' && (
                      <div className="border-t divide-y">
                        {cirugias.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin cirugías registradas.</p>
                        ) : cirugias.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{c.tipo || '(sin tipo)'}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoCirugiaBadge((c as any).estado)}`}>{estadoCirugiaLabel((c as any).estado)}</span>
                                <span className="text-xs text-muted-foreground">{formatDateTime(c.fecha)}</span>
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openPetEdit('cirugia', c)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
                            {c.descripcion && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Descripción:</span> {c.descripcion}</p>}
                            {c.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {c.resultado}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ─── Vacunas ─── */}
                  <div className="rounded-lg border">
                    <button
                      onClick={() => toggleSection('vacunas')}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Syringe className="h-4 w-4 text-green-500" />
                        Vacunas
                        <Badge variant="secondary" className="text-xs">{vacunas.length}</Badge>
                      </div>
                      {expandedSection === 'vacunas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'vacunas' && (
                      <div className="border-t divide-y">
                        {vacunas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin vacunas registradas.</p>
                        ) : vacunas.map(v => (
                          <div key={v.id} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">Aplicación: {formatDate(v.fecha)}</span>
                              <div className="flex items-center gap-2">
                                {v.proxima_dosis && (
                                  <span className="text-xs text-muted-foreground">
                                    Próxima dosis: <span className="font-medium text-foreground">{formatDate(v.proxima_dosis)}</span>
                                  </span>
                                )}
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openPetEdit('vacuna', v)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
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

      {/* ─── Historia Clínica Edit Dialogs ─── */}

      {/* Consulta */}
      <Dialog open={petEditTarget === 'consulta'} onOpenChange={open => !open && closePetEdit()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar consulta</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handlePetEditSave() }} className="space-y-3">
            <div className="space-y-1.5"><Label>Motivo</Label><Input value={editConsultaForm.motivo} onChange={e => setEditConsultaForm(f => ({ ...f, motivo: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Diagnóstico</Label><Textarea value={editConsultaForm.diagnostico} onChange={e => setEditConsultaForm(f => ({ ...f, diagnostico: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Tratamiento</Label><Textarea value={editConsultaForm.tratamiento} onChange={e => setEditConsultaForm(f => ({ ...f, tratamiento: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Observaciones</Label><Textarea value={editConsultaForm.observaciones} onChange={e => setEditConsultaForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePetEdit}>Cancelar</Button>
              <Button type="submit" disabled={petEditSaving}>{petEditSaving ? 'Guardando…' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cirugía */}
      <Dialog open={petEditTarget === 'cirugia'} onOpenChange={open => !open && closePetEdit()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cirugía</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handlePetEditSave() }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Tipo</Label><Input value={editCirugiaForm.tipo} onChange={e => setEditCirugiaForm(f => ({ ...f, tipo: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={editCirugiaForm.fecha} onChange={e => setEditCirugiaForm(f => ({ ...f, fecha: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Estado</Label>
                <Select value={editCirugiaForm.estado} onValueChange={v => setEditCirugiaForm(f => ({ ...f, estado: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="exitosa">Exitosa</SelectItem>
                    <SelectItem value="complicaciones">Complicaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label>Descripción</Label><Textarea value={editCirugiaForm.descripcion} onChange={e => setEditCirugiaForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Resultado</Label><Textarea value={editCirugiaForm.resultado} onChange={e => setEditCirugiaForm(f => ({ ...f, resultado: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePetEdit}>Cancelar</Button>
              <Button type="submit" disabled={petEditSaving}>{petEditSaving ? 'Guardando…' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vacuna */}
      <Dialog open={petEditTarget === 'vacuna'} onOpenChange={open => !open && closePetEdit()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar vacuna</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handlePetEditSave() }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Fecha aplicación</Label><Input type="date" value={editVacunaForm.fecha} onChange={e => setEditVacunaForm(f => ({ ...f, fecha: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Próxima dosis</Label><Input type="date" value={editVacunaForm.proxima_dosis} onChange={e => setEditVacunaForm(f => ({ ...f, proxima_dosis: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePetEdit}>Cancelar</Button>
              <Button type="submit" disabled={petEditSaving}>{petEditSaving ? 'Guardando…' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
