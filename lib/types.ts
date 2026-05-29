// Clinicas
export interface Clinica {
  id: string
  nombre: string
  direccion: string
  telefono: string
  created_at: string
}

// Usuarios (Perfil)
export interface Usuario {
  id: string
  nombre: string
  rol: 'admin' | 'veterinario' | 'asistente' | 'dueno'
  id_clinica: string
  created_at: string
}

// Dueños
export interface Dueno {
  id: string
  nombre: string
  telefono: string
  email: string
  direccion: string
  contacto_secundario?: string
  id_clinica: string
  created_at: string
  // Portal de dueños
  usuario?: string
  auth_user_id?: string
  primer_login?: boolean
  password_temp?: string
}

// Mascotas
export interface Mascota {
  id: string
  nombre: string
  especie: string
  raza: string
  fecha_nacimiento: string
  sexo?: 'M' | 'F'
  peso?: number
  peso_inicial?: number
  observaciones?: string
  id_dueno: string
  id_clinica: string
  created_at: string
  tipo?: 'socio' | 'particular'
}

// Consultas (Historia Clínica)
export interface Consulta {
  id: string
  id_mascota: string
  id_usuario?: string
  fecha: string
  motivo: string
  diagnostico: string
  tratamiento: string
  observaciones: string
  id_clinica: string
  created_at?: string
}

// Turnos
export interface Turno {
  id: string
  id_mascota: string
  fecha_hora: string
  estado: 'sin_atender' | 'atendido' | 'ausente'
  id_usuario?: string
  notas?: string
  ubicacion?: 'clinica' | 'domicilio'
  id_clinica: string
  created_at?: string
  mascotas?: { nombre: string }
}

// Tipos de Cirugía
export interface TipoCirugia {
  id: string
  nombre: string
  descripcion?: string | null
  created_at?: string
}

// Especies
export interface Especie {
  id: string
  nombre: string
  created_at?: string
}

// Razas
export interface Raza {
  id: string
  nombre: string
  id_especie: string
  created_at?: string
}

// Tipos de Análisis
export interface TipoAnalisis {
  id: string
  nombre: string
  descripcion?: string | null
  created_at?: string
}

// Tipos de Vacuna
export interface TipoVacuna {
  id: string
  nombre: string
  color?: string
  created_at?: string
}

// Vacunas
export interface Vacuna {
  id: string
  id_mascota: string
  id_tipo_vacuna?: string | null
  fecha: string
  proxima_dosis: string | null
  id_clinica: string
  created_at?: string
}

// Controles de Peso
export interface ControlPeso {
  id: string
  id_mascota: string
  id_usuario?: string
  fecha: string
  peso: number
  observaciones?: string
  id_clinica: string
  created_at?: string
}

// Cirugias
export interface Cirugia {
  id: string
  id_mascota: string
  id_usuario?: string
  fecha: string
  tipo: string
  descripcion?: string
  resultado: string
  id_clinica: string
  created_at?: string
}

// Análisis de Laboratorio
export interface Analisis {
  id: string
  id_mascota: string
  id_usuario?: string
  id_tipo_analisis?: string
  fecha: string
  tipo: string
  descripcion?: string
  resultado?: string
  observaciones?: string
  id_clinica: string
  created_at?: string
}

// Imágenes Diagnósticas
export interface ImagenDiagnostica {
  id: string
  id_mascota: string
  id_usuario?: string
  fecha: string
  tipo: 'Radiografía' | 'Ecografía' | 'TAC' | 'Resonancia' | 'Otro'
  region?: string
  hallazgos?: string
  observaciones?: string
  id_clinica: string
  created_at?: string
}

// Usuario autenticado con contexto
export interface AuthUser extends Usuario {
  email: string
  primer_login?: boolean
}

// Respuesta genérica de API
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Documentos adjuntos
export interface Documento {
  id: string
  id_clinica: string
  tipo_entidad: 'consulta' | 'cirugia' | 'analisis' | 'imagen'
  id_entidad: string
  nombre: string
  url: string
  created_at?: string
}

// Tickets / Reportes de errores
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Ticket {
  id: string
  user_id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  created_at: string
  updated_at: string | null
  admin_response: string | null
  browser_info: string | null
  app_version: string | null
  page_url: string | null
}

export interface TicketCreateInput {
  title: string
  description: string
  priority: TicketPriority
  browser_info?: string
  app_version?: string
  page_url?: string
}

export interface TicketUpdateInput {
  status?: TicketStatus
  admin_response?: string
}
