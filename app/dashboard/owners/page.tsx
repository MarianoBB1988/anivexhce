'use client'

import { useState } from "react"
import { Plus, Search, Phone, Mail, PawPrint, MoreHorizontal, Pencil, Trash2, Dog, Cat, Bird, Rabbit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDuenos } from "@/hooks/use-duenos"
import { useMascotas } from "@/hooks/use-mascotas"
import { createDueno, deleteDueno, updateDueno } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
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
  DialogTrigger,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const initialOwners = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    petsCount: 2,
    registeredDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+1 (555) 234-5678",
    petsCount: 1,
    registeredDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.brown@email.com",
    phone: "+1 (555) 345-6789",
    petsCount: 3,
    registeredDate: "2024-01-08",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@email.com",
    phone: "+1 (555) 456-7890",
    petsCount: 1,
    registeredDate: "2024-03-10",
  },
  {
    id: 5,
    name: "David Martinez",
    email: "david.martinez@email.com",
    phone: "+1 (555) 567-8901",
    petsCount: 2,
    registeredDate: "2024-02-05",
  },
  {
    id: 6,
    name: "Jennifer Lee",
    email: "jennifer.lee@email.com",
    phone: "+1 (555) 678-9012",
    petsCount: 1,
    registeredDate: "2024-03-22",
  },
  {
    id: 7,
    name: "Robert Garcia",
    email: "robert.garcia@email.com",
    phone: "+1 (555) 789-0123",
    petsCount: 4,
    registeredDate: "2023-12-01",
  },
  {
    id: 8,
    name: "Amanda Thompson",
    email: "amanda.thompson@email.com",
    phone: "+1 (555) 890-1234",
    petsCount: 2,
    registeredDate: "2024-01-25",
  },
]

