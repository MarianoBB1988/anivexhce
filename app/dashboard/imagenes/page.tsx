'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Calendar, PawPrint, ScanLine, Paperclip } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { useImagenes } from '@/hooks/use-imagenes'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createImagen, updateImagen, deleteImagen, uploadDocumento } from '@/lib/services'
import { ImagenDiagnostica } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { DocumentosPanel } from '@/components/documentos-panel'
import { ImagenForm, ImagenFormData, emptyImagenForm } from '@/components/forms/imagen-form'

const tipoBadgeVariant: Record<ImagenDiagnostica['tipo'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'Radiografía': 'default',
  'Ecografía': 'secondary',
  'TAC': 'outline',
  'Resonancia': 'outline',
  'Otro': 'secondary',
}

export default function ImagenesPage() {
  const { t } = useLanguage()
  const { data: imagenes, loading, refetch } = useImagenes()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { data: usuarios } = useUserList()
  const { user } = useAuth()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogTab, setDialogTab] = useState('datos')
  const [dialogKey, setDialogKey] = useState(0)
  const [initialFormData, setInitialFormData] = useState<Partial<ImagenFormData>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ImagenDiagnostica | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const getMascotaNombre = (id: string) => mascotas.find(m => m.id === id)?.nombre || 'Sin mascota'
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find(m => m.id === mascotaId)
    return duenos.find(d => d.id === mascota?.id_dueno)?.nombre || ''
  }
  const getUsuarioNombre = (id?: string) =>
    id ? (usuarios.find(u => u.id === id)?.nombre || 'Sin asignar') : 'Sin asignar'

  const filtered = imagenes.filter(i => {
    const term = searchTerm.toLowerCase()
    return (
      getMascotaNombre(i.id_mascota).toLowerCase().includes(term) ||
      getDuenoNombrePorMascota(i.id_mascota).toLowerCase().includes(term) ||
      i.tipo.toLowerCase().includes(term) ||
      (i.region || '').toLowerCase().includes(term)
    )
  })

  const openNew = () => {
    setEditingId(null)
    setInitialFormData({})
    setDialogKey(k => k + 1)
    setDialogTab('datos')
    setIsDialogOpen(true)
  }

  const openEdit = (item: ImagenDiagnostica) => {
    setEditingId(item.id)
    const mascota = mascotas.find(m => m.id === item.id_mascota)
    setInitialFormData({
      id_mascota: item.id_mascota,
      id_usuario: item.id_usuario || '',
      fecha: item.fecha?.split('T')[0] || '',
      tipo: item.tipo,
      region: item.region || '',
      hallazgos: item.hallazgos || '',
      observaciones: item.observaciones || '',
      _duenoId: mascota?.id_dueno || '',
    })
    setDialogKey(k => k + 1)
    setDialogTab('datos')
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: ImagenFormData, files: File[]) => {
    if (!user) return
    if (!formData.id_mascota || !formData.fecha || !formData.tipo) {
      toast({ title: 'Campos requeridos', description: 'Mascota, fecha y tipo son obligatorios.', variant: 'destructive' })
      return
    }
    try {
      const { _duenoId, ...rest } = formData
      const payload = Object.fromEntries(
        Object.entries({ ...rest, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== '')
      )
      if (editingId) {
        await updateImagen(editingId, user.id_clinica, payload as any)
        toast({ title: 'Imagen actualizada', description: 'Los cambios se guardaron.' })
        setIsDialogOpen(false)
      } else {
        const res = await createImagen(payload as any)
        if (!res.success || !res.data) throw new Error(res.error || 'Error al crear')
        const newId = res.data.id
        for (const file of files) {
          await uploadDocumento(file, newId, 'imagen', user.id_clinica)
        }
        if (files.length > 0) {
          setEditingId(newId)
          setDialogTab('documentos')
          toast({ title: 'Imagen registrada', description: `${files.length} archivo(s) adjunto(s). Podés agregar más documentos aquí.` })
        } else {
          setIsDialogOpen(false)
          toast({ title: 'Imagen registrada', description: 'El estudio fue guardado exitosamente.' })
        }
      }
      await refetch()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      await deleteImagen(deletingId, user.id_clinica)
      toast({ title: 'Imagen eliminada' })
      setDeletingId(null)
      await refetch()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imágenes Diagnósticas</h1>
          <p className="text-muted-foreground">Registro de radiografías, ecografías y estudios por imagen</p>
        </div>
        {user?.rol !== 'asistente' && (
        <Button className="w-full sm:w-auto" onClick={openNew}>
          <Plus className="mr-2 size-4" />
          Nueva imagen
        </Button>
        )}
      </div>

      {/* Formulario agregar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar imagen diagnóstica' : 'Nueva imagen diagnóstica'}</DialogTitle>
            <DialogDescription>Completá los datos del estudio por imagen</DialogDescription>
          </DialogHeader>
          {editingId ? (
            <Tabs value={dialogTab} onValueChange={setDialogTab}>
              <TabsList className="w-full">
                <TabsTrigger value="datos" className="flex-1">Datos</TabsTrigger>
                <TabsTrigger value="documentos" className="flex-1 gap-2">
                  <Paperclip className="size-4" />Documentos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="datos" className="pt-2">
                <ImagenForm
                  key={dialogKey}
                  initial={initialFormData}
                  duenos={duenos}
                  mascotas={mascotas}
                  usuarios={usuarios}
                  editingId={editingId}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </TabsContent>
              <TabsContent value="documentos">
                <DocumentosPanel idEntidad={editingId} tipoEntidad="imagen" idClinica={user?.id_clinica ?? ''} />
              </TabsContent>
            </Tabs>
          ) : (
            <ImagenForm
              key={dialogKey}
              initial={initialFormData}
              duenos={duenos}
              mascotas={mascotas}
              usuarios={usuarios}
              editingId={null}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen diagnóstica?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Historial de imágenes</CardTitle>
              <CardDescription>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por mascota, tipo o región..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Región</TableHead>
                  <TableHead className="hidden sm:table-cell">Hallazgos</TableHead>
                  <TableHead className="hidden md:table-cell">Veterinario</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span>{new Date(item.fecha).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                          <PawPrint className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{getMascotaNombre(item.id_mascota)}</p>
                          <p className="text-xs text-muted-foreground">{getDuenoNombrePorMascota(item.id_mascota)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tipoBadgeVariant[item.tipo]}>{item.tipo}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-muted-foreground">{item.region || '—'}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="line-clamp-1 text-muted-foreground">{item.hallazgos || '—'}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground">{getUsuarioNombre(item.id_usuario)}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => { setSelectedItem(item); setIsDetailOpen(true) }, 0)}>
                            <Eye className="mr-2 size-4" />Ver detalles
                          </DropdownMenuItem>
                          {user?.rol !== 'asistente' && (
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEdit(item), 0)}>
                            <Pencil className="mr-2 size-4" />Editar
                          </DropdownMenuItem>
                          )}
                          {user?.rol !== 'asistente' && (
                          <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => setDeletingId(item.id), 0)}>
                            <Trash2 className="mr-2 size-4" />Eliminar
                          </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3"><ScanLine className="size-6 text-muted-foreground" /></div>
              <p className="mt-4 text-sm text-muted-foreground">No se encontraron imágenes diagnósticas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet detalle */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="flex flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle de imagen diagnóstica</SheetTitle>
            <SheetDescription>
              {selectedItem && `${getMascotaNombre(selectedItem.id_mascota)} — ${new Date(selectedItem.fecha).toLocaleDateString()}`}
            </SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-4 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <PawPrint className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{getMascotaNombre(selectedItem.id_mascota)}</p>
                  <p className="text-sm text-muted-foreground">{getDuenoNombrePorMascota(selectedItem.id_mascota)}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Tipo de estudio</Label>
                  <p className="mt-1"><Badge variant={tipoBadgeVariant[selectedItem.tipo]}>{selectedItem.tipo}</Badge></p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Fecha</Label>
                  <p className="mt-1">{new Date(selectedItem.fecha).toLocaleDateString()}</p>
                </div>
                {selectedItem.region && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Región anatómica</Label>
                    <p className="mt-1">{selectedItem.region}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Veterinario</Label>
                  <p className="mt-1">{getUsuarioNombre(selectedItem.id_usuario)}</p>
                </div>
                {selectedItem.hallazgos && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Hallazgos</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedItem.hallazgos}</p>
                  </div>
                )}
                {selectedItem.observaciones && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Observaciones</Label>
                    <p className="mt-1">{selectedItem.observaciones}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Archivos adjuntos</Label>
                <div className="mt-2">
                  <DocumentosPanel
                    idEntidad={selectedItem.id}
                    tipoEntidad="imagen"
                    idClinica={user?.id_clinica ?? ''}
                    readonly
                  />
                </div>
              </div>
              <Separator />
              <Button variant="outline" className="w-full" onClick={() => { setIsDetailOpen(false); openEdit(selectedItem) }}>
                <Pencil className="mr-2 size-4" />Editar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
