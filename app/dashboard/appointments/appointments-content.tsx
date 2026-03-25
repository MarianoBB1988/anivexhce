'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, Clock } from 'lucide-react'
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
import { useTurnos } from '@/hooks/use-turnos'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useAuth } from '@/lib/auth-context'
import { createTurno, updateTurno, deleteTurno } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

const statusColors: { [key: string]: string } = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export function AppointmentsContent() {
  const { data: turnos, loading: turnosLoading, refetch } = useTurnos()
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDueno, setSelectedDueno] = useState('')
  const [formData, setFormData] = useState({
    id_mascota: '',
    fecha: '',
    hora: '',
    estado: 'sin_atender' as 'sin_atender' | 'atendido' | 'ausente',
    notas: '',
  })

  const mascotasFiltradas = selectedDueno
    ? mascotas.filter((m) => m.id_dueno === selectedDueno)
    : mascotas

  const filteredTurnos = turnos.filter((t) => {
    const mascota = mascotas.find((m) => m.id === t.id_mascota)
    return mascota?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getMascotaNombre = (mascotaId: string) => {
    return mascotas.find((m) => m.id === mascotaId)?.nombre || 'No identificada'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { fecha, hora, ...rest } = formData
      const payload = {
        ...rest,
        fecha_hora: fecha + (hora ? 'T' + hora : ''),
      }

      if (editingId) {
        await updateTurno(editingId, user.id_clinica, payload as any)
        toast({ title: 'Turno actualizado', description: 'Los cambios se han guardado.' })
      } else {
        await createTurno({
          ...payload,
          id_clinica: user.id_clinica,
        } as any)
        toast({ title: 'Turno creado', description: 'El nuevo turno ha sido registrado.' })
      }

      setFormData({ id_mascota: '', fecha: '', hora: '', estado: 'sin_atender', notas: '' })
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
      await deleteTurno(id, user.id_clinica)
      toast({ title: 'Turno eliminado', description: 'El turno ha sido removido.' })
      await refetch()
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Turnos</h1>
        <p className="text-gray-600 mt-2">Gestión de citas y turnos</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Turnos</CardTitle>
              <CardDescription>Total: {turnos.length} turnos</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setSelectedDueno('')
                    setFormData({ id_mascota: '', fecha: '', hora: '', estado: 'sin_atender', notas: '' })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Turno' : 'Nuevo Turno'}</DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Actualiza los datos del turno'
                      : 'Registra un nuevo turno en el sistema'}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hora">Hora</Label>
                      <Input
                        id="hora"
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin_atender">Sin atender</SelectItem>
                        <SelectItem value="atendido">Atendido</SelectItem>
                        <SelectItem value="ausente">Ausente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Input
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
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

          {turnosLoading ? (
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
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">{getMascotaNombre(turno.id_mascota)}</TableCell>
                      <TableCell>{new Date(turno.fecha_hora).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[turno.estado]}>
                          {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{turno.notas}</TableCell>
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
                                setEditingId(turno.id)
                                const mascota = mascotas.find((m) => m.id === turno.id_mascota)
                                setSelectedDueno(mascota?.id_dueno || '')
                                setFormData({
                                  id_mascota: turno.id_mascota,
                                  fecha: turno.fecha_hora?.split('T')[0] || '',
                                  hora: turno.fecha_hora?.split('T')[1]?.slice(0, 5) || '',
                                  estado: turno.estado,
                                  notas: turno.notas || '',
                                })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(turno.id)}>
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
