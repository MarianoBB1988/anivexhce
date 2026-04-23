import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const MATCH_PROMPT = `Eres un asistente que busca coincidencias de nombres. El usuario dijo un nombre por voz (puede tener errores de pronunciación, transcripción, ortografía o acentos). Tu tarea es buscar el nombre más similar en la lista proporcionada.

Reglas:
- Buscá coincidencias fonéticas y por similitud (ej: "emanuele" = "emanuelle", "gonza" = "gonzalez")
- Un nombre parcial también cuenta (ej: "juan" coincide con "Juan Pérez" y "Juan González")
- Si hay múltiples coincidencias, devolvé todas
- Respondé SOLO con JSON válido, sin markdown ni backticks
- Formato: {"matches": ["nombre exacto de la lista", ...]}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada.' }, { status: 500 })
  }

  let spoken: string
  let nombres: string[]
  try {
    const body = await req.json()
    spoken = body.spoken?.trim()
    nombres = body.nombres
    if (!spoken || !Array.isArray(nombres) || nombres.length === 0) throw new Error('invalid')
  } catch {
    return NextResponse.json({ error: 'Se requiere "spoken" y "nombres".' }, { status: 400 })
  }

  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: MATCH_PROMPT },
        { role: 'user', content: `El usuario dijo: "${spoken}"\nLista de nombres: ${nombres.join(', ')}` },
      ],
      max_tokens: 256,
      temperature: 0.1,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] ?? raw)
      return NextResponse.json({ matches: parsed.matches ?? [] })
    } catch {
      return NextResponse.json({ matches: [] })
    }
  } catch (err: any) {
    console.error('[Match API error]', err)
    return NextResponse.json({ error: 'Error al procesar.' }, { status: 502 })
  }
}
