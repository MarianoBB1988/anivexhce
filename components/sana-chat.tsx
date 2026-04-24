'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Loader2, ChevronDown, Plus, MessageSquare, Trash2, History, ArrowLeft, Maximize2, Minimize2, Mic, Volume2, Square } from 'lucide-react'

export function SanaLogo({ className, color = '#2ECC71' }: { className?: string; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g transform="translate(10,10)">
        <path d="M 0 30 L 15 0 L 40 15 L 65 0 L 80 30 L 80 60 L 55 80 L 25 80 L 0 60 Z"
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="25" cy="45" r="5" fill={color}/>
        <rect x="23" y="55" width="4" height="15" rx="2" fill={color}/>
        <circle cx="55" cy="45" r="12" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="55" cy="45" r="4" fill={color}/>
      </g>
    </svg>
  )
}
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

const WELCOME: Message = {
  role: 'assistant',
  content: '¡Hola! Soy **Sana IA**, tu asistente veterinaria especializada en investigación clínica. ¿En qué puedo ayudarte hoy?',
}

const LS_KEY = 'sana_conversations'

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Conversation[]) : []
  } catch {
    return []
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(convs))
  } catch {}
}

export function SanaChat() {
  const [open, setOpen] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Voice state
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceSpeaking, setVoiceSpeaking] = useState(false) // Sana is speaking aloud
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [voiceMode, setVoiceMode] = useState(false) // continuous voice conversation mode
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const voiceActiveRef = useRef(false)
  const voiceProcessingRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Strip markdown formatting for TTS (remove **, *, `, #, etc.)
  const limpiarMarkdown = useCallback((texto: string): string => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '$1')       // **negritas** → texto
      .replace(/\*(.*?)\*/g, '$1')            // *cursiva* → texto
      .replace(/`(.*?)`/g, '$1')              // `código` → texto
      .replace(/^#{1,6}\s+/gm, '')            // # Títulos → texto
      .replace(/^[-*+]\s+/gm, '')             // - listas → texto
      .replace(/^\d+\.\s+/gm, '')             // 1. listas → texto
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url) → texto
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // ![img](url) → texto
      .replace(/>\s+/g, '')                   // > citas → texto
      .replace(/\n{2,}/g, '\n')               // múltiples saltos → uno
      .trim()
  }, [])

  // TTS: speak text aloud (truncate to 500 chars for TTS limit)
  const speakText = useCallback(async (text: string) => {
    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
    // Strip markdown and truncate to 500 chars for TTS limit
    const textoLimpio = limpiarMarkdown(text)
    const ttsText = textoLimpio.length > 500 ? textoLimpio.slice(0, 497) + '...' : textoLimpio
    try {
      const res = await fetch('/api/sana/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText }),
      })
      if (!res.ok) {
        console.warn('[TTS] Error:', res.status)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      return new Promise<void>((resolve) => {
        const audio = new Audio(url)
        currentAudioRef.current = audio
        audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve() }
        audio.play().catch(() => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve() })
      })
    } catch (err) {
      console.warn('[TTS] Error:', err)
    }
  }, [])

  // Transcribe audio blob
  const transcribir = useCallback(async (blob: Blob): Promise<string> => {
    const fd = new FormData()
    fd.append('audio', blob, 'audio.webm')
    const res = await fetch('/api/sana/transcribe', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error de transcripción')
    return (data.transcripcion || '').trim()
  }, [])

  // ── Continuous voice conversation mode ──
  const SILENCE_THRESHOLD = 0.04
  const SILENCE_DURATION = 1200

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

  const detectarSilencio = useCallback(() => {
    if (!voiceActiveRef.current || voiceProcessingRef.current) return
    const analyser = analyserRef.current
    if (!analyser) return

    const buffer = new Float32Array(analyser.fftSize)
    let silenceStart: number | null = null
    let haHablado = false

    function loop() {
      if (!voiceActiveRef.current || voiceProcessingRef.current) return

      analyser!.getFloatTimeDomainData(buffer)
      let sum = 0
      for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
      const rms = Math.sqrt(sum / buffer.length)

      if (rms < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now()
        const tiempoSilencio = Date.now() - silenceStart
        if (haHablado && tiempoSilencio > SILENCE_DURATION && chunksRef.current.length > 5) {
          procesarYEnviar()
          return
        }
      } else {
        silenceStart = null
        haHablado = true
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }, [])

  const procesarYEnviar = useCallback(async () => {
    if (voiceProcessingRef.current || !voiceActiveRef.current) return
    voiceProcessingRef.current = true
    setVoiceProcessing(true)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const stopPromise = new Promise<void>(resolve => { mediaRecorderRef.current!.onstop = () => resolve() })
      mediaRecorderRef.current.stop()
      await stopPromise
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })

    if (blob.size < 1000) {
      voiceProcessingRef.current = false
      setVoiceProcessing(false)
      iniciarGrabacion()
      detectarSilencio()
      return
    }

    try {
      const text = await transcribir(blob)
      if (text && voiceActiveRef.current) {
        // Send the message directly
        const newMessages: Message[] = [...messages, { role: 'user', content: text }]
        setMessages(newMessages)

        const currentActiveId = activeId
        setLoading(true)

        const res = await fetch('/api/sana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error desconocido')

        const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: data.reply }]
        setMessages(finalMessages)

        // Show "Sana está hablando" while TTS plays
        setVoiceProcessing(false)
        setVoiceSpeaking(true)
        const replyIndex = finalMessages.length - 1
        setSpeakingIndex(replyIndex)
        await speakText(data.reply)
        setSpeakingIndex(null)
        setVoiceSpeaking(false)

        // Save conversation
        if (currentActiveId) {
          setConversations(prev => {
            const updated = prev.map(c =>
              c.id === currentActiveId ? { ...c, messages: finalMessages } : c
            )
            saveConversations(updated)
            return updated
          })
        } else {
          const title = text.length > 42 ? text.slice(0, 42) + '…' : text
          const newConv: Conversation = {
            id: crypto.randomUUID(),
            title,
            messages: finalMessages,
            createdAt: Date.now(),
          }
          setActiveId(newConv.id)
          setConversations(prev => {
            const updated = [newConv, ...prev]
            saveConversations(updated)
            return updated
          })
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'No se pudo obtener respuesta. Intentá de nuevo.'}`,
      }])
    } finally {
      setLoading(false)
      voiceProcessingRef.current = false
      setVoiceProcessing(false)
      setVoiceSpeaking(false)
      // Resume listening if still in voice mode
      if (voiceActiveRef.current) {
        iniciarGrabacion()
        detectarSilencio()
      }
    }
  }, [transcribir, speakText, messages, activeId, iniciarGrabacion, detectarSilencio])

  const startVoiceMode = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      voiceActiveRef.current = true
      setVoiceMode(true)
      setVoiceListening(false) // no listening yet, Sana will speak first
      await conectarAudio()

      // Sana saluda primero
      const saludo = '¡Hola! Soy Sana, tu asistente veterinaria. Decime, ¿en qué puedo ayudarte?'
      setSpeakingIndex(0)
      await speakText(saludo)
      setSpeakingIndex(null)

      // Ahora sí, empezar a escuchar
      setVoiceListening(true)
      iniciarGrabacion()
      detectarSilencio()
    } catch {
      alert('No se pudo acceder al micrófono. Verificá los permisos del navegador.')
    }
  }, [conectarAudio, iniciarGrabacion, detectarSilencio, speakText])

  const stopVoiceMode = useCallback(() => {
    voiceActiveRef.current = false
    voiceProcessingRef.current = false
    setVoiceMode(false)
    setVoiceListening(false)
    setVoiceProcessing(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
  }, [])

  useEffect(() => {
    setConversations(loadConversations())
  }, [])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const startNew = useCallback(() => {
    setActiveId(null)
    setMessages([WELCOME])
    setInput('')
    setShowHistory(false)
  }, [])

  const openConversation = useCallback((conv: Conversation) => {
    setActiveId(conv.id)
    setMessages(conv.messages)
    setInput('')
    setShowHistory(false)
  }, [])

  const deleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveConversations(updated)
      return updated
    })
    if (activeId === id) {
      setActiveId(null)
      setMessages([WELCOME])
    }
  }, [activeId])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // capture activeId at call time (before any async state changes)
    const currentActiveId = activeId

    try {
      const res = await fetch('/api/sana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')

      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: data.reply }]
      setMessages(finalMessages)

      // Auto-speak the response
      const replyIndex = finalMessages.length - 1
      setSpeakingIndex(replyIndex)
      speakText(data.reply).finally(() => setSpeakingIndex(null))

      if (currentActiveId) {
        setConversations(prev => {
          const updated = prev.map(c =>
            c.id === currentActiveId ? { ...c, messages: finalMessages } : c
          )
          saveConversations(updated)
          return updated
        })
      } else {
        const title = text.length > 42 ? text.slice(0, 42) + '…' : text
        const newConv: Conversation = {
          id: crypto.randomUUID(),
          title,
          messages: finalMessages,
          createdAt: Date.now(),
        }
        setActiveId(newConv.id)
        setConversations(prev => {
          const updated = [newConv, ...prev]
          saveConversations(updated)
          return updated
        })
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'No se pudo obtener respuesta. Intentá de nuevo.'}`,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < arr.length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95',
          open && 'hidden'
        )}
        aria-label="Abrir asistente Sana IA"
      >
        <SanaLogo className="size-6" color="white" />
        <span className="text-sm font-semibold">Sana IA</span>
      </button>

      {/* Chat modal */}
      {open && (
        <div className={cn(
          'fixed z-50 flex flex-col overflow-hidden bg-background shadow-2xl transition-all duration-300',
          maximized
            ? 'inset-0 rounded-none border-0 sm:flex-row'
            : 'bottom-0 right-0 h-[85dvh] w-full rounded-t-2xl border-t border-border sm:bottom-6 sm:right-6 sm:h-[580px] sm:max-h-[calc(100vh-5rem)] sm:w-[min(800px,calc(100vw-3rem))] sm:flex-row sm:rounded-2xl sm:border'
        )}>

          {/* ── Left sidebar (hidden on mobile) ── */}
          <div className={cn(
            'absolute inset-0 z-10 flex flex-col bg-background sm:static sm:flex sm:shrink-0 sm:border-r sm:bg-muted/40',
            maximized ? 'sm:w-64' : 'sm:w-52',
            showHistory ? 'flex' : 'hidden sm:flex'
          )}>
            <div className="flex items-center justify-between border-b px-3 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Historial
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={startNew}
                  title="Nueva conversación"
                >
                  <Plus className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 sm:hidden text-muted-foreground hover:text-foreground"
                  onClick={() => setShowHistory(false)}
                  title="Cerrar historial"
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Sin conversaciones aún
                </p>
              ) : (
                <div className="space-y-0.5 p-1.5">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openConversation(conv)}
                      onKeyDown={e => e.key === 'Enter' && openConversation(conv)}
                      className={cn(
                        'group relative w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted',
                        activeId === conv.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-start gap-1.5 pr-5">
                        <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground/60" />
                        <span className={cn(
                          'line-clamp-2 text-[11px] leading-snug text-foreground/70',
                          activeId === conv.id && 'font-medium text-foreground'
                        )}>
                          {conv.title}
                        </span>
                      </div>
                      {/* Delete on hover */}
                      <button
                        onClick={e => deleteConversation(conv.id, e)}
                        className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-destructive group-hover:flex"
                        title="Eliminar"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ── Main chat area ── */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/20 p-1">
                  <SanaLogo className="size-full" color="white" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Sana IA</p>
                  <p className="text-xs text-primary-foreground/70">Asistente veterinaria IA</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* History button — mobile only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 sm:hidden text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                  onClick={() => setShowHistory(true)}
                  title="Historial"
                >
                  <History className="size-4" />
                </Button>
                {/* Nueva visible only on mobile (sidebar hidden there) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 sm:hidden text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                  onClick={startNew}
                  title="Nueva conversación"
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                  onClick={() => setMaximized(m => !m)}
                  aria-label={maximized ? 'Restaurar' : 'Maximizar'}
                  title={maximized ? 'Restaurar' : 'Maximizar'}
                >
                  {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </Button>
                {!maximized && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                    onClick={() => setOpen(false)}
                    aria-label="Minimizar"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                  onClick={() => { setOpen(false); setMaximized(false) }}
                  aria-label="Cerrar"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Messages - hidden in voice mode */}
            {voiceMode ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
                {/* Sana logo grande */}
                <div className={cn(
                  'mb-6 flex size-28 items-center justify-center rounded-full transition-all duration-[1500ms]',
                  voiceSpeaking
                    ? 'bg-primary/15 animate-sana-speak'
                    : voiceProcessing
                      ? 'bg-amber-500/10 shadow-[0_0_30px_10px_rgba(245,158,11,0.3)]'
                      : voiceListening
                        ? 'bg-primary/10 shadow-[0_0_30px_10px_rgba(46,204,113,0.4)] animate-pulse'
                        : 'bg-primary/5'
                )}>
                  <SanaLogo className={cn(
                    'size-16 transition-all duration-500',
                    voiceSpeaking && 'scale-110',
                    voiceListening && 'scale-110'
                  )} />
                </div>
                {/* Mic icon */}
                <div className={cn(
                  'flex size-16 items-center justify-center rounded-full transition-all duration-300',
                  voiceSpeaking
                    ? 'bg-primary/20 shadow-[0_0_20px_8px_rgba(46,204,113,0.5)] animate-sana-speak'
                    : voiceProcessing
                      ? 'bg-amber-500/20'
                      : voiceListening
                        ? 'bg-red-500/20 shadow-[0_0_20px_8px_rgba(239,68,68,0.4)] animate-pulse'
                        : 'bg-primary/10'
                )}>
                  {voiceProcessing ? (
                    <Loader2 className="size-8 text-amber-500 animate-spin" />
                  ) : voiceSpeaking ? (
                    <Volume2 className="size-8 text-primary" />
                  ) : (
                    <Mic className={cn('size-8', voiceListening ? 'text-red-500' : 'text-primary')} />
                  )}
                </div>
                {/* Status text */}
                <p className="mt-4 text-sm font-medium text-foreground">
                  {voiceSpeaking
                    ? 'Sana está hablando...'
                    : voiceProcessing
                      ? 'Sana está procesando...'
                      : voiceListening
                        ? 'Escuchando... hablá cuando quieras'
                        : 'Preparando micrófono...'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {voiceSpeaking
                    ? 'Escuchá con atención'
                    : voiceProcessing
                      ? 'Un momento por favor'
                      : voiceListening
                        ? 'Sana detecta silencio automáticamente'
                        : 'Iniciando...'}
                </p>
              </div>
            ) : (
              <ScrollArea className="min-h-0 flex-1 px-4 py-3">
                <div className={cn('space-y-3', maximized && 'mx-auto max-w-3xl')}>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className={cn(
                          'mr-2 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full p-0.5',
                          speakingIndex === i
                            ? 'bg-primary/20 shadow-[0_0_12px_4px_rgba(46,204,113,0.5)] animate-pulse'
                            : 'bg-primary/10'
                        )}>
                          <SanaLogo className="size-full" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                          msg.role === 'user'
                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                            : 'rounded-bl-sm bg-muted text-foreground'
                        )}
                      >
                        {formatContent(msg.content)}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                    <div className="mr-2 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 p-0.5">
                      <SanaLogo className="size-full" />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
            )}

            {/* Input / Voice mode indicator */}
            <div className={cn('shrink-0 border-t p-3', maximized && 'pb-6')}>
              {voiceMode ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-full',
                      voiceProcessing
                        ? 'bg-amber-500/20'
                        : voiceListening
                          ? 'bg-red-500/20 shadow-[0_0_16px_6px_rgba(239,68,68,0.4)] animate-pulse'
                          : 'bg-primary/10'
                    )}>
                      {voiceProcessing ? (
                        <Loader2 className="size-5 text-amber-500 animate-spin" />
                      ) : (
                        <Mic className={cn('size-5', voiceListening ? 'text-red-500' : 'text-primary')} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {voiceProcessing
                          ? 'Procesando...'
                          : voiceListening
                            ? 'Escuchando... hablá cuando quieras'
                            : 'Modo voz activo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {voiceProcessing
                          ? 'Sana está procesando lo que dijiste'
                          : voiceListening
                            ? 'Sana detecta silencio automáticamente'
                            : 'Preparando micrófono...'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopVoiceMode}
                      className="gap-1"
                    >
                      <Square className="size-3" />
                      Detener
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={cn('flex items-end gap-2', maximized && 'mx-auto max-w-3xl')}>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí tu consulta... (Enter para enviar)"
                    className="max-h-28 min-h-[40px] resize-none text-sm"
                    rows={1}
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={startVoiceMode}
                    disabled={loading}
                    aria-label="Modo conversación por voz"
                    title="Charlar con Sana por voz"
                  >
                    <Mic className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="shrink-0"
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    aria-label="Enviar"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>
              )}
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Sana IA puede cometer errores. Verificá información crítica.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}