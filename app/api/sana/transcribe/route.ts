import { NextRequest, NextResponse } from 'next/server'

const HF_SPACE_URL = 'https://anivex2026-sana-voz.hf.space'
const TRANSCRIBE_TIMEOUT_MS = 15000

export async function POST(req: NextRequest) {
  let incomingForm: FormData
  try {
    incomingForm = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Se esperaba FormData con un campo "audio".' },
      { status: 400 },
    )
  }

  const audioFile = incomingForm.get('audio')
  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json(
      { error: 'No se recibió archivo de audio.' },
      { status: 400 },
    )
  }

  try {
    // Reenviar al Space de HuggingFace
    const fd = new FormData()
    fd.append('audio', audioFile, 'audio.webm')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS)

    const res = await fetch(`${HF_SPACE_URL}/transcribir`, {
      method: 'POST',
      body: fd,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text().catch(() => 'Error desconocido')
      console.error('[Transcribe proxy error]', res.status, err)
      return NextResponse.json({ error: 'Error al transcribir el audio.' }, { status: 502 })
    }

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    // El Space devuelve { usuario, respuesta, audio_url }
    // Nosotros solo necesitamos la transcripción (campo "usuario")
    const transcripcion = data.usuario || ''

    return NextResponse.json({ transcripcion, texto: transcripcion })
  } catch (err: any) {
    console.error('[Sana Transcribe error]', err)
    return NextResponse.json(
      { error: 'Error al contactar el servicio de transcripción.' },
      { status: 502 },
    )
  }
}
