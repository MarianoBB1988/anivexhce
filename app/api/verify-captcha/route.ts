import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Falta el token de hCaptcha' }, { status: 400 })
    }

    const secret = process.env.HCAPTCHA_SECRET_KEY

    if (!secret) {
      return NextResponse.json({ success: false, error: 'hCaptcha no configurado' }, { status: 500 })
    }

    // Verificar el token con hCaptcha
    const verifyUrl = 'https://api.hcaptcha.com/siteverify'
    const params = new URLSearchParams({
      secret,
      response: token,
    })

    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const verifyData = await verifyRes.json()

    if (!verifyData.success) {
      return NextResponse.json({
        success: false,
        error: 'Falló la verificación de hCaptcha',
        'error-codes': verifyData['error-codes'],
      }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verificando hCaptcha:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
