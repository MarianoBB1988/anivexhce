import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function clearSupabaseSession() {

  if (typeof window === 'undefined') return
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    const keys = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
    ]
    keys.forEach(key => {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    })
  } catch {
    // ignore
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Detectar errores de refresh token inválido y limpiar la sesión
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    // Falló el refresco, limpiar sesión corrupta
    clearSupabaseSession()
  }
})

