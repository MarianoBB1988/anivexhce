'use client'

import { useState, useEffect } from "react"
import { Plus, Search, Phone, Mail, PawPrint, MoreHorizontal, Pencil, Trash2, Dog, Cat, Bird, Rabbit, KeyRound, MessageCircle, Copy, MapPin, BookOpen, Stethoscope, Scissors, Syringe, FlaskConical, ScanLine, ChevronDown, ChevronRight, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useDuenos } from "@/hooks/use-duenos"
import { useMascotas } from "@/hooks/use-mascotas"
import { useTiposCirugia } from "@/hooks/use-tipos-cirugia"
import { useTiposAnalisis } from "@/hooks/use-tipos-analisis"
import { useEspecies } from "@/hooks/use-especies"
import { useRazas } from "@/hooks/use-razas"
import { createDueno, deleteDueno, updateDueno, createOwnerAccess, getConsultasByMascota, getCirugiasByMascota, getVacunasByMascota, getAnalisisByMascota, getImagenesByMascota, updateConsulta, updateCirugia, updateVacuna, updateAnalisis, updateImagen, updateMascota } from "@/lib/services"
import type { Consulta, Cirugia, Vacuna, Analisis, ImagenDiagnostica } from "@/lib/types"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

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

// ─── Subcomponent: Add Owner Dialog ───────────────────────────────────────────
function AddOwnerDialog({ open, onOpenChange, onAdd, t }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (form: { nombre: string; email: string; telefono: string; direccion: string; contacto_secundario: string; tipo: 'socio' | 'particular' }) => Promise<void>
  t: (k: string) => string
}) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", direccion: "", contacto_secundario: "", tipo: 'particular' as 'socio' | 'particular' })

  useEffect(() => {
    if (!open) setForm({ nombre: "", email: "", telefono: "", direccion: "", contacto_secundario: "", tipo: 'particular' })
  }, [open])

  const handleSubmit = async () => {
    await onAdd(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addNewOwner')}</DialogTitle>
          <DialogDescription>{t('enterDetails')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="add-name">{t('fullName')}</Label>
            <Input id="add-name" placeholder="Enter full name" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-email">{t('email')}</Label>
            <Input id="add-email" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-phone">{t('phoneNumber')}</Label>
            <Input id="add-phone" placeholder="+1 (555) 000-0000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-direccion">Dirección</Label>
            <Input id="add-direccion" placeholder="Calle, número, ciudad" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-contacto-secundario">Contacto secundario <span className="text-muted-foreground">(opcional)</span></Label>
            <Input id="add-contacto-secundario" placeholder="Nombre y teléfono de contacto adicional" value={form.contacto_secundario} onChange={e => setForm(f => ({ ...f, contacto_secundario: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-tipo">Tipo de cliente</Label>
            <select
              id="add-tipo"
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'socio' | 'particular' }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="particular">Particular</option>
              <option value="socio">Socio</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit}>{t('addOwner')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponent: Edit Owner Dialog ──────────────────────────────────────────
function EditOwnerDialog({ open, onOpenChange, initial, onSave, t }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: { nombre: string; email: string; telefono: string; direccion: string; contacto_secundario: string; tipo: 'socio' | 'particular' }
  onSave: (form: { nombre: string; email: string; telefono: string; direccion: string; contacto_secundario: string; tipo: 'socio' | 'particular' }) => Promise<void>
  t: (k: string) => string
}) {
  const [form, setForm] = useState(initial)

  useEffect(() => {
    if (open) setForm(initial)
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit')} {t('owner')}</DialogTitle>
          <DialogDescription>{t('updateDetails')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">{t('fullName')}</Label>
            <Input id="edit-name" placeholder="Enter full name" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-email">{t('email')}</Label>
            <Input id="edit-email" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-phone">{t('phoneNumber')}</Label>
            <Input id="edit-phone" placeholder="+1 (555) 000-0000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-direccion">Dirección</Label>
            <Input id="edit-direccion" placeholder="Calle, número, ciudad" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-contacto-secundario">Contacto secundario <span className="text-muted-foreground">(opcional)</span></Label>
            <Input id="edit-contacto-secundario" placeholder="Nombre y teléfono de contacto adicional" value={form.contacto_secundario} onChange={e => setForm(f => ({ ...f, contacto_secundario: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-tipo">Tipo de cliente</Label>
            <select
              id="edit-tipo"
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'socio' | 'particular' }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="particular">Particular</option>
              <option value="socio">Socio</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={() => onSave(form)}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponent: Edit Pet (in Historia Sheet) Dialog ────────────────────────
function EditPetInHistoriaDialog({ open, onOpenChange, pet, especies, razas, onSave, saving }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  pet: any
  especies: any[]
  razas: any[]
  onSave: (data: { nombre: string; especie: string; raza: string; sexo: string; fecha_nacimiento: string; peso: string; observaciones: string }) => Promise<void>
  saving: boolean
}) {
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState('')
  const [raza, setRaza] = useState('')
  const [sexo, setSexo] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [peso, setPeso] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [especieOpen, setEspecieOpen] = useState(false)
  const [razaOpen, setRazaOpen] = useState(false)

  useEffect(() => {
    if (open && pet) {
      setNombre(pet.nombre || '')
      setEspecie(pet.especie || '')
      setRaza(pet.raza || '')
      setSexo(pet.sexo || '')
      setFechaNac(pet.fecha_nacimiento ? pet.fecha_nacimiento.slice(0, 10) : '')
      setPeso(pet.peso ? String(pet.peso) : '')
      setObservaciones(pet.observaciones || '')
    }
  }, [open, pet])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Editar datos de la mascota</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1"><Label>Nombre</Label><Input value={nombre} onChange={e => setNombre(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Especie</Label>
              <Popover open={especieOpen} onOpenChange={setEspecieOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className="truncate">{especie || 'Seleccionar'}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar especie..." />
                    <CommandList>
                      <CommandEmpty>No encontrada.</CommandEmpty>
                      <CommandGroup>
                        {especies.map((e: any) => (
                          <CommandItem key={e.id} value={e.nombre} onSelect={() => { setEspecie(e.nombre); setRaza(''); setEspecieOpen(false) }}>
                            <Check className={cn('mr-2 size-4', especie === e.nombre ? 'opacity-100' : 'opacity-0')} />
                            {e.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1"><Label>Raza</Label>
              <Popover open={razaOpen} onOpenChange={v => { if (especie) setRazaOpen(v) }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" disabled={!especie} className="w-full justify-between font-normal">
                    <span className="truncate">{raza || (especie ? 'Seleccionar raza' : 'Seleccioná especie')}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar raza..." />
                    <CommandList>
                      <CommandEmpty>No encontrada.</CommandEmpty>
                      <CommandGroup>
                        {razas.filter((r: any) => r.id_especie === especies.find((e: any) => e.nombre === especie)?.id).map((r: any) => (
                          <CommandItem key={r.id} value={r.nombre} onSelect={() => { setRaza(r.nombre); setRazaOpen(false) }}>
                            <Check className={cn('mr-2 size-4', raza === r.nombre ? 'opacity-100' : 'opacity-0')} />
                            {r.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Sexo</Label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Sin especificar</option>
                <option value="M">Macho</option>
                <option value="F">Hembra</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Fecha de nacimiento</Label><Input type="date" value={fechaNac} onChange={e => setFechaNac(e.target.value)} /></div>
          <div className="space-y-1"><Label>Observaciones</Label><Textarea rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave({ nombre, especie, raza, sexo, fecha_nacimiento: fechaNac, peso, observaciones })} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponent: Edit Historia Item Dialog ───────────────────────────────────
type EditTarget = 'consulta' | 'cirugia' | 'vacuna' | 'analisis' | 'imagen'

function EditHistoriaItemDialog({ editTarget, editItem, tiposCirugia, tiposAnalisis, onSave, onClose, saving }: {
  editTarget: EditTarget | null
  editItem: any
  tiposCirugia: any[]
  tiposAnalisis: any[]
  onSave: (target: EditTarget, item: any, data: any) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const [motivo, setMotivo] = useState('')
  const [fecha, setFecha] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [resultado, setResultado] = useState('')
  const [estado, setEstado] = useState('')
  const [proximaDosis, setProximaDosis] = useState('')
  const [imagenTipo, setImagenTipo] = useState('')
  const [region, setRegion] = useState('')
  const [hallazgos, setHallazgos] = useState('')
  const [analisisTipoOpen, setAnalisisTipoOpen] = useState(false)

  useEffect(() => {
    if (!editTarget || !editItem) return
    if (editTarget === 'consulta') {
      setMotivo(editItem.motivo || ''); setFecha(editItem.fecha ? editItem.fecha.slice(0, 16) : '')
      setDiagnostico(editItem.diagnostico || ''); setTratamiento(editItem.tratamiento || ''); setObservaciones(editItem.observaciones || '')
    } else if (editTarget === 'cirugia') {
      setTipo(editItem.tipo || ''); setFecha(editItem.fecha ? editItem.fecha.slice(0, 10) : '')
      setDescripcion(editItem.descripcion || ''); setResultado(editItem.resultado || ''); setEstado(editItem.estado || '')
    } else if (editTarget === 'vacuna') {
      setFecha(editItem.fecha ? editItem.fecha.slice(0, 10) : '')
      setProximaDosis(editItem.proxima_dosis ? editItem.proxima_dosis.slice(0, 10) : '')
    } else if (editTarget === 'analisis') {
      setTipo(editItem.tipo || ''); setFecha(editItem.fecha ? editItem.fecha.slice(0, 10) : '')
      setDescripcion(editItem.descripcion || ''); setResultado(editItem.resultado || ''); setObservaciones(editItem.observaciones || '')
    } else if (editTarget === 'imagen') {
      setImagenTipo(editItem.tipo || ''); setFecha(editItem.fecha ? editItem.fecha.slice(0, 10) : '')
      setRegion(editItem.region || ''); setHallazgos(editItem.hallazgos || ''); setObservaciones(editItem.observaciones || '')
    }
  }, [editTarget, editItem])

  const handleSave = () => {
    if (!editTarget) return
    let data: any = {}
    if (editTarget === 'consulta') data = { motivo, fecha, diagnostico, tratamiento, observaciones }
    else if (editTarget === 'cirugia') data = { tipo, fecha, descripcion, resultado, estado }
    else if (editTarget === 'vacuna') data = { fecha, proxima_dosis: proximaDosis }
    else if (editTarget === 'analisis') data = { tipo, fecha, descripcion, resultado, observaciones }
    else if (editTarget === 'imagen') data = { tipo: imagenTipo, fecha, region, hallazgos, observaciones }
    onSave(editTarget, editItem, data)
  }

  return (
    <Dialog open={!!editTarget} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTarget === 'consulta' && 'Editar consulta'}
            {editTarget === 'cirugia' && 'Editar cirugía'}
            {editTarget === 'vacuna' && 'Editar vacuna'}
            {editTarget === 'analisis' && 'Editar análisis'}
            {editTarget === 'imagen' && 'Editar imagen diagnóstica'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {editTarget === 'consulta' && (<>
            <div className="space-y-1"><Label>Fecha</Label><Input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Motivo</Label><Input value={motivo} onChange={e => setMotivo(e.target.value)} /></div>
            <div className="space-y-1"><Label>Diagnóstico</Label><Textarea rows={2} value={diagnostico} onChange={e => setDiagnostico(e.target.value)} /></div>
            <div className="space-y-1"><Label>Tratamiento</Label><Textarea rows={2} value={tratamiento} onChange={e => setTratamiento(e.target.value)} /></div>
            <div className="space-y-1"><Label>Observaciones</Label><Textarea rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></div>
          </>)}
          {editTarget === 'cirugia' && (<>
            <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Tipo</Label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Seleccionar tipo...</option>
                {tiposCirugia.map((tc: any) => <option key={tc.id} value={tc.nombre}>{tc.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>Estado</Label>
              <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Sin estado</option>
                <option value="programado">Programado</option>
                <option value="en_progreso">En progreso</option>
                <option value="exitosa">Exitosa</option>
                <option value="complicaciones">Complicaciones</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Descripción</Label><Textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} /></div>
            <div className="space-y-1"><Label>Resultado</Label><Textarea rows={2} value={resultado} onChange={e => setResultado(e.target.value)} /></div>
          </>)}
          {editTarget === 'vacuna' && (<>
            <div className="space-y-1"><Label>Fecha aplicación</Label><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Próxima dosis</Label><Input type="date" value={proximaDosis} onChange={e => setProximaDosis(e.target.value)} /></div>
          </>)}
          {editTarget === 'analisis' && (<>
            <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Tipo</Label>
              <Popover open={analisisTipoOpen} onOpenChange={setAnalisisTipoOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className="truncate">{tipo || 'Seleccionar tipo...'}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar tipo..." />
                    <CommandList>
                      <CommandEmpty>No encontrado.</CommandEmpty>
                      <CommandGroup>
                        {tiposAnalisis.map((ta: any) => (
                          <CommandItem key={ta.id} value={ta.nombre} onSelect={() => { setTipo(ta.nombre); setAnalisisTipoOpen(false) }}>
                            <Check className={cn('mr-2 size-4', tipo === ta.nombre ? 'opacity-100' : 'opacity-0')} />
                            {ta.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1"><Label>Descripción</Label><Textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} /></div>
            <div className="space-y-1"><Label>Resultado</Label><Textarea rows={2} value={resultado} onChange={e => setResultado(e.target.value)} /></div>
            <div className="space-y-1"><Label>Observaciones</Label><Textarea rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></div>
          </>)}
          {editTarget === 'imagen' && (<>
            <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Tipo</Label>
              <select value={imagenTipo} onChange={e => setImagenTipo(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="Radiografía">Radiografía</option>
                <option value="Ecografía">Ecografía</option>
                <option value="TAC">TAC</option>
                <option value="Resonancia">Resonancia</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Región</Label><Input value={region} onChange={e => setRegion(e.target.value)} /></div>
            <div className="space-y-1"><Label>Hallazgos</Label><Textarea rows={2} value={hallazgos} onChange={e => setHallazgos(e.target.value)} /></div>
            <div className="space-y-1"><Label>Observaciones</Label><Textarea rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></div>
          </>)}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function OwnersPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { data: owners = [], loading, error, refetch } = useDuenos()
  const { data: mascotas = [] } = useMascotas()
  const { data: tiposCirugia } = useTiposCirugia()
  const { data: tiposAnalisis } = useTiposAnalisis()
  const { data: especies = [] } = useEspecies()
  const { data: razas = [] } = useRazas()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editOwnerInitial, setEditOwnerInitial] = useState<{ nombre: string; email: string; telefono: string; direccion: string; contacto_secundario: string; tipo: 'socio' | 'particular' }>({ nombre: "", email: "", telefono: "", direccion: "", contacto_secundario: "", tipo: 'particular' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [warningOwner, setWarningOwner] = useState<{ id: string; nombre: string; petCount: number } | null>(null)
  const [viewingPetsOwner, setViewingPetsOwner] = useState<any | null>(null)
  const [accessDialogOwner, setAccessDialogOwner] = useState<{ id: string; nombre: string; telefono: string; usuario: string; password: string } | null>(null)
  const [generatingAccess, setGeneratingAccess] = useState<string | null>(null)

  // Historia clínica sheet
  const [historiaOpen, setHistoriaOpen] = useState(false)
  const [historiaPet, setHistoriaPet] = useState<any | null>(null)
  const [historiaLoading, setHistoriaLoading] = useState(false)
  const [hConsultas, setHConsultas] = useState<Consulta[]>([])
  const [hCirugias, setHCirugias] = useState<Cirugia[]>([])
  const [hVacunas, setHVacunas] = useState<Vacuna[]>([])
  const [hAnalisis, setHAnalisis] = useState<Analisis[]>([])
  const [hImagenes, setHImagenes] = useState<ImagenDiagnostica[]>([])
  const [expandedSection, setExpandedSection] = useState<'consultas' | 'cirugias' | 'vacunas' | 'analisis' | 'imagenes' | null>('consultas')

  const openHistoria = async (pet: any) => {
    setHistoriaPet(pet)
    setHistoriaOpen(true)
    setHistoriaLoading(true)
    setHConsultas([]); setHCirugias([]); setHVacunas([]); setHAnalisis([]); setHImagenes([])
    setExpandedSection('consultas')
    if (!user) return
    const [c, ci, v, a, im] = await Promise.all([
      getConsultasByMascota(pet.id, user.id_clinica),
      getCirugiasByMascota(pet.id, user.id_clinica),
      getVacunasByMascota(pet.id, user.id_clinica),
      getAnalisisByMascota(pet.id, user.id_clinica),
      getImagenesByMascota(pet.id, user.id_clinica),
    ])
    setHConsultas(c.data ?? [])
    setHCirugias(ci.data ?? [])
    setHVacunas(v.data ?? [])
    setHAnalisis(a.data ?? [])
    setHImagenes(im.data ?? [])
    setHistoriaLoading(false)
  }

  const toggleSection = (s: typeof expandedSection) => setExpandedSection(prev => prev === s ? null : s)

  const estadoBadgeClass = (estado?: string) => {
    const m: Record<string, string> = {
      programado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      en_progreso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      exitosa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      complicaciones: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return m[estado ?? ''] ?? 'bg-muted text-muted-foreground'
  }
  const estadoLabel = (estado?: string) => ({ programado: 'Programado', en_progreso: 'En progreso', exitosa: 'Exitosa', complicaciones: 'Complicaciones' })[estado ?? ''] ?? estado ?? '-'
  const fDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
  const fDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  // --- Edición de historia ---
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const openEdit = (target: EditTarget, item: any) => { setEditTarget(target); setEditItem(item) }
  const closeEdit = () => { setEditTarget(null); setEditItem(null) }

  // --- Edición de datos de la mascota ---
  const [editPetOpen, setEditPetOpen] = useState(false)
  const [editPetSaving, setEditPetSaving] = useState(false)

  const openEditPet = () => { setEditPetOpen(true) }

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

  const handleAddOwner = async (form: { nombre: string; email: string; telefono: string; direccion: string; contacto_secundario: string; tipo: 'socio' | 'particular' }) => {
    if (user && form.nombre && form.email && form.telefono) {
      try {
        await createDueno({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          direccion: form.direccion,
          contacto_secundario: form.contacto_secundario || undefined,
          tipo: form.tipo,
          id_clinica: user.id_clinica,
        })
        setIsAddDialogOpen(false)
        refetch()
      } catch (err) {
        console.error("Error adding owner:", err)
      }
    }
  }

  const handleEditOwner = (owner: any) => {
    setEditingId(owner.id)
    setEditOwnerInitial({
      nombre: owner.nombre,
      email: owner.email,
      telefono: owner.telefono,
      direccion: owner.direccion || "",
      contacto_secundario: owner.contacto_secundario || "",
      tipo: owner.tipo || 'particular',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateOwner = async (form: { nombre: string; email: string; telefono: string; direccion: string; contacto_secundario: string; tipo: 'socio' | 'particular' }) => {
    if (user && editingId && form.nombre && form.email && form.telefono) {
      try {
        await updateDueno(editingId, user.id_clinica, {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          direccion: form.direccion,
          contacto_secundario: form.contacto_secundario || undefined,
          tipo: form.tipo,
        })
        setEditingId(null)
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

  const handleGenerateAccess = async (owner: any) => {
    // Si ya tiene usuario, mostrar los datos existentes
    if (owner.usuario && owner.password_temp) {
      setAccessDialogOwner({
        id: owner.id,
        nombre: owner.nombre,
        telefono: owner.telefono,
        usuario: owner.usuario,
        password: owner.password_temp,
      })
      return
    }
    setGeneratingAccess(owner.id)
    try {
      const res = await createOwnerAccess(owner.id, user!.id_clinica, owner.nombre)
      if (res.success && res.data) {
        setAccessDialogOwner({
          id: owner.id,
          nombre: owner.nombre,
          telefono: owner.telefono,
          usuario: res.data.usuario,
          password: res.data.password,
        })
        refetch()
      }
    } finally {
      setGeneratingAccess(null)
    }
  }

  const handleSavePet = async (data: { nombre: string; especie: string; raza: string; sexo: string; fecha_nacimiento: string; peso: string; observaciones: string }) => {
    if (!historiaPet || !user) return
    setEditPetSaving(true)
    const res = await updateMascota(historiaPet.id, user.id_clinica, {
      nombre: data.nombre,
      especie: data.especie,
      raza: data.raza,
      sexo: data.sexo as 'M' | 'F' | undefined,
      fecha_nacimiento: data.fecha_nacimiento,
      peso: data.peso ? parseFloat(data.peso) : undefined,
      observaciones: data.observaciones,
    })
    if (res.data) {
      setHistoriaPet((prev: any) => ({ ...prev, ...res.data }))
    }
    setEditPetSaving(false)
    setEditPetOpen(false)
  }

  const handleSaveHistoriaItem = async (target: EditTarget, item: any, data: any) => {
    if (!user) return
    setEditSaving(true)
    if (target === 'consulta') {
      const res = await updateConsulta(item.id, user.id_clinica, { motivo: data.motivo, fecha: data.fecha, diagnostico: data.diagnostico, tratamiento: data.tratamiento, observaciones: data.observaciones })
      if (res.data) setHConsultas(prev => prev.map(x => x.id === item.id ? { ...x, ...res.data! } : x))
    } else if (target === 'cirugia') {
      const res = await updateCirugia(item.id, user.id_clinica, { tipo: data.tipo, fecha: data.fecha, descripcion: data.descripcion, resultado: data.resultado, ...(data.estado && { estado: data.estado }) } as any)
      if (res.data) setHCirugias(prev => prev.map(x => x.id === item.id ? { ...x, ...res.data! } : x))
    } else if (target === 'vacuna') {
      const res = await updateVacuna(item.id, user.id_clinica, { fecha: data.fecha, proxima_dosis: data.proxima_dosis || null })
      if (res.data) setHVacunas(prev => prev.map(x => x.id === item.id ? { ...x, ...res.data! } : x))
    } else if (target === 'analisis') {
      const res = await updateAnalisis(item.id, user.id_clinica, { tipo: data.tipo, fecha: data.fecha, descripcion: data.descripcion, resultado: data.resultado, observaciones: data.observaciones })
      if (res.data) setHAnalisis(prev => prev.map(x => x.id === item.id ? { ...x, ...res.data! } : x))
    } else if (target === 'imagen') {
      const res = await updateImagen(item.id, user.id_clinica, { tipo: data.tipo as any, fecha: data.fecha, region: data.region, hallazgos: data.hallazgos, observaciones: data.observaciones })
      if (res.data) setHImagenes(prev => prev.map(x => x.id === item.id ? { ...x, ...res.data! } : x))
    }
    setEditSaving(false)
    closeEdit()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('owners')}</h1>
          <p className="text-muted-foreground">{t('manageOwners')}</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t('addOwner')}
        </Button>
        <AddOwnerDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={handleAddOwner}
          t={t}
        />
        <EditOwnerDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initial={editOwnerInitial}
          onSave={handleUpdateOwner}
          t={t}
        />
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
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
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
                            <a
                              href={`https://wa.me/${owner.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground sm:hidden hover:text-green-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {owner.telefono}
                            </a>
                            {owner.direccion && (
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(owner.direccion)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MapPin className="size-3" />
                                {owner.direccion}
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <a
                          href={`https://wa.me/${owner.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-green-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="size-4" />
                          {owner.telefono}
                        </a>
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
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={owner.tipo === 'socio' ? 'default' : 'outline'} className="text-xs">
                          {owner.tipo === 'socio' ? 'Socio' : 'Particular'}
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
                                setTimeout(() => handleGenerateAccess(owner), 0)
                              }}
                              disabled={generatingAccess === owner.id}
                            >
                              <KeyRound className="mr-2 size-4" />
                              {owner.usuario ? 'Ver datos de acceso' : 'Generar acceso portal'}
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

      {/* Dialog de datos de acceso al portal */}
      <Dialog open={!!accessDialogOwner} onOpenChange={(open) => !open && setAccessDialogOwner(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              Datos de acceso — {accessDialogOwner?.nombre}
            </DialogTitle>
            <DialogDescription>
              Compartí estos datos con el dueño para que ingrese al portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuario</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{accessDialogOwner?.usuario}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(accessDialogOwner?.usuario || '')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contraseña temporal</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{accessDialogOwner?.password}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(accessDialogOwner?.password || '')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Al ingresar por primera vez se le pedirá que cambie su contraseña.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setAccessDialogOwner(null)}
            >
              Cerrar
            </Button>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (!accessDialogOwner) return
                const phone = accessDialogOwner.telefono.replace(/\D/g, '')
                const text = `¡Hola ${accessDialogOwner.nombre}! Te enviamos tus datos de acceso al portal de mascotas Anivex 🐾\n\nUsuario: ${accessDialogOwner.usuario}\nContraseña temporal: ${accessDialogOwner.password}\n\nIngresá en: ${window.location.origin}\n\nAl entrar por primera vez se te pedirá que cambies tu contraseña.`
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
              }}
            >
              <MessageCircle className="mr-2 size-4" />
              Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Dialog de datos de acceso al portal */}
      <Dialog open={!!accessDialogOwner} onOpenChange={(open) => !open && setAccessDialogOwner(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              Datos de acceso — {accessDialogOwner?.nombre}
            </DialogTitle>
            <DialogDescription>
              Compartí estos datos con el dueño para que ingrese al portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuario</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{accessDialogOwner?.usuario}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(accessDialogOwner?.usuario || '')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contraseña temporal</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{accessDialogOwner?.password}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(accessDialogOwner?.password || '')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Al ingresar por primera vez se le pedirá que cambie su contraseña.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setAccessDialogOwner(null)}
            >
              Cerrar
            </Button>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (!accessDialogOwner) return
                const phone = accessDialogOwner.telefono.replace(/\D/g, '')
                const text = `¡Hola ${accessDialogOwner.nombre}! Te enviamos tus datos de acceso al portal de mascotas Anivex \uD83D\uDC3E\n\nUsuario: ${accessDialogOwner.usuario}\nContraseña temporal: ${accessDialogOwner.password}\n\nIngresá en: ${window.location.origin}\n\nAl entrar por primera vez se te pedirá que cambies tu contraseña.`
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
              }}
            >
              <MessageCircle className="mr-2 size-4" />
              Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs shrink-0"
                          onClick={() => { setViewingPetsOwner(null); setTimeout(() => openHistoria(pet), 50) }}
                        >
                          <BookOpen className="size-3.5" />
                          Ver historia
                        </Button>
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
      {/* ─── Historia Clínica Sheet ─── */}
      <Sheet open={historiaOpen} onOpenChange={setHistoriaOpen}>
        <SheetContent className="w-full sm:max-w-[680px] p-0" side="right" onInteractOutside={e => { if (editTarget || editPetOpen) e.preventDefault() }}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {historiaPet && (() => {
                const speciesIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                  perro: Dog, gato: Cat, pajaro: Bird, Dog, Cat, Bird, Rabbit, conejo: Rabbit,
                }
                const IconComp = speciesIconMap[historiaPet.especie] || PawPrint
                const edad = historiaPet.fecha_nacimiento
                  ? Math.floor((Date.now() - new Date(historiaPet.fecha_nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365))
                  : null
                return (
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20">
                      <IconComp className="w-14 h-14 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <SheetHeader className="p-0 text-left">
                        <div className="flex items-center gap-2">
                          <SheetTitle className="text-2xl font-bold">{historiaPet.nombre}</SheetTitle>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={openEditPet}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </SheetHeader>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Especie:</span> {historiaPet.especie}</span>
                        {historiaPet.raza && <span><span className="font-medium text-foreground">Raza:</span> {historiaPet.raza}</span>}
                        {historiaPet.sexo && <span><span className="font-medium text-foreground">Sexo:</span> {historiaPet.sexo === 'M' ? 'Macho' : 'Hembra'}</span>}
                        {edad !== null && <span><span className="font-medium text-foreground">Edad:</span> {edad} año{edad !== 1 ? 's' : ''}</span>}
                        {historiaPet.fecha_nacimiento && <span><span className="font-medium text-foreground">Nac.:</span> {fDate(historiaPet.fecha_nacimiento)}</span>}
                        {historiaPet.peso && <span><span className="font-medium text-foreground">Peso:</span> {historiaPet.peso} kg</span>}
                      </div>
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {historiaLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Consultas */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('consultas')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        Consultas
                        <Badge variant="secondary" className="text-xs">{hConsultas.length}</Badge>
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
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{fDateTime(c.fecha)}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openEdit('consulta', c)}><Pencil className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {c.diagnostico && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Diagnóstico:</span> {c.diagnostico}</p>}
                            {c.tratamiento && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tratamiento:</span> {c.tratamiento}</p>}
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
                        <Badge variant="secondary" className="text-xs">{hCirugias.length}</Badge>
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
                              <div className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadgeClass((c as any).estado)}`}>{estadoLabel((c as any).estado)}</span>
                                <span className="text-xs text-muted-foreground">{fDate(c.fecha)}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openEdit('cirugia', c)}><Pencil className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {c.descripcion && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Descripción:</span> {c.descripcion}</p>}
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
                        <Badge variant="secondary" className="text-xs">{hVacunas.length}</Badge>
                      </div>
                      {expandedSection === 'vacunas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'vacunas' && (
                      <div className="border-t divide-y">
                        {hVacunas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin vacunas registradas.</p>
                        ) : hVacunas.map(v => (
                          <div key={v.id} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">Aplicación: {fDate(v.fecha)}</span>
                              <div className="flex items-center gap-1">
                                {v.proxima_dosis && <span className="text-xs text-muted-foreground">Próxima dosis: <span className="font-medium text-foreground">{fDate(v.proxima_dosis)}</span></span>}
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openEdit('vacuna', v)}><Pencil className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Análisis */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('analisis')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <FlaskConical className="h-4 w-4 text-orange-500" />
                        Análisis
                        <Badge variant="secondary" className="text-xs">{hAnalisis.length}</Badge>
                      </div>
                      {expandedSection === 'analisis' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'analisis' && (
                      <div className="border-t divide-y">
                        {hAnalisis.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin análisis registrados.</p>
                        ) : hAnalisis.map(a => (
                          <div key={a.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{a.tipo}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{fDate(a.fecha)}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openEdit('analisis', a)}><Pencil className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {a.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {a.resultado}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Imagenología */}
                  <div className="rounded-lg border">
                    <button onClick={() => toggleSection('imagenes')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-2 font-semibold">
                        <ScanLine className="h-4 w-4 text-cyan-500" />
                        Imagenología
                        <Badge variant="secondary" className="text-xs">{hImagenes.length}</Badge>
                      </div>
                      {expandedSection === 'imagenes' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedSection === 'imagenes' && (
                      <div className="border-t divide-y">
                        {hImagenes.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin estudios registrados.</p>
                        ) : hImagenes.map(im => (
                          <div key={im.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{im.tipo}{im.region ? ` — ${im.region}` : ''}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{fDate(im.fecha)}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openEdit('imagen', im)}><Pencil className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {im.hallazgos && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Hallazgos:</span> {im.hallazgos}</p>}
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

      {/* Edit mascota Dialog */}
      <EditPetInHistoriaDialog
        open={editPetOpen}
        onOpenChange={setEditPetOpen}
        pet={historiaPet}
        especies={especies}
        razas={razas}
        onSave={handleSavePet}
        saving={editPetSaving}
      />

      {/* Edit historia Dialog */}
      <EditHistoriaItemDialog
        editTarget={editTarget}
        editItem={editItem}
        tiposCirugia={tiposCirugia ?? []}
        tiposAnalisis={tiposAnalisis ?? []}
        onSave={handleSaveHistoriaItem}
        onClose={closeEdit}
        saving={editSaving}
      />
    </div>
  )
}
