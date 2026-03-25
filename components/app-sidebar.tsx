"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Stethoscope,
  CalendarDays,
  Syringe,
  Scissors,
  UserCog,
  LogOut,
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { signOut } from "@/lib/services/auth"
import { useToast } from "@/hooks/use-toast"
import { LanguageSelector } from "@/components/language-selector"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

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
      title: t('consultations'),
      href: "/dashboard/consultations",
      icon: Stethoscope,
    },
    {
      title: t('appointments'),
      href: "/dashboard/appointments",
      icon: CalendarDays,
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
  ]

  const adminNavItems = [
    {
      title: t('users'),
      href: "/dashboard/users",
      icon: UserCog,
    },
  ]

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (_) {
      // ignorar errores de red, igual redirigimos
    }
    router.push("/")
    router.refresh()
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
            <Image
              src="/logo.png"
              alt="Anivex Logo"
              width={32}
              height={32}
              className="w-full object-cover"
            />
          </div>
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Anivex
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
                    <Link href={item.href}>
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
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
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
          <SidebarGroupContent>
            <LanguageSelector />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-3 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <Avatar className="size-9">
            <AvatarImage src="/placeholder-avatar.jpg" alt={user?.nombre} />
            <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">{user?.nombre || "Usuario"}</span>
            <span className="text-xs text-sidebar-foreground/60 capitalize">{user?.rol || "Sin rol"}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
          title={t('signOut')}
        >
          <LogOut className="size-4" />
          <span className="text-sm group-data-[collapsible=icon]:hidden">{t('signOut')}</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
