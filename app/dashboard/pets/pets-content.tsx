'use client'

import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, Cat, Dog, Bird, Rabbit } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { createMascota, updateMascota, deleteMascota } from '@/lib/services'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

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
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMascotas.map((mascota) => {
                    const IconComponent = speciesIcons[mascota.especie] || Dog
                    return (
                      <TableRow key={mascota.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {mascota.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getSpeciesLabel(mascota.especie)}</Badge>
                        </TableCell>
                        <TableCell>{mascota.raza}</TableCell>
                        <TableCell>{getDuenoNombre(mascota.id_dueno)}</TableCell>
                        <TableCell>{new Date(mascota.fecha_nacimiento).toLocaleDateString()}</TableCell>
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
    </div>
  )
}