export default function OwnersPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { data: owners = [], loading, error, refetch } = useDuenos()
  const { data: mascotas = [] } = useMascotas()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [warningOwner, setWarningOwner] = useState<{ id: string; nombre: string; petCount: number } | null>(null)
  const [viewingPetsOwner, setViewingPetsOwner] = useState<any | null>(null)
  const [newOwner, setNewOwner] = useState({ nombre: "", email: "", telefono: "" })
  const [editOwner, setEditOwner] = useState({ nombre: "", email: "", telefono: "" })

  // Calcular cantidad de mascotas por dueño
  const getPetCountForOwner = (ownerId: string) => {
    return mascotas.filter((pet: any) => pet.id_dueno === ownerId).length
  }

  const filteredOwners = owners.filter(
    (owner: any) =>
      owner.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.telefono.includes(searchTerm)
  )

  const handleAddOwner = async () => {
    if (user && newOwner.nombre && newOwner.email && newOwner.telefono) {
      try {
        await createDueno({
          nombre: newOwner.nombre,
          email: newOwner.email,
          telefono: newOwner.telefono,
          id_clinica: user.id_clinica,
        })
        setNewOwner({ nombre: "", email: "", telefono: "" })
        setIsAddDialogOpen(false)
        refetch()
      } catch (err) {
        console.error("Error adding owner:", err)
      }
    }
  }

  const handleEditOwner = (owner: any) => {
    setEditingId(owner.id)
    setEditOwner({
      nombre: owner.nombre,
      email: owner.email,
      telefono: owner.telefono,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateOwner = async () => {
    if (user && editingId && editOwner.nombre && editOwner.email && editOwner.telefono) {
      try {
        await updateDueno(editingId, user.id_clinica, {
          nombre: editOwner.nombre,
          email: editOwner.email,
          telefono: editOwner.telefono,
        })
        setEditingId(null)
        setEditOwner({ nombre: "", email: "", telefono: "" })
        setIsEditDialogOpen(false)
        refetch()
      } catch (err) {
        console.error("Error updating owner:", err)
      }
    }
  }

  const handleDeleteOwner = async (id?: string) => {
    const targetId = id ?? deletingId
    if (user && targetId) {
      try {
        await deleteDueno(targetId, user.id_clinica)
        setDeletingId(null)
        refetch()
      } catch (err) {
        console.error("Error deleting owner:", err)
      }
    }
  }

  const handleDeleteClick = (owner: any) => {
    const petCount = getPetCountForOwner(owner.id)
    if (petCount > 0) {
      setWarningOwner({ id: owner.id, nombre: owner.nombre, petCount })
    } else {
      setTimeout(() => setDeletingId(owner.id), 0)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('owners')}</h1>
          <p className="text-muted-foreground">{t('manageOwners')}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              {t('addOwner')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addNewOwner')}</DialogTitle>
              <DialogDescription>
                {t('enterDetails')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('fullName')}</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newOwner.nombre}
                  onChange={(e) => setNewOwner({ ...newOwner, nombre: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={newOwner.email}
                  onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('phoneNumber')}</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={newOwner.telefono}
                  onChange={(e) => setNewOwner({ ...newOwner, telefono: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleAddOwner}>{t('addOwner')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('edit')} {t('owner')}</DialogTitle>
              <DialogDescription>
                {t('updateDetails')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t('fullName')}</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter full name"
                  value={editOwner.nombre}
                  onChange={(e) => setEditOwner({ ...editOwner, nombre: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{t('email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@example.com"
                  value={editOwner.email}
                  onChange={(e) => setEditOwner({ ...editOwner, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">{t('phoneNumber')}</Label>
                <Input
                  id="edit-phone"
                  placeholder="+1 (555) 000-0000"
                  value={editOwner.telefono}
                  onChange={(e) => setEditOwner({ ...editOwner, telefono: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleUpdateOwner}>{t('save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('allOwners')}</CardTitle>
              <CardDescription>{owners.length} {t('ownersRegistered')}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchOwners')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('owner')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('phone')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('email')}</TableHead>
                    <TableHead className="text-center">{t('pets')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner: any) => (
                    <TableRow key={owner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {owner.nombre
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{owner.nombre}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">
                              {owner.telefono}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-4" />
                          {owner.telefono}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-4" />
                          {owner.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => setViewingPetsOwner(owner)}
                        >
                          <PawPrint className="size-3" />
                          {getPetCountForOwner(owner.id)}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => handleEditOwner(owner)}>
                              <Pencil className="mr-2 size-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setTimeout(() => setViewingPetsOwner(owner), 0)
                              }}
                            >
                              <PawPrint className="mr-2 size-4" />
                              Ver mascotas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setTimeout(() => handleDeleteClick(owner), 0)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOwners.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {searchTerm ? t('noOwnersFound') : t('noRecords')}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dueño?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el dueño del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteOwner()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!warningOwner} onOpenChange={(open) => !open && setWarningOwner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dueño con mascotas?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{warningOwner?.nombre}</strong> tiene <strong>{warningOwner?.petCount} {warningOwner?.petCount === 1 ? 'mascota' : 'mascotas'}</strong> asignadas.
              {' '}Al eliminar el dueño, las mascotas quedarán sin dueño asignado.
              <br /><br />
              ¿Deseas continuar de todas formas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (warningOwner) {
                  const id = warningOwner.id
                  setWarningOwner(null)
                  handleDeleteOwner(id)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar igual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingPetsOwner} onOpenChange={(open) => !open && setViewingPetsOwner(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="size-5" />
              Mascotas de {viewingPetsOwner?.nombre}
            </DialogTitle>
            <DialogDescription>
              Listado de mascotas registradas para este dueño
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {(() => {
              const ownerPets = mascotas.filter((p: any) => p.id_dueno === viewingPetsOwner?.id)
              const speciesIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                perro: Dog, gato: Cat, pajaro: Bird, Dog: Dog, Cat: Cat, Bird: Bird, Rabbit: Rabbit, conejo: Rabbit,
              }
              if (ownerPets.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <PawPrint className="size-8 mb-2 opacity-40" />
                    <p className="text-sm">Este dueño no tiene mascotas registradas.</p>
                  </div>
                )
              }
              return (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {ownerPets.map((pet: any) => {
                    const Icon = speciesIconMap[pet.especie] || PawPrint
                    return (
                      <div key={pet.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{pet.nombre}</p>
                          <p className="text-xs text-muted-foreground capitalize">{pet.especie} {pet.raza ? `• ${pet.raza}` : ''}</p>
                        </div>
                        {pet.sexo && (
                          <Badge variant="secondary" className="text-xs">{pet.sexo === 'M' ? 'Macho' : 'Hembra'}</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingPetsOwner(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
