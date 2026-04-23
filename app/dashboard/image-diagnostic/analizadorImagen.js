import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

async function analizarImagen(rutaImagen) {
  // Lee la imagen como base64
  const imageBase64 = fs.readFileSync(rutaImagen, { encoding: "base64" });

  const response = await client.chat.completions.create({
    model: "llama-image-vision",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe la imagen:" },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  console.log(response.choices[0].message.content);
}

// Cambia la ruta por la de tu imagen
analizarImagen("./ejemplo.jpg");
