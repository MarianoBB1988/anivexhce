import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const PREDICT_PROMPT = `Eres Sana, una veterinaria experta con 20 años de experiencia clínica. Se te proporciona la información de una consulta veterinaria completa. Tu tarea es dar un análisis predictivo clínico avanzado.

Analizá toda la información y respondé con:

1. **prediccion**: Un párrafo conciso con tu predicción clínica. Incluí:
   - Probabilidad estimada de recaída o complicación (en porcentaje aproximado)
   - Factores de riesgo identificados (dieta, entorno, edad, raza, etc.)
   - Pronóstico a corto y mediano plazo
   - Posibles enfermedades subyacentes o asociadas que podrían no haberse considerado

2. **riesgo**: Nivel de riesgo general: "bajo", "medio" o "alto"

3. **acciones**: 2-4 acciones concretas que el veterinario debería considerar (estudios complementarios, cambios en tratamiento, seguimiento, etc.)

IMPORTANTE:
- Respondé SOLO con JSON válido, sin markdown, sin backticks.
- Usá español rioplatense.
- Sé clínicamente preciso y directo.
- Basate en evidencia veterinaria real.
- Si la información es insuficiente para un análisis significativo, indicalo honestamente.

Formato (JSON puro):
{"prediccion": "...", "riesgo": "bajo|medio|alto", "acciones": ["..."]}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada.' }, { status: 500 })
  }

  let context: string
  try {
    const body = await req.json()
    const { especie, raza, edad, sexo, peso, motivo, diagnostico, tratamiento, observaciones } = body
    if (!motivo && !diagnostico) throw new Error('insufficient')

    const parts: string[] = []
    if (especie || raza) parts.push(`Paciente: ${especie || ''}${raza ? ` - ${raza}` : ''}`)
    if (edad) parts.push(`Edad: ${edad}`)
    if (sexo) parts.push(`Sexo: ${sexo === 'M' ? 'Macho' : 'Hembra'}`)
    if (peso) parts.push(`Peso: ${peso} kg`)
    if (motivo) parts.push(`Motivo de consulta: ${motivo}`)
    if (diagnostico) parts.push(`Diagnóstico: ${diagnostico}`)
    if (tratamiento) parts.push(`Tratamiento: ${tratamiento}`)
    if (observaciones) parts.push(`Observaciones: ${observaciones}`)
    context = parts.join('\n')
  } catch {
    return NextResponse.json({ error: 'Se requiere información clínica.' }, { status: 400 })
  }

  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: PREDICT_PROMPT },
        { role: 'user', content: context },
      ],
      max_tokens: 1024,
      temperature: 0.4,
    })

    const raw = completion.choices[0]?.message?.content ?? ''

    let parsed: { prediccion?: string; riesgo?: string; acciones?: string[] }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? raw)
    } catch {
      return NextResponse.json({ error: 'La IA no devolvió JSON válido.', raw }, { status: 502 })
    }

    return NextResponse.json({
      prediccion: parsed.prediccion ?? '',
      riesgo: parsed.riesgo ?? 'medio',
      acciones: Array.isArray(parsed.acciones) ? parsed.acciones : [],
    })
  } catch (err: any) {
    console.error('[Predict API error]', err)
    return NextResponse.json({ error: 'Error al procesar predicción.' }, { status: 502 })
  }
}
