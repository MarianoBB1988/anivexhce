'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ScalpelIcon } from 'lucide-react'
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
import { useCirugias } from '@/hooks/use-cirugias'
import { useMascotas } from '@/hooks/use-mascotas'
import { useAuth } from '@/lib/auth-context'
import { createCirugia, updateCirugia, deleteCirugia } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'

export function SurgeriesContent() {
  const { data: cirugias, loading: cirugiasLoading, refetch } = useCirugias()
  const { data: mascotas } = useMascotas()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    id_mascota: '',
    fecha: '',
    tipo: '',
    resultado: '',
    observaciones: '',
  })

  const filteredCirugias = cirugias.filter((c) => {
    const mascota = mascotas.find((m) => m.id === c.id_mascota)
    return (
      mascota?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tipo.toLowerCase().includes(searchTerm.toLowerCase())
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
        await updateCirugia(editingId, user.id_clinica, {
          ...formData,
        } as any)
        toast({ title: 'Cirugía actualizada', description: 'Los cambios se han guardado.' })
      } else {
        await createCirugia({
          ...formData,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: 'Cirugía creada', description: 'La nueva cirugía ha sido registrada.' })
      }

      setFormData({ mascota_id: '', fecha: '', tipo: '', resultado: '', observaciones: '' })
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
      await deleteCirugia(id, user.id_clinica)
      toast({ title: 'Cirugía eliminada', description: 'La cirugía ha sido removida.' })
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cirugías</h1>
        <p className="text-gray-600 mt-2">Gestión de procedimientos quirúrgicos</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Cirugías</CardTitle>
              <CardDescription>Total: {cirugias.length} cirugías</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ mascota_id: '', fecha: '', tipo: '', resultado: '', observaciones: '' })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cirugía
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Cirugía' : 'Nueva Cirugía'}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Actualiza los datos de la cirugía'
                      : 'Registra una nueva cirugía en el sistema'}
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
                    <Label htmlFor="fecha">Fecha de Cirugía</Label>
                    <Input
                      id="fecha"
                      type="datetime-local"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Cirugía</Label>
                    <Input
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="resultado">Resultado</Label>
                    <Textarea
                      id="resultado"
                      value={formData.resultado}
                      onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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
              placeholder="Buscar por mascota o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {cirugiasLoading ? (
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCirugias.map((cirugia) => (
                    <TableRow key={cirugia.id}>
                      <TableCell className="font-medium">{getMascotaNombre(cirugia.mascota_id)}</TableCell>
                      <TableCell>{new Date(cirugia.fecha).toLocaleString()}</TableCell>
                      <TableCell>{cirugia.tipo}</TableCell>
                      <TableCell>{cirugia.resultado}</TableCell>
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
                                setEditingId(cirugia.id)
                                setFormData({
                                  id_mascota: cirugia.id_mascota,
                                  fecha: cirugia.fecha,
                                  tipo: cirugia.tipo,
                                  resultado: cirugia.resultado,
                                  observaciones: cirugia.observaciones,
                                })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(cirugia.id)}>
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
