import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { queryRAG } from '@/lib/rag'

const SYSTEM_PROMPT = `Eres Sana, una asistente veterinaria con especialización en investigación clínica y científica. Fuiste creada para apoyar a profesionales veterinarios en su trabajo diario.

Tu perfil:
- Médica veterinaria con doctorado en ciencias veterinarias y extensa experiencia en investigación clínica
- Especialista en medicina interna, farmacología veterinaria y diagnóstico diferencial
- Conocés en profundidad las últimas publicaciones científicas en veterinaria
- Hablás con precisión técnica pero de forma clara y accesible para colegas
- Sos conversadora, cálida y natural — no parecés un robot

Tu rol:
- Ayudás a los veterinarios a formular diagnósticos diferenciales basados en signos clínicos
- Sugerís protocolos de tratamiento y dosis farmacológicas según especie, peso y condición
- Explicás el fundamento científico detrás de cada recomendación
- Analizás resultados de laboratorio, imágenes diagnósticas y hallazgos clínicos
- Respondés preguntas sobre enfermedades infectocontagiosas, zoonosis, nutrición, cirugía y más
- Podés sugerir bibliografía o estudios relevantes cuando corresponde

Comportamiento:
- Siempre respondés en español
- Sos directa y precisa, sin rodeos innecesarios
- Cuando no tenés certeza, lo decís claramente y sugerís consultar fuentes adicionales
- Nunca reemplazás el juicio clínico del profesional — sos una herramienta de apoyo
- Usás términos técnicos correctos pero explicás los conceptos cuando es necesario
- Si te preguntan algo que NO está relacionado con veterinaria, medicina animal, clínica veterinaria, diagnóstico, tratamiento, farmacología, cirugía, nutrición animal, enfermedades zoonóticas, o cualquier tema del ámbito veterinario, respondés amablemente: "Sana fue diseñada para ayudar en temas veterinarios y clínicos. ¿En qué puedo asistirte con tu consulta veterinaria?"`

// Palabras clave que indican que la consulta necesita contexto clínico (RAG)
const RAG_KEYWORDS = [
  'diagnóstico', 'diagnóstico diferencial', 'tratamiento', 'dosis', 'farmaco', 'fármaco',
  'medicamento', 'antibiótico', 'antiinflamatorio', 'analgésico', 'vacuna', 'protocolo',
  'enfermedad', 'síntoma', 'signo clínico', 'laboratorio', 'análisis', 'estudio',
  'cirugía', 'quirúrgico', 'anestesia', 'eutanasia', 'pronóstico', 'patología',
  'infección', 'parásito', 'bacteria', 'virus', 'hongo', 'neoplasia', 'tumor',
  'cáncer', 'alergia', 'intoxicación', 'envenenamiento', 'trauma', 'fractura',
  'herida', 'quemadura', 'shock', 'deshidratación', 'fiebre', 'vómito', 'diarrea',
  'convulsión', 'cojera', 'dermatitis', 'otitis', 'conjuntivitis', 'estomatitis',
  'insuficiencia', 'renal', 'hepático', 'cardíaco', 'respiratorio', 'digestivo',
  'neurológico', 'musculoesquelético', 'reproductivo', 'urinario', 'endocrino',
  'merck', 'manual', 'guía', 'protocolo clínico',
]

function necesitaRAG(texto: string): boolean {
  const t = texto.toLowerCase()
  return RAG_KEYWORDS.some(kw => t.includes(kw))
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada en el servidor.' }, { status: 500 })
  }

  let messages: { role: 'user' | 'assistant'; content: string }[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('invalid')
  } catch {
    return NextResponse.json({ error: 'Formato de solicitud inválido.' }, { status: 400 })
  }

  try {
    const groq = new Groq({ apiKey })
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''

    // Solo consultar RAG si el mensaje contiene palabras clave clínicas
    let ragContext = ''
    if (necesitaRAG(lastUserMsg)) {
      try {
        const ragResult = await queryRAG(lastUserMsg)
        if (ragResult) {
          ragContext = `\n\n[Contexto relevante del manual veterinario Merck]\n${ragResult}\n`
          console.log('[RAG] Contexto obtenido para consulta clínica')
        }
      } catch (err) {
        console.warn('[RAG] Falló, continuando sin contexto:', err)
      }
    }

    // Enriquecer el último mensaje del usuario con el contexto RAG si aplica
    const enrichedMessages = messages.map((m, i) => {
      const isLast = i === messages.length - 1
      if (isLast && m.role === 'user' && ragContext) {
        return { ...m, content: ragContext + m.content }
      }
      return m
    })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...enrichedMessages,
      ],
      max_tokens: 1024,
      temperature: 0.7, // un poco más creativa para conversación natural
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[Sana API error]', err)
    return NextResponse.json({ error: 'Error al contactar con el servicio de IA.' }, { status: 502 })
  }
}
