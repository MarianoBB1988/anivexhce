const HF_URL = 'https://anivex2026-sana-vet.hf.space/gradio_api/call/predict'
const RAG_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`RAG timeout (${ms}ms)`)), ms)
    ),
  ])
}

export async function queryRAG(pregunta: string): Promise<string> {
  // 1. POST para obtener el event_id
  const postRes = await withTimeout(
    fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ data: [pregunta] }),
    }),
    RAG_TIMEOUT_MS
  )

  if (!postRes.ok) {
    throw new Error(`HF POST error: ${postRes.status}`)
  }

  const postData = await postRes.json()
  const event_id: string = postData.event_id

  if (!event_id) {
    throw new Error('No se recibió event_id de Hugging Face')
  }

  // 2. GET SSE para obtener la respuesta
  const getRes = await withTimeout(
    fetch(`${HF_URL}/${event_id}`, {
      headers: { 'Accept': 'text/event-stream' },
    }),
    RAG_TIMEOUT_MS
  )

  if (!getRes.ok) {
    throw new Error(`HF GET error: ${getRes.status}`)
  }

  const text = await getRes.text()

  // Parsear SSE: extraer la última línea data: [...] con contenido
  let result = ''
  const lines = text.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim()
      try {
        const parsed = JSON.parse(dataStr)
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          result = parsed[0]
        }
      } catch {
        // ignorar líneas no JSON (como "HEARTBEAT" o vacías)
      }
    }
  }

  return result
}
