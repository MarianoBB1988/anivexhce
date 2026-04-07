import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Faltan variables de entorno de Supabase (SERVICE_ROLE_KEY)')
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

// POST /api/users — create auth user + insert into usuarios table
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; nombre?: string; rol?: string; id_clinica?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { email, password, nombre, rol, id_clinica } = body

  if (!email || !password || !nombre || !rol || !id_clinica) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = getAdminClient()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Error al crear usuario' }, { status: 400 })
  }

  const authUserId = authData.user.id

  // 2. Insertar en tabla usuarios
  const { error: dbError } = await supabaseAdmin
    .from('usuarios')
    .insert({ id: authUserId, nombre, rol, id_clinica })

  if (dbError) {
    // Rollback: eliminar el auth user para no dejar registros huérfanos
    await supabaseAdmin.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: authUserId })
}

// DELETE /api/users?id=xxx — delete from auth + usuarios table
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = getAdminClient()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  // 1. Eliminar de tabla usuarios
  const { error: dbError } = await supabaseAdmin
    .from('usuarios')
    .delete()
    .eq('id', id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // 2. Eliminar de Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) {
    // Log pero no fallar — el registro de tabla ya fue eliminado
    console.error('Error eliminando auth user:', authError.message)
  }

  return NextResponse.json({ success: true })
}
