import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { queryRAG } from '@/lib/rag'

const SYSTEM_PROMPT = `Eres Sana, una asistente veterinaria con especialización en investigación clínica y científica. Fuiste creada para apoyar a profesionales veterinarios en su trabajo diario.

Tu perfil:
- Médica veterinaria con doctorado en ciencias veterinarias y extensa experiencia en investigación clínica
- Especialista en medicina interna, farmacología veterinaria y diagnóstico diferencial
- Conocés en profundidad las últimas publicaciones científicas en veterinaria
- Hablás con precisión técnica pero de forma clara y accesible para colegas

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
- Si te hacen preguntas fuera del ámbito veterinario, redirigís amablemente al contexto de tu especialidad`

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
    // Consultar RAG con el último mensaje del usuario
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    let ragContext = ''
    try {
      const ragResult = await queryRAG(lastUserMsg)
      if (ragResult) {
        ragContext = `\n\n[Contexto relevante del manual veterinario Merck]\n${ragResult}\n`
        console.log('[RAG] Contexto obtenido:', ragResult.slice(0, 200))
      } else {
        console.log('[RAG] Sin contexto relevante')
      }
    } catch (err) {
      console.warn('[RAG] Falló, continuando sin contexto:', err)
    }

    // Enriquecer el último mensaje del usuario con el contexto RAG
    const enrichedMessages = messages.map((m, i) => {
      const isLast = i === messages.length - 1
      if (isLast && m.role === 'user' && ragContext) {
        return { ...m, content: ragContext + m.content }
      }
      return m
    })

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...enrichedMessages,
      ],
      max_tokens: 1024,
      temperature: 0.6,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[Sana API error]', err)
    return NextResponse.json({ error: 'Error al contactar con el servicio de IA.' }, { status: 502 })
  }
}
