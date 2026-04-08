'use client'

import { useState } from 'react'
import { ArrowLeft, Mic } from 'lucide-react'
import Link from 'next/link'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createConsulta } from '@/lib/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConsultaFormVoz, ConsultaFormVozData } from '@/components/forms/consulta-form-voz'

export default function ConsultaVozPage() {
  const { data: mascotas } = useMascotas()
  const { data: duenos } = useDuenos()
  const { data: usuarios } = useUserList()
  const { user } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (formData: ConsultaFormVozData) => {
    if (!user) return
    setSaving(true)
    try {
      const { fecha_date, fecha_time, _duenoId, ...rest } = formData as any
      const payload = { ...rest, fecha: fecha_date + (fecha_time ? 'T' + fecha_time : '') }
      const res = await createConsulta({ ...payload, id_clinica: user.id_clinica })
      if (!res.success) throw new Error(res.error || 'Error al crear la consulta')
      toast({ title: 'Consulta creada', description: 'La consulta se guardó correctamente con asistente de voz.' })
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/consultations">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Consulta por Voz</h1>
              <Badge variant="secondary" className="gap-1">
                <Mic className="size-3" />
                Beta
              </Badge>
            </div>
            <p className="text-muted-foreground">Completá la consulta usando el asistente de voz Sana</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="size-5 text-primary" />
            Nueva Consulta con Asistente de Voz
          </CardTitle>
          <CardDescription>
            Presioná &ldquo;Iniciar Asistente&rdquo; y Sana te irá preguntando los datos. 
            Respondé con tu voz y los campos se completarán automáticamente. 
            Siempre podés editar los campos manualmente después.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsultaFormVoz
            duenos={duenos}
            mascotas={mascotas}
            usuarios={usuarios}
            loading={saving}
            onSubmit={handleSubmit}
            onCancel={() => window.history.back()}
          />
        </CardContent>
      </Card>
    </div>
  )
}
