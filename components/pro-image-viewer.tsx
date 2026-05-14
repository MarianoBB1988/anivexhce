'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Contrast,
  FlipHorizontal,
  Maximize,
  Minimize,
  Move,
  RefreshCcw,
  RotateCw,
  Search,
  SunMedium,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface ProImageViewerProps {
  imageUrl: string
  title?: string
  onBack?: () => void
}

interface Point {
  x: number
  y: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function ProImageViewer({ imageUrl, title = 'Visor de imagen', onBack }: ProImageViewerProps) {
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(false)
  const [invert, setInvert] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<Point | null>(null)

  const filterStyle = useMemo(() => {
    const filters = [
      grayscale ? 'grayscale(1)' : '',
      invert ? 'invert(1)' : '',
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
    ].filter(Boolean)

    return filters.join(' ')
  }, [brightness, contrast, grayscale, invert])

  const resetViewer = () => {
    setBrightness(100)
    setContrast(100)
    setGrayscale(false)
    setInvert(false)
    setScale(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
    setDragStart(null)
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    setScale((current) => clamp(current + (event.deltaY > 0 ? -0.1 : 0.1), 0.2, 6))
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y })
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return
    setOffset({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y })
  }

  const handlePointerUp = () => {
    setDragStart(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack && (
              <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">Visor avanzado para imagenología</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setScale((current) => clamp(current - 0.2, 0.2, 6))}>
              <Minimize className="mr-2 size-4" />Zoom -
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setScale((current) => clamp(current + 0.2, 0.2, 6))}>
              <Maximize className="mr-2 size-4" />Zoom +
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRotation((current) => (current + 90) % 360)}>
              <RotateCw className="mr-2 size-4" />Rotar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={resetViewer}>
              <RefreshCcw className="mr-2 size-4" />Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="min-h-0 overflow-hidden">
          <CardContent className="h-full space-y-6 overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Brillo</Label>
                <span className="text-sm text-muted-foreground">{brightness}%</span>
              </div>
              <div className="flex items-center gap-3">
                <SunMedium className="size-4 text-muted-foreground" />
                <Slider value={[brightness]} min={10} max={250} step={1} onValueChange={([value]) => setBrightness(value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Contraste</Label>
                <span className="text-sm text-muted-foreground">{contrast}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Contrast className="size-4 text-muted-foreground" />
                <Slider value={[contrast]} min={10} max={250} step={1} onValueChange={([value]) => setContrast(value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Zoom</Label>
                <span className="text-sm text-muted-foreground">{scale.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <Search className="size-4 text-muted-foreground" />
                <Slider value={[Math.round(scale * 100)]} min={20} max={600} step={5} onValueChange={([value]) => setScale(value / 100)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={grayscale ? 'default' : 'outline'} onClick={() => setGrayscale((current) => !current)}>
                Blanco y negro
              </Button>
              <Button type="button" variant={invert ? 'default' : 'outline'} onClick={() => setInvert((current) => !current)}>
                <FlipHorizontal className="mr-2 size-4" />Invertir
              </Button>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 text-foreground">
                <Move className="size-4" />Navegación
              </div>
              <p>Arrastrá la imagen para moverla. Usá los botones o el control de zoom; la rueda solo hace zoom con Ctrl presionado.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden">
          <CardContent className="p-0">
            <div
              className="relative h-[calc(100vh-10rem)] min-h-[540px] overflow-hidden bg-[#0b1118]"
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img
                src={imageUrl}
                alt={title}
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  filter: filterStyle,
                  cursor: dragStart ? 'grabbing' : 'grab',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}