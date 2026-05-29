'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SanaLogo } from '@/components/sana-chat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, GitCommit, Code, Bug, Sparkles, Shield, Palette, Wrench, Radio, CreditCard, Layout } from 'lucide-react'

/* ─── Datos del desarrollo ─── */

export interface FaseDesarrollo {
  id: string
  nombre: string
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD
  color: string // clase tailwind bg
  icono: React.ReactNode
  descripcion: string
  commits: number
  features: string[]
}

const FASES: FaseDesarrollo[] = [
  {
    id: 'init',
    nombre: 'Setup inicial & estructura',
    desde: '2026-03-25',
    hasta: '2026-03-25',
    color: 'bg-slate-500',
    icono: <Code className="size-3.5" />,
    descripcion: 'Commit inicial, configuración del proyecto Next.js, estructura base.',
    commits: 4,
    features: ['Next.js + Tailwind', 'Estructura base', 'Auth básica', 'Sidebar inicial'],
  },
  {
    id: 'core',
    nombre: 'Funcionalidades core',
    desde: '2026-03-25',
    hasta: '2026-04-06',
    color: 'bg-blue-500',
    icono: <Wrench className="size-3.5" />,
    descripcion: 'CRUDs de dueños, mascotas, consultas, turnos, vacunas, cirugías, análisis.',
    commits: 3,
    features: ['Chatbot Sana', 'CRUD dueños/mascotas', 'Gestión turnos', 'Historial clínico'],
  },
  {
    id: 'fixes-v1',
    nombre: 'Correcciones & RBAC',
    desde: '2026-04-06',
    hasta: '2026-04-09',
    color: 'bg-amber-500',
    icono: <Bug className="size-3.5" />,
    descripcion: 'Corrección de bugs, control de acceso por roles, creación de usuarios vía API.',
    commits: 8,
    features: ['Control de roles RBAC', 'Creación usuarios server-side', 'Fix scroll sidebar', 'Fix logout', 'Fix refetch masivo'],
  },
  {
    id: 'voz',
    nombre: 'Asistente de voz',
    desde: '2026-04-08',
    hasta: '2026-04-08',
    color: 'bg-purple-500',
    icono: <Radio className="size-3.5" />,
    descripcion: 'Implementación del asistente de voz para consultas.',
    commits: 1,
    features: ['Asistente de voz'],
  },
  {
    id: 'sana-beta',
    nombre: 'Sana IA Beta 1.3',
    desde: '2026-04-23',
    hasta: '2026-04-30',
    color: 'bg-emerald-500',
    icono: <Sparkles className="size-3.5" />,
    descripcion: 'Lanzamiento del asistente Sana con agendamiento por voz, RAG, TTS y mejoras continuas.',
    commits: 6,
    features: ['Agendamiento turnos por voz', 'RAG para consultas clínicas', 'TTS + limpieza markdown', 'Modo voz continua', 'Recomendaciones IA'],
  },
  {
    id: 'dashboard-v2',
    nombre: 'Dashboard & mejoras',
    desde: '2026-05-07',
    hasta: '2026-05-14',
    color: 'bg-cyan-500',
    icono: <Layout className="size-3.5" />,
    descripcion: 'Mejoras masivas al dashboard, historial de peso, workflows, documentos adjuntos.',
    commits: 7,
    features: ['Dashboard rediseñado', 'Weight history', 'Workflows consultas', 'Document handling', 'Spinner / loading states'],
  },
  {
    id: 'sidebar',
    nombre: 'Sidebar & navegación',
    desde: '2026-05-21',
    hasta: '2026-05-21',
    color: 'bg-indigo-500',
    icono: <Layout className="size-3.5" />,
    descripcion: 'Refactor del sidebar con nueva estructura de navegación.',
    commits: 4,
    features: ['Nuevo AppSidebar', 'Menú colapsable', 'Avatar usuario', 'Notificaciones'],
  },
  {
    id: 'landing',
    nombre: 'Landing page pública',
    desde: '2026-05-22',
    hasta: '2026-05-25',
    color: 'bg-orange-500',
    icono: <Layout className="size-3.5" />,
    descripcion: 'Nueva página pública de presentación de la clínica.',
    commits: 2,
    features: ['Página pública', 'Presentación clínica'],
  },
  {
    id: 'security',
    nombre: 'Seguridad & Pagos',
    desde: '2026-05-26',
    hasta: '2026-05-26',
    color: 'bg-rose-500',
    icono: <Shield className="size-3.5" />,
    descripcion: 'Integración de hCaptcha y Mercado Pago para suscripciones.',
    commits: 3,
    features: ['hCaptcha', 'Mercado Pago', 'Suscripciones'],
  },
  {
    id: 'darkmode',
    nombre: 'Modo oscuro',
    desde: '2026-05-26',
    hasta: '2026-05-26',
    color: 'bg-violet-500',
    icono: <Palette className="size-3.5" />,
    descripcion: 'Soporte completo para modo oscuro en toda la app.',
    commits: 1,
    features: ['Dark mode', 'Tema oscuro global'],
  },
]

/* ─── Utils ─── */

