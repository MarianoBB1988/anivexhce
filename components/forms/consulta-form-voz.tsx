'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Loader2, Volume2, Check, Square, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SanaLogo } from '@/components/sana-chat'
import type { Dueno, Mascota, Usuario } from '@/lib/types'
import { cn } from '@/lib/utils'

/* -- Types -- */
export const emptyConsultaFormVoz = {
  id_mascota: '',
  id_usuario: '',
  fecha_date: '',
  fecha_time: '',
  motivo: '',
  diagnostico: '',
  tratamiento: '',
  observaciones: '',
  _duenoId: '',
}

export type ConsultaFormVozData = typeof emptyConsultaFormVoz

/* -- Conversation steps -- */
type ConvStep =
  | 'idle'
  | 'ask_dueno'          // Sana asks for owner name
  | 'choose_dueno'       // Multiple matches → user picks
  | 'ask_mascota'        // Sana asks which pet
  | 'choose_mascota'     // Multiple pets → user picks
  | 'ask_clinico'        // Sana asks motivo/diagnostico/tratamiento together
  | 'extracting'         // AI is processing the clinical text
  | 'ask_observaciones'
  | 'ask_turno'          // Sana asks if user wants to schedule a follow-up
  | 'ask_turno_fecha'    // Sana asks for the date of the follow-up
  | 'ask_turno_hora'     // Sana asks for the time of the follow-up
  | 'finished'

/* -- Silence detection constants -- */
const SILENCE_THRESHOLD = 0.04
const SILENCE_DURATION = 900   // Beta 1.2: reduced from 1600
const SILENCE_DURATION_LONG = 4000 // For long clinical dictation (increased from 2500)
const MIN_AUDIO_SIZE = 1000

/* -- TTS helper -- */
let currentAudio: HTMLAudioElement | null = null

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

async function speak(text: string): Promise<void> {
  stopSpeaking()
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

/* -- Fuzzy name matching -- */
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/* -- Clean transcription: remove filler phrases -- */
function cleanName(raw: string): string {
  const cleaned = raw
    .replace(/^(el dueño es|la dueña es|se llama|es|el señor|la señora|señor|señora|don|doña|el|la|del)\s+/i, '')
    .replace(/[.,!?¿¡]+/g, '')
    .trim()
  return cleaned || raw
}

/* -- Levenshtein distance for fuzzy matching -- */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function isSimilar(a: string, b: string): boolean {
  const na = normalize(a), nb = normalize(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const maxDist = Math.max(1, Math.floor(Math.max(na.length, nb.length) * 0.3))
  return levenshtein(na, nb) <= maxDist
}

function matchDuenos(duenos: Dueno[], spoken: string): Dueno[] {
  const norm = normalize(spoken)
  if (!norm) return []
  // First try exact match
  const exact = duenos.filter(d => normalize(d.nombre) === norm)
  if (exact.length > 0) return exact
  // Then partial includes
  const partial = duenos.filter(d => {
    const dn = normalize(d.nombre)
    return dn.includes(norm) || norm.includes(dn) ||
      norm.split(' ').some(w => w.length > 2 && dn.includes(w))
  })
  if (partial.length > 0) return partial
  // Fuzzy: Levenshtein on full name or individual words
  return duenos.filter(d => {
    const dn = normalize(d.nombre)
    return isSimilar(dn, norm) ||
      dn.split(' ').some(w => w.length > 2 && isSimilar(w, norm)) ||
      norm.split(' ').some(w => w.length > 2 && dn.split(' ').some(dw => isSimilar(dw, w)))
  })
}

function matchMascota(mascotas: Mascota[], spoken: string): Mascota | null {
  const norm = normalize(spoken)
  if (!norm) return null
  return mascotas.find(m => normalize(m.nombre) === norm) ??
    mascotas.find(m => normalize(m.nombre).includes(norm) || norm.includes(normalize(m.nombre))) ??
    mascotas.find(m => isSimilar(m.nombre, spoken)) ??
    null
}

/* -- AI fuzzy name matching (Groq) -- */
async function fuzzyMatchDuenos(duenos: Dueno[], spoken: string): Promise<Dueno[]> {
  if (duenos.length === 0) return []
  try {
    const nombres = duenos.map(d => d.nombre)
    const res = await fetch('/api/sana/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spoken, nombres }),
    })
    const data = await res.json()
    if (Array.isArray(data.matches)) {
      return duenos.filter(d =>
        data.matches.some((m: string) =>
          m.toLowerCase().trim() === d.nombre.toLowerCase().trim()
        )
      )
    }
    return []
  } catch (err) {
    console.warn('[Fuzzy match error]', err)
    return []
  }
}

async function fuzzyMatchMascota(mascotas: Mascota[], spoken: string): Promise<Mascota | null> {
  if (mascotas.length === 0) return null
  try {
    const nombres = mascotas.map(m => m.nombre)
    const res = await fetch('/api/sana/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spoken, nombres }),
    })
    const data = await res.json()
    if (Array.isArray(data.matches) && data.matches.length > 0) {
      return mascotas.find(m =>
        data.matches.some((match: string) =>
          match.toLowerCase().trim() === m.nombre.toLowerCase().trim()
        )
      ) ?? null
    }
    return null
  } catch (err) {
    console.warn('[Fuzzy mascota match error]', err)
    return null
  }
}

