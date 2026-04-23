
import express from "express";
import { Groq } from "groq-sdk";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static("."));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/analizar", async (req, res) => {
  try {
    console.log("[analizar] Petición recibida");
    const { imagen, especie } = req.body;
    if (!imagen) {
      console.log("[analizar] No se envió imagen");
      return res.status(400).json({ error: "No se envió imagen" });
    }

    // Validar formato base64
    if (!/^data:image\/(png|jpeg|jpg);base64,/.test(imagen)) {
      console.log("[analizar] Formato de imagen no válido");
      return res.status(400).json({ error: "Formato de imagen no válido" });
    }

    // Subir la imagen a un host temporal si es base64
    const apiKeyImgbb = "eaee470e8f0981b170276c96d1c814e7";
    const base64 = imagen.split(",")[1];
    let imageUrl = null;
    try {
      console.log("[analizar] Subiendo imagen a imgbb...");
      const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgbb}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ image: base64 })
      });
      const uploadData = await uploadRes.json();
      console.log("[analizar] Respuesta imgbb:", uploadData);
      imageUrl = uploadData.data?.url;
    } catch (e) {
      console.log("[analizar] Error subiendo imagen a imgbb", e);
      return res.status(500).json({ error: "No se pudo subir la imagen a un host temporal." });
    }
    if (!imageUrl) {
      console.log("[analizar] No se pudo obtener la URL de la imagen");
      return res.status(500).json({ error: "No se pudo obtener la URL de la imagen." });
    }

    console.log("[analizar] URL de imagen subida:", imageUrl);

    // Personalizar el prompt según la especie y pedir respuesta en español
    let prompt = "Describe la imagen en español:";
    if (especie && especie.trim() !== "") {
      prompt = `Analiza en español la siguiente imagen de un(a) ${especie.trim()}:`;
    }

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

    console.log("[analizar] Respuesta de Groq:", chatCompletion);
    res.json({ resultado: chatCompletion.choices?.[0]?.message?.content || "Sin respuesta del modelo." });
  } catch (err) {
    console.error("Error analizando imagen:", err);
    res.status(500).json({ error: "Error al analizar la imagen", detalle: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