function parseDate(s: string) { return new Date(s + 'T00:00:00') }

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDateRange(desde: string, hasta: string) {
  const d = parseDate(desde)
  const h = parseDate(hasta)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  if (d.getMonth() !== h.getMonth() || d.getFullYear() !== h.getFullYear()) {
    return `${d.toLocaleDateString('es', opts)} – ${h.toLocaleDateString('es', { ...opts, year: 'numeric' })}`
  }
  if (d.getTime() === h.getTime()) {
    return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return `${d.getDate()} – ${h.toLocaleDateString('es', opts)}`
}

/* ─── Componente ─── */

export function GanttDesarrollo() {
  const [zoom, setZoom] = useState(1) // 1 = día por px base

  const { dayWidth, totalDays, startDate, endDate, semanas } = useMemo(() => {
    const dates = FASES.flatMap(f => [parseDate(f.desde), parseDate(f.hasta)])
    const start = dates.reduce((a, b) => a < b ? a : b)
    const end = dates.reduce((a, b) => a > b ? a : b)
    const total = diffDays(start, end) + 14 // padding
    const bw = Math.max(10, Math.min(28, zoom * 14))
    const sem: { label: string; start: number; width: number }[] = []
    let cursor = new Date(start)
    while (cursor <= end) {
      const weekEnd = new Date(cursor)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const wStart = diffDays(start, cursor)
      const wEnd = diffDays(start, weekEnd > end ? end : weekEnd)
      sem.push({
        label: cursor.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        start: wStart,
        width: wEnd - wStart + 1,
      })
      cursor.setDate(cursor.getDate() + 7)
    }
    return { dayWidth: bw, totalDays: total, startDate: start, endDate: end, semanas: sem }
  }, [zoom])

  const timelineWidth = totalDays * dayWidth

  return (
    <Card className="overflow-hidden border-white/60 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <SanaLogo className="size-7" color="#2ECC71" />
              <div>
                <CardTitle className="text-xl dark:text-white leading-tight">
                  Sana Vet
                </CardTitle>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
                  Sistema de gestión veterinaria
                </p>
              </div>
            </div>
            <CardDescription className="dark:text-gray-400 mt-2">
              Timeline de desarrollo — {FASES.length} fases,{' '}
              {FASES.reduce((a, f) => a + f.commits, 0)} commits
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
              <ZoomIn className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setZoom(1)}>
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={200}>
          <div className="overflow-x-auto pb-2">
            <div style={{ width: timelineWidth + 180, minWidth: '100%' }}>
              {/* Encabezado con semanas */}
              <div className="flex" style={{ marginLeft: 180 }}>
                <div style={{ width: timelineWidth }} className="relative h-10">
                  {/* Línea base */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-slate-700" />
                  {semanas.map((sem, i) => (
                    <div
                      key={i}
                      className="absolute top-0 flex items-start pt-1"
                      style={{ left: sem.start * dayWidth, width: sem.width * dayWidth }}
                    >
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {sem.label}
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-100 dark:bg-slate-800" />
                    </div>
                  ))}
                  {/* Grid vertical de semanas */}
                  {semanas.map((sem, i) => (
                    <div
                      key={`grid-${i}`}
                      className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800"
                      style={{ left: sem.start * dayWidth }}
                    />
                  ))}
                </div>
              </div>

              {/* Filas de fases */}
              <div className="space-y-1.5 mt-2">
                {FASES.map((fase) => {
                  const desde = parseDate(fase.desde)
                  const hasta = parseDate(fase.hasta)
                  const startOffset = diffDays(startDate, desde)
                  const duracion = diffDays(desde, hasta) + 1
                  const barLeft = startOffset * dayWidth
                  const barWidth = Math.max(duracion * dayWidth, 16)

                  return (
                    <Tooltip key={fase.id}>
                      <TooltipTrigger asChild>
                        <div className="group flex items-center rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {/* Label */}
                          <div className="flex w-[180px] shrink-0 items-center gap-2 pr-3 py-2">
                            <div className={cn('flex size-7 items-center justify-center rounded-full text-white shrink-0', fase.color)}>
                              {fase.icono}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">
                                {fase.nombre}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                {formatDateRange(fase.desde, fase.hasta)}
                              </p>
                            </div>
                          </div>

                          {/* Barra */}
                          <div className="relative flex-1" style={{ height: 28 }}>
                            {/* Grid de fondo */}
                            {semanas.map((sem, i) => (
                              <div
                                key={`grid-row-${i}`}
                                className="absolute inset-y-0 border-l border-slate-100/50 dark:border-slate-800/50"
                                style={{ left: sem.start * dayWidth }}
                              />
                            ))}
                            {/* Barra de la fase */}
                            <div
                              className={cn(
                                'absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2',
                                'shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-y-110',
                                fase.color, 'text-white'
                              )}
                              style={{ left: barLeft, width: barWidth, minWidth: 20 }}
                            >
                              <span className="text-[10px] font-semibold truncate whitespace-nowrap">
                                {duracion}d
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start" className="max-w-xs p-0 overflow-hidden rounded-xl border shadow-xl">
                        <div className={cn('h-1.5 w-full', fase.color)} />
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn('flex size-6 items-center justify-center rounded-full text-white', fase.color)}>
                              {fase.icono}
                            </div>
                            <p className="font-semibold text-sm">{fase.nombre}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{fase.descripcion}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <GitCommit className="size-3.5" />
                            <span>{fase.commits} commits</span>
                            <span>·</span>
                            <span>{formatDateRange(fase.desde, fase.hasta)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {fase.features.map((feat) => (
                              <Badge key={feat} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {feat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fases</span>
                {FASES.map((f) => (
                  <div key={f.id} className="flex items-center gap-1.5">
                    <div className={cn('size-2.5 rounded-full', f.color)} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">{f.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
