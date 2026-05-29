'use client'

// ─── Mercado Pago Standalone Test Page ─────────────────────────────────────
// RUNS ON: Client-side (Browser)
// Página de prueba aislada para verificar que el SDK de Mercado Pago carga
// correctamente y el Payment Brick se renderiza sin errores.
// Visitá: http://localhost:3000/mp-test-page

import { useEffect, useState, useCallback, useRef } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''

type TestStep = 'loading-sdk' | 'ready' | 'creating' | 'brick-ready' | 'error'

export default function MpTestPage() {
  const [step, setStep] = useState<TestStep>('loading-sdk')
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [mpEmail, setMpEmail] = useState('test@example.com')
  const brickReadyRef = useRef(false)

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
    console.log('[MP-TEST-PAGE]', msg)
  }, [])

  // ── 1. Init Mercado Pago SDK ────────────────────────────────────────────

  useEffect(() => {
    if (!PUBLIC_KEY) {
      const msg = 'Falta NEXT_PUBLIC_MP_PUBLIC_KEY en .env.local'
      setSdkError(msg)
      addLog('❌ ' + msg)
      setStep('error')
      return
    }

    addLog(`🔑 Public Key: ${PUBLIC_KEY.substring(0, 10)}...`)
    addLog('🔄 Inicializando SDK de Mercado Pago...')

    try {
      initMercadoPago(PUBLIC_KEY, { locale: 'es-AR' })
      addLog('✅ SDK initialized successfully')
      setStep('ready')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar SDK'
      setSdkError(msg)
      addLog('❌ Error: ' + msg)
      setStep('error')
    }
  }, [addLog])

  // ── 2. Create test preference (Payment Brick) ──────────────────────────

  const handleCreatePreference = useCallback(async () => {
    setStep('creating')
    setErrorDetail(null)
    addLog('🔄 Creando preferencia de prueba en backend...')

    try {
      const res = await fetch('/api/mp-test')
      const data = await res.json()

      addLog(`📡 Response: success=${data.success}, id=${data.preferenceId}`)

      if (data.success && data.preferenceId) {
        setPreferenceId(data.preferenceId)
        addLog(`✅ Preference ID: ${data.preferenceId}`)
        addLog('⏳ Esperando que cargue el Payment Brick...')
      } else {
        const errMsg = data.error || data.details?.originalMessage || 'Error desconocido'
        setErrorDetail(errMsg)
        addLog(`❌ Error: ${errMsg}`)
        setStep('error')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de red'
      setErrorDetail(msg)
      addLog(`❌ Error de red: ${msg}`)
      setStep('error')
    }
  }, [addLog])

  // ── 3. Test create-preapproval (recurring subscription) ─────────────────

  const handleCreatePreapproval = useCallback(async () => {
    setStep('creating')
    setErrorDetail(null)
    setPreferenceId(null)
    addLog(`🔄 Creando suscripción recurrente (Preapproval) con email: ${mpEmail}...`)

    try {
      const res = await fetch('/api/mercadopago/create-preapproval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'sana-vet-monthly',
          userId: 'test-user-123',
          clinicaId: 'test-clinica-456',
          payerEmail: mpEmail,
          payerName: 'Test User',
        }),
      })

      const data = await res.json()
      addLog(`📡 Status: ${res.status}, Response: ${JSON.stringify(data, null, 2)}`)

      if (data.success && data.data) {
        addLog(`✅ Preapproval ID: ${data.data.preapprovalId}`)
        addLog(`🔗 Init Point: ${data.data.initPoint}`)
      } else {
        setErrorDetail(JSON.stringify(data, null, 2))
        addLog(`❌ Error: ${data.error || 'Error desconocido'}`)
        setStep('error')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de red'
      setErrorDetail(msg)
      addLog(`❌ Error de red: ${msg}`)
      setStep('error')
    }
  }, [addLog])

  // ── 3. Brick callbacks ──────────────────────────────────────────────────

  const handleBrickReady = useCallback(() => {
    if (brickReadyRef.current) return // avoid infinite loop from re-renders
    brickReadyRef.current = true
    addLog('✅✅✅ Payment Brick listo y renderizado!')
    setStep('brick-ready')
  }, [addLog])

  const handleBrickError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    addLog(`❌ Brick error: ${msg}`)
    setErrorDetail(msg)
    setStep('error')
  }, [addLog])

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">🧪 Mercado Pago - Test Page</h1>
          <p className="text-sm text-muted-foreground">
            Página de prueba aislada para verificar que el SDK de Mercado Pago carga correctamente
          </p>
        </div>

        {/* SDK Status */}
        <div className={`p-4 rounded-lg border ${
          step === 'error' ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800' :
          step === 'brick-ready' ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' :
          'bg-muted/30 border-border'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${
              step === 'loading-sdk' ? 'bg-yellow-400 animate-pulse' :
              step === 'error' ? 'bg-red-500' :
              step === 'brick-ready' ? 'bg-green-500' :
              'bg-blue-500'
            }`} />
            <span className="font-mono text-sm font-medium">
              Estado: {step === 'loading-sdk' ? 'Cargando SDK...' :
                       step === 'ready' ? 'SDK Listo - Esperando acción' :
                       step === 'creating' ? 'Creando preferencia...' :
                       step === 'brick-ready' ? '✅ Payment Brick renderizado!' :
                       `Error: ${sdkError || errorDetail}`}
            </span>
          </div>
          {PUBLIC_KEY && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Public Key: {PUBLIC_KEY.substring(0, 15)}...
            </p>
          )}
        </div>

        {/* Email de prueba */}
        <div className="p-3 rounded-lg border bg-card">
          <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
            📧 Usuario / Email de Mercado Pago (para el pagador)
          </label>
          <input
            type="text"
            value={mpEmail}
            onChange={(e) => setMpEmail(e.target.value)}
            placeholder="ej: test_user_123@testuser.com o TESTUSER123"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Se envía a MP como payerEmail (en pruebas acepta emails o TESTUSER)
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleCreatePreference}
            disabled={step !== 'ready'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90
                       transition-colors"
          >
            {step === 'creating' ? 'Creando...' : '🧪 Crear preferencia (Payment Brick)'}
          </button>
          <button
            onClick={handleCreatePreapproval}
            disabled={step !== 'ready'}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500
                       transition-colors"
          >
            {step === 'creating' ? 'Creando...' : '🔄 Crear Preapproval (Suscripción recurrente)'}
          </button>
        </div>

        {/* Payment Brick Container */}
        {preferenceId && (
          <div className="border rounded-lg p-4 bg-card">
            <h2 className="text-sm font-semibold mb-3">🔲 Payment Brick</h2>
            <div className="brick-container min-h-[300px]">
              <Payment
                initialization={{
                  amount: 100,
                  preferenceId,
                }}
                customization={{
                  paymentMethods: {
                    minInstallments: 1,
                    creditCard: 'all',
                  },
                }}
                onReady={handleBrickReady}
                onError={handleBrickError}
                onSubmit={async () => {
                  addLog('📤 Submit - procesando pago...')
                }}
              />
            </div>
          </div>
        )}

        {/* Error Detail */}
        {errorDetail && (
          <div className="p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
              ❌ Detalle del error
            </h3>
            <pre className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap font-mono">
              {errorDetail}
            </pre>
          </div>
        )}

        {/* Console Logs */}
        <div className="border rounded-lg">
          <div className="px-4 py-2 border-b bg-muted/30">
            <h2 className="text-sm font-semibold">📋 Logs</h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin logs aún...</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-xs font-mono text-muted-foreground">{log}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
