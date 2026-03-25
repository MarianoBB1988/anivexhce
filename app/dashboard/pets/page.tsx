"use client"

import { useState, useCallback } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Dog, Cat, Bird, Rabbit, Filter, User, Phone, Mail, MapPin, BookOpen, Stethoscope, Scissors, Syringe, HelpCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMascotas } from "@/hooks/use-mascotas"
import { useDuenos } from "@/hooks/use-duenos"
import { createMascota, deleteMascota, updateMascota, getConsultasByMascota, getCirugiasByMascota, getVacunasByMascota } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Consulta, Cirugia, Vacuna } from "@/lib/types"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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

  // Historia clínica
  const [historiaOpen, setHistoriaOpen] = useState(false)
  const [historiaPet, setHistoriaPet] = useState<any | null>(null)
  const [historiaLoading, setHistoriaLoading] = useState(false)
  const [hConsultas, setHConsultas] = useState<Consulta[]>([])
  const [hCirugias, setHCirugias] = useState<Cirugia[]>([])
  const [hVacunas, setHVacunas] = useState<Vacuna[]>([])
  const [expandedSection, setExpandedSection] = useState<'consultas' | 'cirugias' | 'vacunas' | null>('consultas')

  const openHistoria = useCallback(async (pet: any) => {
    setHistoriaPet(pet)
    setHistoriaOpen(true)
    setHistoriaLoading(true)
    setHConsultas([])
    setHCirugias([])
    setHVacunas([])
    setExpandedSection('consultas')
    if (!user) return
    const [c, ci, v] = await Promise.all([
      getConsultasByMascota(pet.id, user.id_clinica),
      getCirugiasByMascota(pet.id, user.id_clinica),
      getVacunasByMascota(pet.id, user.id_clinica),
    ])
    setHConsultas(c.data ?? [])
    setHCirugias(ci.data ?? [])
    setHVacunas(v.data ?? [])
    setHistoriaLoading(false)
  }, [user])

  const toggleSection = (s: 'consultas' | 'cirugias' | 'vacunas') =>
    setExpandedSection(prev => prev === s ? null : s)

  const estadoBadgeClass = (estado?: string) => {
    const m: Record<string, string> = {
      programado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      en_progreso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      exitosa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      complicaciones: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return m[estado ?? ''] ?? 'bg-muted text-muted-foreground'
  }

  const estadoLabel = (estado?: string) => ({
    programado: 'Programado', en_progreso: 'En progreso',
    exitosa: 'Exitosa', complicaciones: 'Complicaciones',
  })[estado ?? ''] ?? estado ?? '-'

  const fDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
  const fDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
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
                   
                    <TableHead className="w-[180px]"></TableHead>
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
                        <div className="flex items-center justify-end gap-1 flex-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openHistoria(pet)}
                            className="text-xs gap-1 h-8 whitespace-nowrap"
                          >
                            <BookOpen className="size-3.5" />
                            Ver historia
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 shrink-0">
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
                                onSelect={() => setTimeout(() => setDeletingId(pet.id), 0)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
      {/* ─── Historia Clínica Sheet ─── */}
      <Sheet open={historiaOpen} onOpenChange={setHistoriaOpen}>
        <SheetContent className="w-full sm:max-w-[680px] p-0" side="right">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {historiaPet && (() => {
                const specIcons: Record<string, React.ComponentType<{className?: string}>> = { perro: Dog, gato: Cat, pajaro: Bird, conejo: Rabbit, Dog, Cat, Bird, Rabbit }
                const IconComp = specIcons[historiaPet.especie] || HelpCircle
                const owner = duenos.find((d: any) => d.id === historiaPet.id_dueno)
                const edad = historiaPet.fecha_nacimiento
                  ? Math.floor((Date.now() - new Date(historiaPet.fecha_nacimiento).getTime()) / (1000*60*60*24*365))
                  : null
                return (
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20">
                      <IconComp className="w-14 h-14 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <SheetHeader className="p-0 text-left">
                        <SheetTitle className="text-2xl font-bold">{historiaPet.nombre}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Especie:</span> {historiaPet.especie}</span>
                        {historiaPet.raza && <span><span className="font-medium text-foreground">Raza:</span> {historiaPet.raza}</span>}
                        {historiaPet.sexo && <span><span className="font-medium text-foreground">Sexo:</span> {historiaPet.sexo === 'M' ? 'Macho' : 'Hembra'}</span>}
                        {edad !== null && <span><span className="font-medium text-foreground">Edad:</span> {edad} año{edad !== 1 ? 's' : ''}</span>}
                        {historiaPet.fecha_nacimiento && <span><span className="font-medium text-foreground">Nac.:</span> {fDate(historiaPet.fecha_nacimiento)}</span>}
                        {historiaPet.peso && <span><span className="font-medium text-foreground">Peso:</span> {historiaPet.peso} kg</span>}
                      </div>
                      {owner && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{owner.nombre}</span>
                          {owner.telefono && <span className="text-muted-foreground">· {owner.telefono}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {historiaLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Consultas */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('consultas')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        Consultas
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hConsultas.length}</span>
                      </div>
                      {expandedSection === 'consultas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'consultas' && (
                      <div className="border-t divide-y">
                        {hConsultas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin consultas registradas.</p>
                        ) : hConsultas.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{c.motivo || '(sin motivo)'}</span>
                              <span className="text-xs text-muted-foreground">{fDateTime(c.fecha)}</span>
                            </div>
                            {c.diagnostico && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Diagnóstico:</span> {c.diagnostico}</p>}
                            {c.tratamiento && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tratamiento:</span> {c.tratamiento}</p>}
                            {c.observaciones && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Observaciones:</span> {c.observaciones}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cirugías */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('cirugias')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Scissors className="h-4 w-4 text-purple-500" />
                        Cirugías
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hCirugias.length}</span>
                      </div>
                      {expandedSection === 'cirugias' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'cirugias' && (
                      <div className="border-t divide-y">
                        {hCirugias.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin cirugías registradas.</p>
                        ) : hCirugias.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{c.tipo || '(sin tipo)'}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadgeClass((c as any).estado)}`}>{estadoLabel((c as any).estado)}</span>
                                <span className="text-xs text-muted-foreground">{fDateTime(c.fecha)}</span>
                              </div>
                            </div>
                            {c.descripcion && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Descripción:</span> {c.descripcion}</p>}
                            {c.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {c.resultado}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vacunas */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('vacunas')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Syringe className="h-4 w-4 text-green-500" />
                        Vacunas
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hVacunas.length}</span>
                      </div>
                      {expandedSection === 'vacunas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'vacunas' && (
                      <div className="border-t divide-y">
                        {hVacunas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin vacunas registradas.</p>
                        ) : hVacunas.map(v => (
                          <div key={v.id} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">Aplicación: {fDate(v.fecha)}</span>
                              {v.proxima_dosis && <span className="text-xs text-muted-foreground">Próxima dosis: <span className="font-medium text-foreground">{fDate(v.proxima_dosis)}</span></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
