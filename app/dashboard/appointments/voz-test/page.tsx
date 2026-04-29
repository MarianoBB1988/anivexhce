'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Mic, Square, Loader2, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { createTurno, checkTurnoDisponibilidad, getMascotas } from '@/lib/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// --- TTS helper (mismo que usa consulta-form-voz.tsx) ---
let currentAudio: HTMLAudioElement | null = null

function stopSpeak() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

async function speak(text: string): Promise<void> {
  stopSpeak()
  try {
    const res = await fetch('/api/sana/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) { console.warn('[TTS] Error:', res.status); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    return new Promise<void>((resolve) => {
      const audio = new Audio(url)
      currentAudio = audio
      audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; resolve() }
      audio.play().catch(() => { URL.revokeObjectURL(url); currentAudio = null; resolve() })
    })
  } catch (err) {
    console.warn('[TTS] Fetch error:', err)
  }
}

// --- Speech recognition ---
let recognition: any = null
if (typeof window !== 'undefined') {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (SpeechRecognition) {
    recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.continuous = false
    recognition.interimResults = false
  }
}

function listen(timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!recognition) return reject('No speech recognition')
    const timeout = setTimeout(() => {
      try { recognition.stop() } catch {}
      reject('timeout')
    }, timeoutMs)
    recognition.onresult = (e: any) => {
      clearTimeout(timeout)
      resolve(e.results[0][0].transcript)
    }
    recognition.onerror = (e: any) => {
      clearTimeout(timeout)
      reject(e.error)
    }
    recognition.start()
  })
}

function stopListen() {
  try { recognition?.stop() } catch {}
}

// --- Steps ---
type Step = 'idle' | 'ask_fecha' | 'ask_hora' | 'confirmar' | 'creando' | 'hecho' | 'error'

