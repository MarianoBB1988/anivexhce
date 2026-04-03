'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getMascotasByDueno } from '@/lib/services/mascotas'
import { getConsultasByMascota } from '@/lib/services/consultas'
import { getVacunasByMascota } from '@/lib/services/vacunas'
import { getCirugiasByMascota } from '@/lib/services/cirugias'
import { getTurnosByMascota } from '@/lib/services/turnos'
import { Mascota, Consulta, Vacuna, Cirugia, Turno } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dog, Cat, Bird, Rabbit, PawPrint, Syringe, Stethoscope, Scissors, CalendarDays } from 'lucide-react'

const speciesIcon = (especie: string) => {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    perro: Dog, dog: Dog, gato: Cat, cat: Cat,
    pajaro: Bird, bird: Bird, conejo: Rabbit, rabbit: Rabbit,
  }
  return map[especie?.toLowerCase()] || PawPrint
}

const estadoBadge = (estado: Turno['estado']) => {
  if (estado === 'atendido') return <Badge className="bg-green-500/15 text-green-700 border-green-300">Atendido</Badge>
  if (estado === 'ausente') return <Badge className="bg-red-500/15 text-red-700 border-red-300">Ausente</Badge>
  return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">Pendiente</Badge>
}

function PetHistory({ mascota, clinicaId }: { mascota: Mascota; clinicaId: string }) {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [vacunas, setVacunas] = useState<Vacuna[]>([])
  const [cirugias, setCirugias] = useState<Cirugia[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return
    Promise.all([
      getConsultasByMascota(mascota.id, clinicaId),
      getVacunasByMascota(mascota.id, clinicaId),
      getCirugiasByMascota(mascota.id, clinicaId),
      getTurnosByMascota(mascota.id, clinicaId),
    ]).then(([c, v, ci, t]) => {
      setConsultas(c.data || [])
      setVacunas(v.data || [])
      setCirugias(ci.data || [])
      setTurnos(t.data || [])
      setLoaded(true)
    })
  }, [mascota.id, clinicaId, loaded])

  const age = mascota.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(mascota.fecha_nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null

  const Icon = speciesIcon(mascota.especie)

  return (
    <div className="space-y-4">
      {/* Info de la mascota */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-semibold">{mascota.nombre}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}{age !== null ? ` · ${age} año${age !== 1 ? 's' : ''}` : ''}
            {mascota.sexo ? ` · ${mascota.sexo === 'M' ? 'Macho' : 'Hembra'}` : ''}
          </p>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* Turnos */}
        <AccordionItem value="turnos" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2 font-medium">
              <CalendarDays className="size-4 text-primary" />
              Turnos
              <Badge variant="secondary" className="ml-1">{turnos.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {turnos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sin turnos registrados.</p>
            ) : (
              <div className="space-y-2 pb-2">
                {turnos.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/40">
                    <span>{new Date(t.fecha_hora).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {estadoBadge(t.estado)}
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Consultas */}
        <AccordionItem value="consultas" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2 font-medium">
              <Stethoscope className="size-4 text-blue-500" />
              Historia Clínica
              <Badge variant="secondary" className="ml-1">{consultas.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {consultas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sin consultas registradas.</p>
            ) : (
              <div className="space-y-3 pb-2">
                {consultas.map(c => (
                  <div key={c.id} className="text-sm p-3 rounded-md bg-muted/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{new Date(c.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                    <p><span className="text-muted-foreground">Motivo: </span>{c.motivo}</p>
                    {c.diagnostico && <p><span className="text-muted-foreground">Diagnóstico: </span>{c.diagnostico}</p>}
                    {c.tratamiento && <p><span className="text-muted-foreground">Tratamiento: </span>{c.tratamiento}</p>}
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Vacunas */}
        <AccordionItem value="vacunas" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2 font-medium">
              <Syringe className="size-4 text-green-500" />
              Vacunas
              <Badge variant="secondary" className="ml-1">{vacunas.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {vacunas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sin vacunas registradas.</p>
            ) : (
              <div className="space-y-2 pb-2">
                {vacunas.map(v => (
                  <div key={v.id} className="text-sm p-2 rounded-md bg-muted/40 flex items-center justify-between">
                    <span>{new Date(v.fecha).toLocaleDateString('es-AR')}</span>
                    {v.proxima_dosis && (
                      <span className="text-muted-foreground text-xs">
                        Próxima: {new Date(v.proxima_dosis).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Cirugías */}
        <AccordionItem value="cirugias" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2 font-medium">
              <Scissors className="size-4 text-orange-500" />
              Cirugías
              <Badge variant="secondary" className="ml-1">{cirugias.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {cirugias.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sin cirugías registradas.</p>
            ) : (
              <div className="space-y-3 pb-2">
                {cirugias.map(c => (
                  <div key={c.id} className="text-sm p-3 rounded-md bg-muted/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{new Date(c.fecha).toLocaleDateString('es-AR')}</span>
                      <Badge variant="outline">{c.resultado}</Badge>
                    </div>
                    <p><span className="text-muted-foreground">Tipo: </span>{c.tipo}</p>
                    {c.descripcion && <p className="text-muted-foreground text-xs">{c.descripcion}</p>}
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default function PortalPage() {
  const { user } = useAuth()
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getMascotasByDueno(user.id, user.id_clinica).then(res => {
      setMascotas(res.data || [])
      setLoading(false)
    })
  }, [user])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis mascotas</h1>
        <p className="text-muted-foreground">Hola, {user.nombre} — acá podés ver la historia clínica y los turnos de tus mascotas.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">Cargando...</div>
      ) : mascotas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PawPrint className="size-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground">No tenés mascotas registradas todavía.</p>
          </CardContent>
        </Card>
      ) : mascotas.length === 1 ? (
        <Card>
          <CardContent className="pt-6">
            <PetHistory mascota={mascotas[0]} clinicaId={user.id_clinica} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={mascotas[0].id}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {mascotas.map(m => {
              const Icon = speciesIcon(m.especie)
              return (
                <TabsTrigger key={m.id} value={m.id} className="gap-1.5">
                  <Icon className="size-3.5" />
                  {m.nombre}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {mascotas.map(m => (
            <TabsContent key={m.id} value={m.id}>
              <Card>
                <CardContent className="pt-6">
                  <PetHistory mascota={m} clinicaId={user.id_clinica} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
