import { Groq } from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { imagen, especie } = req.body;
    console.log("[analizar] Body recibido", { imagen: imagen?.slice(0, 30), especie });
    if (!imagen) {
      console.log("[analizar] No se envió imagen");
      return res.status(400).json({ error: "No se envió imagen" });
    }

    // Validar formato base64
    if (!/^data:image\/(png|jpeg|jpg);base64,/.test(imagen)) {
      console.log("[analizar] Formato de imagen no válido", imagen?.slice(0, 30));
      return res.status(400).json({ error: "Formato de imagen no válido" });
    }

    // Subir la imagen a Supabase Storage
    const match = imagen.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!match) {
      console.log("[analizar] No hizo match base64", imagen?.slice(0, 30));
      return res.status(400).json({ error: "Formato de imagen no válido" });
    }
    const ext = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");

    console.log("[analizar] Subiendo a Supabase Storage...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const fileName = `groq-vision/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from("imagenes-publicas").upload(fileName, buffer, {
      contentType: `image/${ext}`,
      upsert: true,
    });
    if (uploadError) {
      console.log("[analizar] Error subiendo a Supabase Storage", uploadError);
      return res.status(500).json({ error: "No se pudo subir la imagen a Supabase Storage.", detalle: uploadError.message });
    }
    console.log("[analizar] Subida exitosa", uploadData);
    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from("imagenes-publicas").getPublicUrl(fileName);
    const imageUrl = publicUrlData?.publicUrl;
    console.log("[analizar] URL pública:", imageUrl);
    if (!imageUrl) {
      return res.status(500).json({ error: "No se pudo obtener la URL pública de la imagen." });
    }

    // Personalizar el prompt según la especie y pedir respuesta en español
    let prompt = "Describe la imagen en español:";
    if (especie && especie.trim() !== "") {
      prompt = `Analiza en español la siguiente imagen de un(a) ${especie.trim()}:`;
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_VISION });
    console.log("[analizar] Enviando a Groq", { imageUrl, prompt });
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });
    console.log("[analizar] Respuesta Groq", chatCompletion);

    res.json({ resultado: chatCompletion.choices?.[0]?.message?.content || "Sin respuesta del modelo." });
  } catch (err) {
    console.error("[analizar] Error general", err);
    res.status(500).json({ error: "Error al analizar la imagen", detalle: err.message });
  }
}
