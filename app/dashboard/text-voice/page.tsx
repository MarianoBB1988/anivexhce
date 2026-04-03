"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function TextVoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [textoDictado, setTextoDictado] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      
      // CONFIGURACIÓN CRÍTICA
      recognition.lang = 'es-ES';
      recognition.continuous = true; // No se detiene automáticamente
      recognition.interimResults = true; // Ver lo que escucha en tiempo real

      recognition.onstart = () => {
        console.log("Micrófono encendido");
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTextoDictado(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Error capturado:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log("El micrófono se cerró");
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleEscucha = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTextoDictado("");
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Error al arrancar:", err);
      }
    }
  };

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">Sana Voice Lab</h1>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleEscucha}
          className={`px-6 py-3 rounded-full font-bold transition-all ${
            isListening 
            ? 'bg-red-500 text-white shadow-lg scale-105' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isListening ? "🛑 Detener Sana" : "🎤 Hablar con Sana"}
        </button>

        {isListening && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>

      <div className="mt-10 p-6 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
        <p className="text-xs font-mono text-slate-400 mb-2 uppercase">Transcripción en vivo:</p>
        <p className="text-xl min-h-[3rem]">
          {textoDictado || <span className="text-slate-400 italic font-light text-base">Esperando voz...</span>}
        </p>
      </div>
      
      <p className="text-xs text-slate-500">
        Nota: Asegúrate de que no haya otras pestañas (como Meet o Zoom) usando el micrófono.
      </p>
    </div>
  );
}