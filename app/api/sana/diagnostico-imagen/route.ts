// API route for Sana diagnostic (simulated)
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { raw, descripcion } = await req.json()
  // Aquí deberías llamar a Sana para análisis avanzado
  // Simulación:
  // const result = await analizarConSana(raw, descripcion)
  // return NextResponse.json(result)
  // Por ahora, respuesta simulada:
  return NextResponse.json({
    diagnostico: 'Diagnóstico simulado por Sana.',
    recomendaciones: 'Recomendaciones simuladas por Sana.'
  })
}
