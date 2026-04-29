'use client'

import { useState } from 'react'
import { ArrowLeft, Mic } from 'lucide-react'
import Link from 'next/link'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useUserList } from '@/hooks/use-usuarios'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createConsulta, createTurno, checkTurnoDisponibilidad } from '@/lib/services'
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
      const fechaStr = fecha_date + (fecha_time ? 'T' + fecha_time : '')
      console.log('[Consulta] Payload:', { ...rest, fecha: fechaStr, id_clinica: user.id_clinica })
      const payload = { ...rest, fecha: fechaStr }
      const res = await createConsulta({ ...payload, id_clinica: user.id_clinica })
      if (!res.success) throw new Error(res.error || 'Error al crear la consulta')
      toast({ title: 'Consulta creada', description: 'La consulta se guardo correctamente con asistente de voz.' })
    } catch (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTurno = async (fecha: string, hora: string): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: 'Usuario no autenticado' }
    try {
      const fecha_hora = `${fecha}T${hora}:00`
      const { disponible, conflictos } = await checkTurnoDisponibilidad(user.id_clinica, fecha_hora)
      if (!disponible) {
        console.log('[Turno] Slot occupied, conflicts:', conflictos.length)
        return { ok: false, error: 'El horario esta ocupado' }
      }
      const res = await createTurno({
        id_mascota: '',
        fecha_hora,
        notas: 'Turno de control generado por asistente de voz',
        id_usuario: user.id,
        estado: 'sin_atender',
        ubicacion: 'clinica',
        id_clinica: user.id_clinica,
      })
      if (!res.success) {
        console.error('[Turno error]', res.error)
        return { ok: false, error: res.error || 'Error al crear turno' }
      }
      toast({ title: 'Turno agendado', description: 'Se agendo el turno de control automaticamente.' })
      return { ok: true }
    } catch (err) {
      console.error('[Turno error]', err)
      return { ok: false, error: 'Error de conexion al agendar turno' }
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
                Beta 1.2
              </Badge>
            </div>
            <p className="text-muted-foreground">Complete la consulta usando el asistente de voz Sana</p>
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
            Presione &ldquo;Iniciar Asistente&rdquo; y Sana le preguntara todo por voz:
            nombre del dueno, mascota, y toda la informacion clinica.
            La IA separa y enriquece motivo, diagnostico y tratamiento automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsultaFormVoz
            duenos={duenos}
            mascotas={mascotas}
            usuarios={usuarios}
            currentUserId={user?.id}
            loading={saving}
            onSubmit={handleSubmit}
            onCancel={() => window.history.back()}
            onCreateTurno={handleCreateTurno}
          />
        </CardContent>
      </Card>
    </div>
  )
}
