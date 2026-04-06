'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Syringe, Calendar, AlertCircle, PawPrint, Check, ChevronsUpDown, Dog, Cat, Bird, Rabbit } from 'lucide-react'
import { useLanguage } from "@/lib/language-context"
import { useVacunas } from '@/hooks/use-vacunas'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useTiposVacuna } from '@/hooks/use-tipos-vacuna'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createVacuna, updateVacuna, deleteVacuna, createTipoVacuna } from '@/lib/services'
import { Vacuna, Dueno, Mascota, TipoVacuna } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const emptyForm = {
  id_mascota: '',
  id_tipo_vacuna: '',
  fecha: '',
  proxima_dosis: '',
}

const speciesIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Dog, Cat, Bird, Rabbit,
  perro: Dog, gato: Cat, ave: Bird, conejo: Rabbit,
}

function getVacunaStatus(proxima_dosis: string): 'current' | 'due-soon' | 'overdue' {
  const today = new Date()
  const nextDose = new Date(proxima_dosis)
  const daysUntil = Math.floor((nextDose.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 30) return 'due-soon'
  return 'current'
}

type VacunaFormData = typeof emptyForm & { _duenoId?: string }

function VacunaForm({
  initial, duenos, mascotas, tiposVacuna, editingId, onSubmit, onCancel, onTipoAdded, t,
}: {
  initial: VacunaFormData
  duenos: Dueno[]
  mascotas: Mascota[]
  tiposVacuna: TipoVacuna[]
  editingId: string | null
  onSubmit: (data: VacunaFormData) => Promise<void>
  onCancel: () => void
  onTipoAdded: () => Promise<void>
  t: (key: string) => string
}) {
  const { toast } = useToast()
  const [selectedDuenoId, setSelectedDuenoId] = useState(initial._duenoId || '')
  const [formData, setFormData] = useState(initial)
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [petOpen, setPetOpen] = useState(false)
  const [tipoOpen, setTipoOpen] = useState(false)
  const [isAddingTipo, setIsAddingTipo] = useState(false)
  const [newTipoNombre, setNewTipoNombre] = useState('')
  const filteredMascotas = selectedDuenoId ? mascotas.filter(m => m.id_dueno === selectedDuenoId) : []

  const handleOwnerChange = (duenoId: string) => {
    setSelectedDuenoId(duenoId)
    setFormData(prev => ({ ...prev, id_mascota: '', _duenoId: duenoId }))
  }

  const handleAddTipoVacuna = async () => {
    if (!newTipoNombre.trim()) return
    try {
      const res = await createTipoVacuna(newTipoNombre.trim())
      if (res.success && res.data) {
        await onTipoAdded()
        setFormData(prev => ({ ...prev, id_tipo_vacuna: res.data!.id }))
        toast({ title: 'Tipo agregado', description: `"${res.data.nombre}" fue agregado.` })
        setNewTipoNombre('')
        setIsAddingTipo(false)
      } else {
        toast({ title: 'Error al agregar', description: res.error || 'No se pudo guardar el tipo de vacuna.', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }} className="space-y-4">
      {/* Row 1: Dueño + Mascota */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('owner')}</Label>
          <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={ownerOpen} className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                <span className="truncate">{selectedDuenoId ? duenos.find(d => d.id === selectedDuenoId)?.nombre : t('selectOwner')}</span>
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
                      <CommandItem key={d.id} value={d.nombre} onSelect={() => { handleOwnerChange(d.id); setOwnerOpen(false) }}>
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
          <Label>{t('petName')}</Label>
          <Popover open={petOpen} onOpenChange={(v) => { if (!selectedDuenoId) return; setPetOpen(v) }}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={petOpen} disabled={!selectedDuenoId} className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                <span className="truncate">{formData.id_mascota ? mascotas.find(m => m.id === formData.id_mascota)?.nombre : (selectedDuenoId ? t('selectPet') : t('selectOwnerFirst'))}</span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar mascota..." />
                <CommandList>
                  <CommandEmpty>No encontrada.</CommandEmpty>
                  <CommandGroup>
                    {filteredMascotas.map(m => (
                      <CommandItem key={m.id} value={m.nombre} onSelect={() => { setFormData(prev => ({ ...prev, id_mascota: m.id })); setPetOpen(false) }}>
                        <Check className={cn('mr-2 size-4', formData.id_mascota === m.id ? 'opacity-100' : 'opacity-0')} />
                        {m.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Tipo vacuna full width */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>{t('vaccineType')}</Label>
          <button
            type="button"
            className="text-xs text-primary underline-offset-2 hover:underline"
            onClick={() => setIsAddingTipo(v => !v)}
          >
            {isAddingTipo ? t('cancel') : '+ Nuevo tipo'}
          </button>
        </div>
        {isAddingTipo ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newTipoNombre}
              onChange={(e) => setNewTipoNombre(e.target.value)}
              placeholder="Nombre del tipo de vacuna"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTipoVacuna() } }}
            />
            <Button type="button" size="sm" onClick={handleAddTipoVacuna}>Agregar</Button>
          </div>
        ) : (
          <Popover open={tipoOpen} onOpenChange={setTipoOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={tipoOpen} className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                {formData.id_tipo_vacuna ? tiposVacuna.find(tv => tv.id === formData.id_tipo_vacuna)?.nombre : t('selectVaccine')}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar tipo..." />
                <CommandList>
                  <CommandEmpty>No encontrado.</CommandEmpty>
                  <CommandGroup>
                    {tiposVacuna.map(tipo => (
                      <CommandItem key={tipo.id} value={tipo.nombre} onSelect={() => { setFormData(prev => ({ ...prev, id_tipo_vacuna: tipo.id })); setTipoOpen(false) }}>
                        <Check className={cn('mr-2 size-4', formData.id_tipo_vacuna === tipo.id ? 'opacity-100' : 'opacity-0')} />
                        {tipo.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {/* Fecha + Proxima dosis */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('date')}</Label>
          <Input type="date" value={formData.fecha} onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('nextDoseDate')}</Label>
          <Input type="date" value={formData.proxima_dosis} onChange={(e) => setFormData(prev => ({ ...prev, proxima_dosis: e.target.value }))} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{editingId ? t('save') : t('addVaccination')}</Button>
      </DialogFooter>
    </form>
  )
}

export default function VaccinationsPage() {
  const { t } = useLanguage()
  const { data: vacunas, loading: vacunasLoading, refetch } = useVacunas()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { data: tiposVacuna, refetch: refetchTipos } = useTiposVacuna()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [initialFormData, setInitialFormData] = useState<VacunaFormData>(emptyForm)

  const getMascotaNombre = (id: string) => mascotas.find(m => m.id === id)?.nombre || ''
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find(m => m.id === mascotaId)
    return duenos.find(d => d.id === mascota?.id_dueno)?.nombre || ''
  }

  const filteredVacunas = vacunas.filter((v) => {
    const mascotaNombre = getMascotaNombre(v.id_mascota).toLowerCase()
    const duenoNombre = getDuenoNombrePorMascota(v.id_mascota).toLowerCase()
    const tipoNombre = (tiposVacuna.find(t => t.id === v.id_tipo_vacuna)?.nombre || '').toLowerCase()
    const term = searchTerm.toLowerCase()
    return mascotaNombre.includes(term) || duenoNombre.includes(term) || tipoNombre.includes(term)
  })

  // Stats
  const currentCount = vacunas.filter(v => v.proxima_dosis && getVacunaStatus(v.proxima_dosis) === 'current').length
  const dueSoonCount = vacunas.filter(v => v.proxima_dosis && getVacunaStatus(v.proxima_dosis) === 'due-soon').length
  const overdueCount = vacunas.filter(v => v.proxima_dosis && getVacunaStatus(v.proxima_dosis) === 'overdue').length

  const getStatusBadge = (proxima_dosis: string) => {
    const status = getVacunaStatus(proxima_dosis)
    switch (status) {
      case 'current':
        return <Badge className="bg-success/20 text-success-foreground">{t('upToDate')}</Badge>
      case 'due-soon':
        return <Badge className="bg-warning text-white">{t('dueSoon')}</Badge>
      case 'overdue':
        return <Badge className="bg-destructive/20 text-destructive">{t('overdue')}</Badge>
    }
  }

  const openNewDialog = () => {
    setEditingId(null)
    setInitialFormData(emptyForm)
    setDialogKey(k => k + 1)
    setIsDialogOpen(true)
  }

  const openEditDialog = (vacuna: Vacuna) => {
    setEditingId(vacuna.id)
    const mascota = mascotas.find(m => m.id === vacuna.id_mascota)
    setInitialFormData({
      id_mascota: vacuna.id_mascota,
      id_tipo_vacuna: vacuna.id_tipo_vacuna || '',
      fecha: vacuna.fecha,
      proxima_dosis: vacuna.proxima_dosis ?? '',
      _duenoId: mascota?.id_dueno || '',
    })
    setDialogKey(k => k + 1)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: VacunaFormData) => {
    if (!user) return
    const { _duenoId, ...rest } = formData
    const payload = {
      id_mascota: rest.id_mascota,
      id_tipo_vacuna: rest.id_tipo_vacuna || null,
      fecha: rest.fecha,
      proxima_dosis: rest.proxima_dosis || null,
    }
    try {
      if (editingId) {
        const res = await updateVacuna(editingId, user.id_clinica, payload)
        if (!res.success) throw new Error(res.error || 'Error al actualizar')
        toast({ title: 'Vacuna actualizada', description: 'Los cambios se guardaron.' })
      } else {
        const res = await createVacuna({ ...payload, id_clinica: user.id_clinica })
        if (!res.success) throw new Error(res.error || 'Error al crear')
        toast({ title: 'Vacuna registrada', description: 'La vacuna fue registrada.' })
      }
      setIsDialogOpen(false)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      await deleteVacuna(deletingId, user.id_clinica)
      toast({ title: 'Vacuna eliminada', description: 'El registro fue removido.' })
      setDeletingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('vaccinations')}</h1>
          <p className="text-muted-foreground">{t('trackVaccinations')}</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openNewDialog}>
          <Plus className="mr-2 size-4" />
          {t('addVaccination')}
        </Button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t('edit') : t('recordVaccination')}</DialogTitle>
            <DialogDescription>{t('trackVaccinations')}</DialogDescription>
          </DialogHeader>
          <VacunaForm
            key={dialogKey}
            initial={initialFormData}
            duenos={duenos}
            mascotas={mascotas}
            tiposVacuna={tiposVacuna}
            editingId={editingId}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            onTipoAdded={refetchTipos}
            t={t}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vacuna?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
              <Syringe className="size-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentCount}</p>
              <p className="text-sm text-muted-foreground">{t('upToDate')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-warning/10">
              <Calendar className="size-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dueSoonCount}</p>
              <p className="text-sm text-muted-foreground">{t('dueSoon')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
              <p className="text-sm text-muted-foreground">{t('overdue')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('trackVaccinations')}</CardTitle>
              <CardDescription>{filteredVacunas.length} {t('vaccinationsRecorded')}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchVaccinations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vacunasLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('petName')}</TableHead>
                  <TableHead>{t('vaccineType')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('date')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('nextDoseDate')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVacunas.map((vax) => (
                  <TableRow key={vax.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                          {(() => { const m = mascotas.find(x => x.id === vax.id_mascota); const Icon = speciesIcons[m?.especie || ''] || PawPrint; return <Icon className="size-4 text-primary" /> })()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{getMascotaNombre(vax.id_mascota)}</p>
                          <p className="text-xs text-muted-foreground">{getDuenoNombrePorMascota(vax.id_mascota)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const tipo = tiposVacuna.find(t => t.id === vax.id_tipo_vacuna)
                        const color = tipo?.color
                        return (
                          <Badge
                            variant="outline"
                            className="gap-1"
                            style={color ? { borderColor: color, color } : undefined}
                          >
                            <Syringe className="size-3" />
                            {tipo?.nombre || '-'}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {vax.fecha ? new Date(vax.fecha).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {vax.proxima_dosis ? getStatusBadge(vax.proxima_dosis) : <Badge variant="secondary">-</Badge>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {vax.proxima_dosis ? new Date(vax.proxima_dosis).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEditDialog(vax), 0)}>
                            <Pencil className="mr-2 size-4" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setTimeout(() => setDeletingId(vax.id), 0)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!vacunasLoading && filteredVacunas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('noVaccinationsFound')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
