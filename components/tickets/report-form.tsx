'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bug, Send, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTicket } from '@/hooks/use-tickets'
import { TicketPriority } from '@/lib/types'
import { toast } from 'sonner'

function getBrowserInfo() {
  if (typeof window === 'undefined') return ''
  return [
    `Navegador: ${navigator.userAgent}`,
    `Idioma: ${navigator.language}`,
    `Plataforma: ${navigator.platform}`,
  ].join(' | ')
}

function getAppVersion() {
  if (typeof window === 'undefined') return ''
  // Intentar leer de un meta tag o variable de entorno
  const meta = document.querySelector('meta[name="app-version"]')
  return meta?.getAttribute('content') || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
}

export function ReportForm() {
  const router = useRouter()
  const { create, loading, error } = useCreateTicket()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  // Recolectar info del navegador al montar
  const [browserInfo] = useState(getBrowserInfo)
  const [appVersion] = useState(getAppVersion)
  const [pageUrl] = useState(typeof window !== 'undefined' ? window.location.href : '')

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {}
    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio'
    }
    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria'
    } else if (description.trim().length < 10) {
      newErrors.description = 'Describe el error con al menos 10 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const result = await create({
      title: title.trim(),
      description: description.trim(),
      priority,
      browser_info: browserInfo,
      app_version: appVersion,
      page_url: pageUrl,
    })

    if (result) {
      toast.success('Ticket creado con éxito', {
        description: 'Gracias por reportar. Revisaremos tu solicitud pronto.',
      })
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-border/50">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Reportar error</CardTitle>
              <CardDescription>
                Ayúdanos a mejorar la aplicación reportando cualquier incidencia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ej: No puedo guardar una consulta"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                }}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe qué pasó, qué esperabas que pasara, y cómo reproducirlo..."
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
                }}
                className={errors.description ? 'border-destructive resize-none' : 'resize-none'}
              />
              {errors.description && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {description.length} caracteres
              </p>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TicketPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baja</SelectItem>
                  <SelectItem value="medium">🟡 Media</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error del servidor */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar reporte
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
