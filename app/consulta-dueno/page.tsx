'use client'

import { useState, useCallback } from 'react'
import { getDuenoByEmail } from '@/lib/services/duenos'
import { getMascotasByDueno } from '@/lib/services/mascotas'
import { getConsultasByMascota } from '@/lib/services/consultas'
import { getVacunasByMascota } from '@/lib/services/vacunas'
import { getCirugiasByMascota } from '@/lib/services/cirugias'
import { getTurnosByMascota } from '@/lib/services/turnos'
import { getAnalisisByMascota } from '@/lib/services/analisis'
import { getImagenesByMascota } from '@/lib/services/imagenes'
import type { Dueno, Mascota, Consulta, Vacuna, Cirugia, Turno, Analisis, ImagenDiagnostica } from '@/lib/types'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, PawPrint, MapPin, Search, Dog, Cat, Bird, Rabbit, HelpCircle, CalendarDays, Stethoscope, Scissors, Syringe, FlaskConical, ScanLine, ChevronDown, ChevronRight, User, Calendar, Clock } from 'lucide-react'


// ─── Helpers ───────────────────────────────────────────────────────────────────

const speciesIcon = (especie: string) => {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    perro: Dog, dog: Dog, gato: Cat, cat: Cat,
    pajaro: Bird, bird: Bird, conejo: Rabbit, rabbit: Rabbit,
  }
  return map[especie?.toLowerCase()] || HelpCircle
}

const estadoBadge = (estado: Turno['estado']) => {
  if (estado === 'atendido') return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">Atendido</Badge>
  if (estado === 'ausente') return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-0">Ausente</Badge>
  return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-0">Pendiente</Badge>
}

const fDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
const fDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

const calcularEdad = (fnac?: string) => {
  if (!fnac) return null
  const diff = Date.now() - new Date(fnac).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
}

// ─── Subcomponente: Card de turno ──────────────────────────────────────────────

