"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from 'next/dynamic'
// --- Markdown renderer for Sana report ---
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

function SanaMarkdown({ content }: { content: string }) {
  if (typeof window === 'undefined') {
    // SSR fallback
    return <pre className="whitespace-pre-wrap text-sm">{content}</pre>
  }
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p style={{ margin: '1em 0' }}>{children}</p>
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Dog, Cat, Bird, Rabbit, Filter, User, Phone, Mail, MapPin, BookOpen, Stethoscope, Scissors, Syringe, HelpCircle, ChevronDown, ChevronRight, FlaskConical, ScanLine, Paperclip, X as XIcon, Check, ChevronsUpDown, Download } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMascotas } from "@/hooks/use-mascotas"
import { useDuenos } from "@/hooks/use-duenos"
import { createMascota, deleteMascota, updateMascota, getConsultasByMascota, getCirugiasByMascota, getVacunasByMascota, getAnalisisByMascota, getImagenesByMascota, createConsulta, createCirugia, createVacuna, createAnalisis, createImagen, uploadDocumento, updateConsulta, updateCirugia, updateVacuna, updateAnalisis, updateImagen } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useUserList } from "@/hooks/use-usuarios"
import { useTiposCirugia } from "@/hooks/use-tipos-cirugia"
import { useTiposVacuna } from "@/hooks/use-tipos-vacuna"
import { useTiposAnalisis } from "@/hooks/use-tipos-analisis"
import { useEspecies } from "@/hooks/use-especies"
import { useRazas } from "@/hooks/use-razas"
import type { Consulta, Cirugia, Vacuna, Analisis, ImagenDiagnostica } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SanaLogo } from "@/components/sana-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { ConsultaForm, ConsultaFormData } from '@/components/forms/consulta-form'
import { AnalisisForm, AnalisisFormData } from '@/components/forms/analisis-form'
import { ImagenForm, ImagenFormData } from '@/components/forms/imagen-form'

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