export default function VozTestPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('idle')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [transcripcion, setTranscripcion] = useState('')
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)
  const [escuchando, setEscuchando] = useState(false)
  const [hablando, setHablando] = useState(false)
  const abortRef = useRef(false)

  const hablar = useCallback(async (text: string) => {
    setHablando(true)
    try { await speak(text) } catch {}
    setHablando(false)
  }, [])

  const escuchar = useCallback(async (): Promise<string> => {
    setEscuchando(true)
    try {
      const t = await listen()
      setTranscripcion(t)
      return t
    } catch {
      return ''
    } finally {
      setEscuchando(false)
    }
  }, [])

  const crearTurno = useCallback(async (f: string, h: string) => {
    if (!user) return
    try {
      const fecha_hora = `${f}T${h}:00`
      console.log('[VozTest] Creando turno:', { fecha_hora, clinica: user.id_clinica })

      // Check disponibilidad
      const { disponible, conflictos } = await checkTurnoDisponibilidad(user.id_clinica, fecha_hora)
      console.log('[VozTest] Disponibilidad:', { disponible, conflictos })
      if (!disponible) {
        setResultado({ ok: false, msg: 'El horario esta ocupado. Elegi otro.' })
        setStep('hecho')
        await hablar('El horario esta ocupado. Intenta de nuevo.')
        return
      }

      // Buscar una mascota de la clinica para asignar al turno
      const mascotasRes = await getMascotas(user.id_clinica)
      console.log('[VozTest] Mascotas:', mascotasRes)
      if (!mascotasRes.success || !mascotasRes.data || mascotasRes.data.length === 0) {
        throw new Error('No hay mascotas en la clinica para asignar el turno')
      }
      const id_mascota = mascotasRes.data[0].id
      console.log('[VozTest] Usando mascota:', id_mascota)

      // Crear turno
      const res = await createTurno({
        id_mascota,
        fecha_hora,
        notas: 'Turno de prueba por voz',
        id_usuario: user.id,
        estado: 'sin_atender',
        ubicacion: 'clinica',
        id_clinica: user.id_clinica,
      })
      console.log('[VozTest] Resultado createTurno:', res)
      if (!res.success) throw new Error(res.error || 'Error al crear turno')
      setResultado({ ok: true, msg: `Turno creado para el ${f} a las ${h}` })
      setStep('hecho')
      await hablar(`Turno agendado para el ${f} a las ${h}.`)
    } catch (err) {
      console.error('[VozTest] Error:', err)
      setResultado({ ok: false, msg: String(err) })
      setStep('hecho')
      await hablar('Hubo un error al crear el turno.')
    }
  }, [user, hablar])

  const iniciar = useCallback(async () => {
    console.log('[VozTest] iniciar llamado')
    abortRef.current = false
    setResultado(null)
    setFecha('')
    setHora('')
    setTranscripcion('')
    setStep('ask_fecha')

    console.log('[VozTest] Preguntando fecha...')
    await hablar('Decime la fecha para el turno, por ejemplo: veinte de abril del 2026')
    if (abortRef.current) { console.log('[VozTest] abortado despues de fecha'); return }

    console.log('[VozTest] Escuchando fecha...')
    const f = await escuchar()
    console.log('[VozTest] Fecha escuchada:', f)
    if (abortRef.current || !f) {
      console.log('[VozTest] No se obtuvo fecha, volviendo a idle')
      setStep('idle')
      return
    }

    setStep('ask_hora')
    console.log('[VozTest] Preguntando hora...')
    await hablar('Gracias. Ahora decime la hora, por ejemplo: a las tres de la tarde')
    if (abortRef.current) { console.log('[VozTest] abortado despues de hora'); return }

    console.log('[VozTest] Escuchando hora...')
    const h = await escuchar()
    console.log('[VozTest] Hora escuchada:', h)
    if (abortRef.current || !h) {
      console.log('[VozTest] No se obtuvo hora, volviendo a idle')
      setStep('idle')
      return
    }

    // Parsear fecha/hora
    setStep('confirmar')
    const parsed = parsearFechaHora(f, h)
    console.log('[VozTest] Parseado:', parsed)
    setFecha(parsed.fecha)
    setHora(parsed.hora)

    console.log('[VozTest] Preguntando confirmacion...')
    await hablar(
      `El turno seria el ${parsed.fecha} a las ${parsed.hora}. ` +
      (parsed.confianza > 0.5 ? '¿Esta bien? Decime que si para confirmar o que no para cancelar.' : '¿Es correcto?')
    )
    if (abortRef.current) { console.log('[VozTest] abortado en confirmacion'); return }

    console.log('[VozTest] Escuchando confirmacion...')
    let conf = ''
    for (let i = 0; i < 3; i++) {
      conf = await escuchar()
      console.log('[VozTest] Confirmacion (intento', i+1, '):', conf)
      if (abortRef.current) return
      if (conf.trim()) break
      if (i < 2) await hablar('No te escuche bien. Decime si para confirmar o no para cancelar.')
    }

    const si = /^(si|sí|dale|ok|confirmo|adelante|correcto)/i.test(conf.trim())
    if (!si && conf.trim()) {
      console.log('[VozTest] Usuario dijo que no')
      setResultado({ ok: false, msg: 'Turno cancelado.' })
      setStep('hecho')
      await hablar('Turno cancelado.')
      return
    }

    // Si no se escucho nada, asumimos que quiere confirmar
    if (!conf.trim()) {
      console.log('[VozTest] No se escucho respuesta, asumiendo confirmacion')
    }

    console.log('[VozTest] Usuario confirmo, creando turno...')
    setStep('creando')
    await crearTurno(parsed.fecha, parsed.hora)
    console.log('[VozTest] crearTurno finalizado')
  }, [hablar, escuchar, crearTurno])

  const cancelar = () => {
    abortRef.current = true
    stopSpeak()
    stopListen()
    setStep('idle')
    setEscuchando(false)
    setHablando(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/appointments">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Prueba de Turnos por Voz</h1>
          <p className="text-muted-foreground">Seccion de prueba para agendar turnos solo con la voz</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="size-5 text-primary" />
            Asistente de Turnos por Voz
          </CardTitle>
          <CardDescription>
            Presiona "Iniciar" y el asistente te preguntara fecha y hora. Solo tenes que hablar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado */}
          <div className="flex items-center gap-3">
            {step === 'idle' && (
              <Button onClick={iniciar} className="gap-2">
                <Mic className="size-4" />
                Iniciar
              </Button>
            )}
            {step !== 'idle' && step !== 'hecho' && (
              <Button variant="destructive" onClick={cancelar} className="gap-2">
                <Square className="size-4" />
                Cancelar
              </Button>
            )}
            {step === 'hecho' && (
              <Button onClick={() => setStep('idle')} variant="outline">
                Volver a empezar
              </Button>
            )}
            <Badge variant="secondary" className="gap-1.5">
              {escuchando && <Loader2 className="size-3 animate-spin" />}
              {hablando && <Mic className="size-3 animate-pulse" />}
              {step === 'idle' && 'Listo'}
              {step === 'ask_fecha' && 'Preguntando fecha...'}
              {step === 'ask_hora' && 'Preguntando hora...'}
              {step === 'confirmar' && 'Confirmando...'}
              {step === 'creando' && 'Creando turno...'}
              {step === 'hecho' && 'Finalizado'}
              {step === 'error' && 'Error'}
            </Badge>
          </div>

          {/* Transcripcion */}
          {transcripcion && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Ultima transcripcion:</p>
              <p className="text-sm">&ldquo;{transcripcion}&rdquo;</p>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className={`rounded-lg border p-4 flex items-start gap-3 ${
              resultado.ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
            }`}>
              {resultado.ok
                ? <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
                : <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
              }
              <div>
                <p className={`font-semibold text-sm ${resultado.ok ? 'text-green-800' : 'text-red-800'}`}>
                  {resultado.ok ? 'Turno agendado' : 'Error'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{resultado.msg}</p>
              </div>
            </div>
          )}

          {/* Datos del turno */}
          {(fecha || hora) && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos del turno</p>
              <div className="flex gap-4">
                {fecha && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    {fecha}
                  </div>
                )}
                {hora && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    {hora}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Parseo de fecha/hora desde texto natural ---
function parsearFecha(texto: string): string {
  const hoy = new Date()
  const diasSemana: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }
  const meses: Record<string, number> = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 }

  const t = texto.toLowerCase()

  // "hoy", "mañana", "pasado mañana"
  if (/hoy|ahora|este/i.test(t)) {
    return formatearFecha(hoy)
  }
  if (/mañana|manana/i.test(t) && !/pasado/i.test(t)) {
    const m = new Date(hoy); m.setDate(m.getDate() + 1); return formatearFecha(m)
  }
  if (/pasado mañana|pasado manana/i.test(t)) {
    const m = new Date(hoy); m.setDate(m.getDate() + 2); return formatearFecha(m)
  }

  // "lunes que viene", "martes" etc
  for (const [nombre, idx] of Object.entries(diasSemana)) {
    if (t.includes(nombre)) {
      const diff = (idx - hoy.getDay() + 7) % 7 || 7
      const m = new Date(hoy); m.setDate(m.getDate() + diff); return formatearFecha(m)
    }
  }

  // "20 de abril", "20 de abril del 2026"
  const matchFecha = t.match(/(\d{1,2})\s*(?:de\s+)?([a-z]+)(?:\s*(?:del?\s*)?(\d{4}))?/)
  if (matchFecha) {
    const dia = parseInt(matchFecha[1])
    const mes = meses[matchFecha[2]]
    const anio = matchFecha[3] ? parseInt(matchFecha[3]) : hoy.getFullYear()
    if (mes !== undefined && dia >= 1 && dia <= 31) {
      return formatearFecha(new Date(anio, mes, dia))
    }
  }

  // "2026-04-20" (formato ISO)
  const matchIso = t.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2].padStart(2, '0')}-${matchIso[3].padStart(2, '0')}`
  }

  // "20/04/2026" o "20-04-2026"
  const matchLocal = t.match(/(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{4}))?/)
  if (matchLocal) {
    const dia = parseInt(matchLocal[1])
    const mes = parseInt(matchLocal[2])
    const anio = matchLocal[3] ? parseInt(matchLocal[3]) : hoy.getFullYear()
    return formatearFecha(new Date(anio, mes - 1, dia))
  }

  return formatearFecha(hoy)
}

function parsearHora(texto: string): string {
  const t = texto.toLowerCase()

  // "10:30", "10.30"
  const matchHora = t.match(/(\d{1,2})[:\.](\d{2})/)
  if (matchHora) {
    return `${matchHora[1].padStart(2, '0')}:${matchHora[2]}`
  }

  // "3 de la tarde", "10 de la mañana"
  const matchTarde = t.match(/(\d{1,2})\s*(?:de\s+)?(?:la\s+)?(tarde|noche)/)
  if (matchTarde) {
    const h = parseInt(matchTarde[1]) + 12
    return `${h.toString().padStart(2, '0')}:00`
  }
  const matchManana = t.match(/(\d{1,2})\s*(?:de\s+)?(?:la\s+)?(mañana|manana|madrugada)/)
  if (matchManana) {
    return `${matchManana[1].padStart(2, '0')}:00`
  }

  // "las 3", "a las 3"
  const matchSimple = t.match(/(?:a\s+)?(?:las\s+)?(\d{1,2})\s*(?:hs|horas)?/)
  if (matchSimple) {
    return `${matchSimple[1].padStart(2, '0')}:00`
  }

  return '10:00'
}

function formatearFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parsearFechaHora(fechaText: string, horaText: string): { fecha: string; hora: string; confianza: number } {
  const fecha = parsearFecha(fechaText)
  const hora = parsearHora(horaText)
  const confianza = fecha !== formatearFecha(new Date()) || hora !== '10:00' ? 0.8 : 0.3
  return { fecha, hora, confianza }
}
