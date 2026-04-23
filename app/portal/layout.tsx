'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { signOut } from '@/lib/services/auth'
import { Button } from '@/components/ui/button'
import { SanaLogo } from '@/components/sana-chat'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/')
      return
    }
    if (user.rol !== 'dueno') {
      router.replace('/dashboard')
      return
    }
    // Forzar cambio de contraseña en primer ingreso
    if (user.primer_login) {
      router.replace('/portal/cambiar-password')
    }
  }, [user, loading, router])

  if (loading || !user || user.rol !== 'dueno') return null

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="size-7 flex items-center justify-center rounded-full bg-primary/10 p-0.5">
              <SanaLogo className="size-full" />
            </div>
            <span>Portal Sana</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hola, {user.nombre.split(' ')[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
