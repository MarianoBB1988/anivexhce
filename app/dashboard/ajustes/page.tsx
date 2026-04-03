'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Syringe, Scissors, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge'
import { useTiposVacuna } from '@/hooks/use-tipos-vacuna'
import { useTiposCirugia } from '@/hooks/use-tipos-cirugia'
import { useTiposAnalisis } from '@/hooks/use-tipos-analisis'
import {
  createTipoVacuna,
  updateTipoVacuna,
  deleteTipoVacuna,
  createTipoCirugia,
  updateTipoCirugia,
  deleteTipoCirugia,
  createTipoAnalisis,
  updateTipoAnalisis,
  deleteTipoAnalisis,
} from '@/lib/services'

// ─── Tipos de Vacuna ─────────────────────────────────────────────────────────

function TiposVacunaTab() {
  const { data: tipos, loading, refetch } = useTiposVacuna()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditId(null); setNombre(''); setDialogOpen(true) }
  const openEdit = (t: { id: string; nombre: string }) => { setEditId(t.id); setNombre(t.nombre); setDialogOpen(true) }

  const handleSave = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    if (editId) {
      await updateTipoVacuna(editId, nombre.trim())
    } else {
      await createTipoVacuna(nombre.trim())
    }
    setSaving(false)
    setDialogOpen(false)
    refetch()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await deleteTipoVacuna(deletingId)
    setDeletingId(null)
    refetch()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-green-500" />
            Tipos de Vacuna
          </CardTitle>
          <CardDescription>Vacunas disponibles para aplicar a las mascotas</CardDescription>
        </div>
        <Button size="sm" className="gap-2 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
          </div>
        ) : tipos.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No hay tipos de vacuna registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar tipo de vacuna' : 'Nuevo tipo de vacuna'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nombre</Label>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Rabia, Moquillo, Parvovirus..."
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !nombre.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de vacuna?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tipo de vacuna se eliminará del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ─── Tipos de Cirugía ─────────────────────────────────────────────────────────

function TiposCirugiaTab() {
  const { data: tipos, loading, refetch } = useTiposCirugia()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditId(null); setNombre(''); setDescripcion(''); setDialogOpen(true) }
  const openEdit = (t: { id: string; nombre: string; descripcion?: string | null }) => {
    setEditId(t.id); setNombre(t.nombre); setDescripcion(t.descripcion || ''); setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    if (editId) {
      await updateTipoCirugia(editId, nombre.trim(), descripcion.trim() || undefined)
    } else {
      await createTipoCirugia(nombre.trim(), descripcion.trim() || undefined)
    }
    setSaving(false)
    setDialogOpen(false)
    refetch()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await deleteTipoCirugia(deletingId)
    setDeletingId(null)
    refetch()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-purple-500" />
            Tipos de Cirugía
          </CardTitle>
          <CardDescription>Procedimientos quirúrgicos disponibles en el sistema</CardDescription>
        </div>
        <Button size="sm" className="gap-2 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
          </div>
        ) : tipos.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No hay tipos de cirugía registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.descripcion || <span className="italic opacity-50">Sin descripción</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar tipo de cirugía' : 'Nuevo tipo de cirugía'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Castración, Ovariohisterectomía..."
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                rows={2}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Breve descripción del procedimiento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !nombre.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de cirugía?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tipo de cirugía se eliminará del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Tipos de Análisis ───────────────────────────────────────────────────────

function TiposAnalisisTab() {
  const { data: tipos, loading, refetch } = useTiposAnalisis()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditId(null); setNombre(''); setDescripcion(''); setDialogOpen(true) }
  const openEdit = (t: { id: string; nombre: string; descripcion?: string | null }) => {
    setEditId(t.id); setNombre(t.nombre); setDescripcion(t.descripcion || ''); setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    if (editId) {
      await updateTipoAnalisis(editId, nombre.trim(), descripcion.trim() || undefined)
    } else {
      await createTipoAnalisis(nombre.trim(), descripcion.trim() || undefined)
    }
    setSaving(false)
    setDialogOpen(false)
    refetch()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await deleteTipoAnalisis(deletingId)
    setDeletingId(null)
    refetch()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-blue-500" />
            Tipos de Análisis
          </CardTitle>
          <CardDescription>Análisis de laboratorio disponibles en el sistema</CardDescription>
        </div>
        <Button size="sm" className="gap-2 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
          </div>
        ) : tipos.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No hay tipos de análisis registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.descripcion || <span className="italic opacity-50">Sin descripción</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar tipo de análisis' : 'Nuevo tipo de análisis'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Hemograma, Bioquímica..."
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                rows={2}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Breve descripción del análisis..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !nombre.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de análisis?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tipo de análisis se eliminará del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default function AjustesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground text-sm">
          Administrá los catálogos y configuraciones del sistema.
        </p>
      </div>

      <Tabs defaultValue="vacunas">
        <TabsList className="mb-4">
          <TabsTrigger value="vacunas" className="gap-2">
            <Syringe className="h-4 w-4" />
            Tipos de Vacuna
          </TabsTrigger>
          <TabsTrigger value="cirugias" className="gap-2">
            <Scissors className="h-4 w-4" />
            Tipos de Cirugía
          </TabsTrigger>
          <TabsTrigger value="analisis" className="gap-2">
            <Check className="h-4 w-4" />
            Tipos de Análisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vacunas">
          <TiposVacunaTab />
        </TabsContent>
        <TabsContent value="cirugias">
          <TiposCirugiaTab />
        </TabsContent>
        <TabsContent value="analisis">
          <TiposAnalisisTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
