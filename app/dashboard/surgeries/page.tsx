'use client'

import { useState, useRef } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Scissors, AlertCircle, CheckCircle, Calendar, Clock, PawPrint, Dog, Cat, Bird, Rabbit, Check, ChevronsUpDown, Eye, X as XIcon, RefreshCw } from 'lucide-react'
import { useLanguage } from "@/lib/language-context"
import { Separator } from "@/components/ui/separator"
import { useCirugias } from '@/hooks/use-cirugias'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useTiposCirugia } from '@/hooks/use-tipos-cirugia'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createCirugia, updateCirugia, deleteCirugia, uploadDocumento } from '@/lib/services'
import { Cirugia, Dueno, Mascota, Usuario, TipoCirugia } from '@/lib/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenuSeparator,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Paperclip } from 'lucide-react'
import { DocumentosPanel } from '@/components/documentos-panel'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

const emptyForm = {
  id_mascota: '',
  id_usuario: '',
  tipo: '',
  fecha: '',
  resultado: 'scheduled',
  descripcion: '',
}

const speciesIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Dog, Cat, Bird, Rabbit,
  perro: Dog, gato: Cat, ave: Bird, conejo: Rabbit,
}

type SurgeryFormData = typeof emptyForm & { _duenoId?: string }

function SurgeryForm({
  initial, duenos, mascotas, usuarios, tiposCirugia, editingId, onSubmit, onCancel, t,
}: {
  initial: SurgeryFormData
  duenos: Dueno[]
  mascotas: Mascota[]
  usuarios: Usuario[]
  tiposCirugia: TipoCirugia[]
  editingId: string | null
  onSubmit: (data: SurgeryFormData, files: File[]) => Promise<void>
  onCancel: () => void
  t: (key: string) => string
}) {
  const [selectedDuenoId, setSelectedDuenoId] = useState(initial._duenoId || '')
  const [formData, setFormData] = useState(initial)
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [petOpen, setPetOpen] = useState(false)
  const [usuarioOpen, setUsuarioOpen] = useState(false)
  const [tipoOpen, setTipoOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filteredMascotas = selectedDuenoId ? mascotas.filter(m => m.id_dueno === selectedDuenoId) : []

  const handleOwnerChange = (duenoId: string) => {
    setSelectedDuenoId(duenoId)
    setFormData(prev => ({ ...prev, id_mascota: '', _duenoId: duenoId }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData, pendingFiles) }} className="space-y-4">
      {/* Row 1: Dueño + Mascota */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('owner')}</Label>
          <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
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
          <Popover open={petOpen} onOpenChange={setPetOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" disabled={!selectedDuenoId} className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
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
      {/* Row 2: Veterinario + Tipo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('veterinarian')}</Label>
          <Popover open={usuarioOpen} onOpenChange={setUsuarioOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                <span className="truncate">{formData.id_usuario ? usuarios.find(u => u.id === formData.id_usuario)?.nombre : t('selectVeterinarian')}</span>
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
                      <CommandItem key={u.id} value={u.nombre} onSelect={() => { setFormData(prev => ({ ...prev, id_usuario: u.id })); setUsuarioOpen(false) }}>
                        <Check className={cn('mr-2 size-4', formData.id_usuario === u.id ? 'opacity-100' : 'opacity-0')} />
                        {u.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label>{t('surgeryType')}</Label>
          <Popover open={tipoOpen} onOpenChange={setTipoOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-yellow-50 hover:text-foreground">
                <span className="truncate">{formData.tipo || t('selectType')}</span>
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
                      <CommandItem key={tc.id} value={tc.nombre} onSelect={() => { setFormData(prev => ({ ...prev, tipo: tc.nombre })); setTipoOpen(false) }}>
                        <Check className={cn('mr-2 size-4', formData.tipo === tc.nombre ? 'opacity-100' : 'opacity-0')} />
                        {tc.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Row 3: Fecha + Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('date')}</Label>
          <Input type="date" value={formData.fecha} onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('status')}</Label>
          <Select value={formData.resultado} onValueChange={(v) => setFormData(prev => ({ ...prev, resultado: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
              <SelectItem value="successful">{t('successful')}</SelectItem>
              <SelectItem value="in-progress">{t('inProgress')}</SelectItem>
              <SelectItem value="complications">{t('complications')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Row 4: Notas full width */}
      <div className="space-y-1.5">
        <Label>{t('notes')}</Label>
        <Textarea value={formData.descripcion} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} placeholder={t('preOperativeNotes')} />
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
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="hidden"
                onChange={(e) => { if (e.target.files) { setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]); e.target.value = '' } }} />
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-1">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                    <span className="flex-1 truncate text-muted-foreground">{f.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
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
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{t('save')}</Button>
      </DialogFooter>
    </form>
  )
}

