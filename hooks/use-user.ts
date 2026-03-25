'use client'

import { useAuth } from '@/lib/auth-context'
import { Usuario } from '@/lib/types'

export function useClinica() {
  const { user } = useAuth()
  return user?.id_clinica || null
}

export function useUser(): Usuario | null {
  const { user } = useAuth()
  return user || null
}

export function useUserRole() {
  const { user } = useAuth()
  return user?.rol || null
}

export function isAdmin(user: Usuario | null): boolean {
  return user?.rol === 'admin'
}

export function isVeterinario(user: Usuario | null): boolean {
  return user?.rol === 'veterinario'
}

export function isAsistente(user: Usuario | null): boolean {
  return user?.rol === 'asistente'
}
