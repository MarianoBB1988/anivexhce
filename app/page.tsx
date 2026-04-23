"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { signIn, getCurrentUser } from "@/lib/services/auth"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { SanaLogo } from "@/components/sana-chat"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Redirigir automáticamente si el usuario ya está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      // Determinar a dónde redirigir según el rol
      if (user.rol === 'dueno') {
        router.push('/portal')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Si no tiene @ es un usuario de portal (dueño) → convertir a email interno
      let loginEmail = email.includes('@') ? email : `${email}@portal.sana`

      let response = await signIn(loginEmail, password)

      // Fallback: try legacy domain for existing portal users
      if (!response.success && !email.includes('@')) {
        response = await signIn(`${email}@portal.anivex`, password)
      }
      
      if (!response.success) {
        setError(response.error || t('signInError'))
        toast({
          title: "Error",
          description: response.error || t('signInError'),
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: t('loggedIn'),
        description: "✓",
      })

      // Determinar a dónde redirigir según el rol
      const userResponse = await getCurrentUser()
      if (userResponse.success && userResponse.data?.rol === 'dueno') {
        router.push('/portal')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si ya está autenticado, mostrar loading mientras redirige
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 size-30 rounded-full bg-primary/10 flex items-center justify-center p-3">
            <SanaLogo className="size-full" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Bienvenido a Sana</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sistema de gestión veterinaria integral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email o usuario</Label>
              <Input
                id="email"
                type="text"
                placeholder="mariano@sana.vet o jperez"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background"
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 bg-background"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" disabled={isLoading} />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Recuérdame
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : (
                t('signIn')
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda?{" "}
              <button className="text-primary hover:text-primary/80 transition-colors" disabled={isLoading}>
                Contactar Soporte
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}