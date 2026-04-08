'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Loader2, Volume2, Check, Square, ChevronsUpDown } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
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

/* -- Voice steps: solo los campos de texto/voz (motivo en adelante) -- */
type VoiceStepKey = 'motivo' | 'diagnostico' | 'tratamiento' | 'observaciones'

interface VoiceStep {
  key: VoiceStepKey
  label: string
  question: string
  required?: boolean
}

const VOICE_STEPS: VoiceStep[] = [
  { key: 'motivo',        label: 'Motivo',        question: '¿Cuál es el motivo de la consulta?',       required: true },
  { key: 'diagnostico',   label: 'Diagnóstico',   question: '¿Cuál es el diagnóstico?' },
  { key: 'tratamiento',   label: 'Tratamiento',   question: '¿Qué tratamiento se indica?' },
  { key: 'observaciones', label: 'Observaciones',  question: '¿Alguna observación adicional?' },
]

/* -- Silence detection constants (same as HF Space) -- */
const SILENCE_THRESHOLD = 0.04
const SILENCE_DURATION = 1600
const MIN_AUDIO_SIZE = 1000

/* -- TTS helper (Edge-TTS via /api/sana/tts) -- */
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
    if (!res.ok) {
      console.warn('[TTS] Error:', res.status)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    return new Promise<void>((resolve) => {
      const audio = new Audio(url)
      currentAudio = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      }
      audio.play().catch(() => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      })
    })
  } catch (err) {
    console.warn('[TTS] Fetch error:', err)
  }
}

/* -- Props -- */
interface Props {
  duenos?: Dueno[]
  mascotas?: Mascota[]
  usuarios: Usuario[]
  loading?: boolean
  onSubmit: (data: ConsultaFormVozData) => Promise<void>
  onCancel: () => void
}