/* -- Number words to digits (for choosing) -- */
function parseChoice(spoken: string, max: number): number | null {
  const norm = normalize(spoken)
  const nums: Record<string, number> = {
    uno: 1, una: 1, primero: 1, primera: 1, primer: 1,
    dos: 2, segundo: 2, segunda: 2,
    tres: 3, tercero: 3, tercera: 3,
    cuatro: 4, cuarto: 4, cuarta: 4,
    cinco: 5, quinto: 5, quinta: 5,
  }
  for (const [word, n] of Object.entries(nums)) {
    if (norm.includes(word) && n <= max) return n
  }
  const m = norm.match(/(\d+)/)
  if (m) {
    const n = parseInt(m[1])
    if (n >= 1 && n <= max) return n
  }
  return null
}

/* -- Props -- */
interface Props {
  duenos?: Dueno[]
  mascotas?: Mascota[]
  usuarios: Usuario[]
  currentUserId?: string
  loading?: boolean
  onSubmit: (data: ConsultaFormVozData) => Promise<void>
  onCancel: () => void
  onCreateTurno?: (fecha: string, hora: string) => Promise<{ ok: boolean; error?: string }>
}

/* -- Component -- */
export function ConsultaFormVoz({
  duenos = [],
  mascotas = [],
  usuarios,
  currentUserId,
  loading = false,
  onSubmit,
  onCancel,
  onCreateTurno,
}: Props) {
  const [formData, setFormData] = useState<ConsultaFormVozData>({
    ...emptyConsultaFormVoz,
    fecha_date: new Date().toISOString().split('T')[0],
    fecha_time: new Date().toTimeString().slice(0, 5),
    id_usuario: currentUserId || '',
  })
  const [selectedDuenoId, setSelectedDuenoId] = useState('')

  // Conversation state
  const [convStep, setConvStep] = useState<ConvStep>('idle')
  const [listening, setListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sanaMessage, setSanaMessage] = useState('')
  const [lastTranscription, setLastTranscription] = useState('')
  const [sugerencias, setSugerencias] = useState('')
  const [duenoMatches, setDuenoMatches] = useState<Dueno[]>([])

  // Turno state
  const [turnoFecha, setTurnoFecha] = useState('')
  const [turnoHora, setTurnoHora] = useState('')
  const [turnoStatus, setTurnoStatus] = useState<'idle' | 'creating' | 'ok' | 'error'>('idle')
  const [turnoError, setTurnoError] = useState('')

  // Audio refs
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const activoRef = useRef(false)
  const procesandoRef = useRef(false)
  const convStepRef = useRef<ConvStep>('idle')
  const duenoMatchesRef = useRef<Dueno[]>([])
  const duenosRef = useRef<Dueno[]>(duenos)
  const mascotasRef = useRef<Mascota[]>(mascotas)
  const selectedDuenoIdRef = useRef('')

  // Keep refs in sync
  useEffect(() => { convStepRef.current = convStep }, [convStep])
  useEffect(() => { procesandoRef.current = isProcessing }, [isProcessing])
  useEffect(() => { duenoMatchesRef.current = duenoMatches }, [duenoMatches])
  useEffect(() => { duenosRef.current = duenos }, [duenos])
  useEffect(() => { mascotasRef.current = mascotas }, [mascotas])
  useEffect(() => { selectedDuenoIdRef.current = selectedDuenoId }, [selectedDuenoId])

  const filteredMascotas = selectedDuenoId
    ? mascotas.filter(m => m.id_dueno === selectedDuenoId)
    : []

  /* -- Audio helpers -- */
  const conectarAudio = useCallback(async () => {
    if (audioContextRef.current) await audioContextRef.current.close().catch(() => {})
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    const source = ctx.createMediaStreamSource(streamRef.current!)
    source.connect(analyser)
    audioContextRef.current = ctx
    analyserRef.current = analyser
  }, [])

  const iniciarGrabacion = useCallback(() => {
    chunksRef.current = []
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm'
    const recorder = new MediaRecorder(streamRef.current!, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start(100)
    mediaRecorderRef.current = recorder
  }, [])

  /* -- Transcribe audio blob -- */
  const transcribir = useCallback(async (blob: Blob): Promise<string> => {
    const fd = new FormData()
    fd.append('audio', blob, 'audio.webm')
    const res = await fetch('/api/sana/transcribe', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error de transcripción')
    return (data.transcripcion || '').trim()
  }, [])

  /* -- AI extraction -- */
  const extraerClinicos = useCallback(async (text: string) => {
    // Build clinical history from selected pet data
    let historiaClinica = ''
    const mascotaId = formData.id_mascota
    if (mascotaId) {
      const mascota = mascotas.find(m => m.id === mascotaId)
      if (mascota) {
        const edad = mascota.fecha_nacimiento
          ? Math.floor((Date.now() - new Date(mascota.fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 'desconocida'
        historiaClinica = `Especie: ${mascota.especie}, Raza: ${mascota.raza}, Edad: ${edad} años, Sexo: ${mascota.sexo || 'no especificado'}, Peso: ${mascota.peso || 'desconocido'} kg`
        if (mascota.observaciones) {
          historiaClinica += `\nObservaciones: ${mascota.observaciones}`
        }
      }
    }

    const res = await fetch('/api/sana/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcripcion: text, historiaClinica }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error de extracción')
    return data as { motivo: string; diagnostico: string; tratamiento: string; sugerencias: string; preguntas: string[]; diferenciales: string[]; alertas: string[] }
  }, [formData.id_mascota, mascotas])

  /* -- Resume listening -- */
  const reanudarEscucha = useCallback(async () => {
    if (!activoRef.current) return
    procesandoRef.current = false
    setIsProcessing(false)
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      await conectarAudio()
      iniciarGrabacion()
      detectarSilencio()
      setListening(true)
    } catch (err) {
      console.error('[Mic reopen error]', err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conectarAudio, iniciarGrabacion])

  /* -- Process recorded audio (main conversation handler) -- */
  const processAudio = useCallback(async (blob: Blob) => {
    setIsProcessing(true)
    setLastTranscription('')
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())

    // Read latest data from refs (avoid stale closures)
    const _duenos = duenosRef.current
    const _mascotas = mascotasRef.current
    const _selectedDuenoId = selectedDuenoIdRef.current

    try {
      const transcripcion = await transcribir(blob)
      setLastTranscription(transcripcion)

      if (!transcripcion) {
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      const step = convStepRef.current

      /* -- STEP: ask_dueno -- */
      if (step === 'ask_dueno') {
        const cleaned = cleanName(transcripcion)
        console.log('[Sana] Dueño transcripción:', transcripcion, '→ limpio:', cleaned, '| duenos:', _duenos.length)
        let matches = matchDuenos(_duenos, cleaned)
        // Also try with raw transcription
        if (matches.length === 0 && cleaned !== transcripcion) {
          matches = matchDuenos(_duenos, transcripcion)
        }
        // AI fuzzy fallback when local matching fails
        if (matches.length === 0) {
          setSanaMessage('Buscando...')
          matches = await fuzzyMatchDuenos(_duenos, cleaned)
        }
        if (matches.length === 0) {
          setIsSpeaking(true)
          setSanaMessage(`No encontré ningún dueño con ese nombre. Intentá de nuevo.`)
          await speak('No encontré ningún dueño con ese nombre. Intentá de nuevo.')
          setIsSpeaking(false)
          setIsProcessing(false)
          await reanudarEscucha()
        } else if (matches.length === 1) {
          const d = matches[0]
          setSelectedDuenoId(d.id)
          selectedDuenoIdRef.current = d.id
          setFormData(prev => ({ ...prev, _duenoId: d.id, id_mascota: '' }))
          const pets = _mascotas.filter(m => m.id_dueno === d.id)
          if (pets.length === 0) {
            setIsSpeaking(true)
            setSanaMessage(`Seleccioné a ${d.nombre}, pero no tiene mascotas registradas.`)
            await speak(`Seleccioné a ${d.nombre}, pero no tiene mascotas registradas. Agregá una mascota primero.`)
            setIsSpeaking(false)
            setConvStep('finished')
            activoRef.current = false
            setIsProcessing(false)
            setListening(false)
            return
          } else if (pets.length === 1) {
            setFormData(prev => ({ ...prev, id_mascota: pets[0].id }))
            setIsSpeaking(true)
            setSanaMessage(`Perfecto, ${d.nombre} con ${pets[0].nombre}. Ahora contame el motivo de consulta, diagnóstico y tratamiento, todo junto.`)
            await speak(`Perfecto, ${d.nombre} con ${pets[0].nombre}. Ahora contame el motivo de consulta, diagnóstico y tratamiento, todo junto.`)
            setIsSpeaking(false)
            setConvStep('ask_clinico')
          } else {
            const names = pets.map((p, i) => `${i + 1}, ${p.nombre}`).join('. ')
            setIsSpeaking(true)
            setSanaMessage(`${d.nombre} tiene estas mascotas: ${pets.map((p, i) => `${i + 1}. ${p.nombre}`).join(', ')}. ¿Cuál es?`)
            await speak(`${d.nombre} tiene estas mascotas: ${names}. ¿Cuál es?`)
            setIsSpeaking(false)
            setConvStep('ask_mascota')
          }
          setIsProcessing(false)
          await reanudarEscucha()
        } else {
          setDuenoMatches(matches)
          const names = matches.map((d, i) => `${i + 1}, ${d.nombre}`).join('. ')
          setIsSpeaking(true)
          setSanaMessage(`Encontré varios: ${matches.map((d, i) => `${i + 1}. ${d.nombre}`).join(', ')}. ¿Cuál es?`)
          await speak(`Encontré varios dueños: ${names}. ¿Cuál es?`)
          setIsSpeaking(false)
          setConvStep('choose_dueno')
          setIsProcessing(false)
          await reanudarEscucha()
        }
        return
      }

      /* -- STEP: choose_dueno -- */
      if (step === 'choose_dueno') {
        const matches = duenoMatchesRef.current
        const cleaned = cleanName(transcripcion)
        const choice = parseChoice(transcripcion, matches.length)
        const nameMatch = matches.find(d =>
          normalize(d.nombre).includes(normalize(cleaned)) ||
          isSimilar(d.nombre, cleaned)
        )
        const selected = choice ? matches[choice - 1] : nameMatch

        if (!selected) {
          setIsSpeaking(true)
          setSanaMessage('No entendí. ¿Cuál de los dueños es?')
          await speak('No entendí. ¿Cuál de los dueños es? Podés decirme el nombre o el número.')
          setIsSpeaking(false)
          setIsProcessing(false)
          await reanudarEscucha()
          return
        }

        setSelectedDuenoId(selected.id)
        selectedDuenoIdRef.current = selected.id
        setFormData(prev => ({ ...prev, _duenoId: selected.id, id_mascota: '' }))
        const pets = _mascotas.filter(m => m.id_dueno === selected.id)

        if (pets.length === 0) {
          setIsSpeaking(true)
          setSanaMessage(`${selected.nombre} no tiene mascotas registradas.`)
          await speak(`${selected.nombre} no tiene mascotas registradas.`)
          setIsSpeaking(false)
          setConvStep('finished')
          activoRef.current = false
          setIsProcessing(false)
          setListening(false)
          return
        } else if (pets.length === 1) {
          setFormData(prev => ({ ...prev, id_mascota: pets[0].id }))
          setIsSpeaking(true)
          setSanaMessage(`Perfecto, ${selected.nombre} con ${pets[0].nombre}. Contame el motivo, diagnóstico y tratamiento.`)
          await speak(`Perfecto, ${selected.nombre} con ${pets[0].nombre}. Contame el motivo de consulta, diagnóstico y tratamiento, todo junto.`)
          setIsSpeaking(false)
          setConvStep('ask_clinico')
        } else {
          const names = pets.map((p, i) => `${i + 1}, ${p.nombre}`).join('. ')
          setIsSpeaking(true)
          setSanaMessage(`${selected.nombre} tiene: ${pets.map((p, i) => `${i + 1}. ${p.nombre}`).join(', ')}. ¿Cuál?`)
          await speak(`Tiene estas mascotas: ${names}. ¿Cuál es?`)
          setIsSpeaking(false)
          setConvStep('ask_mascota')
        }
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      /* -- STEP: ask_mascota / choose_mascota -- */
      if (step === 'ask_mascota' || step === 'choose_mascota') {
        const pets = _mascotas.filter(m => m.id_dueno === _selectedDuenoId)
        const cleaned = cleanName(transcripcion)
        console.log('[Sana] Mascota transcripción:', transcripcion, '→ limpio:', cleaned)
        const choice = parseChoice(transcripcion, pets.length)
        let nameMatch = matchMascota(pets, cleaned)
        if (!nameMatch && cleaned !== transcripcion) nameMatch = matchMascota(pets, transcripcion)
        // AI fuzzy fallback
        if (!choice && !nameMatch) {
          setSanaMessage('Buscando...')
          nameMatch = await fuzzyMatchMascota(pets, cleaned)
        }
        const selected = choice ? pets[choice - 1] : nameMatch

        if (!selected) {
          setIsSpeaking(true)
          setSanaMessage('No entendí. ¿Cuál mascota es?')
          await speak('No entendí. ¿Cuál mascota es? Podés decirme el nombre.')
          setIsSpeaking(false)
          setConvStep('choose_mascota')
          setIsProcessing(false)
          await reanudarEscucha()
          return
        }

        setFormData(prev => ({ ...prev, id_mascota: selected.id }))
        setIsSpeaking(true)
        setSanaMessage(`Perfecto, ${selected.nombre}. Ahora contame el motivo, diagnóstico y tratamiento, todo junto.`)
        await speak(`Perfecto, ${selected.nombre}. Ahora contame el motivo de consulta, diagnóstico y tratamiento, todo junto.`)
        setIsSpeaking(false)
        setConvStep('ask_clinico')
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      /* -- STEP: ask_clinico → send to AI extraction -- */
      if (step === 'ask_clinico') {
        setConvStep('extracting')
        setSanaMessage('Procesando con IA...')
        setIsSpeaking(true)
        await speak('Perfecto, estoy procesando la información.')
        setIsSpeaking(false)

        try {
          const result = await extraerClinicos(transcripcion)
          setFormData(prev => ({
            ...prev,
            motivo: result.motivo || prev.motivo,
            diagnostico: result.diagnostico || prev.diagnostico,
            tratamiento: result.tratamiento || prev.tratamiento,
          }))
          if (result.sugerencias) {
            setSugerencias(result.sugerencias)
          }

          setIsSpeaking(true)
          let confirmMsg = 'Listo. Separé la información en motivo, diagnóstico y tratamiento.'
          if (result.sugerencias) {
            confirmMsg += ` Tengo una sugerencia: ${result.sugerencias}`
          }
          confirmMsg += ' ¿Querés agregar alguna observación?'
          setSanaMessage(confirmMsg)
          await speak(confirmMsg)
          setIsSpeaking(false)
          setConvStep('ask_observaciones')
          setIsProcessing(false)
          await reanudarEscucha()
        } catch (err) {
          console.error('[Extract error]', err)
          setFormData(prev => ({ ...prev, motivo: transcripcion }))
          setIsSpeaking(true)
          setSanaMessage('No pude separar la información con IA. Puse todo en motivo. ¿Querés agregar observaciones?')
          await speak('No pude separar la información con la inteligencia artificial. Puse todo en el campo motivo. ¿Querés agregar alguna observación?')
          setIsSpeaking(false)
          setConvStep('ask_observaciones')
          setIsProcessing(false)
          await reanudarEscucha()
        }
        return
      }

      /* -- STEP: ask_observaciones -- */
      if (step === 'ask_observaciones') {
        const neg = normalize(transcripcion)
        const isNo = neg === 'no' || neg === 'nada' || neg === 'no nada' || neg.startsWith('no,') || neg === 'ninguna'

        // Build observaciones: user's input + Sana's recommendations
        let obsParts: string[] = []
        if (!isNo && transcripcion) {
          obsParts.push(transcripcion)
        }
        // Always add Sana's recommendations if available
        if (sugerencias) {
          obsParts.push(`Recomendaciones de Sana: ${sugerencias}`)
        }
        if (obsParts.length > 0) {
          setFormData(prev => ({ ...prev, observaciones: obsParts.join('\n\n') }))
        }

        // Ask if user wants to schedule a follow-up turno
        setIsSpeaking(true)
        setConvStep('ask_turno')
        const msg = '¿Querés agendar un turno de control para una próxima consulta?'
        setSanaMessage(msg)
        await speak(msg)
        setIsSpeaking(false)
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      /* -- STEP: ask_turno -- */
      if (step === 'ask_turno') {
        const norm = normalize(transcripcion)
        const isYes = norm === 'si' || norm === 'sí' || norm === 'dale' || norm === 'ok' || norm === 'bueno' ||
          norm === 'claro' || norm === 's' || norm.includes('si,') || norm.includes('sí,') ||
          norm.includes('quiero') || norm.includes('agenda') || norm.includes('turno')

        if (!isYes) {
          // No turno → finish
          setIsSpeaking(true)
          setConvStep('finished')
          const msg = '¡Listo! Revisá el formulario y guardá cuando estés conforme.'
          setSanaMessage(msg)
          await speak(msg)
          setIsSpeaking(false)
          activoRef.current = false
          setIsProcessing(false)
          setListening(false)
          return
        }

        // Yes → ask for date
        setIsSpeaking(true)
        setConvStep('ask_turno_fecha')
        const msg = '¿Qué día querés agendar el turno de control?'
        setSanaMessage(msg)
        await speak(msg)
        setIsSpeaking(false)
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      /* -- STEP: ask_turno_fecha -- */
      if (step === 'ask_turno_fecha') {
        // Try to parse date from transcription
        const norm = normalize(transcripcion)
        let fecha = ''

        // Try "dd de mes" or "dd/mm" patterns
        const meses: Record<string, string> = {
          enero: '01', febrero: '02', marzo: '03', abril: '04',
          mayo: '05', junio: '06', julio: '07', agosto: '08',
          septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
        }

        // Pattern: "15 de marzo" or "15/03" or "15-03"
        const diaMesMatch = norm.match(/(\d{1,2})\s*(?:de\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i)
        if (diaMesMatch) {
          const dia = diaMesMatch[1].padStart(2, '0')
          const mes = meses[diaMesMatch[2].toLowerCase()]
          const year = new Date().getFullYear()
          fecha = `${year}-${mes}-${dia}`
        }

        const numMatch = norm.match(/(\d{1,2})\s*[/\-]\s*(\d{1,2})/)
        if (!fecha && numMatch) {
          const dia = numMatch[1].padStart(2, '0')
          const mes = numMatch[2].padStart(2, '0')
          const year = new Date().getFullYear()
          fecha = `${year}-${mes}-${dia}`
        }

        // "hoy" or "mañana"
        if (!fecha) {
          if (norm.includes('hoy')) {
            fecha = new Date().toISOString().split('T')[0]
          } else if (norm.includes('mañana') || norm.includes('manana')) {
            const manana = new Date()
            manana.setDate(manana.getDate() + 1)
            fecha = manana.toISOString().split('T')[0]
          }
        }

        if (!fecha) {
          setIsSpeaking(true)
          setSanaMessage('No entendí la fecha. Decime el día, por ejemplo "15 de marzo" o "mañana".')
          await speak('No entendí la fecha. Decime el día, por ejemplo "15 de marzo" o "mañana".')
          setIsSpeaking(false)
          setIsProcessing(false)
          await reanudarEscucha()
          return
        }

        setTurnoFecha(fecha)
        setIsSpeaking(true)
        setConvStep('ask_turno_hora')
        const msg = `Perfecto, para el ${fecha}. ¿A qué hora?`
        setSanaMessage(msg)
        await speak(msg)
        setIsSpeaking(false)
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      /* -- STEP: ask_turno_hora -- */
      if (step === 'ask_turno_hora') {
        // Try to parse time from transcription
        const norm = normalize(transcripcion)
        let hora = ''

        // Pattern: "15:30" or "15:30 hs" or "3 y media" or "las 3"
        const timeMatch = norm.match(/(\d{1,2})\s*[:h]\s*(\d{2})\s*(?:hs|horas)?/)
        if (timeMatch) {
          hora = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
        }

        // "media hora" pattern: "3 y media" → 3:30
        if (!hora) {
          const mediaMatch = norm.match(/(\d{1,2})\s*(?:y\s*)?media/)
          if (mediaMatch) {
            hora = `${mediaMatch[1].padStart(2, '0')}:30`
          }
        }

        // Just a number: "las 3" → 3:00
        if (!hora) {
          const justNum = norm.match(/(?:las\s*)?(\d{1,2})\s*(?:hs|horas)?$/)
          if (justNum) {
            hora = `${justNum[1].padStart(2, '0')}:00`
          }
        }

        if (!hora) {
          setIsSpeaking(true)
          setSanaMessage('No entendí la hora. Decime, por ejemplo "15:30" o "las 3".')
          await speak('No entendí la hora. Decime, por ejemplo "15:30" o "las 3".')
          setIsSpeaking(false)
          setIsProcessing(false)
          await reanudarEscucha()
          return
        }

        setTurnoHora(hora)

        // Create the turno
        if (onCreateTurno) {
          setTurnoStatus('creating')
          setSanaMessage(`Agendando turno para el ${turnoFecha} a las ${hora}...`)
          try {
            const result = await onCreateTurno(turnoFecha, hora)
            if (result.ok) {
              setTurnoStatus('ok')
              setIsSpeaking(true)
              setConvStep('finished')
              const msg = `¡Turno agendado para el ${turnoFecha} a las ${hora}! Revisá el formulario y guardá.`
              setSanaMessage(msg)
              await speak(msg)
              setIsSpeaking(false)
            } else {
              setTurnoStatus('error')
              setTurnoError(result.error || 'Error al agendar')
              setIsSpeaking(true)
              setConvStep('finished')
              const msg = result.error?.includes('ocupado')
                ? `Ese horario está ocupado. Podés agendar el turno manualmente después. Revisá el formulario y guardá.`
                : `No pude agendar el turno. Podés hacerlo manualmente después. Revisá el formulario y guardá.`
              setSanaMessage(msg)
              await speak(msg)
              setIsSpeaking(false)
            }
          } catch {
            setTurnoStatus('error')
            setTurnoError('Error de conexión')
            setIsSpeaking(true)
            setConvStep('finished')
            const msg = 'Hubo un error al agendar el turno. Podés hacerlo manualmente después. Revisá el formulario y guardá.'
            setSanaMessage(msg)
            await speak(msg)
            setIsSpeaking(false)
          }
        } else {
          // No onCreateTurno prop → just finish
          setIsSpeaking(true)
          setConvStep('finished')
          const msg = `¡Listo! Revisá el formulario y guardá cuando estés conforme.`
          setSanaMessage(msg)
          await speak(msg)
          setIsSpeaking(false)
        }

        activoRef.current = false
        setIsProcessing(false)
        setListening(false)
        return
      }

    } catch (err: any) {
      console.error('[Voice error]', err)
      setIsSpeaking(true)
      setSanaMessage('No pude procesar el audio. Intentá de nuevo.')
      await speak('No pude procesar el audio. Intentá de nuevo.')
      setIsSpeaking(false)
      setIsProcessing(false)
      await reanudarEscucha()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcribir, extraerClinicos, reanudarEscucha])

  /* -- Silence detection loop -- */
  const detectarSilencio = useCallback(() => {
    if (!activoRef.current || procesandoRef.current) return
    const analyser = analyserRef.current
    if (!analyser) return

    const buffer = new Float32Array(analyser.fftSize)
    let silenceStart: number | null = null
    let haHablado = false

    function loop() {
      if (!activoRef.current || procesandoRef.current) return

      analyser!.getFloatTimeDomainData(buffer)
      let sum = 0
      for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
      const rms = Math.sqrt(sum / buffer.length)

      if (rms < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now()
        const tiempoSilencio = Date.now() - silenceStart
        // Use longer silence for clinical dictation
        const threshold = convStepRef.current === 'ask_clinico' ? SILENCE_DURATION_LONG : SILENCE_DURATION
        if (haHablado && tiempoSilencio > threshold && chunksRef.current.length > 5) {
          procesarYContinuar()
          return
        }
      } else {
        silenceStart = null
        haHablado = true
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const procesarYContinuar = useCallback(async () => {
    if (procesandoRef.current || !activoRef.current) return
    procesandoRef.current = true
    setIsProcessing(true)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const stopPromise = new Promise<void>(resolve => { mediaRecorderRef.current!.onstop = () => resolve() })
      mediaRecorderRef.current.stop()
      await stopPromise
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })

    if (blob.size < MIN_AUDIO_SIZE) {
      procesandoRef.current = false
      setIsProcessing(false)
      iniciarGrabacion()
      detectarSilencio()
      return
    }

    await processAudio(blob)
  }, [processAudio, iniciarGrabacion, detectarSilencio])

  /* -- Start assistant -- */
  const startAssistant = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('No se pudo acceder al micrófono. Verificá los permisos del navegador.')
      return
    }

    activoRef.current = true
    setConvStep('ask_dueno')
    setLastTranscription('')
    setSugerencias('')
    setSanaMessage('')
    setDuenoMatches([])

    setIsSpeaking(true)
    setSanaMessage('Hola, soy Sana. ¿Cuál es el nombre del dueño?')
    await speak('Hola, soy Sana. ¿Cuál es el nombre del dueño?')
    setIsSpeaking(false)

    await conectarAudio()
    iniciarGrabacion()
    detectarSilencio()
    setListening(true)
  }, [conectarAudio, iniciarGrabacion, detectarSilencio, usuarios, formData.id_usuario])

  /* -- Stop assistant -- */
  const stopAssistant = useCallback(() => {
    activoRef.current = false
    stopSpeaking()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
    setListening(false)
    setIsProcessing(false)
    setIsSpeaking(false)
    setConvStep('idle')
    setSanaMessage('')
    setLastTranscription('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activoRef.current = false
      stopSpeaking()
      streamRef.current?.getTracks().forEach(t => t.stop())
      audioContextRef.current?.close().catch(() => {})
    }
  }, [])

  const isActive = convStep !== 'idle'
  const isFinished = convStep === 'finished'

  /* -- Step labels for progress bar -- */
  const PROGRESS_STEPS = ['Dueño', 'Mascota', 'Clínico', 'Observaciones']
  const stepIndex =
    convStep === 'ask_dueno' || convStep === 'choose_dueno' ? 0 :
    convStep === 'ask_mascota' || convStep === 'choose_mascota' ? 1 :
    convStep === 'ask_clinico' || convStep === 'extracting' ? 2 :
    convStep === 'ask_observaciones' ? 3 :
    convStep === 'finished' ? 4 : -1

  const selectedDueno = duenos.find(d => d.id === selectedDuenoId)

  return (
    <div className="space-y-6">
      {/* -- Sana Voice Panel -- */}
      <Card className={cn(
        'border-2 transition-colors',
        isActive ? 'border-primary/50 bg-primary/5' : 'border-dashed'
      )}>
        <CardContent className="pt-6">
          {!isActive ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <SanaLogo className="size-10" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Asistente de voz Sana</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Presioná &ldquo;Iniciar Asistente&rdquo; y Sana te guiará paso a paso con la voz.<br />
                  Fecha y hora se llenan automáticamente. Veterinario se puede editar abajo.
                </p>
              </div>
              <Button size="lg" onClick={startAssistant} className="gap-2">
                <Mic className="size-5" />
                Iniciar Asistente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SanaLogo className="size-6" />
                  <span className="text-sm font-semibold text-primary">Sana</span>
                  {listening && !isProcessing && !isSpeaking && (
                    <Badge variant="default" className="gap-1 animate-pulse bg-red-500">
                      <span className="size-1.5 rounded-full bg-white" />
                      Escuchando
                    </Badge>
                  )}
                  {isSpeaking && (
                    <Badge variant="secondary" className="gap-1">
                      <Volume2 className="size-3" />
                      Hablando
                    </Badge>
                  )}
                  {isProcessing && !isSpeaking && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      {convStep === 'extracting' ? 'IA procesando' : 'Procesando'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isFinished && stepIndex >= 0 && (
                    <span className="text-xs text-muted-foreground">
                      Paso {Math.min(stepIndex + 1, PROGRESS_STEPS.length)} de {PROGRESS_STEPS.length}
                    </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={stopAssistant} className="gap-1 text-xs text-destructive">
                    <Square className="size-3" />
                    Detener
                  </Button>
                </div>
              </div>

              {/* Step progress */}
              <div className="flex gap-1">
                {PROGRESS_STEPS.map((label, i) => (
                  <div
                    key={label}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i < stepIndex ? 'bg-primary' :
                      i === stepIndex ? 'bg-primary/50 animate-pulse' :
                      'bg-muted'
                    )}
                  />
                ))}
              </div>

              {/* Sana message */}
              {sanaMessage && (
                <div className="rounded-lg bg-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      {isSpeaking ? (
                        <Volume2 className="size-5 text-primary animate-pulse" />
                      ) : listening && !isProcessing ? (
                        <Mic className="size-5 text-red-500 animate-pulse" />
                      ) : isProcessing ? (
                        <Loader2 className="size-5 text-primary animate-spin" />
                      ) : (
                        <SanaLogo className="size-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sanaMessage}</p>
                      {lastTranscription && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Escuché: &ldquo;{lastTranscription}&rdquo;
                        </p>
                      )}
                      {listening && !isProcessing && !isSpeaking && (
                        <p className="mt-2 text-xs text-green-600 font-medium">
                          Escuchando... hablá cuando quieras
                        </p>
                      )}
                      {isSpeaking && (
                        <p className="mt-2 text-xs text-blue-600 font-medium">
                          Sana está hablando...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sugerencias */}
              {sugerencias && (
                <div className="rounded-lg bg-amber-500/10 p-3 flex items-start gap-2">
                  <Sparkles className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">{sugerencias}</p>
                </div>
              )}

              {/* Finished */}
              {isFinished && (
                <div className="rounded-lg bg-green-500/10 p-4 text-center">
                  <Check className="mx-auto mb-2 size-8 text-green-600" />
                  <p className="text-sm font-medium text-green-700">
                    ¡Formulario completado! Revisá los datos y guardá.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* -- Form -- */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }}
        className="space-y-4"
      >
        {/* Dueño y Mascota (solo lectura cuando el asistente está activo) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Dueño</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
              {selectedDueno ? selectedDueno.nombre : '—'}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mascota <span className="text-destructive">*</span></Label>
            <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
              {formData.id_mascota
                ? mascotas.find(m => m.id === formData.id_mascota)?.nombre || '—'
                : '—'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Veterinario</Label>
            <Select value={formData.id_usuario} onValueChange={v => setFormData(p => ({ ...p, id_usuario: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar veterinario" /></SelectTrigger>
              <SelectContent>
                {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Fecha <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={formData.fecha_date}
                onChange={e => setFormData(p => ({ ...p, fecha_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.fecha_time}
                onChange={e => setFormData(p => ({ ...p, fecha_time: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Voice-filled fields */}
        <div className="space-y-1.5">
          <Label className={cn(convStep === 'ask_clinico' || convStep === 'extracting' ? 'text-primary font-semibold' : '')}>
            Motivo <span className="text-destructive">*</span>
            {formData.motivo && <Check className="ml-1 inline size-3 text-primary" />}
          </Label>
          <Input
            value={formData.motivo}
            onChange={e => setFormData(p => ({ ...p, motivo: e.target.value }))}
            className={cn(convStep === 'ask_clinico' || convStep === 'extracting' ? 'ring-2 ring-primary/50' : '')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={cn(convStep === 'ask_clinico' || convStep === 'extracting' ? 'text-primary font-semibold' : '')}>
              Diagnóstico
              {formData.diagnostico && <Check className="ml-1 inline size-3 text-primary" />}
            </Label>
            <Textarea
              rows={3}
              value={formData.diagnostico}
              onChange={e => setFormData(p => ({ ...p, diagnostico: e.target.value }))}
              className={cn(convStep === 'ask_clinico' || convStep === 'extracting' ? 'ring-2 ring-primary/50' : '')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={cn(convStep === 'ask_clinico' || convStep === 'extracting' ? 'text-primary font-semibold' : '')}>
              Tratamiento
              {formData.tratamiento && <Check className="ml-1 inline size-3 text-primary" />}
            </Label>
            <Textarea
              rows={3}
              value={formData.tratamiento}
              onChange={e => setFormData(p => ({ ...p, tratamiento: e.target.value }))}
              className={cn(convStep === 'ask_clinico' || convStep === 'extracting' ? 'ring-2 ring-primary/50' : '')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className={cn(convStep === 'ask_observaciones' && 'text-primary font-semibold')}>
            Observaciones
            {formData.observaciones && <Check className="ml-1 inline size-3 text-primary" />}
          </Label>
          <Textarea
            rows={2}
            value={formData.observaciones}
            onChange={e => setFormData(p => ({ ...p, observaciones: e.target.value }))}
            className={cn(convStep === 'ask_observaciones' && 'ring-2 ring-primary/50')}
          />
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar consulta'}
          </Button>
        </div>
      </form>
    </div>
  )
}
