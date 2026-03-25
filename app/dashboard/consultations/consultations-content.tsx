'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { useConsultas } from '@/hooks/use-consultas'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useAuth } from '@/lib/auth-context'
import { createConsulta, updateConsulta, deleteConsulta } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'

export function ConsultationsContent() {
  const { data: consultas, loading: consultasLoading, refetch } = useConsultas()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { data: usuarios } = useUserList()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDueno, setSelectedDueno] = useState('')
  const [formData, setFormData] = useState({
    id_mascota: '',
    id_usuario: '',
    fecha_date: '',
    fecha_time: '',
    motivo: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
  })

  const mascotasFiltradas = selectedDueno
    ? mascotas.filter((m) => m.id_dueno === selectedDueno)
    : mascotas

  const filteredConsultas = consultas.filter((c) => {
    const mascota = mascotas.find((m) => m.id === c.id_mascota)
    return mascota?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getMascotaNombre = (mascotaId: string) => {
    return mascotas.find((m) => m.id === mascotaId)?.nombre || 'No identificada'
  }

  const getUsuarioNombre = (usuarioId: string) => {
    return usuarios.find((u) => u.id === usuarioId)?.nombre || 'No asignado'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { fecha_date, fecha_time, ...rest } = formData
      const payload = {
        ...rest,
        fecha: fecha_date + (fecha_time ? 'T' + fecha_time : ''),
      }

      if (editingId) {
        await updateConsulta(editingId, user.id_clinica, payload as any)
        toast({ title: 'Consulta actualizada', description: 'Los cambios se han guardado.' })
      } else {
        await createConsulta({
          ...payload,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: 'Consulta creada', description: 'La nueva consulta ha sido registrada.' })
      }

      setFormData({
        id_mascota: '',
        id_usuario: '',
        fecha_date: '',
        fecha_time: '',
        motivo: '',
        diagnostico: '',
        tratamiento: '',
        observaciones: '',
      })
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
      await deleteConsulta(id, user.id_clinica)
      toast({ title: 'Consulta eliminada', description: 'La consulta ha sido removida.' })
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consultas</h1>
        <p className="text-gray-600 mt-2">Gestión de consultas clínicas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Consultas</CardTitle>
              <CardDescription>Total: {consultas.length} consultas</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setSelectedDueno('')
                    setFormData({
                      id_mascota: '',
                      id_usuario: '',
                      fecha_date: '',
                      fecha_time: '',
                      motivo: '',
                      diagnostico: '',
                      tratamiento: '',
                      observaciones: '',
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Consulta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Consulta' : 'Nueva Consulta'}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Actualiza los datos de la consulta'
                      : 'Registra una nueva consulta en el sistema'}
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
                  <div>
                    <Label htmlFor="id_usuario">Veterinario</Label>
                    <Select value={formData.id_usuario} onValueChange={(value) => setFormData({ ...formData, id_usuario: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona veterinario" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios.map((usuario) => (
                          <SelectItem key={usuario.id} value={usuario.id}>
                            {usuario.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fecha_date">Fecha</Label>
                      <Input
                        id="fecha_date"
                        type="date"
                        value={formData.fecha_date}
                        onChange={(e) => setFormData({ ...formData, fecha_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fecha_time">Hora</Label>
                      <Input
                        id="fecha_time"
                        type="time"
                        value={formData.fecha_time}
                        onChange={(e) => setFormData({ ...formData, fecha_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="motivo">Motivo de Consulta</Label>
                    <Input
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="diagnostico">Diagnóstico</Label>
                    <Textarea
                      id="diagnostico"
                      value={formData.diagnostico}
                      onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tratamiento">Tratamiento</Label>
                    <Textarea
                      id="tratamiento"
                      value={formData.tratamiento}
                      onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
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
              placeholder="Buscar por mascota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {consultasLoading ? (
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
                    <TableHead>Veterinario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultas.map((consulta) => (
                    <TableRow key={consulta.id}>
                      <TableCell className="font-medium">{getMascotaNombre(consulta.id_mascota)}</TableCell>
                      <TableCell>{getUsuarioNombre(consulta.id_usuario)}</TableCell>
                      <TableCell>{new Date(consulta.fecha).toLocaleString()}</TableCell>
                      <TableCell>{consulta.motivo}</TableCell>
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
                                setEditingId(consulta.id)
                                const mascota = mascotas.find((m) => m.id === consulta.id_mascota)
                                setSelectedDueno(mascota?.id_dueno || '')
                                setFormData({
                                  id_mascota: consulta.id_mascota,
                                  id_usuario: consulta.id_usuario || '',
                                  fecha_date: consulta.fecha?.split('T')[0] || '',
                                  fecha_time: consulta.fecha?.split('T')[1]?.slice(0, 5) || '',
                                  motivo: consulta.motivo,
                                  diagnostico: consulta.diagnostico,
                                  tratamiento: consulta.tratamiento,
                                  observaciones: consulta.observaciones,
                                })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(consulta.id)}>
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
