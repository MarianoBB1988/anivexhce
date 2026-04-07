'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Calendar, PawPrint, FlaskConical, Paperclip } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { useAnalisis } from '@/hooks/use-analisis'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createAnalisis, updateAnalisis, deleteAnalisis, uploadDocumento } from '@/lib/services'
import { Analisis } from '@/lib/types'
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
import { AnalisisForm, AnalisisFormData, emptyAnalisisForm } from '@/components/forms/analisis-form'
import { useTiposAnalisis } from '@/hooks/use-tipos-analisis'

export default function AnalisisPage() {
  const { data: tiposAnalisis, loading: loadingTipos } = useTiposAnalisis();
  const { t } = useLanguage()
  const { data: analisis, loading, refetch } = useAnalisis()
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
  const [initialFormData, setInitialFormData] = useState<Partial<AnalisisFormData>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Analisis | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const getMascotaNombre = (id: string) => mascotas.find(m => m.id === id)?.nombre || 'Sin mascota'
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find(m => m.id === mascotaId)
    return duenos.find(d => d.id === mascota?.id_dueno)?.nombre || ''
  }
  const getUsuarioNombre = (id?: string) =>
    id ? (usuarios.find(u => u.id === id)?.nombre || 'Sin asignar') : 'Sin asignar'

  const filtered = analisis.filter(a => {
    const term = searchTerm.toLowerCase()
    return (
      getMascotaNombre(a.id_mascota).toLowerCase().includes(term) ||
      getDuenoNombrePorMascota(a.id_mascota).toLowerCase().includes(term) ||
      a.tipo.toLowerCase().includes(term)
    )
  })

  const openNew = () => {
    setEditingId(null)
    setInitialFormData({})
    setDialogKey(k => k + 1)
    setDialogTab('datos')
    setIsDialogOpen(true)
  }

  const openEdit = (item: Analisis) => {
    setEditingId(item.id)
    const mascota = mascotas.find(m => m.id === item.id_mascota)
    setInitialFormData({
      id_mascota: item.id_mascota,
      id_usuario: item.id_usuario || '',
      fecha: item.fecha?.split('T')[0] || '',
      tipo: item.tipo,
      descripcion: item.descripcion || '',
      resultado: item.resultado || '',
      observaciones: item.observaciones || '',
      _duenoId: mascota?.id_dueno || '',
    })
    setDialogKey(k => k + 1)
    setDialogTab('datos')
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: AnalisisFormData, files: File[]) => {
    if (!user) return
    if (!formData.id_mascota || !formData.tipo || !formData.fecha) {
      toast({ title: 'Campos requeridos', description: 'Mascota, tipo y fecha son obligatorios.', variant: 'destructive' })
      return
    }
    try {
      const { _duenoId, ...rest } = formData
      const payload = Object.fromEntries(Object.entries({ ...rest, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== ''))
      if (editingId) {
        await updateAnalisis(editingId, user.id_clinica, payload as any)
        toast({ title: 'Análisis actualizado', description: 'Los cambios se guardaron.' })
        setIsDialogOpen(false)
      } else {
        const res = await createAnalisis(payload as any)
        if (!res.success || !res.data) throw new Error(res.error || 'Error al crear')
        const newId = res.data.id
        for (const file of files) {
          await uploadDocumento(file, newId, 'analisis', user.id_clinica)
        }
        setEditingId(newId)
        setDialogTab('documentos')
        toast({ title: 'Análisis registrado', description: files.length > 0 ? `${files.length} archivo(s) adjunto(s).` : 'Podés adjuntar documentos ahora.' })
      }
      await refetch()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      await deleteAnalisis(deletingId, user.id_clinica)
      toast({ title: 'Análisis eliminado' })
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
          <h1 className="text-2xl font-bold text-foreground">Análisis de Laboratorio</h1>
          <p className="text-muted-foreground">Registro de análisis clínicos por mascota</p>
        </div>
        {user?.rol !== 'asistente' && (
        <Button className="w-full sm:w-auto" onClick={openNew}>
          <Plus className="mr-2 size-4" />
          Nuevo análisis
        </Button>
        )}
      </div>

      {/* Formulario agregar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar análisis' : 'Nuevo análisis'}</DialogTitle>
            <DialogDescription>Completá los datos del análisis de laboratorio</DialogDescription>
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
                <AnalisisForm
                  key={dialogKey}
                  initial={initialFormData}
                  duenos={duenos}
                  mascotas={mascotas}
                  usuarios={usuarios}
                  editingId={editingId}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsDialogOpen(false)}
                  tiposAnalisis={tiposAnalisis}
                  loading={loadingTipos}
                />
              </TabsContent>
              <TabsContent value="documentos">
                <DocumentosPanel idEntidad={editingId} tipoEntidad="analisis" idClinica={user?.id_clinica ?? ''} />
              </TabsContent>
            </Tabs>
          ) : (
            <AnalisisForm
              key={dialogKey}
              initial={initialFormData}
              duenos={duenos}
              mascotas={mascotas}
              usuarios={usuarios}
              editingId={null}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              tiposAnalisis={tiposAnalisis}
              loading={loadingTipos}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar análisis?</AlertDialogTitle>
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
              <CardTitle>Historial de análisis</CardTitle>
              <CardDescription>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por mascota, dueño o tipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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
                  <TableHead className="hidden sm:table-cell">Resultado</TableHead>
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
                      <Badge variant="secondary">{item.tipo}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="line-clamp-1 text-muted-foreground">{item.resultado || '—'}</span>
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
              <div className="rounded-full bg-muted p-3"><FlaskConical className="size-6 text-muted-foreground" /></div>
              <p className="mt-4 text-sm text-muted-foreground">No se encontraron análisis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet detalle */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="flex flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle del análisis</SheetTitle>
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
                  <Label className="text-xs uppercase text-muted-foreground">Tipo</Label>
                  <p className="mt-1"><Badge variant="secondary">{selectedItem.tipo}</Badge></p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Fecha</Label>
                  <p className="mt-1">{new Date(selectedItem.fecha).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Veterinario</Label>
                  <p className="mt-1">{getUsuarioNombre(selectedItem.id_usuario)}</p>
                </div>
                {selectedItem.descripcion && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Descripción / Muestra</Label>
                    <p className="mt-1">{selectedItem.descripcion}</p>
                  </div>
                )}
                {selectedItem.resultado && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Resultado</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedItem.resultado}</p>
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
                    tipoEntidad="analisis"
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
