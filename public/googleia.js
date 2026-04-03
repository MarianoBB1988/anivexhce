import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import path from "path";

const API_KEY = "AIzaSyBJhrb6CNiqbn687PPzD47AzEgx02ysdKU";

// 1. Forzamos la versión v1 desde el inicio para evitar el 404 de la beta
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

async function procesarArchivo() {
  try {
    const nombreArchivo = "merk_vet.pdf";
    const rutaAbsoluta = path.resolve(nombreArchivo);

    console.log(`1. Subiendo: ${nombreArchivo} (200MB)...`);
    const uploadResult = await fileManager.uploadFile(rutaAbsoluta, {
      mimeType: "application/pdf",
      displayName: "Manual Veterinario",
    });

    console.log(`✅ Archivo subido: ${uploadResult.file.uri}`);

    // 2. Esperar procesamiento
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      file = await fileManager.getFile(uploadResult.file.name);
    }
    console.log("\nArchivo listo.");

    // 3. ANALIZAR - Usamos Flash que es más rápido para archivos grandes
    // IMPORTANTE: Pasamos el apiVersion aquí también por seguridad
    const model = genAI.getGenerativeModel(
        { model: "gemini-1.5-flash" },
        { apiVersion: "v1" }
    );
    
    console.log("3. Generando resumen ejecutivo...");

    // Sintaxis de partes: es la que mejor traduce la librería a la API v1
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
      { text: "Analiza este manual y resume los puntos clave para el sistema veterinario Sana." },
    ]);

    const response = await result.response;
    console.log("\n--- ¡POR FIN! ANÁLISIS COMPLETADO ---");
    console.log(response.text());

  } catch (error) {
    console.error("\n--- ERROR ---");
    console.log(error.message);
    
    // Si te da 429 (Cuota), espera 2 minutos. Si da 404, Google movió el modelo otra vez.
    if (error.message.includes("429")) {
        console.log("Cuota excedida. Espera un momento y reintenta.");
    }
  }
}

procesarArchivo();