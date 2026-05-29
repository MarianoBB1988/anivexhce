'use client'

import { GanttDesarrollo } from '@/components/gantt-desarrollo'

export default function GanttPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Diagrama de Gantt</h1>
        <p className="text-muted-foreground">
          Línea de tiempo del desarrollo de Sana Vet — cada barra representa una fase del proyecto.
        </p>
      </div>
      <GanttDesarrollo />
    </div>
  )
}
