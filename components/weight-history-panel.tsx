'use client'

import { useMemo } from 'react'
import { Activity, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { ControlPeso } from '@/lib/types'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  controls: ControlPeso[]
  initialWeight?: number | null
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function WeightHistoryPanel({ controls, initialWeight = null }: Props) {
  const sortedControls = useMemo(() => {
    return [...controls].sort((left, right) => new Date(left.fecha).getTime() - new Date(right.fecha).getTime())
  }, [controls])

  const chartData = useMemo(() => {
    const data = sortedControls.map((control) => ({
      fecha: formatDate(control.fecha),
      peso: Number(control.peso.toFixed(2)),
    }))
    const firstControl = sortedControls[0]

    if (initialWeight != null && (!firstControl || Math.abs(firstControl.peso - initialWeight) > 0.001)) {
      return [
        { fecha: 'Inicial', peso: Number(initialWeight.toFixed(2)) },
        ...data,
      ]
    }

    return data
  }, [initialWeight, sortedControls])

  const firstControl = initialWeight != null
    ? { peso: initialWeight, fecha: 'Inicial' }
    : sortedControls[0]
  const latestControl = sortedControls[sortedControls.length - 1]
  const totalDelta = firstControl && latestControl ? latestControl.peso - firstControl.peso : 0

  const trend = totalDelta > 0.001
    ? { label: 'subiendo', icon: TrendingUp, className: 'text-emerald-600' }
    : totalDelta < -0.001
      ? { label: 'bajando', icon: TrendingDown, className: 'text-amber-600' }
      : { label: 'estable', icon: Activity, className: 'text-muted-foreground' }

  const TrendIcon = trend.icon

  return (
    <div className="space-y-3 border-b px-4 py-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-dashed shadow-none">
          <CardContent className="flex items-start justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Peso inicial</p>
              <p className="mt-1 text-lg font-semibold">{firstControl.peso.toFixed(2)} kg</p>
              <p className="text-xs text-muted-foreground">{firstControl.fecha === 'Inicial' ? 'Ficha de mascota' : formatDate(firstControl.fecha)}</p>
            </div>
            <Scale className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border-dashed shadow-none">
          <CardContent className="flex items-start justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Peso actual</p>
              <p className="mt-1 text-lg font-semibold">{latestControl.peso.toFixed(2)} kg</p>
              <p className="text-xs text-muted-foreground">{formatDate(latestControl.fecha)}</p>
            </div>
            <Activity className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border-dashed shadow-none">
          <CardContent className="flex items-start justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Evolución</p>
              <p className="mt-1 text-lg font-semibold">{totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(2)} kg</p>
              <p className={`text-xs capitalize ${trend.className}`}>{trend.label}</p>
            </div>
            <TrendIcon className={`size-4 ${trend.className}`} />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-background/80 p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Tendencia</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={['dataMin - 0.3', 'dataMax + 0.3']} width={40} />
            <Tooltip formatter={(value: number) => [`${value} kg`, 'Peso']} />
            <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}