async function getSanaLogoPNG(sizePx = 80, color = '#ffffff'): Promise<string> {
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${sizePx}" height="${sizePx}">
    <g transform="translate(10,10)">
      <path d="M 0 30 L 15 0 L 40 15 L 65 0 L 80 30 L 80 60 L 55 80 L 25 80 L 0 60 Z"
        fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="25" cy="45" r="5" fill="${color}"/>
      <rect x="23" y="55" width="4" height="15" rx="2" fill="${color}"/>
      <circle cx="55" cy="45" r="12" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="55" cy="45" r="4" fill="${color}"/>
    </g>
  </svg>`
  return new Promise((resolve) => {
    const img = new window.Image()
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = sizePx
      canvas.height = sizePx
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = url
  })
}

// ─── Subcomponent: Add Pet Dialog ─────────────────────────────────────────────
function AddPetDialog({ open, onOpenChange, onAdd, duenos, especies, razas, t }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (pet: { nombre: string; especie: string; raza: string; id_dueno: string; fecha_nacimiento: string; sexo: string; peso: string; observaciones: string; tipo: string }) => Promise<void>
  duenos: any[]
  especies: any[]
  razas: any[]
  t: (k: string) => string
}) {
  const [form, setForm] = useState({ nombre: "", especie: "", raza: "", id_dueno: "", fecha_nacimiento: "", sexo: "", peso: "", observaciones: "", tipo: "particular" })
  const [especieOpen, setEspecieOpen] = useState(false)
  const [razaOpen, setRazaOpen] = useState(false)
  const [searchDuenos, setSearchDuenos] = useState("")

  useEffect(() => {
    if (!open) {
      setForm({ nombre: "", especie: "", raza: "", id_dueno: "", fecha_nacimiento: "", sexo: "", peso: "", observaciones: "", tipo: "particular" })
      setSearchDuenos("")
    }
  }, [open])

  const filteredDuenos = duenos.filter((d: any) => d.nombre.toLowerCase().includes(searchDuenos.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={e => { e.preventDefault(); onAdd(form) }}>
          <DialogHeader>
            <DialogTitle>{t("addNewPet")}</DialogTitle>
            <DialogDescription>{t("enterDetails")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-petName">{t("petName")}</Label>
              <Input id="add-petName" placeholder={t("petName")} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>{t("species")}</Label>
              <Popover open={especieOpen} onOpenChange={setEspecieOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className="truncate">{form.especie || t("species")}</span>
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
                          <CommandItem key={e.id} value={e.nombre} onSelect={() => { setForm(f => ({ ...f, especie: e.nombre, raza: '' })); setEspecieOpen(false) }}>
                            <Check className={cn('mr-2 size-4', form.especie === e.nombre ? 'opacity-100' : 'opacity-0')} />
                            {e.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("breed")}</Label>
                <Popover open={razaOpen} onOpenChange={v => { if (form.especie) setRazaOpen(v) }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" disabled={!form.especie} className="w-full justify-between font-normal">
                      <span className="truncate">{form.raza || (form.especie ? t("breed") : 'Seleccioná especie')}</span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar raza..." />
                      <CommandList>
                        <CommandEmpty>No encontrada.</CommandEmpty>
                        <CommandGroup>
                          {razas.filter((r: any) => r.id_especie === especies.find((e: any) => e.nombre === form.especie)?.id).map((r: any) => (
                            <CommandItem key={r.id} value={r.nombre} onSelect={() => { setForm(f => ({ ...f, raza: r.nombre })); setRazaOpen(false) }}>
                              <Check className={cn('mr-2 size-4', form.raza === r.nombre ? 'opacity-100' : 'opacity-0')} />
                              {r.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>{t("sex")}</Label>
                <Select value={form.sexo} onValueChange={v => setForm(f => ({ ...f, sexo: v }))}>
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
              <Select value={form.id_dueno} onValueChange={v => { setForm(f => ({ ...f, id_dueno: v })); setSearchDuenos("") }}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("owner")} /></SelectTrigger>
                <SelectContent className="w-full">
                  <div className="p-2">
                    <Input placeholder={t("search")} value={searchDuenos} onChange={e => setSearchDuenos(e.target.value)} className="mb-2" />
                  </div>
                  {filteredDuenos.length > 0 ? filteredDuenos.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  )) : (
                    <div className="text-sm text-muted-foreground p-2 text-center">No se encontraron dueños</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("birthDate")}</Label>
                <Input type="date" value={form.fecha_nacimiento} onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>{t("weight")}</Label>
                <div className="relative">
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} onKeyDown={e => { if (e.key === ',') e.preventDefault() }} className="pr-10" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observaciones</Label>
              <Input placeholder="Alergias, condiciones especiales..." value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de mascota</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="socio">Socio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit">{t("add")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponent: Edit Pet Dialog ────────────────────────────────────────────
function EditPetDialog({ open, onOpenChange, initial, onSave, duenos, especies, razas, t }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: { nombre: string; especie: string; raza: string; id_dueno: string; fecha_nacimiento: string; sexo: string; peso: string; observaciones: string; tipo: string }
  onSave: (data: typeof initial) => Promise<void>
  duenos: any[]
  especies: any[]
  razas: any[]
  t: (k: string) => string
}) {
  const [form, setForm] = useState(initial)
  const [especieOpen, setEspecieOpen] = useState(false)
  const [razaOpen, setRazaOpen] = useState(false)

  useEffect(() => {
    if (open) setForm(initial)
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editPet")}</DialogTitle>
          <DialogDescription>{t("updatePetData")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t("petName")}</Label>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>{t("species")}</Label>
            <Popover open={especieOpen} onOpenChange={setEspecieOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{form.especie || t("species")}</span>
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
                        <CommandItem key={e.id} value={e.nombre} onSelect={() => { setForm(f => ({ ...f, especie: e.nombre, raza: '' })); setEspecieOpen(false) }}>
                          <Check className={cn('mr-2 size-4', form.especie === e.nombre ? 'opacity-100' : 'opacity-0')} />
                          {e.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("breed")}</Label>
              <Popover open={razaOpen} onOpenChange={v => { if (form.especie) setRazaOpen(v) }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" disabled={!form.especie} className="w-full justify-between font-normal">
                    <span className="truncate">{form.raza || (form.especie ? t('breed') : 'Seleccioná especie')}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar raza..." />
                    <CommandList>
                      <CommandEmpty>No encontrada.</CommandEmpty>
                      <CommandGroup>
                        {razas.filter((r: any) => r.id_especie === especies.find((e: any) => e.nombre === form.especie)?.id).map((r: any) => (
                          <CommandItem key={r.id} value={r.nombre} onSelect={() => { setForm(f => ({ ...f, raza: r.nombre })); setRazaOpen(false) }}>
                            <Check className={cn('mr-2 size-4', form.raza === r.nombre ? 'opacity-100' : 'opacity-0')} />
                            {r.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>{t("sex")}</Label>
              <Select value={form.sexo} onValueChange={v => setForm(f => ({ ...f, sexo: v }))}>
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
            <Select value={form.id_dueno} onValueChange={v => setForm(f => ({ ...f, id_dueno: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("owner")} /></SelectTrigger>
              <SelectContent>
                {duenos.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("birthDate")}</Label>
              <Input type="date" value={form.fecha_nacimiento} onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>{t("weight")}</Label>
              <div className="relative">
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} onKeyDown={e => { if (e.key === ',') e.preventDefault() }} className="pr-10" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Observaciones</Label>
            <Input placeholder="Alergias, condiciones especiales..." value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Tipo de mascota</Label>
            <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="socio">Socio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponent: Edit Historia Item Dialogs (pets) ──────────────────────────
type PetsEditTarget = 'consulta' | 'cirugia' | 'vacuna' | 'analisis' | 'imagen'

function EditHistoriaItemDialogPets({ editTarget, editItem, tiposCirugia, tiposAnalisis, onSave, onClose, saving }: {
  editTarget: PetsEditTarget | null
  editItem: any
  tiposCirugia: any[]
  tiposAnalisis: any[]
  onSave: (target: PetsEditTarget, item: any, data: any) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const [consultaForm, setConsultaForm] = useState({ motivo: '', diagnostico: '', tratamiento: '', observaciones: '', fecha: '' })
  const [cirugiaForm, setCirugiaForm] = useState({ tipo: '', estado: '', descripcion: '', resultado: '', fecha: '' })
  const [vacunaForm, setVacunaForm] = useState({ fecha: '', proxima_dosis: '' })
  const [analisisForm, setAnalisisForm] = useState({ tipo: '', descripcion: '', resultado: '', observaciones: '', fecha: '' })
  const [analisisTipoOpen, setAnalisisTipoOpen] = useState(false)
  const [imagenForm, setImagenForm] = useState({ tipo: '', region: '', hallazgos: '', observaciones: '', fecha: '' })

  useEffect(() => {
    if (!editTarget || !editItem) return
    if (editTarget === 'consulta') setConsultaForm({ motivo: editItem.motivo || '', diagnostico: editItem.diagnostico || '', tratamiento: editItem.tratamiento || '', observaciones: editItem.observaciones || '', fecha: editItem.fecha?.slice(0, 10) || '' })
    else if (editTarget === 'cirugia') setCirugiaForm({ tipo: editItem.tipo || '', estado: editItem.estado || '', descripcion: editItem.descripcion || '', resultado: editItem.resultado || '', fecha: editItem.fecha?.slice(0, 10) || '' })
    else if (editTarget === 'vacuna') setVacunaForm({ fecha: editItem.fecha?.slice(0, 10) || '', proxima_dosis: editItem.proxima_dosis?.slice(0, 10) || '' })
    else if (editTarget === 'analisis') setAnalisisForm({ tipo: editItem.tipo || '', descripcion: editItem.descripcion || '', resultado: editItem.resultado || '', observaciones: editItem.observaciones || '', fecha: editItem.fecha?.slice(0, 10) || '' })
    else if (editTarget === 'imagen') setImagenForm({ tipo: editItem.tipo || '', region: editItem.region || '', hallazgos: editItem.hallazgos || '', observaciones: editItem.observaciones || '', fecha: editItem.fecha?.slice(0, 10) || '' })
  }, [editTarget, editItem])

  const handleSave = () => {
    if (!editTarget) return
    if (editTarget === 'consulta') onSave(editTarget, editItem, consultaForm)
    else if (editTarget === 'cirugia') onSave(editTarget, editItem, cirugiaForm)
    else if (editTarget === 'vacuna') onSave(editTarget, editItem, vacunaForm)
    else if (editTarget === 'analisis') onSave(editTarget, editItem, analisisForm)
    else if (editTarget === 'imagen') onSave(editTarget, editItem, imagenForm)
  }

  return (<>
    {/* Editar Consulta */}
    <Dialog open={editTarget === 'consulta'} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar consulta</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-3">
          <div className="space-y-1.5"><Label>Motivo</Label><Input value={consultaForm.motivo} onChange={e => setConsultaForm(f => ({ ...f, motivo: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Diagnóstico</Label><Textarea value={consultaForm.diagnostico} onChange={e => setConsultaForm(f => ({ ...f, diagnostico: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Tratamiento</Label><Textarea value={consultaForm.tratamiento} onChange={e => setConsultaForm(f => ({ ...f, tratamiento: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Observaciones</Label><Textarea value={consultaForm.observaciones} onChange={e => setConsultaForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={consultaForm.fecha} onChange={e => setConsultaForm(f => ({ ...f, fecha: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Editar Cirugía */}
    <Dialog open={editTarget === 'cirugia'} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar cirugía</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2"><Label>Tipo</Label>
              <Select value={cirugiaForm.tipo} onValueChange={val => setCirugiaForm(f => ({ ...f, tipo: val }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>{tiposCirugia.map((t: any) => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={cirugiaForm.fecha} onChange={e => setCirugiaForm(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Estado</Label>
              <Select value={cirugiaForm.estado} onValueChange={val => setCirugiaForm(f => ({ ...f, estado: val }))}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="exitosa">Exitosa</SelectItem>
                  <SelectItem value="complicaciones">Complicaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={cirugiaForm.descripcion} onChange={e => setCirugiaForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Resultado</Label><Textarea value={cirugiaForm.resultado} onChange={e => setCirugiaForm(f => ({ ...f, resultado: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Editar Vacuna */}
    <Dialog open={editTarget === 'vacuna'} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar vacuna</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-3">
          <div className="space-y-1.5"><Label>Fecha de aplicación</Label><Input type="date" value={vacunaForm.fecha} onChange={e => setVacunaForm(f => ({ ...f, fecha: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Próxima dosis</Label><Input type="date" value={vacunaForm.proxima_dosis} onChange={e => setVacunaForm(f => ({ ...f, proxima_dosis: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Editar Análisis */}
    <Dialog open={editTarget === 'analisis'} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar análisis</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2"><Label>Tipo</Label>
              <Popover open={analisisTipoOpen} onOpenChange={setAnalisisTipoOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className="truncate">{analisisForm.tipo || 'Seleccionar tipo'}</span>
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
                          <CommandItem key={ta.id} value={ta.nombre} onSelect={() => { setAnalisisForm(f => ({ ...f, tipo: ta.nombre })); setAnalisisTipoOpen(false) }}>
                            <Check className={cn('mr-2 size-4', analisisForm.tipo === ta.nombre ? 'opacity-100' : 'opacity-0')} />
                            {ta.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>Fecha</Label><Input type="date" value={analisisForm.fecha} onChange={e => setAnalisisForm(f => ({ ...f, fecha: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label>Descripción (muestra)</Label><Textarea value={analisisForm.descripcion} onChange={e => setAnalisisForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Resultado</Label><Textarea value={analisisForm.resultado} onChange={e => setAnalisisForm(f => ({ ...f, resultado: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Observaciones</Label><Textarea value={analisisForm.observaciones} onChange={e => setAnalisisForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Editar Imagen */}
    <Dialog open={editTarget === 'imagen'} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar imagenología</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tipo</Label>
              <Select value={imagenForm.tipo} onValueChange={val => setImagenForm(f => ({ ...f, tipo: val }))}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Radiografía">Radiografía</SelectItem>
                  <SelectItem value="Ecografía">Ecografía</SelectItem>
                  <SelectItem value="TAC">TAC</SelectItem>
                  <SelectItem value="Resonancia">Resonancia</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Región</Label><Input value={imagenForm.region} onChange={e => setImagenForm(f => ({ ...f, region: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Fecha</Label><Input type="date" value={imagenForm.fecha} onChange={e => setImagenForm(f => ({ ...f, fecha: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label>Hallazgos</Label><Textarea value={imagenForm.hallazgos} onChange={e => setImagenForm(f => ({ ...f, hallazgos: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Observaciones</Label><Textarea value={imagenForm.observaciones} onChange={e => setImagenForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>)
}

export default function PetsPage() {
    // Estado y lógica Sana (IA)
    const [sanaLoading, setSanaLoading] = useState(false)
    const [sanaReport, setSanaReport] = useState<string | null>(null)

    // Construir payload de historia clínica para Sana
    function buildSanaPayload() {
      if (!historiaPet) return null;
      return {
        mascota: {
          nombre: historiaPet.nombre,
          especie: historiaPet.especie,
          raza: historiaPet.raza,
          fecha_nacimiento: historiaPet.fecha_nacimiento,
          sexo: historiaPet.sexo,
          peso: historiaPet.peso,
          observaciones: historiaPet.observaciones,
        },
        consultas: hConsultas,
        cirugias: hCirugias,
        vacunas: hVacunas,
      };
    }

    // Simulación de llamada a IA (reemplazar por fetch real si es necesario)
    async function analizarConSana() {
      setSanaLoading(true);
      setSanaReport(null);
      const payload = buildSanaPayload();
      if (!payload) {
        setSanaReport('No hay datos suficientes para generar el informe.');
        setSanaLoading(false);
        return;
      }
      // Construir mensaje clínico base
      const userMsg =
        `Paciente: ${payload.mascota.nombre || '-'}\n` +
        `Especie: ${payload.mascota.especie || '-'}\n` +
        (payload.mascota.raza ? `Raza: ${payload.mascota.raza}\n` : '') +
        (payload.mascota.sexo ? `Sexo: ${payload.mascota.sexo}\n` : '') +
        (payload.mascota.peso ? `Peso: ${payload.mascota.peso} kg\n` : '') +
        (payload.mascota.fecha_nacimiento ? `Fecha de nacimiento: ${payload.mascota.fecha_nacimiento}\n` : '') +
        (payload.mascota.observaciones ? `Observaciones: ${payload.mascota.observaciones}\n` : '') +
        (payload.consultas?.length ? `\nConsultas previas:\n${payload.consultas.map((c: any, i: number) => `- ${c.motivo || '(sin motivo)'}${c.diagnostico ? ` | Dx: ${c.diagnostico}` : ''}${c.tratamiento ? ` | Tx: ${c.tratamiento}` : ''}`).join('\n')}` : '') +
        (payload.cirugias?.length ? `\nCirugías previas:\n${payload.cirugias.map((c: any) => `- ${c.tipo || '(sin tipo)'}${c.resultado ? ` | Resultado: ${c.resultado}` : ''}`).join('\n')}` : '') +
        (payload.vacunas?.length ? `\nVacunas:\n${payload.vacunas.map((v: any) => `- ${v.tipo || '(sin tipo)'}${v.fecha ? ` | Fecha: ${v.fecha}` : ''}`).join('\n')}` : '') +
        '\n\nPor favor, genera un informe clínico para este paciente.';

      try {
        // Enviar a la API de Sana (el RAG ya está integrado en /api/sana)
        const res = await fetch('/api/sana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [ { role: 'user', content: userMsg } ] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido');
        setSanaReport(data.reply);
      } catch (err: any) {
        setSanaReport('Error al generar el informe: ' + (err.message || 'Error desconocido.'));
      } finally {
        setSanaLoading(false);
      }
    }

    async function exportarPDF() {
      if (!sanaReport || !historiaPet) return
      const { default: jsPDFClass } = await import('jspdf')
      const doc = new jsPDFClass()
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 15
      const contentW = pageW - margin * 2

      // Header verde
      doc.setFillColor(46, 204, 113)
      doc.rect(0, 0, pageW, 35, 'F')

      // Logo Sana blanco
      try {
        const logoData = await getSanaLogoPNG(80, '#ffffff')
        doc.addImage(logoData, 'PNG', margin, 6, 20, 20)
      } catch {}

      // Título header
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Sana', margin + 25, 15)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Informe Clínico Veterinario', margin + 25, 23)
      const ahora = new Date()
      const fechaStr = ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const horaStr = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      doc.setFontSize(8)
      doc.text(`${fechaStr}  ${horaStr}`, pageW - margin, 15, { align: 'right' })

      // Datos del paciente
      let y = 47
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('DATOS DEL PACIENTE', margin, y)
      y += 4
      doc.setDrawColor(46, 204, 113)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageW - margin, y)
      y += 7
      doc.setFontSize(9.5)
      const patientFields: [string, string][] = [
        ['Nombre', historiaPet.nombre || '-'],
        ['Especie', historiaPet.especie || '-'],
        ['Raza', historiaPet.raza || '-'],
        ['Sexo', historiaPet.sexo === 'M' ? 'Macho' : historiaPet.sexo === 'H' ? 'Hembra' : (historiaPet.sexo || '-')],
        ['Peso', historiaPet.peso ? `${historiaPet.peso} kg` : '-'],
        ['Nac.', historiaPet.fecha_nacimiento ? new Date(historiaPet.fecha_nacimiento).toLocaleDateString('es-AR') : '-'],
      ]
      const half = pageW / 2
      for (let i = 0; i < patientFields.length; i += 2) {
        const [k1, v1] = patientFields[i]
        doc.setFont('helvetica', 'bold')
        doc.text(`${k1}: `, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.text(v1, margin + doc.getTextWidth(`${k1}: `), y)
        if (patientFields[i + 1]) {
          const [k2, v2] = patientFields[i + 1]
          doc.setFont('helvetica', 'bold')
          doc.text(`${k2}: `, half, y)
          doc.setFont('helvetica', 'normal')
          doc.text(v2, half + doc.getTextWidth(`${k2}: `), y)
        }
        y += 7
      }

      // Separador verde
      y += 2
      doc.setDrawColor(46, 204, 113)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      // Título informe
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('INFORME CLÍNICO', margin, y)
      y += 8

      // Texto del informe (sin markdown)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const plainText = sanaReport
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/`(.*?)`/g, '$1')
        .replace(/^\s*[-*]\s+/gm, '• ')
      const lines = doc.splitTextToSize(plainText, contentW)
      for (const line of lines) {
        if (y + 5 > pageH - 18) {
          doc.addPage()
          y = 20
        }
        doc.text(line, margin, y)
        y += 5
      }

      // Footer en todas las páginas
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(
          'Sana es una herramienta de apoyo clínico. Verificar información crítica con un veterinario certificado.',
          pageW / 2, pageH - 8, { align: 'center' }
        )
      }

      doc.save(`informe_${historiaPet.nombre || 'mascota'}_${ahora.toISOString().slice(0, 10)}.pdf`)
    }

  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: pets = [], loading, error, refetch } = useMascotas()
  const { data: duenos = [] } = useDuenos()
  const { data: usuarios = [] } = useUserList()
  const { data: tiposCirugia = [] } = useTiposCirugia()
  const { data: tiposVacuna = [] } = useTiposVacuna()
  const { data: tiposAnalisis = [] } = useTiposAnalisis()
  const { data: especies = [] } = useEspecies()
  const { data: razas = [] } = useRazas()
  const [searchTerm, setSearchTerm] = useState("")
  const [speciesFilter, setSpeciesFilter] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPetInitial, setEditPetInitial] = useState({ nombre: "", especie: "", raza: "", id_dueno: "", fecha_nacimiento: "", sexo: "", peso: "", observaciones: "", tipo: "particular" })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingOwner, setViewingOwner] = useState<any | null>(null)

  // Historia clínica
  const [historiaOpen, setHistoriaOpen] = useState(false)
  const [historiaPet, setHistoriaPet] = useState<any | null>(null)
  const [historiaLoading, setHistoriaLoading] = useState(false)
  const [hConsultas, setHConsultas] = useState<Consulta[]>([])
  const [hCirugias, setHCirugias] = useState<Cirugia[]>([])
  const [hVacunas, setHVacunas] = useState<Vacuna[]>([])
  const [hAnalisis, setHAnalisis] = useState<Analisis[]>([])
  const [hImagenes, setHImagenes] = useState<ImagenDiagnostica[]>([])
  const [expandedSection, setExpandedSection] = useState<'consultas' | 'cirugias' | 'vacunas' | 'analisis' | 'imagenes' | null>('consultas')

  // Quick-add state
  type QuickSection = 'consulta' | 'cirugia' | 'vacuna' | 'analisis' | 'imagen'
  const [quickSection, setQuickSection] = useState<QuickSection | null>(null)
  const [quickSaving, setQuickSaving] = useState(false)
  const [qCirugia, setQCirugia] = useState({ fecha: '', tipo: '', descripcion: '', resultado: '', id_usuario: '' })
  const [qVacuna, setQVacuna] = useState({ fecha: '', proxima_dosis: '', id_tipo_vacuna: '' })

  // Historia edit state
  type EditTarget = 'consulta' | 'cirugia' | 'vacuna' | 'analisis' | 'imagen'
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [editSaving, setEditSaving] = useState(false)

  const openEdit = (target: EditTarget, item: any) => {
    setEditTarget(target)
    setEditItem(item)
  }

  const closeEdit = () => { setEditTarget(null); setEditItem(null) }

  const handleSaveHistoriaEdit = async (target: EditTarget, item: any, data: any) => {
    if (!user || !item) return
    setEditSaving(true)
    try {
      if (target === 'consulta') {
        const res = await updateConsulta(item.id, user.id_clinica, data)
        if (!res.success) throw new Error(res.error || '')
        setHConsultas(prev => prev.map(x => x.id === item.id ? { ...x, ...data } : x))
      } else if (target === 'cirugia') {
        const res = await updateCirugia(item.id, user.id_clinica, data)
        if (!res.success) throw new Error(res.error || '')
        setHCirugias(prev => prev.map(x => x.id === item.id ? { ...x, ...data } : x))
      } else if (target === 'vacuna') {
        const res = await updateVacuna(item.id, user.id_clinica, data)
        if (!res.success) throw new Error(res.error || '')
        setHVacunas(prev => prev.map(x => x.id === item.id ? { ...x, ...data } : x))
      } else if (target === 'analisis') {
        const res = await updateAnalisis(item.id, user.id_clinica, data)
        if (!res.success) throw new Error(res.error || '')
        setHAnalisis(prev => prev.map(x => x.id === item.id ? { ...x, ...data } : x))
      } else if (target === 'imagen') {
        const res = await updateImagen(item.id, user.id_clinica, data as any)
        if (!res.success) throw new Error(res.error || '')
        setHImagenes(prev => prev.map(x => x.id === item.id ? { ...x, ...data } as any as ImagenDiagnostica : x))
      }
      toast({ title: 'Guardado correctamente' })
      closeEdit()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  const openQuickAdd = (section: QuickSection) => {
    const today = new Date().toISOString().split('T')[0]
    if (section === 'cirugia') setQCirugia({ fecha: today, tipo: '', descripcion: '', resultado: '', id_usuario: '' })
    if (section === 'vacuna') setQVacuna({ fecha: today, proxima_dosis: '', id_tipo_vacuna: '' })
    setQuickSection(section)
  }

  const reloadHistoria = async (pet: any) => {
    if (!user || !pet) return
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
  }

  const handleQuickConsultaSubmit = async (data: ConsultaFormData, files: File[]) => {
    if (!user || !historiaPet) return
    setQuickSaving(true)
    try {
      const { fecha_date, fecha_time, _duenoId, ...rest } = data
      const payload = Object.fromEntries(Object.entries({ ...rest, fecha: fecha_date + (fecha_time ? 'T' + fecha_time : ''), id_mascota: historiaPet.id, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== ''))
      const res = await createConsulta(payload as any)
      if (!res.success || !res.data) throw new Error(res.error || '')
      for (const file of files) await uploadDocumento(file, res.data.id, 'consulta', user.id_clinica)
      toast({ title: 'Consulta registrada', description: files.length > 0 ? `${files.length} archivo(s) adjuntado(s).` : undefined })
      setQuickSection(null)
      setExpandedSection('consultas')
      await reloadHistoria(historiaPet)
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setQuickSaving(false)
    }
  }

  const handleQuickAnalisisSubmit = async (data: AnalisisFormData, files: File[]) => {
    if (!user || !historiaPet) return
    setQuickSaving(true)
    try {
      const { _duenoId, ...rest } = data
      const payload = Object.fromEntries(Object.entries({ ...rest, id_mascota: historiaPet.id, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== ''))
      const res = await createAnalisis(payload as any)
      if (!res.success || !res.data) throw new Error(res.error || '')
      for (const file of files) await uploadDocumento(file, res.data.id, 'analisis', user.id_clinica)
      toast({ title: 'Análisis registrado', description: files.length > 0 ? `${files.length} archivo(s) adjuntado(s).` : undefined })
      setQuickSection(null)
      setExpandedSection('analisis')
      await reloadHistoria(historiaPet)
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setQuickSaving(false)
    }
  }

  const handleQuickImagenSubmit = async (data: ImagenFormData, files: File[]) => {
    if (!user || !historiaPet) return
    setQuickSaving(true)
    try {
      const { _duenoId, ...rest } = data
      const payload = Object.fromEntries(Object.entries({ ...rest, id_mascota: historiaPet.id, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== ''))
      const res = await createImagen(payload as any)
      if (!res.success || !res.data) throw new Error(res.error || '')
      for (const file of files) await uploadDocumento(file, res.data.id, 'imagen', user.id_clinica)
      toast({ title: 'Imagen registrada', description: files.length > 0 ? `${files.length} archivo(s) adjuntado(s).` : undefined })
      setQuickSection(null)
      setExpandedSection('imagenes')
      await reloadHistoria(historiaPet)
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setQuickSaving(false)
    }
  }

  const handleQuickSave = async () => {
    if (!user || !historiaPet || !quickSection) return
    setQuickSaving(true)
    try {
      if (quickSection === 'cirugia') {
        if (!qCirugia.tipo || !qCirugia.fecha) { toast({ title: 'Tipo y fecha son requeridos', variant: 'destructive' }); return }
        const payload = Object.fromEntries(Object.entries({ ...qCirugia, id_mascota: historiaPet.id, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== ''))
        const res = await createCirugia(payload as any)
        if (!res.success) throw new Error(res.error || '')
      } else if (quickSection === 'vacuna') {
        if (!qVacuna.fecha) { toast({ title: 'La fecha es requerida', variant: 'destructive' }); return }
        const payload = Object.fromEntries(Object.entries({ ...qVacuna, id_mascota: historiaPet.id, id_clinica: user.id_clinica }).filter(([, v]) => v !== undefined && v !== ''))
        const res = await createVacuna(payload as any)
        if (!res.success) throw new Error(res.error || '')
      }
      toast({ title: 'Registrado correctamente' })
      setQuickSection(null)
      setExpandedSection(quickSection === 'cirugia' ? 'cirugias' : 'vacunas')
      await reloadHistoria(historiaPet)
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setQuickSaving(false)
    }
  }

  const openHistoria = useCallback(async (pet: any) => {
    setHistoriaPet(pet)
    setHistoriaOpen(true)
    setHistoriaLoading(true)
    setHConsultas([])
    setHCirugias([])
    setHVacunas([])
    setHAnalisis([])
    setHImagenes([])
    setExpandedSection('consultas')
    if (!user) return
    try {
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
    } catch {
      setHConsultas([]); setHCirugias([]); setHVacunas([]); setHAnalisis([]); setHImagenes([])
    } finally {
      setHistoriaLoading(false)
    }
  }, [user])

  const toggleSection = (s: 'consultas' | 'cirugias' | 'vacunas' | 'analisis' | 'imagenes') =>
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

  const filteredPets = pets.filter((pet: any) => {
    const matchesSearch =
      pet.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.raza.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecies = speciesFilter === "All" || pet.especie === speciesFilter
    return matchesSearch && matchesSpecies
  })

  const handleAddPet = async (data: { nombre: string; especie: string; raza: string; id_dueno: string; fecha_nacimiento: string; sexo: string; peso: string; observaciones: string; tipo: string }) => {
    if (!user) return
    if (!data.nombre || !data.especie || !data.raza || !data.id_dueno) {
      toast({ title: 'Campos requeridos', description: 'Completá nombre, especie, raza y dueño.', variant: 'destructive' })
      return
    }
    try {
      const pesoValue = data.peso && data.peso.trim() ? parseFloat(data.peso) : undefined
      const mascotaDataRaw = {
        nombre: data.nombre,
        especie: data.especie,
        raza: data.raza,
        id_dueno: data.id_dueno,
        fecha_nacimiento: data.fecha_nacimiento || new Date().toISOString().split('T')[0],
        sexo: (data.sexo as 'M' | 'F') || undefined,
        peso: pesoValue,
        observaciones: data.observaciones || undefined,
        tipo: (data.tipo as 'socio' | 'particular') || 'particular',
        id_clinica: user.id_clinica,
      }
      const mascotaData = Object.fromEntries(
        Object.entries(mascotaDataRaw).filter(([, v]) => v !== undefined)
      ) as typeof mascotaDataRaw
      const result = await createMascota(mascotaData)
      if (!result.success || result.error) {
        toast({ title: 'Error al guardar', description: result.error || 'Error desconocido', variant: 'destructive' })
        return
      }
      toast({ title: 'Mascota agregada', description: `${data.nombre} fue registrado correctamente.` })
      setIsAddDialogOpen(false)
      await refetch()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
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
    setEditPetInitial({
      nombre: pet.nombre,
      especie: pet.especie,
      raza: pet.raza,
      id_dueno: pet.id_dueno,
      fecha_nacimiento: pet.fecha_nacimiento || "",
      sexo: pet.sexo || "",
      peso: pet.peso != null ? String(pet.peso) : "",
      observaciones: pet.observaciones || "",
      tipo: pet.tipo || "particular",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdatePet = async (data: { nombre: string; especie: string; raza: string; id_dueno: string; fecha_nacimiento: string; sexo: string; peso: string; observaciones: string; tipo: string }) => {
    if (!user || !editingId) return
    try {
      const pesoValue = data.peso && data.peso.trim() ? parseFloat(data.peso) : undefined
      const result = await updateMascota(editingId, user.id_clinica, {
        nombre: data.nombre,
        especie: data.especie,
        raza: data.raza,
        id_dueno: data.id_dueno,
        fecha_nacimiento: data.fecha_nacimiento,
        sexo: (data.sexo as 'M' | 'F') || undefined,
        peso: pesoValue ?? undefined,
        observaciones: data.observaciones || undefined,
        tipo: (data.tipo as 'socio' | 'particular') || undefined,
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
        <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("addPet")}
        </Button>
      </div>

      <AddPetDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAddPet} duenos={duenos} especies={especies} razas={razas} t={t} />

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
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
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
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={pet.tipo === 'socio' ? 'default' : 'outline'} className="text-xs">
                          {pet.tipo === 'socio' ? 'Socio' : 'Particular'}
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

      <EditPetDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} initial={editPetInitial} onSave={handleUpdatePet} duenos={duenos} especies={especies} razas={razas} t={t} />

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
        <SheetContent className="w-full sm:max-w-[680px] p-0" side="right" onInteractOutside={e => { if (editTarget || isEditDialogOpen) e.preventDefault() }}>
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
                        <div className="flex items-center gap-2">
                          <SheetTitle className="text-2xl font-bold">{historiaPet.nombre}</SheetTitle>
                          <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => handleEditPet(historiaPet)} title="Editar mascota">
                            <Pencil className="size-3.5" />
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
                      {historiaPet.observaciones && (
                        <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Observaciones: </span>{historiaPet.observaciones}
                        </div>
                      )}
                      {owner && (
                        <>
                          <div className="mt-3 flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                            <User className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">{owner.nombre}</span>
                            {owner.telefono && <span className="text-muted-foreground">· {owner.telefono}</span>}
                            {/* Botón Sana al lado del dueño */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 ml-2 flex items-center"
                              onClick={analizarConSana}
                              disabled={sanaLoading}
                              title="Analizar con Sana"
                            >
                              <SanaLogo className="size-5" />
                              Analizar con Sana
                            </Button>
                          </div>
                          {/* Informe Sana debajo del bloque dueño+botón */}
                          {(sanaLoading || sanaReport) && (
                            <div className="w-full">
                              {sanaLoading && (
                                <div className="rounded-lg border p-4 my-2 bg-muted animate-pulse text-muted-foreground">
                                  Generando informe clínico con Sana...
                                </div>
                              )}
                              {sanaReport && (
                                <div className="rounded-lg border p-4 my-2 bg-background">
                                  <div className="font-semibold mb-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2"><SanaLogo className="size-5" /> Informe generado por Sana</div>
                                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={exportarPDF}>
                                      <Download className="size-3.5" /> Exportar PDF
                                    </Button>
                                  </div>
                                  <div className="prose prose-sm max-w-none">
                                    <SanaMarkdown content={sanaReport} />
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </>
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
                    <div className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <button onClick={() => toggleSection('consultas')} className="flex-1 flex items-center gap-2 font-semibold text-left">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        Consultas
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hConsultas.length}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openQuickAdd('consulta') }} className="flex items-center gap-1 text-xs text-primary hover:underline mr-2 shrink-0">
                        <Plus className="h-3 w-3" />Ingresar nuevo
                      </button>
                      <button onClick={() => toggleSection('consultas')} className="shrink-0">
                        {expandedSection === 'consultas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    {expandedSection === 'consultas' && (
                      <div className="border-t divide-y">
                        {hConsultas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin consultas registradas.</p>
                        ) : hConsultas.map(c => (
                          <div key={c.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{c.motivo || '(sin motivo)'}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{fDateTime(c.fecha)}</span>
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openEdit('consulta', c)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
                            {c.diagnostico && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Diagnóstico:</span> {c.diagnostico}</p>}
                            {c.tratamiento && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tratamiento:</span> {c.tratamiento}</p>}
                            {(c.observaciones || (c as any).observacion) && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Observaciones:</span> {c.observaciones || (c as any).observacion}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cirugías */}
                  <div className="rounded-lg border">
                    <div className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <button onClick={() => toggleSection('cirugias')} className="flex-1 flex items-center gap-2 font-semibold text-left">
                        <Scissors className="h-4 w-4 text-purple-500" />
                        Cirugías
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hCirugias.length}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openQuickAdd('cirugia') }} className="flex items-center gap-1 text-xs text-primary hover:underline mr-2 shrink-0">
                        <Plus className="h-3 w-3" />Ingresar nuevo
                      </button>
                      <button onClick={() => toggleSection('cirugias')} className="shrink-0">
                        {expandedSection === 'cirugias' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
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
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openEdit('cirugia', c)} title="Editar"><Pencil className="size-3" /></Button>
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
                    <div className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <button onClick={() => toggleSection('vacunas')} className="flex-1 flex items-center gap-2 font-semibold text-left">
                        <Syringe className="h-4 w-4 text-green-500" />
                        Vacunas
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hVacunas.length}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openQuickAdd('vacuna') }} className="flex items-center gap-1 text-xs text-primary hover:underline mr-2 shrink-0">
                        <Plus className="h-3 w-3" />Ingresar nuevo
                      </button>
                      <button onClick={() => toggleSection('vacunas')} className="shrink-0">
                        {expandedSection === 'vacunas' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    {expandedSection === 'vacunas' && (
                      <div className="border-t divide-y">
                        {hVacunas.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin vacunas registradas.</p>
                        ) : hVacunas.map(v => (
                          <div key={v.id} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">Aplicación: {fDate(v.fecha)}</span>
                              <div className="flex items-center gap-2">
                                {v.proxima_dosis && <span className="text-xs text-muted-foreground">Próxima dosis: <span className="font-medium text-foreground">{fDate(v.proxima_dosis)}</span></span>}
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openEdit('vacuna', v)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Análisis */}
                  <div className="rounded-lg border">
                    <div className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <button onClick={() => toggleSection('analisis')} className="flex-1 flex items-center gap-2 font-semibold text-left">
                        <FlaskConical className="h-4 w-4 text-orange-500" />
                        Análisis
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hAnalisis.length}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openQuickAdd('analisis') }} className="flex items-center gap-1 text-xs text-primary hover:underline mr-2 shrink-0">
                        <Plus className="h-3 w-3" />Ingresar nuevo
                      </button>
                      <button onClick={() => toggleSection('analisis')} className="shrink-0">
                        {expandedSection === 'analisis' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    {expandedSection === 'analisis' && (
                      <div className="border-t divide-y">
                        {hAnalisis.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin análisis registrados.</p>
                        ) : hAnalisis.map(a => (
                          <div key={a.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{a.tipo}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{fDate(a.fecha)}</span>
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openEdit('analisis', a)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
                            {a.descripcion && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Muestra:</span> {a.descripcion}</p>}
                            {a.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {a.resultado}</p>}
                            {a.observaciones && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Observaciones:</span> {a.observaciones}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Imágenes */}
                  <div className="rounded-lg border">
                    <div className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
                      <button onClick={() => toggleSection('imagenes')} className="flex-1 flex items-center gap-2 font-semibold text-left">
                        <ScanLine className="h-4 w-4 text-cyan-500" />
                        Imagenología
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{hImagenes.length}</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openQuickAdd('imagen') }} className="flex items-center gap-1 text-xs text-primary hover:underline mr-2 shrink-0">
                        <Plus className="h-3 w-3" />Ingresar nuevo
                      </button>
                      <button onClick={() => toggleSection('imagenes')} className="shrink-0">
                        {expandedSection === 'imagenes' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    {expandedSection === 'imagenes' && (
                      <div className="border-t divide-y">
                        {hImagenes.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">Sin estudios de imágenes registrados.</p>
                        ) : hImagenes.map(im => (
                          <div key={im.id} className="px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium">{im.tipo}{im.region ? ` — ${im.region}` : ''}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{fDate(im.fecha)}</span>
                                <Button size="icon" variant="ghost" className="size-6" onClick={() => openEdit('imagen', im)} title="Editar"><Pencil className="size-3" /></Button>
                              </div>
                            </div>
                            {im.hallazgos && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Hallazgos:</span> {im.hallazgos}</p>}
                            {im.observaciones && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Observaciones:</span> {im.observaciones}</p>}
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

      {/* ─── Historia Edit Dialogs ─── */}
      <EditHistoriaItemDialogPets
        editTarget={editTarget as PetsEditTarget | null}
        editItem={editItem}
        tiposCirugia={tiposCirugia ?? []}
        tiposAnalisis={tiposAnalisis ?? []}
        onSave={handleSaveHistoriaEdit}
        onClose={closeEdit}
        saving={editSaving}
      />

      {/* Quick-add Dialog */}      <Dialog open={!!quickSection} onOpenChange={(open) => { if (!open) setQuickSection(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {quickSection === 'consulta' && 'Nueva consulta'}
              {quickSection === 'cirugia' && 'Nueva cirugía'}
              {quickSection === 'vacuna' && 'Nueva vacuna'}
              {quickSection === 'analisis' && 'Nuevo análisis'}
              {quickSection === 'imagen' && 'Nuevo estudio de imagenología'}
            </DialogTitle>
            {historiaPet && (
              <DialogDescription>Paciente: <strong>{historiaPet.nombre}</strong></DialogDescription>
            )}
          </DialogHeader>

          {/* ── CONSULTA (form compartido) ── */}
          {quickSection === 'consulta' && (
            <ConsultaForm
              key={`consulta-${historiaPet?.id}`}
              fixedMascotaId={historiaPet?.id ?? ''}
              usuarios={usuarios}
              editingId={null}
              loading={quickSaving}
              onSubmit={handleQuickConsultaSubmit}
              onCancel={() => setQuickSection(null)}
            />
          )}

          {/* ── CIRUGÍA (inline) ── */}
          {quickSection === 'cirugia' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Fecha <span className="text-destructive">*</span></Label>
                  <Input type="date" value={qCirugia.fecha} onChange={e => setQCirugia(p => ({ ...p, fecha: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo <span className="text-destructive">*</span></Label>
                  {tiposCirugia.length > 0 ? (
                    <Select value={qCirugia.tipo} onValueChange={val => setQCirugia(p => ({ ...p, tipo: val }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>{tiposCirugia.map((t: any) => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="Tipo de cirugía" value={qCirugia.tipo} onChange={e => setQCirugia(p => ({ ...p, tipo: e.target.value }))} />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descripción</Label>
                <Textarea rows={2} placeholder="Descripción del procedimiento" value={qCirugia.descripcion} onChange={e => setQCirugia(p => ({ ...p, descripcion: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Resultado</Label>
                <Textarea rows={2} placeholder="Resultado de la cirugía" value={qCirugia.resultado} onChange={e => setQCirugia(p => ({ ...p, resultado: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Veterinario</Label>
                <Select value={qCirugia.id_usuario} onValueChange={val => setQCirugia(p => ({ ...p, id_usuario: val }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar veterinario" /></SelectTrigger>
                  <SelectContent>{usuarios.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuickSection(null)} disabled={quickSaving}>Cancelar</Button>
                <Button onClick={handleQuickSave} disabled={quickSaving}>{quickSaving ? 'Guardando…' : 'Guardar'}</Button>
              </DialogFooter>
            </div>
          )}

          {/* ── VACUNA (inline) ── */}
          {quickSection === 'vacuna' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Fecha de aplicación <span className="text-destructive">*</span></Label>
                  <Input type="date" value={qVacuna.fecha} onChange={e => setQVacuna(p => ({ ...p, fecha: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Próxima dosis</Label>
                  <Input type="date" value={qVacuna.proxima_dosis} onChange={e => setQVacuna(p => ({ ...p, proxima_dosis: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Tipo de vacuna</Label>
                {tiposVacuna.length > 0 ? (
                  <Select value={qVacuna.id_tipo_vacuna} onValueChange={val => setQVacuna(p => ({ ...p, id_tipo_vacuna: val }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent>{tiposVacuna.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Tipo de vacuna (opcional)" value={qVacuna.id_tipo_vacuna} onChange={e => setQVacuna(p => ({ ...p, id_tipo_vacuna: e.target.value }))} />
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuickSection(null)} disabled={quickSaving}>Cancelar</Button>
                <Button onClick={handleQuickSave} disabled={quickSaving}>{quickSaving ? 'Guardando…' : 'Guardar'}</Button>
              </DialogFooter>
            </div>
          )}

          {/* ── ANÁLISIS (form compartido) ── */}
          {quickSection === 'analisis' && (
            <AnalisisForm
              key={`analisis-${historiaPet?.id}`}
              fixedMascotaId={historiaPet?.id ?? ''}
              usuarios={usuarios}
              editingId={null}
              tiposAnalisis={tiposAnalisis}
              loading={quickSaving}
              onSubmit={handleQuickAnalisisSubmit}
              onCancel={() => setQuickSection(null)}
            />
          )}

          {/* ── IMAGEN (form compartido) ── */}
          {quickSection === 'imagen' && (
            <ImagenForm
              key={`imagen-${historiaPet?.id}`}
              fixedMascotaId={historiaPet?.id ?? ''}
              usuarios={usuarios}
              editingId={null}
              loading={quickSaving}
              onSubmit={handleQuickImagenSubmit}
              onCancel={() => setQuickSection(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
