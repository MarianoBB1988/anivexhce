'use client'

import { SanaLoading } from '@/components/sana-loading'

export default function SpinnerTestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background p-8">
      <h1 className="text-2xl font-bold">Prueba de Spinner Sana</h1>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Tamaño 16 (botón)</p>
        <SanaLoading size={16} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Tamaño 20 (mensaje Sana)</p>
        <SanaLoading size={20} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Tamaño 40 (default)</p>
        <SanaLoading />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Tamaño 48 (login)</p>
        <SanaLoading size={48} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Tamaño 64</p>
        <SanaLoading size={64} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Tamaño 96</p>
        <SanaLoading size={96} />
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Visitá esta página en <code className="bg-muted px-1 rounded">/spinner-test</code>
      </p>
    </div>
  )
}
