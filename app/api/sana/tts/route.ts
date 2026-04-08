import { NextRequest, NextResponse } from 'next/server'

const HF_SPACE_URL = 'https://anivex2026-sana-voz.hf.space'
const TTS_TIMEOUT_MS = 15000

export async function POST(req: NextRequest) {
  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: 'Se requiere campo "text".' }, { status: 400 })
  }

  if (text.length > 500) {
    return NextResponse.json({ error: 'Texto demasiado largo (máx 500 caracteres).' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS)

    const res = await fetch(`${HF_SPACE_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text().catch(() => 'Error desconocido')
      console.error('[TTS proxy error]', res.status, err)
      return NextResponse.json({ error: 'Error al generar audio TTS.' }, { status: 502 })
    }

    const audioBuffer = await res.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[TTS error]', err)
    return NextResponse.json({ error: 'Error al contactar el servicio de TTS.' }, { status: 502 })
  }
}