export default function SurgeriesPage() {
  const { t } = useLanguage()
  const { data: cirugias, loading: cirugiasLoading, refetch } = useCirugias()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { data: usuarios } = useUserList()
  const { data: tiposCirugia } = useTiposCirugia()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [dialogTab, setDialogTab] = useState('datos')
  const [selectedSurgery, setSelectedSurgery] = useState<Cirugia | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [initialFormData, setInitialFormData] = useState<SurgeryFormData>(emptyForm)

  const getMascotaNombre = (id: string) => mascotas.find(m => m.id === id)?.nombre || ''
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find(m => m.id === mascotaId)
    return duenos.find(d => d.id === mascota?.id_dueno)?.nombre || ''
  }
  const getUsuarioNombre = (id?: string) =>
    id ? (usuarios.find(u => u.id === id)?.nombre || t('notAssigned')) : t('notAssigned')

  const filteredCirugias = cirugias.filter((c) => {
    const mascotaNombre = getMascotaNombre(c.id_mascota).toLowerCase()
    const duenoNombre = getDuenoNombrePorMascota(c.id_mascota).toLowerCase()
    const term = searchTerm.toLowerCase()
    return mascotaNombre.includes(term) || duenoNombre.includes(term) || c.tipo.toLowerCase().includes(term)
  })

  // Stats
  const successfulCount = cirugias.filter(c => c.resultado === 'successful').length
  const scheduledCount = cirugias.filter(c => c.resultado === 'scheduled').length
  const inProgressCount = cirugias.filter(c => c.resultado === 'in-progress').length

  const getResultBadge = (resultado: string) => {
    switch (resultado) {
      case 'successful':
        return <Badge className="bg-success text-white">{t('successful')}</Badge>
      case 'scheduled':
        return <Badge className="bg-primary text-white">{t('scheduled')}</Badge>
      case 'in-progress':
        return <Badge className="bg-warning text-white">{t('inProgress')}</Badge>
      case 'complications':
        return <Badge className="bg-destructive text-white">{t('complications')}</Badge>
      default:
        return <Badge variant="secondary">{resultado}</Badge>
    }
  }

  const openNewDialog = () => {
    setEditingId(null)
    setInitialFormData(emptyForm)
    setDialogKey(k => k + 1)
    setDialogTab('datos')
    setIsDialogOpen(true)
  }

  const openEditDialog = (cirugia: Cirugia) => {
    setEditingId(cirugia.id)
    const mascota = mascotas.find(m => m.id === cirugia.id_mascota)
    setInitialFormData({
      id_mascota: cirugia.id_mascota,
      id_usuario: cirugia.id_usuario || '',
      tipo: cirugia.tipo,
      fecha: cirugia.fecha,
      resultado: cirugia.resultado,
      descripcion: cirugia.descripcion || '',
      _duenoId: mascota?.id_dueno || '',
    })
    setDialogKey(k => k + 1)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: SurgeryFormData, files: File[] = []) => {
    if (!user) return
    try {
      const { _duenoId, ...rest } = formData
      const payload = {
        id_mascota: rest.id_mascota,
        fecha: rest.fecha,
        tipo: rest.tipo || null,
        descripcion: rest.descripcion || null,
        resultado: rest.resultado,
        id_usuario: rest.id_usuario || null,
        id_clinica: user.id_clinica,
      }
      if (editingId) {
        const res = await updateCirugia(editingId, user.id_clinica, payload)
        if (!res.success) throw new Error(res.error || 'Error al actualizar')
        toast({ title: 'Cirugía actualizada', description: 'Los cambios se guardaron.' })
        setIsDialogOpen(false)
      } else {
        const res = await createCirugia(payload)
        if (!res.success || !res.data) throw new Error(res.error || 'Error al registrar')
        const newId = res.data.id
        for (const file of files) {
          await uploadDocumento(file, newId, 'cirugia', user.id_clinica)
        }
        setEditingId(newId)
        setDialogTab('documentos')
        toast({ title: 'Cirugía registrada', description: files.length > 0 ? `${files.length} archivo(s) adjunto(s).` : 'Podés adjuntar documentos ahora.' })
      }
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      const res = await deleteCirugia(deletingId, user.id_clinica)
      if (!res.success) throw new Error(res.error || 'Error al eliminar')
      toast({ title: 'Cirugía eliminada', description: 'El registro fue removido.' })
      setDeletingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleViewDetails = (cirugia: Cirugia) => {
    setSelectedSurgery(cirugia)
    setIsDetailOpen(true)
  }

  const handleStatusChange = async (id: string, resultado: string) => {
    if (!user) return
    try {
      const res = await updateCirugia(id, user.id_clinica, { resultado } as any)
      if (!res.success) throw new Error(res.error || 'Error al actualizar')
      toast({ title: 'Estado actualizado' })
      setStatusChangingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('surgeries')}</h1>
          <p className="text-muted-foreground">{t('manageSurgeries')}</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openNewDialog}>
          <Plus className="mr-2 size-4" />
          {t('addSurgery')}
        </Button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t('edit') : t('addSurgery')}</DialogTitle>
            <DialogDescription>{t('manageSurgeries')}</DialogDescription>
          </DialogHeader>
          {editingId ? (
            <Tabs value={dialogTab} onValueChange={setDialogTab}>
              <TabsList className="w-full">
                <TabsTrigger value="datos" className="flex-1">Datos</TabsTrigger>
                <TabsTrigger value="documentos" className="flex-1 gap-2">
                  <Paperclip className="size-4" />Documentos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="datos">
                <SurgeryForm
                  key={dialogKey}
                  initial={initialFormData}
                  duenos={duenos}
                  mascotas={mascotas}
                  usuarios={usuarios}
                  tiposCirugia={tiposCirugia}
                  editingId={editingId}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsDialogOpen(false)}
                  t={t}
                />
              </TabsContent>
              <TabsContent value="documentos">
                <DocumentosPanel idEntidad={editingId} tipoEntidad="cirugia" idClinica={user?.id_clinica ?? ''} />
              </TabsContent>
            </Tabs>
          ) : (
            <SurgeryForm
              key={dialogKey}
              initial={initialFormData}
              duenos={duenos}
              mascotas={mascotas}
              usuarios={usuarios}
              tiposCirugia={tiposCirugia}
              editingId={null}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              t={t}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cirugía?</AlertDialogTitle>
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
              <CheckCircle className="size-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{successfulCount}</p>
              <p className="text-sm text-muted-foreground">{t('successful')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{scheduledCount}</p>
              <p className="text-sm text-muted-foreground">{t('scheduled')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-warning/10">
              <Clock className="size-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">{t('inProgress')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('surgicalProcedures')}</CardTitle>
              <CardDescription>{filteredCirugias.length} {t('surgeriesRecorded')}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchSurgeries')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cirugiasLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('petName')}</TableHead>
                  <TableHead>{t('surgeryType')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('date')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('surgeon')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCirugias.map((surgery) => (
                  <TableRow key={surgery.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                          {(() => { const m = mascotas.find(x => x.id === surgery.id_mascota); const Icon = speciesIcons[m?.especie || ''] || PawPrint; return <Icon className="size-4 text-primary" /> })()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{getMascotaNombre(surgery.id_mascota)}</p>
                          <p className="text-xs text-muted-foreground">{getDuenoNombrePorMascota(surgery.id_mascota)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Scissors className="size-3" />
                        {surgery.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {surgery.fecha ? new Date(surgery.fecha).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {getUsuarioNombre(surgery.id_usuario)}
                    </TableCell>
                    <TableCell>{getResultBadge(surgery.resultado)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => handleViewDetails(surgery), 0)}>
                            <Eye className="mr-2 size-4" />
                            {t('viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEditDialog(surgery), 0)}>
                            <Pencil className="mr-2 size-4" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setTimeout(() => setStatusChangingId(surgery.id), 0)}>
                            <RefreshCw className="mr-2 size-4" />
                            Cambiar estado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setTimeout(() => setDeletingId(surgery.id), 0)}
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
          {!cirugiasLoading && filteredCirugias.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('noSurgeriesFound')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Status Change Dialog */}
      <Dialog open={!!statusChangingId} onOpenChange={(open) => { if (!open) setStatusChangingId(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
            <DialogDescription>Seleccioná el nuevo estado de la cirugía.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {([
              { value: 'scheduled', label: t('scheduled'), cls: 'bg-primary text-white hover:bg-primary/90' },
              { value: 'in-progress', label: t('inProgress'), cls: 'bg-warning text-white hover:bg-warning/90' },
              { value: 'successful', label: t('successful'), cls: 'bg-success text-white hover:bg-success/90' },
              { value: 'complications', label: t('complications'), cls: 'bg-destructive text-white hover:bg-destructive/90' },
            ] as const).map(({ value, label, cls }) => (
              <Button key={value} className={cls} onClick={() => handleStatusChange(statusChangingId!, value)}>
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Surgery Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="flex flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('viewDetails')}</SheetTitle>
            <SheetDescription>
              {selectedSurgery && `${getMascotaNombre(selectedSurgery.id_mascota)} — ${selectedSurgery.tipo}`}
            </SheetDescription>
          </SheetHeader>
          {selectedSurgery && (
            <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-4 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Scissors className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{getMascotaNombre(selectedSurgery.id_mascota)}</p>
                  <p className="text-sm text-muted-foreground">{getDuenoNombrePorMascota(selectedSurgery.id_mascota)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('surgeryType')}</Label>
                  <p className="mt-1 text-foreground">{selectedSurgery.tipo}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('date')}</Label>
                  <p className="mt-1 text-foreground">{selectedSurgery.fecha ? new Date(selectedSurgery.fecha).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('surgeon')}</Label>
                  <p className="mt-1 text-foreground">{getUsuarioNombre(selectedSurgery.id_usuario)}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('status')}</Label>
                  <div className="mt-1">{getResultBadge(selectedSurgery.resultado)}</div>
                </div>
                {selectedSurgery.descripcion && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">{t('notes')}</Label>
                    <p className="mt-1 text-foreground">{selectedSurgery.descripcion}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Archivos adjuntos</Label>
                <div className="mt-2">
                  <DocumentosPanel
                    idEntidad={selectedSurgery.id}
                    tipoEntidad="cirugia"
                    idClinica={user?.id_clinica ?? ''}
                    readonly
                  />
                </div>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" onClick={() => { setIsDetailOpen(false); openEditDialog(selectedSurgery) }}>
                <Pencil className="mr-2 size-4" />
                {t('edit')}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