/* -- Component -- */
export function ConsultaFormVoz({
  duenos = [],
  mascotas = [],
  usuarios,
  loading = false,
  onSubmit,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState<ConsultaFormVozData>({
    ...emptyConsultaFormVoz,
    fecha_date: new Date().toISOString().split('T')[0],
    fecha_time: new Date().toTimeString().slice(0, 5),
  })
  const [selectedDuenoId, setSelectedDuenoId] = useState('')
  const [duenoOpen, setDuenoOpen] = useState(false)

  // Voice assistant state
  const [voiceStep, setVoiceStep] = useState(-1) // -1 = not started
  const [listening, setListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastTranscription, setLastTranscription] = useState('')
  const [stepStatus, setStepStatus] = useState<Record<number, 'done' | 'skipped'>>({})

  // Audio refs for continuous listening (silence detection like HF Space)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const activoRef = useRef(false)
  const procesandoRef = useRef(false)
  const voiceStepRef = useRef(-1)

  // Keep refs in sync with state
  useEffect(() => { voiceStepRef.current = voiceStep }, [voiceStep])
  useEffect(() => { procesandoRef.current = isProcessing }, [isProcessing])

  const filteredMascotas = selectedDuenoId
    ? mascotas.filter(m => m.id_dueno === selectedDuenoId)
    : mascotas

  /* -- Audio setup (same pattern as HF Space) -- */
  const conectarAudio = useCallback(async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.close().catch(() => {})
    }
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
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const recorder = new MediaRecorder(streamRef.current!, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start(100)
    mediaRecorderRef.current = recorder
  }, [])

  /* -- Process recorded audio -- */
  const processAudio = useCallback(async (blob: Blob) => {
    setIsProcessing(true)
    setLastTranscription('')

    // Stop mic to avoid echo while Sana speaks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    try {
      const fd = new FormData()
      fd.append('audio', blob, 'audio.webm')
      const res = await fetch('/api/sana/transcribe', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error de transcripción')

      const transcripcion = (data.transcripcion || '').trim()
      setLastTranscription(transcripcion)

      if (!transcripcion) {
        setIsProcessing(false)
        await reanudarEscucha()
        return
      }

      // Write transcription into the current step field
      const step = VOICE_STEPS[voiceStepRef.current]
      if (step) {
        setFormData(prev => ({ ...prev, [step.key]: transcripcion }))
        setStepStatus(prev => ({ ...prev, [voiceStepRef.current]: 'done' }))
      }

      // Confirm and advance
      const next = voiceStepRef.current + 1
      if (next < VOICE_STEPS.length) {
        setIsSpeaking(true)
        await speak('Perfecto.')
        setVoiceStep(next)
        await speak(VOICE_STEPS[next].question)
        setIsSpeaking(false)
      } else {
        setIsSpeaking(true)
        setVoiceStep(VOICE_STEPS.length)
        await speak('¡Listo! Ya completamos todos los campos. Revisá el formulario y guardá cuando estés conforme.')
        setIsSpeaking(false)
        setIsProcessing(false)
        activoRef.current = false
        setListening(false)
        return
      }

      setIsProcessing(false)
      await reanudarEscucha()
    } catch (err: any) {
      console.error('[Voice error]', err)
      setIsSpeaking(true)
      await speak('No pude procesar el audio. Intentá de nuevo.')
      setIsSpeaking(false)
      setIsProcessing(false)
      await reanudarEscucha()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -- Silence detection loop (same as HF Space) -- */
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
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i]
      }
      const rms = Math.sqrt(sum / buffer.length)

      if (rms < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now()
        const tiempoSilencio = Date.now() - silenceStart

        if (haHablado && tiempoSilencio > SILENCE_DURATION && chunksRef.current.length > 5) {
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

    // Stop recorder and wait for last chunk
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const stopPromise = new Promise<void>(resolve => {
        mediaRecorderRef.current!.onstop = () => resolve()
      })
      mediaRecorderRef.current.stop()
      await stopPromise
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
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

  /* -- Resume listening (reopen mic after Sana speaks) -- */
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
  }, [conectarAudio, iniciarGrabacion, detectarSilencio])

  /* -- Start voice assistant -- */
  const startAssistant = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('No se pudo acceder al micrófono. Verificá los permisos del navegador.')
      return
    }

    activoRef.current = true
    setVoiceStep(0)
    setStepStatus({})
    setLastTranscription('')

    // Sana greets and asks first question
    setIsSpeaking(true)
    await speak('Soy Sana. Completá dueño, mascota y veterinario en el formulario. Después te pregunto el resto con la voz.')
    await speak(VOICE_STEPS[0].question)
    setIsSpeaking(false)

    // Start continuous listening
    await conectarAudio()
    iniciarGrabacion()
    detectarSilencio()
    setListening(true)
  }, [conectarAudio, iniciarGrabacion, detectarSilencio])

  /* -- Stop assistant -- */
  const stopAssistant = useCallback(() => {
    activoRef.current = false
    stopSpeaking()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
    }
    setListening(false)
    setIsProcessing(false)
    setIsSpeaking(false)
    setVoiceStep(-1)
    setStepStatus({})
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

  const isFinished = voiceStep >= VOICE_STEPS.length
  const isActive = voiceStep >= 0
  const currentVoiceStep = VOICE_STEPS[voiceStep] ?? null

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
                  Primero seleccioná dueño, mascota y veterinario abajo.<br />
                  Después presioná &ldquo;Iniciar Asistente&rdquo; y Sana te preguntará el resto con la voz.
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
                      Procesando
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isFinished && (
                    <span className="text-xs text-muted-foreground">
                      Paso {voiceStep + 1} de {VOICE_STEPS.length}
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
                {VOICE_STEPS.map((s, i) => (
                  <div
                    key={s.key}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      stepStatus[i] === 'done' ? 'bg-primary' :
                      i === voiceStep ? 'bg-primary/50 animate-pulse' :
                      'bg-muted'
                    )}
                  />
                ))}
              </div>

              {/* Current question */}
              {currentVoiceStep && !isFinished && (
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
                      <Badge variant="outline" className="mb-2">{currentVoiceStep.label}</Badge>
                      <p className="text-sm font-medium">{currentVoiceStep.question}</p>
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
        {/* Manual selects: dueño, mascota, veterinario, fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Dueño</Label>
            <Popover open={duenoOpen} onOpenChange={setDuenoOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{duenos.find(d => d.id === selectedDuenoId)?.nombre || 'Seleccionar dueño'}</span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar dueño..." />
                  <CommandList>
                    <CommandEmpty>No encontrado.</CommandEmpty>
                    <CommandGroup>
                      {duenos.map(d => (
                        <CommandItem key={d.id} value={d.nombre} onSelect={() => {
                          setSelectedDuenoId(d.id)
                          setFormData(p => ({ ...p, id_mascota: '', _duenoId: d.id }))
                          setDuenoOpen(false)
                        }}>
                          <Check className={cn('mr-2 size-4', selectedDuenoId === d.id ? 'opacity-100' : 'opacity-0')} />
                          {d.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label>Mascota <span className="text-destructive">*</span></Label>
            <Select
              value={formData.id_mascota}
              onValueChange={v => setFormData(p => ({ ...p, id_mascota: v }))}
              disabled={!selectedDuenoId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedDuenoId ? 'Seleccionar mascota' : 'Primero seleccioná el dueño'} />
              </SelectTrigger>
              <SelectContent>
                {filteredMascotas.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
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

        {/* Voice-filled fields: motivo, diagnóstico, tratamiento, observaciones */}
        <div className="space-y-1.5">
          <Label className={cn(voiceStep === 0 && 'text-primary font-semibold')}>
            Motivo <span className="text-destructive">*</span>
            {stepStatus[0] === 'done' && <Check className="ml-1 inline size-3 text-primary" />}
          </Label>
          <Input
            value={formData.motivo}
            onChange={e => setFormData(p => ({ ...p, motivo: e.target.value }))}
            className={cn(voiceStep === 0 && 'ring-2 ring-primary/50')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={cn(voiceStep === 1 && 'text-primary font-semibold')}>
              Diagnóstico
              {stepStatus[1] === 'done' && <Check className="ml-1 inline size-3 text-primary" />}
            </Label>
            <Textarea
              rows={3}
              value={formData.diagnostico}
              onChange={e => setFormData(p => ({ ...p, diagnostico: e.target.value }))}
              className={cn(voiceStep === 1 && 'ring-2 ring-primary/50')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={cn(voiceStep === 2 && 'text-primary font-semibold')}>
              Tratamiento
              {stepStatus[2] === 'done' && <Check className="ml-1 inline size-3 text-primary" />}
            </Label>
            <Textarea
              rows={3}
              value={formData.tratamiento}
              onChange={e => setFormData(p => ({ ...p, tratamiento: e.target.value }))}
              className={cn(voiceStep === 2 && 'ring-2 ring-primary/50')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className={cn(voiceStep === 3 && 'text-primary font-semibold')}>
            Observaciones
            {stepStatus[3] === 'done' && <Check className="ml-1 inline size-3 text-primary" />}
          </Label>
          <Textarea
            rows={2}
            value={formData.observaciones}
            onChange={e => setFormData(p => ({ ...p, observaciones: e.target.value }))}
            className={cn(voiceStep === 3 && 'ring-2 ring-primary/50')}
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
