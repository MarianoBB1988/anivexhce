"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Dog, Cat, Bird, Rabbit, Filter, User, Phone, Mail, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMascotas } from "@/hooks/use-mascotas"
import { useDuenos } from "@/hooks/use-duenos"
import { createMascota, deleteMascota, updateMascota } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const speciesIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Dog: Dog,
  Cat: Cat,
  Bird: Bird,
  Rabbit: Rabbit,
  perro: Dog,
  gato: Cat,
  ave: Bird,
  conejo: Rabbit,
}

const speciesOptions = ["All", "Dog", "Cat", "Bird", "Rabbit", "perro", "gato", "ave", "conejo"]

export default function PetsPage() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: pets = [], loading, error, refetch } = useMascotas()
  const { data: duenos = [] } = useDuenos()
  const [searchTerm, setSearchTerm] = useState("")
  const [speciesFilter, setSpeciesFilter] = useState("All")
  const [searchDuenos, setSearchDuenos] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingOwner, setViewingOwner] = useState<any | null>(null)
  const [editPet, setEditPet] = useState({
    nombre: "",
    especie: "",
    raza: "",
    id_dueno: "",
    fecha_nacimiento: "",
    sexo: "",
    peso: "",
  })
  const [newPet, setNewPet] = useState({
    nombre: "",
    especie: "",
    raza: "",
    id_dueno: "",
    fecha_nacimiento: "",
    sexo: "",
    peso: "",
  })

  const filteredPets = pets.filter((pet: any) => {
    const matchesSearch =
      pet.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.raza.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecies = speciesFilter === "All" || pet.especie === speciesFilter
    return matchesSearch && matchesSpecies
  })

  const filteredDuenos = duenos.filter((dueno: any) =>
    dueno.nombre.toLowerCase().includes(searchDuenos.toLowerCase())
  )

  const handleAddPet = async () => {
    console.log("🎯 handleAddPet clicked!")
    console.log("Values:", { 
      nombre: newPet.nombre, 
      especie: newPet.especie, 
      raza: newPet.raza, 
      id_dueno: newPet.id_dueno,
      sexo: newPet.sexo,
      user: user?.id
    })
    
    if (!user) {
      alert("⚠️ No user found - authentication required")
      return
    }
    
    if (!newPet.nombre) {
      alert("⚠️ Please enter pet name")
      return
    }
    if (!newPet.especie) {
      alert("⚠️ Please select species")
      return
    }
    if (!newPet.raza) {
      alert("⚠️ Please enter breed")
      return
    }
    if (!newPet.id_dueno) {
      alert("⚠️ Please select owner")
      return
    }
    
    try {
      console.log("✅ All validations passed, creating mascota...")
      
      const pesoValue = newPet.peso && newPet.peso.trim() ? parseFloat(newPet.peso) : null
      const fechaNac = newPet.fecha_nacimiento || new Date().toISOString().split('T')[0]
      
      const mascotaData = {
        nombre: newPet.nombre,
        especie: newPet.especie,
        raza: newPet.raza,
        id_dueno: newPet.id_dueno,
        fecha_nacimiento: fechaNac,
        sexo: newPet.sexo || null,
        peso: pesoValue,
        id_clinica: user.id_clinica,
      }
      
      console.log("📦 Sending data:", mascotaData)
      const result = await createMascota(mascotaData)
      
      console.log("✅ Result:", result)
      
      if (result.error) {
        alert("❌ Error: " + (result.error || "Unknown error"))
        return
      }
      
      alert("✅ Pet created successfully!")
      setNewPet({ nombre: "", especie: "", raza: "", id_dueno: "", fecha_nacimiento: "", sexo: "", peso: "" })
      setIsAddDialogOpen(false)
      await refetch()
    } catch (err: any) {
      console.error("❌ Exception:", err)
      alert("❌ Error: " + (err?.message || String(err)))
    }
  }

  const handleDeletePet = async () => {
    if (user && deletingId) {
      try {
        await deleteMascota(deletingId, user.id_clinica)
        setDeletingId(null)
        refetch()
      } catch (err) {
        console.error("Error deleting pet:", err)
      }
    }
  }

  const handleEditPet = (pet: any) => {
    setEditingId(pet.id)
    setEditPet({
      nombre: pet.nombre,
      especie: pet.especie,
      raza: pet.raza,
      id_dueno: pet.id_dueno,
      fecha_nacimiento: pet.fecha_nacimiento || "",
      sexo: pet.sexo || "",
      peso: pet.peso != null ? String(pet.peso) : "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdatePet = async () => {
    if (!user || !editingId) return
    try {
      const pesoValue = editPet.peso && editPet.peso.trim() ? parseFloat(editPet.peso) : null
      const result = await updateMascota(editingId, user.id_clinica, {
        nombre: editPet.nombre,
        especie: editPet.especie,
        raza: editPet.raza,
        id_dueno: editPet.id_dueno,
        fecha_nacimiento: editPet.fecha_nacimiento,
        sexo: (editPet.sexo as 'M' | 'F') || undefined,
        peso: pesoValue ?? undefined,
      })
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Mascota actualizada', description: 'Los cambios se guardaron correctamente.' })
      setEditingId(null)
      setIsEditDialogOpen(false)
      await refetch()
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' })
    }
  }

  const getSpeciesIcon = (species: string) => {
    const IconComponent = speciesIcons[species] || Dog
    return <IconComponent className="size-4" />
  }

  const getSpeciesBadgeColor = (species: string) => {
    switch (species) {
      case "Dog":
        return "bg-primary/10 text-primary"
      case "Cat":
        return "bg-accent/20 text-white"
      case "Bird":
        return "bg-warning/20 text-warning-foreground"
      case "Rabbit":
        return "bg-success/20 text-success-foreground"
       case "perro":
        return "bg-primary/10 text-primary"
      case "gato":
        return "bg-accent/20 text-white"
      case "pajaro":
        return "bg-warning/20 text-warning-foreground"
      case "conejo":
        return "bg-success/20 text-success-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("pets")}</h1>
          <p className="text-muted-foreground">{t("managePet")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              {t("addPet")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addNewPet")}</DialogTitle>
              <DialogDescription>{t("enterDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="petName">{t("petName")}</Label>
                <Input
                  id="petName"
                  placeholder={t("petName")}
                  value={newPet.nombre}
                  onChange={(e) => setNewPet({ ...newPet, nombre: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="species">{t("species")}</Label>
                  {language === 'es' ? (
                    <Select
                      value={newPet.especie}
                      onValueChange={(value) => setNewPet({ ...newPet, especie: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("species")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perro">Perro</SelectItem>
                        <SelectItem value="gato">Gato</SelectItem>
                        <SelectItem value="pajaro">Pájaro</SelectItem>
                        <SelectItem value="conejo">Conejo</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={newPet.especie}
                      onValueChange={(value) => setNewPet({ ...newPet, especie: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("species")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dog">Dog</SelectItem>
                        <SelectItem value="Cat">Cat</SelectItem>
                        <SelectItem value="Bird">Bird</SelectItem>
                        <SelectItem value="Rabbit">Rabbit</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="breed">{t("breed")}</Label>
                  <Input
                    id="breed"
                    placeholder={t("breed")}
                    value={newPet.raza}
                    onChange={(e) => setNewPet({ ...newPet, raza: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sexo">{t("sex")}</Label>
                  <Select value={newPet.sexo} onValueChange={(value) => setNewPet({ ...newPet, sexo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">{t("male")}</SelectItem>
                      <SelectItem value="F">{t("female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner">{t("owner")}</Label>
                <Select value={newPet.id_dueno} onValueChange={(value) => {
                  setNewPet({ ...newPet, id_dueno: value })
                  setSearchDuenos("")
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("owner")} />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <div className="p-2">
                      <Input
                        placeholder={t("search")}
                        value={searchDuenos}
                        onChange={(e) => setSearchDuenos(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {filteredDuenos.length > 0 ? (
                      filteredDuenos.map((dueno: any) => (
                        <SelectItem key={dueno.id} value={dueno.id}>
                          {dueno.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 text-center">
                        No se encontraron dueños
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="birthDate">{t("birthDate")}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newPet.fecha_nacimiento}
                    onChange={(e) => setNewPet({ ...newPet, fecha_nacimiento: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">{t("weight")}</Label>
                  <Input
                    id="weight"
                    placeholder={t("weight")}
                    value={newPet.peso}
                    onChange={(e) => setNewPet({ ...newPet, peso: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleAddPet}>{t("add")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("allPets")}</CardTitle>
              <CardDescription>{pets.length} {t("petsRegistered")}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPets")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((species) => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>{t("petName")}</TableHead>
                    <TableHead>{t("species")}</TableHead>
                    <TableHead>{t("sex")}</TableHead>
                    <TableHead>{t("weight")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("breed")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("birthDateColumn")}</TableHead>
                   
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPets.map((pet: any) => (
                    <TableRow key={pet.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                            {getSpeciesIcon(pet.especie)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{pet.nombre}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">
                              {pet.raza}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSpeciesBadgeColor(pet.especie)} variant="secondary">
                          {pet.especie}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSpeciesBadgeColor(pet.sexo)} variant="secondary">
                          {pet.sexo}
                        </Badge>
                      </TableCell>
                       <TableCell className="hidden sm:table-cell text-muted-foreground">
                       
                          {pet.peso}
                       
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {pet.raza}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {pet.fecha_nacimiento}
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
                            <DropdownMenuItem
                              onSelect={() => setTimeout(() => handleEditPet(pet), 0)}
                            >
                              <Pencil className="mr-2 size-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                const owner = duenos.find((d: any) => d.id === pet.id_dueno)
                                if (owner) setTimeout(() => setViewingOwner(owner), 0)
                              }}
                            >
                              <User className="mr-2 size-4" />
                              Ver dueño
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setTimeout(() => setDeletingId(pet.id), 0)
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
              {filteredPets.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {searchTerm ? t("noPetsFound") : t("noRecords")}
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
            <AlertDialogTitle>¿Eliminar mascota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la mascota del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editPet")}</DialogTitle>
            <DialogDescription>{t("updatePetData")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("petName")}</Label>
              <Input
                value={editPet.nombre}
                onChange={(e) => setEditPet({ ...editPet, nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{t("species")}</Label>
                {language === 'es' ? (
                  <Select value={editPet.especie} onValueChange={(v) => setEditPet({ ...editPet, especie: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro">Perro</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="pajaro">Pájaro</SelectItem>
                      <SelectItem value="conejo">Conejo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={editPet.especie} onValueChange={(v) => setEditPet({ ...editPet, especie: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog</SelectItem>
                      <SelectItem value="Cat">Cat</SelectItem>
                      <SelectItem value="Bird">Bird</SelectItem>
                      <SelectItem value="Rabbit">Rabbit</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid gap-2">
                <Label>{t("breed")}</Label>
                <Input
                  value={editPet.raza}
                  onChange={(e) => setEditPet({ ...editPet, raza: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("sex")}</Label>
                <Select value={editPet.sexo} onValueChange={(v) => setEditPet({ ...editPet, sexo: v })}>
                  <SelectTrigger><SelectValue placeholder={t("selectType")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">{t("male")}</SelectItem>
                    <SelectItem value="F">{t("female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("owner")}</Label>
              <Select value={editPet.id_dueno} onValueChange={(v) => setEditPet({ ...editPet, id_dueno: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {duenos.map((dueno: any) => (
                    <SelectItem key={dueno.id} value={dueno.id}>{dueno.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("birthDate")}</Label>
                <Input
                  type="date"
                  value={editPet.fecha_nacimiento}
                  onChange={(e) => setEditPet({ ...editPet, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("weight")}</Label>
                <Input
                  placeholder={t("weight")}
                  value={editPet.peso}
                  onChange={(e) => setEditPet({ ...editPet, peso: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleUpdatePet}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingOwner} onOpenChange={(open) => !open && setViewingOwner(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5" />
              Datos del dueño
            </DialogTitle>
            <DialogDescription>Información del dueño de esta mascota</DialogDescription>
          </DialogHeader>
          {viewingOwner && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {viewingOwner.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{viewingOwner.nombre}</p>
                </div>
              </div>
              <div className="space-y-3">
                {viewingOwner.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <span>{viewingOwner.email}</span>
                  </div>
                )}
                {viewingOwner.telefono && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="size-4 text-muted-foreground shrink-0" />
                    <span>{viewingOwner.telefono}</span>
                  </div>
                )}
                {viewingOwner.direccion && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="size-4 text-muted-foreground shrink-0" />
                    <span>{viewingOwner.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingOwner(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
