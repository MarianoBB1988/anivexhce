'use client'

import { PawPrint, Users, CalendarDays, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { useMascotas } from '@/hooks/use-mascotas'
import { useDuenos } from '@/hooks/use-duenos'
import { useTurnos } from '@/hooks/use-turnos'
import { useConsultas } from '@/hooks/use-consultas'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardContent() {
  const { t } = useLanguage()
  const { user, loading: userLoading } = useAuth()
  const { data: mascotas, loading: mascotasLoading } = useMascotas()
  const { data: duenos, loading: duenosLoading } = useDuenos()
  const { data: turnos, loading: turnosLoading } = useTurnos()
  const { data: consultas, loading: consultasLoading } = useConsultas()

  if (userLoading) {
    return <div className="p-8">{t('loading')}</div>
  }

  if (!user) {
    return <div className="p-8 text-red-600">{t('notAuthenticated')}</div>
  }

  const stats = [
    {
      title: t('allPets'),
      value: mascotasLoading ? '...' : mascotas.length,
      change: t('atYourClinic'),
      icon: PawPrint,
      color: 'text-blue-600',
    },
    {
      title: t('allOwners'),
      value: duenosLoading ? '...' : duenos.length,
      change: t('registered'),
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: t('upcomingAppointments'),
      value: turnosLoading ? '...' : turnos.filter(t => t.estado === 'sin_atender').length,
      change: t('pending'),
      icon: CalendarDays,
      color: 'text-orange-600',
    },
    {
      title: t('consultations'),
      value: consultasLoading ? '...' : consultas.length,
      change: t('thisMonth'),
      icon: Stethoscope,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('welcome')}, {user.nombre}!</h1>
        <p className="text-gray-600 mt-2">{t('clinicOverview')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                  {stat.title}
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Próximos Turnos */}
      <Card>
        <CardHeader>
          <CardTitle>{t('upcomingAppointments')}</CardTitle>
          <CardDescription>{t('pendingAppointmentsNextDays')}</CardDescription>
        </CardHeader>
        <CardContent>
          {turnosLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : turnos.filter(t => t.estado === 'sin_atender').length > 0 ? (
            <div className="space-y-2">
              {turnos
                .filter(t => t.estado === 'sin_atender')
                .slice(0, 5)
                .map((turno) => (
                  <div key={turno.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{(turno as any).mascotas?.nombre ?? turno.id_mascota}</p>
                      <p className="text-sm text-gray-500">{new Date(turno.fecha_hora).toLocaleString()}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {turno.estado}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">{t('noUpcomingAppointments')}</p>
          )}
        </CardContent>
      </Card>

      {/* Últimas Consultas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentConsultations')}</CardTitle>
          <CardDescription>{t('recentClinicalHistory')}</CardDescription>
        </CardHeader>
        <CardContent>
          {consultasLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : consultas.length > 0 ? (
            <div className="space-y-2">
              {consultas.slice(0, 5).map((consulta) => (
                <div key={consulta.id} className="p-2 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Motivo: {consulta.motivo}</p>
                      <p className="text-sm text-gray-600">{consulta.diagnostico}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(consulta.fecha).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">{t('noConsultationsRecorded')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
