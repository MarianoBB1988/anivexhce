// ─── Diagnóstico: Mercado Pago Test Route ──────────────────────────────────
// GET /api/mp-test
// Propósito: Verificar que Mercado Pago está correctamente configurado
// Sin autenticación, sin dependencias externas — puro diagnóstico
//
// Cómo probar:
//   1. Abrir navegador → http://localhost:3000/api/mp-test
//   2. O desde terminal: curl http://localhost:3000/api/mp-test
//   3. Ver logs en la terminal donde corre `npm run dev`
//
// ─── Checklist de diagnóstico ───────────────────────────────────────────────
// [✓] Variables de entorno cargan correctamente
// [✓] SDK de Mercado Pago se importa sin errores
// [✓] Cliente MP se inicializa con Access Token
// [✓] Conexión real contra API de Mercado Pago
// [✓] Creación de preferencia de prueba
// [✓] Manejo de errores (token inválido, red, SDK, etc.)
// ────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET() {
  const startTime = Date.now()

  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🔍 [MP-TEST] GET /api/mp-test — Iniciando diagnóstico...')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')

  // ── 1. Validar variables de entorno ──────────────────────────────────
  console.log('📋 [MP-TEST] --- 1. Variables de Entorno ---')

  const rawToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY

  console.log(`📋 [MP-TEST] MERCADOPAGO_ACCESS_TOKEN  : ${rawToken ? `✓ PRESENTE (${rawToken.substring(0, 10)}...${rawToken.slice(-6)})` : '✗ AUSENTE'}`)
  console.log(`📋 [MP-TEST] NEXT_PUBLIC_MP_PUBLIC_KEY : ${publicKey ? `✓ PRESENTE (${publicKey.substring(0, 10)}...)` : '✗ AUSENTE'}`)
  console.log(`📋 [MP-TEST] NODE_ENV                   : ${process.env.NODE_ENV || 'no definido'}`)
  console.log(`📋 [MP-TEST] Token prefix               : ${rawToken ? rawToken.startsWith('TEST') ? 'TEST (Sandbox)' : rawToken.startsWith('APP_USR') ? 'PRODUCCIÓN' : '⚠ FORMATO DESCONOCIDO' : 'N/A'}`)
  console.log(`📋 [MP-TEST] Token length               : ${rawToken ? rawToken.length : 0} caracteres`)
  console.log('')

  if (!rawToken) {
    console.error('💥 [MP-TEST] ✗ MERCADOPAGO_ACCESS_TOKEN no está definido')
    console.log('')

    return NextResponse.json(
      {
        success: false,
        preferenceId: null,
        error: 'MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno',
        details: {
          stage: 'env_check',
          message: 'Falta la variable de entorno MERCADOPAGO_ACCESS_TOKEN',
          env: {
            accessTokenPresent: false,
            publicKeyPresent: !!publicKey,
            nodeEnv: process.env.NODE_ENV || 'no definido',
          },
          suggestions: [
            'Agregá MERCADOPAGO_ACCESS_TOKEN a tu archivo .env.local',
            'Copiá el token exacto desde: https://www.mercadopago.com.ar/developers/panel',
            'Después de editar .env.local, reiniciá el servidor: npm run dev',
          ],
        },
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── 2. Inicializar cliente MP ────────────────────────────────────────
  console.log('🔧 [MP-TEST] --- 2. Inicializando cliente MercadoPagoConfig ---')
  console.log(`🔧 [MP-TEST]   Modo  : ${rawToken.startsWith('TEST') ? 'SANDBOX 🧪' : 'PRODUCCIÓN 🚀'}`)
  console.log(`🔧 [MP-TEST]   Token : ${rawToken.substring(0, 15)}...`)
  console.log('')

  let client: MercadoPagoConfig
  let preference: Preference

  try {
    client = new MercadoPagoConfig({
      accessToken: rawToken.trim(),
      options: { timeout: 15000 },
    })

    preference = new Preference(client)

    console.log('🔧 [MP-TEST] ✓ Cliente inicializado correctamente')
    console.log('')
  } catch (initError) {
    const message = initError instanceof Error ? initError.message : String(initError)
    console.error('💥 [MP-TEST] ✗ Error al inicializar cliente:', message)
    console.log('')

    return NextResponse.json(
      {
        success: false,
        preferenceId: null,
        error: 'Error al inicializar el cliente de Mercado Pago',
        details: {
          stage: 'initialization',
          message,
          env: {
            accessTokenPresent: true,
            accessTokenPrefix: rawToken.substring(0, 10) + '...',
            accessTokenLength: rawToken.length,
            publicKeyPresent: !!publicKey,
            nodeEnv: process.env.NODE_ENV || 'no definido',
          },
          suggestions: [
            'Verificá que el token no tenga espacios, saltos de línea ni caracteres extraños.',
            'Probá generando un nuevo token de prueba desde el panel de MP.',
          ],
        },
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── 3. Crear preferencia de prueba ───────────────────────────────────
  console.log('📡 [MP-TEST] --- 3. Creando preferencia de prueba ---')
  console.log('📡 [MP-TEST]   Item:')
  console.log('📡 [MP-TEST]     title      : "Test SanaVet"')
  console.log('📡 [MP-TEST]     quantity   : 1')
  console.log('📡 [MP-TEST]     unit_price : 100')
  console.log('📡 [MP-TEST]   Llamando a preference.create()...')
  console.log('')

  try {
    // Preferencia mínima para test — sin auto_return ni back_urls
    // para evitar validaciones extras de la API de MP
    const response = await preference.create({
      body: {
        items: [
          {
            id: 'test-sanavet-001',
            title: 'Test SanaVet',
            quantity: 1,
            unit_price: 100,
          },
        ],
        metadata: {
          test: true,
          source: 'mp-test-diagnostic',
          timestamp: new Date().toISOString(),
        },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    })

    const elapsed = Date.now() - startTime

    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎉 [MP-TEST] DIAGNÓSTICO EXITOSO')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`✅ [MP-TEST]   Tiempo de respuesta : ${elapsed}ms`)
    console.log(`✅ [MP-TEST]   Preference ID        : ${response.id}`)
    console.log(`✅ [MP-TEST]   Init Point           : ${response.init_point}`)

    if (response.init_point) {
      console.log(`✅ [MP-TEST]   👉 Abrí en navegador: ${response.init_point}`)
    }

    console.log('')

    return NextResponse.json(
      {
        success: true,
        preferenceId: response.id,
        error: null,
        details: {
          stage: 'complete',
          mode: rawToken.startsWith('TEST') ? 'sandbox' : 'production',
          item: { title: 'Test SanaVet', quantity: 1, unit_price: 100 },
          preference: {
            id: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point,
          },
          responseTimeMs: elapsed,
          env: {
            accessTokenPresent: true,
            accessTokenPrefix: rawToken.substring(0, 10) + '...',
            publicKeyPresent: !!publicKey,
            nodeEnv: process.env.NODE_ENV || 'no definido',
          },
          suggestions: [
            '✅ Todo funciona correctamente. Mercado Pago está operativo.',
            '💡 Probá el checkout abriendo el init_point en el navegador.',
            '💡 Recordá que esto es SANDBOX. Para producción necesitás credenciales de producción.',
          ],
        },
      },
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime
    const errorInfo = extractErrorInfo(error)

    console.log('')
    console.error('💥 [MP-TEST] --- ERROR al crear preferencia ---')
    console.error(`💥 [MP-TEST]   Tiempo hasta el error : ${elapsed}ms`)
    console.error(`💥 [MP-TEST]   Mensaje               : ${errorInfo.message}`)
    console.error(`💥 [MP-TEST]   Status HTTP           : ${errorInfo.status}`)
    console.error(`💥 [MP-TEST]   Código               : ${errorInfo.code}`)
    console.error(`💥 [MP-TEST]   Tipo error            : ${errorInfo.type}`)
    console.error(`💥 [MP-TEST]   Cause / Response      : ${errorInfo.cause}`)
    console.error(`💥 [MP-TEST]   Serializado completo  : ${errorInfo.fullJson}`)
    if (errorInfo.stack) {
      console.error(`💥 [MP-TEST]   Stack                 : ${errorInfo.stack}`)
    }
    console.error('')

    // ── Clasificar error ───────────────────────────────────────────────
    const haystack = `${errorInfo.message} ${errorInfo.status} ${errorInfo.code} ${errorInfo.cause}`.toLowerCase()
    let errorCategory = 'unknown'
    let userFriendlyMessage = errorInfo.message
    const suggestions: string[] = []

    if (haystack.includes('401') || haystack.includes('unauthorized') || haystack.includes('access_token') || haystack.includes('access token') || haystack.includes('invalid_token')) {
      errorCategory = 'invalid_token'
      userFriendlyMessage = '🔴 Token de acceso inválido o rechazado por Mercado Pago (HTTP 401)'
      suggestions.push(
        '🔴 El Access Token fue rechazado. Generá uno NUEVO desde:',
        '🔴 https://www.mercadopago.com.ar/developers/panel → Credenciales',
        '🔴 Copiá el Access Token (TEST-...) exacto, sin espacios.',
      )
    } else if (haystack.includes('403') || haystack.includes('forbidden')) {
      errorCategory = 'forbidden'
      userFriendlyMessage = '🔴 Token sin permisos suficientes (HTTP 403)'
      suggestions.push('🔴 Verificá los permisos de tu aplicación en el panel de MP.')
    } else if (haystack.includes('400') || haystack.includes('bad request')) {
      errorCategory = 'bad_request'
      userFriendlyMessage = '🔴 Solicitud rechazada por datos inválidos (HTTP 400)'
      suggestions.push('🔴 Revisá el mensaje completo para ver qué campo falla.')
    } else if (haystack.includes('timeout') || haystack.includes('etimedout') || haystack.includes('econnrefused') || haystack.includes('econnreset')) {
      errorCategory = 'network'
      userFriendlyMessage = '🔴 Error de conexión con los servidores de Mercado Pago'
      suggestions.push(
        '🔴 Verificá tu conexión a internet.',
        '🔴 Deshabilitá proxy/VPN si tenés.',
        '🔴 Estado del servicio: https://status.mercadopago.com/',
      )
    } else if (haystack.includes('fetch') || haystack.includes('network')) {
      errorCategory = 'fetch_error'
      userFriendlyMessage = '🔴 Error de red (fetch) al conectar con MP'
      suggestions.push('🔴 Ejecutá: curl -I https://api.mercadopago.com')
    } else {
      suggestions.push(
        '⚠ Error no clasificado automáticamente.',
        '💡 Revisá el JSON "fullError" en la respuesta para entender el error.',
        '💡 Ejecutá: npm install mercadopago@latest',
      )
    }

    for (const s of suggestions) {
      console.error(`💥 [MP-TEST]   💡 ${s}`)
    }
    console.error('')

    return NextResponse.json(
      {
        success: false,
        preferenceId: null,
        error: userFriendlyMessage,
        details: {
          stage: 'create_preference',
          errorCategory,
          originalMessage: errorInfo.message,
          statusCode: errorInfo.status,
          errorCode: errorInfo.code,
          responseTimeMs: elapsed,
          env: {
            accessTokenPresent: true,
            accessTokenPrefix: rawToken.substring(0, 10) + '...',
            publicKeyPresent: !!publicKey,
            nodeEnv: process.env.NODE_ENV || 'no definido',
            mode: rawToken.startsWith('TEST') ? 'sandbox' : 'production',
          },
          fullError: errorInfo.full,
          suggestions,
        },
      },
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ---------------------------------------------------------------------------
// Helper: extraer info de cualquier tipo de error (el SDK de MP a veces no
// lanza Error instances, sino objetos planos con status, cause, response...)
// ---------------------------------------------------------------------------
function extractErrorInfo(error: unknown): {
  message: string
  status: string
  code: string
  type: string
  cause: string
  stack: string
  full: unknown
  fullJson: string
} {
  const result = {
    message: '',
    status: '',
    code: '',
    type: '',
    cause: '',
    stack: '',
    full: error,
    fullJson: '',
  }

  try {
    result.fullJson = JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2)
  } catch {
    result.fullJson = String(error)
  }

  if (error instanceof Error) {
    result.message = error.message
    result.stack = (error.stack || '').split('\n').slice(0, 4).join('\n')
    result.type = error.constructor.name

    // Safe property access
    const e = error as unknown as Record<string, unknown>

    if (e.status != null) result.status = String(e.status)
    if (e.statusCode != null) result.status = String(e.statusCode)
    if (e.code != null) result.code = String(e.code)
    if (e.cause != null) {
      result.cause = typeof e.cause === 'string' ? e.cause : safeStringify(e.cause)
    }
    // response?.status — typical in axios/fetch-based SDKs
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>
      if (resp.status != null) result.status = String(resp.status)
      if (resp.data != null) result.cause = safeStringify(resp.data)
      if (resp.statusText != null) result.message = String(resp.statusText)
    }
    // Some SDK errors have a nested `error` property
    if (e.error && typeof e.error === 'object') {
      const sub = e.error as Record<string, unknown>
      if (sub.message) result.message = String(sub.message)
      if (sub.cause) result.cause = typeof sub.cause === 'string' ? sub.cause : safeStringify(sub.cause)
    }
  } else if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>
    result.message = obj.message != null ? String(obj.message) : `Object: ${safeStringify(error)}`
    result.type = 'Object (not Error)'
    if (obj.status != null) result.status = String(obj.status)
    if (obj.statusCode != null) result.status = String(obj.statusCode)
    if (obj.code != null) result.code = String(obj.code)
    if (obj.cause != null) result.cause = typeof obj.cause === 'string' ? obj.cause : safeStringify(obj.cause)
  } else {
    result.message = `Valor: ${String(error)}`
    result.type = typeof error
  }

  if (!result.message) result.message = '(sin mensaje)'
  if (!result.status) result.status = '(sin status)'

  return result
}

// ---------------------------------------------------------------------------
// Helper: safe JSON.stringify (no explota con circular refs u objetos raros)
// ---------------------------------------------------------------------------
function safeStringify(value: unknown): string {
  const seen = new WeakSet()
  try {
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]'
        seen.add(val)
      }
      return val
    }, 2)
  } catch {
    return String(value)
  }
}
