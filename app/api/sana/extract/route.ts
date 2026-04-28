import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const EXTRACTION_PROMPT = `Eres Sana, una veterinaria experta y copiloto clínico. El usuario te dictó por voz una descripción clínica de una consulta veterinaria. También se te proporciona la historia clínica previa de la mascota (consultas anteriores, especie, raza, edad, etc.).

Tu tarea es:

1. Separar la información en tres campos:
   - **motivo**: El motivo de consulta (por qué traen al animal)
   - **diagnostico**: El diagnóstico clínico (qué tiene el animal)
   - **tratamiento**: El tratamiento indicado (medicamentos, dosis, indicaciones)

2. Si falta información clínica que sería coherente agregar (por ejemplo, si mencionan un diagnóstico pero no un tratamiento estándar para ese diagnóstico), completala con información clínica correcta y coherente.

3. Si el tratamiento tiene mejoras posibles o le falta algo importante (dosis, frecuencia, duración, precauciones), agregalo o ajustalo.

4. COPILOTO CLÍNICO - Analizá el caso COMPLETAMENTE usando la historia clínica y generá:
   - **preguntas**: 1-3 preguntas clave que el veterinario debería hacer o considerar (ej: "¿Tuvo acceso a basura o tóxicos?", "¿Está al día con vacunas?"). Si no hay preguntas relevantes, array vacío.
   - **diferenciales**: 1-3 diagnósticos diferenciales a considerar basados en los síntomas descritos y la historia previa. Si el diagnóstico ya es claro y no hay otros relevantes, array vacío.
   - **alertas**: Cualquier alerta o inconsistencia detectada (ej: dosis fuera de rango, interacciones, signos de urgencia, condiciones crónicas que podrían agravarse). Si no hay alertas, array vacío.
   - **sugerencias**: Recomendación detallada para el caso. Incluí posibles causas, patologías relacionadas, tratamientos alternativos o complementarios, y recomendaciones de seguimiento. Sé específico y clínicamente útil. Si no hay, string vacío.

IMPORTANTE:
- Respondé SOLO con JSON válido, sin markdown, sin backticks, sin explicaciones.
- Usá español.
- Sé conciso pero clínicamente preciso.
- Si algún campo no se puede inferir de lo dictado, dejalo como string vacío o array vacío según corresponda.
- Las preguntas, diferenciales y alertas deben ser clínicamente relevantes, no genéricas.
- Usá la historia clínica de la mascota para contextualizar mejor tus recomendaciones.

Formato de respuesta (JSON puro):
{"motivo": "...", "diagnostico": "...", "tratamiento": "...", "sugerencias": "...", "preguntas": ["..."], "diferenciales": ["..."], "alertas": ["..."]}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada.' }, { status: 500 })
  }

  let transcripcion: string
  let historiaClinica: string = ''
  try {
    const body = await req.json()
    transcripcion = body.transcripcion?.trim()
    historiaClinica = body.historiaClinica?.trim() || ''
    if (!transcripcion) throw new Error('empty')
  } catch {
    return NextResponse.json({ error: 'Se requiere el campo "transcripcion".' }, { status: 400 })
  }

  // Build user message with clinical history if available
  let userMessage = transcripcion
  if (historiaClinica) {
    userMessage = `Descripción clínica actual:\n${transcripcion}\n\nHistoria clínica de la mascota:\n${historiaClinica}`
  }

  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content ?? ''

    // Parse JSON from response (handle possible markdown wrapping)
    let parsed: { motivo?: string; diagnostico?: string; tratamiento?: string; sugerencias?: string; preguntas?: string[]; diferenciales?: string[]; alertas?: string[] }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? raw)
    } catch {
      return NextResponse.json({ error: 'La IA no devolvió JSON válido.', raw }, { status: 502 })
    }

    return NextResponse.json({
      motivo: parsed.motivo ?? '',
      diagnostico: parsed.diagnostico ?? '',
      tratamiento: parsed.tratamiento ?? '',
      sugerencias: parsed.sugerencias ?? '',
      preguntas: Array.isArray(parsed.preguntas) ? parsed.preguntas : [],
      diferenciales: Array.isArray(parsed.diferenciales) ? parsed.diferenciales : [],
      alertas: Array.isArray(parsed.alertas) ? parsed.alertas : [],
    })
  } catch (err: any) {
    console.error('[Extract API error]', err)
    return NextResponse.json({ error: 'Error al procesar con IA.' }, { status: 502 })
  }
}
