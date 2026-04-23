// API route for image diagnostic (proxy to imageDiagnostic/server.js or similar logic)
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { imagen } = await req.json()
  // Aquí deberías llamar a tu backend Node.js o Groq API
  // Simulación:
  // const descripcion = await analizarImagenGroq(imagen)
  // return NextResponse.json({ descripcion })
  // Por ahora, respuesta simulada:
  return NextResponse.json({ descripcion: 'Descripción simulada de la imagen por IA.' })
}
