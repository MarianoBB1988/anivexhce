const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require("path");

const API_KEY = "TU_API_KEY"; // Pon tu clave aquí
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

async function procesarDocumento() {
  const rutaAlPDF = path.join(__dirname, "merk_vet.pdf");

  try {
    // 1. Subir el archivo (Soporta más de 50MB)
    const uploadResponse = await fileManager.uploadFile(rutaAlPDF, {
      mimeType: "application/pdf",
      displayName: "Documento de Trabajo",
    });

    console.log(`Subido con éxito: ${uploadResponse.file.uri}`);

    // Usa el modelo más compatible
    const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });
    // Si da error, prueba con "models/gemini-1.0-pro" o "gemini-pro"

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri
        }
      },
      { text: "Haz un resumen detallado de este documento." },
    ]);

    console.log("Respuesta de la IA:");
    console.log(result.response.text());

  } catch (error) {
    console.error("Error al procesar:", error);
  }
}

procesarDocumento();
