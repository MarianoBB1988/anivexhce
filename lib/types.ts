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
  tipo?: 'socio' | 'particular'
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
  observaciones?: string
  id_dueno: string
  id_clinica: string
  created_at: string
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
  tipo_entidad: 'consulta' | 'cirugia'
  id_entidad: string
  nombre: string
  url: string
  created_at?: string
}