function TurnoCard({ turno }: { turno: Turno }) {
  const fecha = new Date(turno.fecha_hora)
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
      <div className="flex-shrink-0 size-10 rounded-full bg-primary/10 flex items-center justify-center">
        <CalendarDays className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium capitalize">{fechaStr}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{hora}</span>
        </div>
        {turno.notas && (
          <p className="text-xs text-muted-foreground mt-1">{turno.notas}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {estadoBadge(turno.estado)}
      </div>
    </div>
  )
}

// ─── Subcomponente: Historia clínica de una mascota ────────────────────────────

type DataCargada = {
  consultas: Consulta[]
  cirugias: Cirugia[]
  vacunas: Vacuna[]
  turnos: Turno[]
  analisis: Analisis[]
  imagenes: ImagenDiagnostica[]
}

function HistoriaClinica({ mascota, clinicaId }: { mascota: Mascota; clinicaId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DataCargada | null>(null)

  const cargar = useCallback(async () => {
    if (data) { setOpen(!open); return }
    setLoading(true)
    try {
      const [c, ci, v, t, a, im] = await Promise.all([
        getConsultasByMascota(mascota.id, clinicaId),
        getCirugiasByMascota(mascota.id, clinicaId),
        getVacunasByMascota(mascota.id, clinicaId),
        getTurnosByMascota(mascota.id, clinicaId),
        getAnalisisByMascota(mascota.id, clinicaId),
        getImagenesByMascota(mascota.id, clinicaId),
      ])
      setData({
        consultas: c.data ?? [],
        cirugias: ci.data ?? [],
        vacunas: v.data ?? [],
        turnos: t.data ?? [],
        analisis: a.data ?? [],
        imagenes: im.data ?? [],
      })
      setOpen(true)
    } catch (err) {
      console.error('[Historia] Error cargando:', err)
    } finally {
      setLoading(false)
    }
  }, [mascota.id, clinicaId]) // eslint-disable-line react-hooks/exhaustive-deps




  const Icon = speciesIcon(mascota.especie)
  const edad = calcularEdad(mascota.fecha_nacimiento)

  return (
    <Card className="overflow-hidden border-border/60">
      <button
        onClick={cargar}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{mascota.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {mascota.especie}
                {mascota.raza ? ` · ${mascota.raza}` : ''}
                {edad !== null ? ` · ${edad} año${edad !== 1 ? 's' : ''}` : ''}
                {mascota.sexo ? ` · ${mascota.sexo === 'M' ? 'Macho' : 'Hembra'}` : ''}
              </p>
            </div>
            <div className="flex-shrink-0 text-muted-foreground">
              {loading ? (
                <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                open ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />
              )}
            </div>
          </div>
        </CardContent>
      </button>

      {open && data && (
        <div className="border-t border-border/60 px-4 pb-4 pt-2 space-y-3">
          {/* Turnos */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
              <CalendarDays className="size-4 text-primary" />
              Turnos
              <Badge variant="secondary" className="ml-1 text-xs">{data.turnos.length}</Badge>
            </div>
            {data.turnos.length === 0 ? (
              <p className="text-xs text-muted-foreground ml-6">Sin turnos registrados.</p>
            ) : (
              <div className="space-y-2 ml-1">
                {data.turnos.map(t => (
                  <TurnoCard key={t.id} turno={t} />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Consultas */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
              <Stethoscope className="size-4 text-blue-500" />
              Consultas
              <Badge variant="secondary" className="ml-1 text-xs">{data.consultas.length}</Badge>
            </div>
            {data.consultas.length === 0 ? (
              <p className="text-xs text-muted-foreground ml-6">Sin consultas registradas.</p>
            ) : (
              <div className="space-y-2">
                {data.consultas.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.motivo || '(sin motivo)'}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{fDateTime(c.fecha)}</span>
                    </div>
                    {c.diagnostico && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Diagnóstico:</span> {c.diagnostico}</p>}
                    {c.tratamiento && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Tratamiento:</span> {c.tratamiento}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Vacunas */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
              <Syringe className="size-4 text-green-500" />
              Vacunas
              <Badge variant="secondary" className="ml-1 text-xs">{data.vacunas.length}</Badge>
            </div>
            {data.vacunas.length === 0 ? (
              <p className="text-xs text-muted-foreground ml-6">Sin vacunas registradas.</p>
            ) : (
              <div className="space-y-2">
                {data.vacunas.map(v => (
                  <div key={v.id} className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between gap-2">
                    <span className="text-sm">Aplicación: <span className="font-medium">{fDate(v.fecha)}</span></span>
                    {v.proxima_dosis && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        Próxima: <span className="font-medium text-foreground">{fDate(v.proxima_dosis)}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Cirugías */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
              <Scissors className="size-4 text-orange-500" />
              Cirugías
              <Badge variant="secondary" className="ml-1 text-xs">{data.cirugias.length}</Badge>
            </div>
            {data.cirugias.length === 0 ? (
              <p className="text-xs text-muted-foreground ml-6">Sin cirugías registradas.</p>
            ) : (
              <div className="space-y-2">
                {data.cirugias.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.tipo || '(sin tipo)'}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{fDate(c.fecha)}</span>
                    </div>
                    {c.descripcion && <p className="text-xs text-muted-foreground">{c.descripcion}</p>}
                    {c.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {c.resultado}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Análisis */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
              <FlaskConical className="size-4 text-purple-500" />
              Análisis
              <Badge variant="secondary" className="ml-1 text-xs">{data.analisis.length}</Badge>
            </div>
            {data.analisis.length === 0 ? (
              <p className="text-xs text-muted-foreground ml-6">Sin análisis registrados.</p>
            ) : (
              <div className="space-y-2">
                {data.analisis.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{a.tipo}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{fDate(a.fecha)}</span>
                    </div>
                    {a.resultado && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resultado:</span> {a.resultado}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Imágenes */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
              <ScanLine className="size-4 text-cyan-500" />
              Imágenes diagnósticas
              <Badge variant="secondary" className="ml-1 text-xs">{data.imagenes.length}</Badge>
            </div>
            {data.imagenes.length === 0 ? (
              <p className="text-xs text-muted-foreground ml-6">Sin imágenes registradas.</p>
            ) : (
              <div className="space-y-2">
                {data.imagenes.map(im => (
                  <div key={im.id} className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{im.tipo}{im.region ? ` — ${im.region}` : ''}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{fDate(im.fecha)}</span>
                    </div>
                    {im.hallazgos && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Hallazgos:</span> {im.hallazgos}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      )}
    </Card>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ConsultaDuenoPage() {
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dueno, setDueno] = useState<Dueno | null>(null)
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [turnosPorMascota, setTurnosPorMascota] = useState<Record<string, Turno[]>>({})
  const [paso, setPaso] = useState<'buscar' | 'resultado'>('buscar')

  const handleBuscar = async () => {
    if (!email.trim()) return
    setBuscando(true)
    setError(null)
    setDueno(null)
    setMascotas([])
    setTurnosPorMascota({})

    try {
      const res = await getDuenoByEmail(email.trim())
      if (!res.success || !res.data) {
        setError('No se encontró ningún dueño con ese correo electrónico.')
        setBuscando(false)
        return
      }

      const d = res.data
      setDueno(d)

      // Cargar mascotas
      const mascRes = await getMascotasByDueno(d.id, d.id_clinica)
      const mascList = mascRes.data ?? []
      setMascotas(mascList)

      // Cargar turnos de cada mascota
      const turnosMap: Record<string, Turno[]> = {}
      await Promise.all(
        mascList.map(async (m) => {
          const tRes = await getTurnosByMascota(m.id, d.id_clinica)
          turnosMap[m.id] = tRes.data ?? []
        })
      )
      setTurnosPorMascota(turnosMap)

      setPaso('resultado')
    } catch (err) {
      setError('Ocurrió un error al buscar. Intentalo de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  const volver = () => {
    setPaso('buscar')
    setDueno(null)
    setMascotas([])
    setTurnosPorMascota({})
    setError(null)
  }

  // Calcular total de turnos pendientes
  const totalPendientes = Object.values(turnosPorMascota).reduce((acc, turnos) => {
    return acc + turnos.filter(t => t.estado === 'sin_atender').length
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <PawPrint className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Consulta de Dueños</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ingresá tu correo electrónico para ver los datos de tus mascotas, turnos e historias clínicas.
          </p>
        </div>

        {paso === 'buscar' ? (
          /* ─── Paso 1: Buscar por email ─── */
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email-input" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    Correo electrónico
                  </label>
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                    className="h-11"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <Search className="size-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleBuscar}
                  disabled={buscando || !email.trim()}
                  className="w-full h-11"
                >
                  {buscando ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="size-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ─── Paso 2: Resultados ─── */
          <div className="space-y-5">
            {/* Botón volver */}
            <button
              onClick={volver}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="size-4 rotate-180" />
              Volver a buscar
            </button>

            {/* Card del dueño */}
            {dueno && (
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary" />
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">{dueno.nombre}</h2>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          <span className="truncate">{dueno.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="size-3.5 shrink-0" />
                          <a
                            href={`https://wa.me/${dueno.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-green-600 transition-colors"
                          >
                            {dueno.telefono}
                          </a>
                        </div>
                        {dueno.direccion && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(dueno.direccion)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {dueno.direccion}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4 text-center">
                  <PawPrint className="size-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{mascotas.length}</p>
                  <p className="text-xs text-muted-foreground">Mascotas</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Calendar className="size-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{totalPendientes}</p>
                  <p className="text-xs text-muted-foreground">Turnos pendientes</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de mascotas */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                Tus mascotas
              </h3>
              <div className="space-y-3">
                {mascotas.length === 0 ? (
                  <Card className="border-dashed border-border/60">
                    <CardContent className="p-6 text-center">
                      <PawPrint className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No tenés mascotas registradas.</p>
                    </CardContent>
                  </Card>
                ) : (
                  mascotas.map(m => (
                    <HistoriaClinica
                      key={m.id}
                      mascota={m}
                      clinicaId={dueno!.id_clinica}
                    />
                  ))

                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Datos proporcionados por Sana · Sistema de gestión veterinaria
        </p>
      </div>
    </div>
  )
}
