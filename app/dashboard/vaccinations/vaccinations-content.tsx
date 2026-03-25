'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Syringe } from 'lucide-react'
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
import { useVacunas } from '@/hooks/use-vacunas'
import { useMascotas } from '@/hooks/use-mascotas'
import { useAuth } from '@/lib/auth-context'
import { createVacuna, updateVacuna, deleteVacuna } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

export function VaccinationsContent() {
  const { data: vacunas, loading: vacunasLoading, refetch } = useVacunas()
  const { data: mascotas } = useMascotas()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    id_mascota: '',
    nombre: '',
    fecha: '',
    proxima_dosis: '',
  })

  const filteredVacunas = vacunas.filter((v) => {
    const mascota = mascotas.find((m) => m.id === v.id_mascota)
    return (
      (mascota?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getMascotaNombre = (mascotaId: string) => {
    return mascotas.find((m) => m.id === mascotaId)?.nombre || 'No identificada'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingId) {
        await updateVacuna(editingId, user.id_clinica, {
          ...formData,
        } as any)
        toast({ title: 'Vacuna actualizada', description: 'Los cambios se han guardado.' })
      } else {
        await createVacuna({
          ...formData,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: 'Vacuna creada', description: 'La nueva vacuna ha sido registrada.' })
      }

      setFormData({ id_mascota: '', nombre: '', fecha: '', proxima_dosis: '' })
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
      await deleteVacuna(id, user.id_clinica)
      toast({ title: 'Vacuna eliminada', description: 'La vacuna ha sido removida.' })
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vacunas</h1>
        <p className="text-gray-600 mt-2">Gestión de vacunas y inmunizaciones</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Vacunas</CardTitle>
              <CardDescription>Total: {vacunas.length} vacunas</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ id_mascota: '', nombre: '', fecha: '', proxima_dosis: '' })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Vacuna
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Vacuna' : 'Nueva Vacuna'}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Actualiza los datos de la vacuna'
                      : 'Registra una nueva vacuna en el sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="id_mascota">Mascota</Label>
                    <Select value={formData.id_mascota} onValueChange={(value) => setFormData({ ...formData, id_mascota: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona mascota" />
                      </SelectTrigger>
                      <SelectContent>
                        {mascotas.map((mascota) => (
                          <SelectItem key={mascota.id} value={mascota.id}>
                            {mascota.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nombre">Nombre de la Vacuna</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha">Fecha de Vacunación</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="proxima_dosis">Próxima Dosis</Label>
                    <Input
                      id="proxima_dosis"
                      type="date"
                      value={formData.proxima_dosis}
                      onChange={(e) => setFormData({ ...formData, proxima_dosis: e.target.value })}
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
              placeholder="Buscar por mascota o nombre de vacuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {vacunasLoading ? (
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Próxima Dosis</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVacunas.map((vacuna) => (
                    <TableRow key={vacuna.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Syringe className="h-4 w-4" />
                        {getMascotaNombre(vacuna.id_mascota)}
                      </TableCell>
                      <TableCell>{vacuna.nombre}</TableCell>
                      <TableCell>{new Date(vacuna.fecha).toLocaleDateString()}</TableCell>
                      <TableCell>{vacuna.proxima_dosis ? new Date(vacuna.proxima_dosis).toLocaleDateString() : '-'}</TableCell>
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
                                setEditingId(vacuna.id)
                                setFormData({
                                  id_mascota: vacuna.id_mascota,
                                  nombre: vacuna.nombre,
                                  fecha: vacuna.fecha,
                                  proxima_dosis: vacuna.proxima_dosis,
                                })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(vacuna.id)}>
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
    </div>
  )
}
