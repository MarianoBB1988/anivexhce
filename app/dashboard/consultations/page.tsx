'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Calendar, PawPrint, Stethoscope, Dog, Cat, Bird, Rabbit, X as XIcon, Paperclip } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { useConsultas } from '@/hooks/use-consultas'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createConsulta, updateConsulta, deleteConsulta, uploadDocumento } from '@/lib/services'
import { Consulta, Dueno, Mascota, Usuario } from '@/lib/types'
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentosPanel } from '@/components/documentos-panel'
import { ConsultaForm, emptyConsultaForm, ConsultaFormData } from '@/components/forms/consulta-form'

const speciesIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Dog, Cat, Bird, Rabbit,
  perro: Dog, gato: Cat, ave: Bird, conejo: Rabbit,
}

export default function ConsultationsPage() {
  const { t } = useLanguage()
  const { data: consultas, loading: consultasLoading, refetch } = useConsultas()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { data: usuarios } = useUserList()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogTab, setDialogTab] = useState('datos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedConsultation, setSelectedConsultation] = useState<Consulta | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  const [initialFormData, setInitialFormData] = useState(emptyConsultaForm)

  const getMascotaNombre = (id: string) => mascotas.find(m => m.id === id)?.nombre || 'Sin mascota'
  const getDuenoNombrePorMascota = (mascotaId: string) => {
    const mascota = mascotas.find(m => m.id === mascotaId)
    return duenos.find(d => d.id === mascota?.id_dueno)?.nombre || ''
  }
  const getUsuarioNombre = (id?: string) =>
    id ? (usuarios.find(u => u.id === id)?.nombre || t('notAssigned')) : t('notAssigned')

  const filteredConsultas = consultas.filter((c) => {
    const mascotaNombre = getMascotaNombre(c.id_mascota).toLowerCase()
    const duenoNombre = getDuenoNombrePorMascota(c.id_mascota).toLowerCase()
    const term = searchTerm.toLowerCase()
    return mascotaNombre.includes(term) || duenoNombre.includes(term) || c.motivo.toLowerCase().includes(term)
  })

  const openNewDialog = () => {
    setEditingId(null)
    setInitialFormData(emptyConsultaForm)
    setDialogKey(k => k + 1)
    setDialogTab('datos')
    setIsDialogOpen(true)
  }

  const openEditDialog = (consulta: Consulta) => {
    setEditingId(consulta.id)
    const mascota = mascotas.find(m => m.id === consulta.id_mascota)
    setInitialFormData({
      id_mascota: consulta.id_mascota,
      id_usuario: consulta.id_usuario || '',
      fecha_date: consulta.fecha?.split('T')[0] || '',
      fecha_time: consulta.fecha?.split('T')[1]?.slice(0, 5) || '',
      motivo: consulta.motivo,
      diagnostico: consulta.diagnostico,
      tratamiento: consulta.tratamiento,
      observaciones: consulta.observaciones,
      _duenoId: mascota?.id_dueno || '',
    })
    setDialogKey(k => k + 1)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: ConsultaFormData, files: File[] = []) => {
    if (!user) return
    try {
      const { fecha_date, fecha_time, _duenoId, ...rest } = formData as any
      const payload = { ...rest, fecha: fecha_date + (fecha_time ? 'T' + fecha_time : '') }
      if (editingId) {
        await updateConsulta(editingId, user.id_clinica, payload)
        toast({ title: 'Consulta actualizada', description: 'Los cambios se guardaron.' })
        setIsDialogOpen(false)
      } else {
        const res = await createConsulta({ ...payload, id_clinica: user.id_clinica })
        if (!res.success || !res.data) throw new Error(res.error || 'Error al crear la consulta')
        const newId = res.data.id
        for (const file of files) {
          await uploadDocumento(file, newId, 'consulta', user.id_clinica)
        }
        setEditingId(newId)
        setDialogTab('documentos')
        toast({ title: 'Consulta creada', description: files.length > 0 ? `${files.length} archivo(s) adjunto(s).` : 'Podés adjuntar documentos ahora.' })
      }
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      await deleteConsulta(deletingId, user.id_clinica)
      toast({ title: 'Consulta eliminada', description: 'La consulta fue removida.' })
      setDeletingId(null)
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  const handleViewDetails = (consulta: Consulta) => {
    setSelectedConsultation(consulta)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('consultations')}</h1>
          <p className="text-muted-foreground">{t('manageConsultations')}</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openNewDialog}>
          <Plus className="mr-2 size-4" />
          {t('newConsultation')}
        </Button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t('edit') : t('newConsultation')}</DialogTitle>
            <DialogDescription>{t('manageConsultations')}</DialogDescription>
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
                <ConsultaForm
                  key={dialogKey}
                  initial={initialFormData as any}
                  duenos={duenos}
                  mascotas={mascotas}
                  usuarios={usuarios}
                  editingId={editingId}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </TabsContent>
              <TabsContent value="documentos">
                <DocumentosPanel idEntidad={editingId} tipoEntidad="consulta" idClinica={user?.id_clinica ?? ''} />
              </TabsContent>
            </Tabs>
          ) : (
            <ConsultaForm
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La consulta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('consultationHistory')}</CardTitle>
              <CardDescription>{filteredConsultas.length} {t('consultationsRecorded')}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchConsultations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {consultasLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('petName')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('diagnosis')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('veterinarian')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultas.map((consulta) => (
                  <TableRow key={consulta.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {new Date(consulta.fecha).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                          {(() => { const m = mascotas.find(x => x.id === consulta.id_mascota); const Icon = speciesIcons[m?.especie || ''] || PawPrint; return <Icon className="size-4 text-primary" /> })()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{getMascotaNombre(consulta.id_mascota)}</p>
                          <p className="text-xs text-muted-foreground">{getDuenoNombrePorMascota(consulta.id_mascota)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-muted-foreground line-clamp-1">
                        {consulta.diagnostico}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{getUsuarioNombre(consulta.id_usuario)}</span>
                      </div>
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
                          <DropdownMenuItem onSelect={() => setTimeout(() => handleViewDetails(consulta), 0)}>
                            <Eye className="mr-2 size-4" />
                            {t('viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEditDialog(consulta), 0)}>
                            <Pencil className="mr-2 size-4" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setTimeout(() => setDeletingId(consulta.id), 0)}
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
          {!consultasLoading && filteredConsultas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('noConsultationsFound')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultation Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="flex flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('viewDetails')}</SheetTitle>
            <SheetDescription>
              {selectedConsultation &&
                `${getMascotaNombre(selectedConsultation.id_mascota)} — ${new Date(selectedConsultation.fecha).toLocaleDateString()}`}
            </SheetDescription>
          </SheetHeader>
          {selectedConsultation && (
            <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-4 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <PawPrint className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{getMascotaNombre(selectedConsultation.id_mascota)}</p>
                  <p className="text-sm text-muted-foreground">{getDuenoNombrePorMascota(selectedConsultation.id_mascota)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('veterinarian')}</Label>
                  <p className="mt-1 text-foreground">{getUsuarioNombre(selectedConsultation.id_usuario)}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('motive')}</Label>
                  <p className="mt-1 text-foreground">{selectedConsultation.motivo}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('diagnosis')}</Label>
                  <p className="mt-1 text-foreground">{selectedConsultation.diagnostico}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('treatment')}</Label>
                  <p className="mt-1 text-foreground">{selectedConsultation.tratamiento}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">{t('observations')}</Label>
                  <p className="mt-1 text-foreground">{selectedConsultation.observaciones || (selectedConsultation as any).observacion}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Archivos adjuntos</Label>
                <div className="mt-2">
                  <DocumentosPanel
                    idEntidad={selectedConsultation.id}
                    tipoEntidad="consulta"
                    idClinica={user?.id_clinica ?? ''}
                    readonly
                  />
                </div>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" onClick={() => { setIsDetailOpen(false); openEditDialog(selectedConsultation) }}>
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
