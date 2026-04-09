'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && !error) {
      router.push('/')
    }
  }, [loading, user, error, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <p className="text-destructive font-medium">Error de conexión</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
