'use client'

import { useState, useEffect } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Shield, Stethoscope, User } from "lucide-react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUserList } from "@/hooks/use-usuarios"
import { useAuth } from "@/lib/auth-context"
import { updateUsuario } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { Usuario } from "@/lib/types"

type Rol = 'admin' | 'veterinario' | 'asistente'

// ─── Subcomponent: Add User Dialog ───────────────────────────────────────────
function AddUserDialog({ open, onOpenChange, onAdd }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (form: { nombre: string; rol: Rol; email: string; password: string }) => Promise<void>
}) {
  const [form, setForm] = useState({ nombre: '', rol: '' as Rol | '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) { setForm({ nombre: '', rol: '', email: '', password: '' }); setLoading(false) }
  }, [open])

  const handleSubmit = async () => {
    if (!form.nombre || !form.rol || !form.email || !form.password) return
    setLoading(true)
    await onAdd({ nombre: form.nombre, rol: form.rol as Rol, email: form.email, password: form.password })
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar usuario</DialogTitle>
          <DialogDescription>El usuario recibirá acceso con el email y contraseña indicados.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="add-nombre">Nombre completo</Label>
            <Input
              id="add-nombre"
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              placeholder="usuario@clinica.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-password">Contraseña</Label>
            <Input
              id="add-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-rol">Rol</Label>
            <Select value={form.rol} onValueChange={v => setForm(f => ({ ...f, rol: v as Rol }))}>
              <SelectTrigger id="add-rol"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="veterinario">Veterinario</SelectItem>
                <SelectItem value="asistente">Asistente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.nombre || !form.rol || !form.email || !form.password || loading}
          >
            {loading ? 'Creando...' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponent: Edit User Dialog ──────────────────────────────────────────
function EditUserDialog({ open, onOpenChange, initial, onSave }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: { nombre: string; rol: Rol }
  onSave: (form: { nombre: string; rol: Rol }) => Promise<void>
}) {
  const [form, setForm] = useState(initial)

  useEffect(() => {
    if (open) setForm(initial)
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Modificá los datos del usuario.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-nombre">Nombre completo</Label>
            <Input
              id="edit-nombre"
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-rol">Rol</Label>
            <Select value={form.rol} onValueChange={v => setForm(f => ({ ...f, rol: v as Rol }))}>
              <SelectTrigger id="edit-rol"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="veterinario">Veterinario</SelectItem>
                <SelectItem value="asistente">Asistente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.nombre || !form.rol}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoleBadge(rol: string) {
  switch (rol) {
    case 'admin':
      return <Badge className="bg-primary/20 text-primary gap-1"><Shield className="size-3" />Admin</Badge>
    case 'veterinario':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1"><Stethoscope className="size-3" />Veterinario</Badge>
    case 'asistente':
      return <Badge className="bg-accent/20 text-accent-foreground gap-1"><User className="size-3" />Asistente</Badge>
    default:
      return <Badge variant="secondary">{rol}</Badge>
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user } = useAuth()
  const { data: usuarios, loading, refetch } = useUserList()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editInitial, setEditInitial] = useState<{ nombre: string; rol: Rol }>({ nombre: '', rol: 'asistente' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredUsers = usuarios.filter(
    u =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = async (form: { nombre: string; rol: Rol; email: string; password: string }) => {
    if (!user) return
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          rol: form.rol,
          id_clinica: user.id_clinica,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Error al crear usuario', description: json.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Usuario creado', description: `${form.nombre} fue agregado correctamente.` })
      setIsAddDialogOpen(false)
      refetch()
    } catch (err) {
      toast({ title: 'Error inesperado', description: String(err), variant: 'destructive' })
    }
  }

  const handleEditOpen = (u: Usuario) => {
    setEditingId(u.id)
    setEditInitial({ nombre: u.nombre, rol: u.rol as Rol })
    setIsEditDialogOpen(true)
  }

  const handleSave = async (form: { nombre: string; rol: Rol }) => {
    if (!user || !editingId) return
    try {
      await updateUsuario(editingId, user.id_clinica, { nombre: form.nombre, rol: form.rol })
      setEditingId(null)
      setIsEditDialogOpen(false)
      refetch()
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  const handleDelete = async () => {
    if (!user || !deletingId) return
    try {
      const res = await fetch(`/api/users?id=${deletingId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Error al eliminar usuario', description: json.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Usuario eliminado' })
      setDeletingId(null)
      refetch()
    } catch (err) {
      toast({ title: 'Error inesperado', description: String(err), variant: 'destructive' })
    }
  }

  const adminCount = usuarios.filter(u => u.rol === 'admin').length
  const vetCount = usuarios.filter(u => u.rol === 'veterinario').length
  const asistCount = usuarios.filter(u => u.rol === 'asistente').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestioná el equipo y permisos de la clínica</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Agregar usuario
        </Button>
        <AddUserDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAdd} />
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initial={editInitial}
          onSave={handleSave}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{adminCount}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Stethoscope className="size-5 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vetCount}</p>
              <p className="text-sm text-muted-foreground">Veterinarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
              <User className="size-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{asistCount}</p>
              <p className="text-sm text-muted-foreground">Asistentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Equipo</CardTitle>
              <CardDescription>{usuarios.length} usuarios registrados</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden md:table-cell">Desde</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {u.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-foreground">{u.nombre}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.rol)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditOpen(u)}>
                              <Pencil className="mr-2 size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setTimeout(() => setDeletingId(u.id), 0)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">No se encontraron usuarios.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={open => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
