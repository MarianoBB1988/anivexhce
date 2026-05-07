'use client'

import { PawPrint, Users, CalendarDays, Stethoscope, TrendingUp, Activity, PieChart, BarChart3, ArrowUpRight, HeartPulse, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useTurnos } from '@/hooks/use-turnos'
import { useConsultas } from '@/hooks/use-consultas'
import { useVacunas } from '@/hooks/use-vacunas'
import { useAnalisis } from '@/hooks/use-analisis'
import { useCirugias } from '@/hooks/use-cirugias'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { 
  Area,
  AreaChart,
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

export function DashboardContent() {
  const { t } = useLanguage()
  const { user, loading: userLoading } = useAuth()
  const { data: mascotas, loading: mascotasLoading } = useMascotas()
  const { data: duenos, loading: duenosLoading } = useDuenos()
  const { data: turnos, loading: turnosLoading } = useTurnos()
  const { data: consultas, loading: consultasLoading } = useConsultas()
  const { data: vacunas, loading: vacunasLoading } = useVacunas()
  const { data: analisis, loading: analisisLoading } = useAnalisis()
  const { data: cirugias, loading: cirugiasLoading } = useCirugias()

  if (userLoading) {
    return <div className="p-8">{t('loading')}</div>
  }

  if (!user) {
    return <div className="p-8 text-red-600">{t('notAuthenticated')}</div>
  }

  // Preparar datos para charts
  const especiesData = mascotas.reduce((acc: Record<string, number>, mascota) => {
    const especie = mascota.especie || 'No especificada'
    acc[especie] = (acc[especie] || 0) + 1
    return acc
  }, {})

  const especiesChartData = Object.entries(especiesData).map(([name, value]) => ({
    name: name.length > 10 ? name.substring(0, 10) + '...' : name,
    value,
    fullName: name
  }))

  const turnosPorEstado = turnos.reduce((acc: Record<string, number>, turno) => {
    acc[turno.estado] = (acc[turno.estado] || 0) + 1
    return acc
  }, {})

  const turnosChartData = Object.entries(turnosPorEstado).map(([name, value]) => ({
    name: name === 'sin_atender' ? 'Pendiente' : 
           name === 'atendido' ? 'Atendido' : 
           name === 'cancelado' ? 'Cancelado' : name,
    value
  }))

  // Datos para línea de tiempo de consultas (últimos 7 días)
  const consultasPorDia = consultas.reduce((acc: Record<string, number>, consulta) => {
    const fecha = new Date(consulta.fecha).toLocaleDateString('es-ES', { weekday: 'short' })
    acc[fecha] = (acc[fecha] || 0) + 1
    return acc
  }, {})

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const consultasChartData = diasSemana.map(dia => ({
    name: dia,
    consultas: consultasPorDia[dia] || 0
  }))

  // Colores para charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
  const pendingAppointments = turnosLoading ? '...' : turnos.filter(t => t.estado === 'sin_atender').length
  const attendedAppointments = turnosLoading ? '...' : turnos.filter(t => t.estado === 'atendido').length
  const weeklyConsultations = consultasLoading ? '...' : consultasChartData.reduce((acc, item) => acc + item.consultas, 0)
  const topSpecies = especiesChartData[0]?.fullName || 'Sin registros'

  const stats = [
    {
      title: t('allPets'),
      value: mascotasLoading ? '...' : mascotas.length,
      change: t('atYourClinic'),
      icon: PawPrint,
      color: 'text-sky-700 dark:text-sky-300',
      bgColor: 'from-sky-100 via-white to-cyan-50 dark:from-sky-950/60 dark:via-slate-900 dark:to-cyan-950/40',
      accent: 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
    },
    {
      title: t('allOwners'),
      value: duenosLoading ? '...' : duenos.length,
      change: t('registered'),
      icon: Users,
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'from-emerald-100 via-white to-teal-50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-teal-950/40',
      accent: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    },
    {
      title: t('upcomingAppointments'),
      value: pendingAppointments,
      change: t('pending'),
      icon: CalendarDays,
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'from-amber-100 via-white to-orange-50 dark:from-amber-950/60 dark:via-slate-900 dark:to-orange-950/40',
      accent: 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    },
    {
      title: t('consultations'),
      value: consultasLoading ? '...' : consultas.length,
      change: t('thisMonth'),
      icon: Stethoscope,
      color: 'text-rose-700 dark:text-rose-300',
      bgColor: 'from-rose-100 via-white to-pink-50 dark:from-rose-950/60 dark:via-slate-900 dark:to-pink-950/40',
      accent: 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
    },
    {
      title: 'Vacunas',
      value: vacunasLoading ? '...' : vacunas.length,
      change: 'Aplicadas',
      icon: Activity,
      color: 'text-violet-700 dark:text-violet-300',
      bgColor: 'from-violet-100 via-white to-fuchsia-50 dark:from-violet-950/60 dark:via-slate-900 dark:to-fuchsia-950/40',
      accent: 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
    },
    {
      title: 'Análisis',
      value: analisisLoading ? '...' : analisis.length,
      change: 'Realizados',
      icon: TrendingUp,
      color: 'text-cyan-700 dark:text-cyan-300',
      bgColor: 'from-cyan-100 via-white to-sky-50 dark:from-cyan-950/60 dark:via-slate-900 dark:to-sky-950/40',
      accent: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
    }
  ]

  const highlightCards = [
    {
      title: 'Pendientes hoy',
      value: pendingAppointments,
      description: 'Turnos esperando atención',
      icon: CalendarDays,
      tone: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Atendidos',
      value: attendedAppointments,
      description: 'Consultas ya resueltas',
      icon: HeartPulse,
      tone: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Consultas semana',
      value: weeklyConsultations,
      description: 'Ritmo clínico semanal',
      icon: Sparkles,
      tone: 'from-sky-500 to-indigo-500',
    },
    {
      title: 'Especie líder',
      value: topSpecies,
      description: 'Mayor presencia en la clínica',
      icon: PawPrint,
      tone: 'from-fuchsia-500 to-rose-500',
    },
  ]

  const renderChartTooltip = (props: any) => {
    const { active, payload, label } = props
    if (!active || !payload?.length) return null

    return (
      <div className="rounded-2xl border border-white/70 bg-white/95 px-3 py-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        {label ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p> : null}
        <div className="mt-1 space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.fill || '#0ea5e9' }}
              />
              <span>{entry.name || entry.payload?.fullName || entry.dataKey}</span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(240,249,255,0.9)_45%,_rgba(236,253,245,0.92))] p-6 shadow-[0_24px_80px_-36px_rgba(14,116,144,0.45)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(17,24,39,0.95)_50%,_rgba(15,23,42,0.98))]">
        <div className="absolute -left-12 top-8 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/20" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Panel clínico con foco operativo
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                {t('welcome')}, {user.nombre}. Tu clínica se ve mejor cuando la información tiene jerarquía.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                {t('clinicOverview')} con una lectura más rápida de pacientes, turnos y carga clínica semanal.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {highlightCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {card.title}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                    <div className={cn('rounded-2xl bg-gradient-to-br p-2.5 text-white shadow-lg', card.tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.slice(0, 4).map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={cn(
                'overflow-hidden border-white/60 bg-gradient-to-br shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:-translate-y-1 dark:border-white/10',
                stat.bgColor,
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                      {stat.title}
                    </CardDescription>
                    <CardTitle className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={cn('rounded-2xl p-3 shadow-sm', stat.accent)}>
                    <Icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <p className="text-sm text-slate-600 dark:text-slate-300">{stat.change}</p>
                <ArrowUpRight className={cn('h-4 w-4', stat.color)} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {stats.slice(4).map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={cn(
                'overflow-hidden border-white/60 bg-gradient-to-br shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:-translate-y-1 dark:border-white/10',
                stat.bgColor,
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                      {stat.title}
                    </CardDescription>
                    <CardTitle className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={cn('rounded-2xl p-3 shadow-sm', stat.accent)}>
                    <Icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <p className="text-sm text-slate-600 dark:text-slate-300">{stat.change}</p>
                <ArrowUpRight className={cn('h-4 w-4', stat.color)} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Distribución de especies */}
        <Card className="overflow-hidden border-white/60 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <span className="rounded-xl bg-sky-500/10 p-2 text-sky-700 dark:text-sky-300">
                <PieChart className="h-5 w-5" />
              </span>
              Distribución de especies
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Tipos de mascotas en la clínica</CardDescription>
          </CardHeader>
          <CardContent>
            {mascotasLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : especiesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <defs>
                    <filter id="speciesGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.12" />
                    </filter>
                  </defs>
                  <Pie
                    data={especiesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={86}
                    paddingAngle={3}
                    cornerRadius={10}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                    labelLine={false}
                    fill="#8884d8"
                    dataKey="value"
                    filter="url(#speciesGlow)"
                  >
                    {especiesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderChartTooltip} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No hay datos de mascotas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Estado de turnos */}
        <Card className="overflow-hidden border-white/60 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                <BarChart3 className="h-5 w-5" />
              </span>
              Estado de turnos
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {turnosLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : turnosChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={turnosChartData}>
                  <defs>
                    <linearGradient id="appointmentsBars" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#cbd5e1" opacity={0.45} />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={renderChartTooltip} />
                  <Bar dataKey="value" name="Cantidad" fill="url(#appointmentsBars)" radius={[12, 12, 6, 6]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No hay datos de turnos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Consultas por día */}
        <Card className="overflow-hidden border-white/60 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <span className="rounded-xl bg-orange-500/10 p-2 text-orange-700 dark:text-orange-300">
                <TrendingUp className="h-5 w-5" />
              </span>
              Consultas por día de la semana
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Actividad semanal de consultas</CardDescription>
          </CardHeader>
          <CardContent>
            {consultasLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={consultasChartData}>
                  <defs>
                    <linearGradient id="weeklyConsultationsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#cbd5e1" opacity={0.45} />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={renderChartTooltip} />
                  <Area type="monotone" dataKey="consultas" stroke="none" fill="url(#weeklyConsultationsFill)" />
                  <Line 
                    type="monotone" 
                    dataKey="consultas" 
                    name="Consultas" 
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 0, fill: '#f97316' }}
                    activeDot={{ r: 7, strokeWidth: 3, stroke: '#fff', fill: '#f97316' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos Turnos */}
      <Card className="overflow-hidden border-white/60 bg-white/80 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <CardHeader>
          <CardTitle className="dark:text-white">{t('upcomingAppointments')}</CardTitle>
          <CardDescription className="dark:text-gray-400">{t('pendingAppointmentsNextDays')}</CardDescription>
        </CardHeader>
        <CardContent>
          {turnosLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : turnos.filter(t => t.estado === 'sin_atender').length > 0 ? (
            <div className="space-y-4">
              {turnos
                .filter(t => t.estado === 'sin_atender')
                .slice(0, 5)
                .map((turno) => (
                  <div key={turno.id} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div>
                      <div className="font-medium dark:text-white">
                        {turno.mascotas?.nombre || `Mascota #${turno.id_mascota}`}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(turno.fecha_hora).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        turno.estado === 'sin_atender' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        turno.estado === 'atendido' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {turno.estado === 'sin_atender' ? 'Pendiente' :
                         turno.estado === 'atendido' ? 'Atendido' : 'Cancelado'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay turnos pendientes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}