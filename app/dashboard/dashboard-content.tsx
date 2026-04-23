'use client'

import { PawPrint, Users, CalendarDays, Stethoscope, TrendingUp, Activity, PieChart, BarChart3 } from 'lucide-react'
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
import { 
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

  const stats = [
    {
      title: t('allPets'),
      value: mascotasLoading ? '...' : mascotas.length,
      change: t('atYourClinic'),
      icon: PawPrint,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: t('allOwners'),
      value: duenosLoading ? '...' : duenos.length,
      change: t('registered'),
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: t('upcomingAppointments'),
      value: turnosLoading ? '...' : turnos.filter(t => t.estado === 'sin_atender').length,
      change: t('pending'),
      icon: CalendarDays,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: t('consultations'),
      value: consultasLoading ? '...' : consultas.length,
      change: t('thisMonth'),
      icon: Stethoscope,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Vacunas',
      value: vacunasLoading ? '...' : vacunas.length,
      change: 'Aplicadas',
      icon: Activity,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Análisis',
      value: analisisLoading ? '...' : analisis.length,
      change: 'Realizados',
      icon: TrendingUp,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('welcome')}, {user.nombre}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('clinicOverview')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`${stat.bgColor} border-0 dark:border dark:border-gray-800`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                  {stat.title}
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Distribución de especies */}
        <Card className="dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                  <Pie
                    data={especiesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {especiesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [
                    value, 
                    props.payload.fullName || name
                  ]} />
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
        <Card className="dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad" fill="#8884d8" />
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
        <Card className="md:col-span-2 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Consultas por día de la semana
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Actividad semanal de consultas</CardDescription>
          </CardHeader>
          <CardContent>
            {consultasLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={consultasChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="consultas" 
                    name="Consultas" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos Turnos */}
      <Card className="dark:border-gray-800">
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
                  <div key={turno.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-800">
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