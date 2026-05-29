"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Stethoscope,
  CalendarDays,
  Syringe,
  Scissors,
  FlaskConical,
  ScanLine,
  UserCog,
  BookOpen,
  LogOut,
  SlidersHorizontal,
  Mic,
  CreditCard,
  Bug,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { signOut } from "@/lib/services/auth"
import { useToast } from "@/hooks/use-toast"
import { LanguageSelector } from "@/components/language-selector"
import { SanaLogo } from "@/components/sana-chat"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const closeMobileMenu = () => {
    if (isMobile) setOpenMobile(false)
  }

  const mainNavItems = [
    {
      title: t('dashboard'),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t('owners'),
      href: "/dashboard/owners",
      icon: Users,
    },
    {
      title: t('pets'),
      href: "/dashboard/pets",
      icon: PawPrint,
    },
    {
      title: t('appointments'),
      href: "/dashboard/appointments",
      icon: CalendarDays,
    },
    {
      title: t('consultations'),
      href: "/dashboard/consultations",
      icon: Stethoscope,
    },
    {
      title: t('vaccinations'),
      href: "/dashboard/vaccinations",
      icon: Syringe,
    },
    {
      title: t('surgeries'),
      href: "/dashboard/surgeries",
      icon: Scissors,
    },
    {
      title: 'Análisis',
      href: '/dashboard/analisis',
      icon: FlaskConical,
    },
    {
      title: 'Estudio de imágenes',
      href: '/dashboard/imagenes',
      icon: ScanLine,
    },
    {
      title: 'Diagnóstico de imágenes',
      href: '/dashboard/image-diagnostic',
      icon: ScanLine,
    },
    {
      title: 'Consulta por Voz (Beta)',
      href: '/dashboard/consultations/voz',
      icon: Mic,
    },
  ]

  const isAdmin = user?.rol === 'admin'

  // Equipo de desarrollo: solo estos emails pueden ver gestión de tickets y sus reportes
  const devEmails = ['mariano@anivex.com', 'emanuele@anivex.com', 'matias@sanavet.uy']
  const isDev = user?.email ? devEmails.includes(user.email) : false

  // Items de configuración en orden consistente: Tickets, Ajustes, Usuarios, Manual de Usuario
  const adminNavItems = [
    ...(isDev ? [{
      title: "Gestión de Tickets",
      href: "/dashboard/tickets",
      icon: Bug,
      external: false,
    }] : []),
    ...(isAdmin ? [{
      title: "Ajustes",
      href: "/dashboard/ajustes",
      icon: SlidersHorizontal,
      external: false,
    }] : []),
    ...(isAdmin ? [{
      title: t('users'),
      href: "/dashboard/users",
      icon: UserCog,
      external: false,
    }] : []),

    {
      title: "Manual de Usuario",
      href: "/manual-usuario.html",
      icon: BookOpen,
      external: true,
    },
  ]

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      const result = await signOut()
      if (!result.success) {
        toast({
          title: 'Error al cerrar sesión',
          description: result.error || 'No se pudo cerrar la sesión.',
          variant: 'destructive',
        })
        return
      }

      window.location.replace("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Obtener iniciales del usuario
  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 p-0.5">
            <SanaLogo className="size-full" />
          </div>
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Sana
          </span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href} onClick={closeMobileMenu}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={!item.external && pathname === item.href}
                    tooltip={item.title}
                  >
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </a>
                    ) : (
                      <Link href={item.href} onClick={closeMobileMenu}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <LanguageSelector />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />

        {/* Notificaciones */}
        <div className="flex items-center gap-3 px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">Notificaciones</span>
            <span className="text-xs text-sidebar-foreground/60">Sin notificaciones</span>
          </div>
        </div>

        {/* Reportar error */}
        <Link
          href="/tickets/report"
          onClick={closeMobileMenu}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <Bug className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">Reportar error</span>
            <span className="text-xs text-sidebar-foreground/60">Enviar incidencia</span>
          </div>
        </Link>

        {/* Suscripción */}
        <Link
          href="/dashboard/subscription"
          onClick={closeMobileMenu}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">Suscripción</span>
            <span className="text-xs text-sidebar-foreground/60">Gestionar plan</span>
          </div>
        </Link>

        {/* ── Menú de usuario flotante ── */}

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 text-left group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">{user?.nombre || "Usuario"}</span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{user?.rol || "Sin rol"}</span>
            </div>
            <svg
              className={`size-3 text-sidebar-foreground/60 transition-transform group-data-[collapsible=icon]:hidden ${userMenuOpen ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop para cerrar al hacer clic fuera */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              {/* Dropdown flotante */}
              <div className="absolute bottom-full left-2 right-2 mb-2 z-50 rounded-lg border border-sidebar-border bg-popover text-popover-foreground shadow-lg overflow-hidden group-data-[collapsible=icon]:hidden">
                <Link
                  href="/tickets"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <Bug className="size-4" />
                  <span>Ver reportes</span>
                </Link>
                <div className="border-t border-sidebar-border" />
                <button

                  onClick={() => {
                    setUserMenuOpen(false)
                    handleLogout()
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <LogOut className="size-4" />
                  <span>{isLoggingOut ? 'Cerrando sesión...' : t('signOut')}</span>
                </button>
              </div>

            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
