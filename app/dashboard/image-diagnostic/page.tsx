"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Image as ImageIcon, Calendar, Scale, Dog, Cat } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// No react-viewer ni cornerstone, visor propio
import { ImagenForm } from "@/components/forms/imagen-form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useDuenos } from "@/hooks/use-duenos";
import { useMascotas } from "@/hooks/use-mascotas";
import { useUserList } from "@/hooks/use-usuarios";

export default function DiagnosticoImagenesPage() {
  const { user } = useAuth();
  const { data: duenos } = useDuenos();
  const { data: mascotas } = useMascotas();
  const { data: usuarios } = useUserList();
  const ZONAS = [
    'Tórax', 'Abdomen', 'Cabeza', 'Columna', 'Pelvis',
    'Miembro anterior derecho', 'Miembro anterior izquierdo',
    'Miembro posterior derecho', 'Miembro posterior izquierdo',
    'Cráneo', 'Nasal', 'Dental', 'Otro',
  ];
  const [selectedDuenoId, setSelectedDuenoId] = useState("");
  const [selectedMascotaId, setSelectedMascotaId] = useState("");
  const [zona, setZona] = useState("");
  
  // Filtrar mascotas por dueño seleccionado
  const filteredMascotas = selectedDuenoId
    ? mascotas?.filter(m => m.id_dueno === selectedDuenoId) || []
    : [];
    
  // Obtener la mascota seleccionada para extraer la especie
  const selectedMascota = selectedMascotaId 
    ? mascotas?.find(m => m.id === selectedMascotaId)
    : null;
    
  // Obtener especie de la mascota seleccionada
  const especie = selectedMascota?.especie || "";

  const [step, setStep] = useState<'input' | 'analyzing' | 'review'>('input');
  const [analyzingMsg, setAnalyzingMsg] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [iaResult, setIaResult] = useState<string>("");
  const [diagnostico, setDiagnostico] = useState<string>("");
  const [openPreview, setOpenPreview] = useState(false);

  // Estado para visor propio
  const [imgFilters, setImgFilters] = useState({
    grayscale: false,
    invert: false,
    brightness: 1,
    contrast: 1,
    rotate: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
  });

  // Función para calcular edad a partir de fecha de nacimiento
  function calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return "No especificada";
    
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    
    if (meses < 0) {
      años--;
      meses += 12;
    }
    
    if (años === 0) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else if (meses === 0) {
      return `${años} ${años === 1 ? 'año' : 'años'}`;
    } else {
      return `${años} ${años === 1 ? 'año' : 'años'} y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
  }

  // Función para formatear fecha
  function formatearFecha(fecha: string): string {
    if (!fecha) return "No especificada";
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  // Handlers visor
  const handleFilter = (type: string, value?: number) => {
    setImgFilters(f => {
      if (type === 'reset') return { grayscale: false, invert: false, brightness: 1, contrast: 1, rotate: 0, scale: 1, offsetX: 0, offsetY: 0, dragging: false, dragStartX: 0, dragStartY: 0 };
      if (type === 'grayscale') return { ...f, grayscale: !f.grayscale };
      if (type === 'invert') return { ...f, invert: !f.invert };
      if (type === 'brightness+') return { ...f, brightness: Math.min(f.brightness + 0.2, 3) };
      if (type === 'brightness-') return { ...f, brightness: Math.max(f.brightness - 0.2, 0.2) };
      if (type === 'contrast+') return { ...f, contrast: Math.min(f.contrast + 0.2, 3) };
      if (type === 'contrast-') return { ...f, contrast: Math.max(f.contrast - 0.2, 0.2) };
      if (type === 'rotate') return { ...f, rotate: (f.rotate + 90) % 360 };
      if (type === 'zoom+') return { ...f, scale: Math.min(f.scale + 0.2, 4) };
      if (type === 'zoom-') return { ...f, scale: Math.max(f.scale - 0.2, 0.2) };
      return f;
    });
  };

  // Drag para mover imagen
  const handleDragStart = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    e.preventDefault();
    setImgFilters(f => ({ ...f, dragging: true, dragStartX: e.clientX - f.offsetX, dragStartY: e.clientY - f.offsetY }));
  };
  const handleDrag = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    if (!imgFilters.dragging) return;
    setImgFilters(f => ({ ...f, offsetX: e.clientX - f.dragStartX, offsetY: e.clientY - f.dragStartY }));
  };
  const handleDragEnd = () => {
    setImgFilters(f => ({ ...f, dragging: false }));
  };

  // Paso 1: Subir imagen
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  // Llama a la API de IA para analizar la imagen
  async function analizarImagenIA(f: File) {
    setAnalyzingMsg('Analizando imagen con IA...');
    setStep('analyzing');
    setIaResult("");
    setDiagnostico("");
    // Convertir a base64
    const base64 = await fileToBase64(f);
    try {
      // 1. Llamar al backend Node.js con Groq Vision
      const res = await fetch('/api/analizar', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ imagen: base64, especie })
      });
      const data = await res.json();
      const descripcion = data.resultado || "Sin respuesta del modelo.";
      setIaResult(descripcion); // Guardamos el resultado pero no lo mostramos

      // 2. Mostrar animación y mensaje mientras Sana analiza
      setAnalyzingMsg('Generando diagnóstico...');
      setStep('analyzing');

      // 3. Construir mensaje clínico para Sana (solo con la descripción de la IA)
      const userMsg =
        `Descripción de hallazgos por IA: ${descripcion}\n\n` +
        'Por favor, genera un informe clínico profesional completo que incluya:\n' +
        '1. Diagnóstico principal\n' +
        '2. Hallazgos relevantes\n' +
        '3. Recomendaciones de tratamiento\n' +
        '4. Sugerencias de seguimiento\n' +
        '5. Consideraciones especiales según la especie\n' +
        '6. Conclusiones para el veterinario';

      // 4. Llamar a Sana con el formato correcto
      const sanaRes = await fetch('/api/sana', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: userMsg }
          ]
        })
      });
      const sanaData = await sanaRes.json();
      setDiagnostico(sanaData.reply || sanaData.resultado || "Sin respuesta de Sana.");
      setStep('review');
    } catch (e) {
      setDiagnostico("Error al analizar la imagen");
      setStep('review');
    }
  }
  // Paso 2: Analizar imagen con IA y Sana
  async function analizarImagen(f: File) {
    setAnalyzingMsg('Analizando imagen con IA...');
    // 1. Convertir a base64
    const base64 = await fileToBase64(f);
    // 2. Llamar backend IA
    const res = await fetch('/api/image-diagnostic', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ imagen: base64 })
    });
    const data = await res.json();
    setIaResult(data.descripcion || "");
    setAnalyzingMsg('Analizando hallazgos con Sana...');
    // 3. Enviar a Sana para diagnóstico (agrega aquí la lógica si es necesario)
    // Por ahora, avanzar automáticamente al paso de revisión
    setTimeout(() => {
      setStep('review');
    }, 1000);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Paso 3: Agregar a imagenología
  // (Funciones eliminadas porque usaban estados inválidos y no se usan en el flujo actual)

  return (
    <div className="space-y-6">
      <Card className="border-2 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/image-diagnostic">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Diagnóstico por Imagen</h1>
                <Badge variant="secondary" className="gap-1">
                  <ImageIcon className="size-3" />
                  Beta 1.2
                </Badge>
              </div>
              <p className="text-muted-foreground">Subí una imagen, seleccioná dueño y mascota, zona, y la IA la analizará.</p>
            </div>
          </div>

          {step === 'input' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                {/* Logo Sana SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="size-10" aria-hidden="true">
                  <g transform="translate(10,10)">
                    <path d="M 0 30 L 15 0 L 40 15 L 65 0 L 80 30 L 80 60 L 55 80 L 25 80 L 0 60 Z" fill="none" stroke="#2ECC71" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <circle cx="25" cy="45" r="5" fill="#2ECC71"></circle>
                    <rect x="23" y="55" width="4" height="15" rx="2" fill="#2ECC71"></rect>
                    <circle cx="55" cy="45" r="12" fill="none" stroke="#2ECC71" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></circle>
                    <circle cx="55" cy="45" r="4" fill="#2ECC71"></circle>
                  </g>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Asistente de IA Sana</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Presioná <b>"Analizar"</b> luego de cargar la imagen, seleccionar dueño y mascota, y zona.<br />
                  La IA generará una descripción automática.<br />
                </p>
              </div>
              <div className="w-full flex flex-col gap-4 mt-4">
                <Input type="file" accept="image/*" onChange={handleFile} />
                <div className="flex flex-row gap-6 items-start w-full mt-2">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Dueño</Label>
                      <Select value={selectedDuenoId} onValueChange={(value) => {
                        setSelectedDuenoId(value);
                        setSelectedMascotaId(""); // Resetear mascota cuando cambia el dueño
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar dueño" />
                        </SelectTrigger>
                        <SelectContent>
                          {duenos?.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mascota</Label>
                      <Select 
                        value={selectedMascotaId} 
                        onValueChange={setSelectedMascotaId}
                        disabled={!selectedDuenoId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDuenoId ? "Seleccionar mascota" : "Primero seleccioná el dueño"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredMascotas.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nombre} ({m.especie})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Especie (automática)</Label>
                      <Input 
                        type="text" 
                        value={especie} 
                        readOnly 
                        placeholder="Seleccioná una mascota para ver la especie"
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Zona</Label>
                      <Input type="text" value={zona} onChange={e => setZona(e.target.value)} placeholder="Ej: Ojo izquierdo, Tórax, etc." />
                    </div>
                  </div>
                  {preview && (
                    <>
                      <div className="flex-shrink-0 flex justify-end w-48">
                        <img
                          src={preview}
                          alt="preview"
                          className="max-h-48 rounded border border-muted-foreground/30 object-contain cursor-zoom-in"
                          onClick={() => {
                            setOpenPreview(true);
                            setImgFilters(f => ({ ...f, scale: 1, offsetX: 0, offsetY: 0, rotate: 0, brightness: 1, contrast: 1, grayscale: false, invert: false }));
                          }}
                        />
                      </div>
                      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
                        <DialogContent className="max-w-4xl flex flex-col items-center justify-center p-4">
                          <div className="flex flex-row gap-2 mb-2 flex-wrap justify-center">
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('zoom-')}>-</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('zoom+')}>+</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('rotate')}>⟳</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('grayscale')}>B/N</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('invert')}>INV</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('brightness-')}>-B</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('brightness+')}>+B</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('contrast-')}>-C</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('contrast+')}>+C</button>
                            <button type="button" className="px-2 py-1 rounded bg-muted border" onClick={() => handleFilter('reset')}>Reset</button>
                          </div>
                          <div className="relative w-full flex justify-center items-center" style={{height: '70vh', overflow: 'hidden'}}>
                            <img
                              src={preview}
                              alt="zoom"
                              draggable={false}
                              style={{
                                maxWidth: 'none',
                                maxHeight: 'none',
                                cursor: imgFilters.dragging ? 'grabbing' : 'grab',
                                filter: `${imgFilters.grayscale ? 'grayscale(1)' : ''} ${imgFilters.invert ? 'invert(1)' : ''} brightness(${imgFilters.brightness}) contrast(${imgFilters.contrast})`.trim(),
                                transform: `translate(${imgFilters.offsetX}px,${imgFilters.offsetY}px) scale(${imgFilters.scale}) rotate(${imgFilters.rotate}deg)`
                              }}
                              onMouseDown={handleDragStart}
                              onMouseMove={handleDrag}
                              onMouseUp={handleDragEnd}
                              onMouseLeave={handleDragEnd}
                              onWheel={e => {
                                e.preventDefault();
                                handleFilter(e.deltaY > 0 ? 'zoom-' : 'zoom+');
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
                <Button 
                  data-slot="button" 
                  className="w-full mt-2" 
                  onClick={() => file && selectedMascotaId && zona && analizarImagenIA(file)} 
                  disabled={!file || !selectedMascotaId || !zona}
                >
                  Analizar
                </Button>
              </div>
            </div>
          )}
          {step === 'analyzing' && (
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="flex items-center justify-center w-full">
                  <div className="rounded-lg border p-4 my-2 bg-muted animate-pulse text-muted-foreground flex items-center justify-center gap-3 w-full max-w-md mx-auto">
                    <Sparkles className="size-8 text-primary animate-spin" />
                    <span className="text-base">{analyzingMsg}</span>
                  </div>
                </div>
                {preview && <img src={preview} alt="preview" className="mx-auto max-h-60 rounded" />}
              </div>
            </div>
          )}
          {step === 'review' && (
            <Card className="mb-6 border-primary border-2 bg-muted/50">
              <CardHeader>
                <CardTitle>Informe profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview && <img src={preview} alt="preview" className="mx-auto max-h-60 rounded border border-muted-foreground/30" />}
                
                {/* Información de la mascota */}
                {selectedMascota && (
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {selectedMascota.especie?.toLowerCase() === 'perro' ? (
                        <Dog className="size-5" />
                      ) : selectedMascota.especie?.toLowerCase() === 'gato' ? (
                        <Cat className="size-5" />
                      ) : (
                        <Dog className="size-5" />
                      )}
                      Datos del paciente
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Nombre</Label>
                        <p className="font-medium">{selectedMascota.nombre || "No especificado"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" /> Edad
                        </Label>
                        <p className="font-medium">{calcularEdad(selectedMascota.fecha_nacimiento)}</p>
                        {selectedMascota.fecha_nacimiento && (
                          <p className="text-xs text-muted-foreground">
                            Nacimiento: {formatearFecha(selectedMascota.fecha_nacimiento)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Especie</Label>
                        <p className="font-medium">{selectedMascota.especie || "No especificada"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Raza</Label>
                        <p className="font-medium">{selectedMascota.raza || "No especificada"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <Scale className="size-3" /> Peso
                        </Label>
                        <p className="font-medium">
                          {selectedMascota.peso ? `${selectedMascota.peso} kg` : "No especificado"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Sexo</Label>
                        <p className="font-medium">
                          {selectedMascota.sexo === 'M' ? 'Macho' : 
                           selectedMascota.sexo === 'F' ? 'Hembra' : 
                           selectedMascota.sexo || "No especificado"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Zona analizada</Label>
                        <p className="font-medium">{zona || "No especificada"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Fecha del estudio</Label>
                        <p className="font-medium">{new Date().toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <Label>Diagnóstico y recomendaciones:</Label>
                  <div
                    className="prose max-w-none rounded p-5 border mt-3 overflow-x-auto"
                    style={{
                      background: '#1e293b', // slate-800
                      color: '#f1f5f9',      // slate-100
                      borderColor: '#334155', // slate-700
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p style={{marginBottom: '1.1em'}} {...props} />,
                        h1: ({node, ...props}) => <h1 style={{marginTop: '1.5em', marginBottom: '0.7em'}} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{marginTop: '1.2em', marginBottom: '0.6em'}} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{marginTop: '1em', marginBottom: '0.5em'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{marginBottom: '1em', paddingLeft: '1.2em'}} {...props} />,
                        ol: ({node, ...props}) => <ol style={{marginBottom: '1em', paddingLeft: '1.2em'}} {...props} />,
                        li: ({node, ...props}) => <li style={{marginBottom: '0.3em'}} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{margin: '1em 0', paddingLeft: '1em', borderLeft: '3px solid #cbd5e1', color: '#64748b'}} {...props} />,
                      }}
                    >
                      {diagnostico}
                    </ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}