'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Slide {
  src: string
  title?: string
  subtitle?: string
}

const SLIDES: Slide[] = [
  {
    src: '/banner/banner1.jpg',
    title: 'Bienvenido a Sana',
    subtitle: 'Innovación tecnológica para la salud',
  },
  {
    src: '/banner/banner2.jpg',
    title: 'Tecnología al servicio de la salud',
    subtitle: 'Desarrollamos soluciones digitales enfocadas en mejorar la conexión entre la tecnología y el profesional de la salud.',
  },
  {
    src: '/banner/banner3.jpg',
    title: 'SanaVet',
    subtitle: 'Nuestro primer producto, nace con el objetivo de brindar una experiencia veterinaria más moderna, accesible e inteligente.',
  },
]

export function ImageSlider() {
  const [current, setCurrent] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => {
      const next = (prev + 1) % SLIDES.length
      return next
    })
    setAnimKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Styles */}
      <style jsx>{`
        @keyframes zoomOut {
          from {
            transform: scale(1.15);
          }
          to {
            transform: scale(1);
          }
        }
        .zoom-out {
          animation: zoomOut 5s ease-out forwards;
        }
      `}</style>

      {/* Images */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            key={i === current ? animKey : 'hidden'}
            className={`absolute inset-0 ${i === current ? 'zoom-out' : ''}`}
          >
            <Image
              src={slide.src}
              alt={`Banner ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
          {/* Overlay oscuro para legibilidad */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Texto superpuesto */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-3xl text-center text-white">
              {slide.title && (
                <h2 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
                  {slide.title}
                </h2>
              )}
              {slide.subtitle && (
                <p className="mt-3 text-sm leading-relaxed drop-shadow-md sm:text-base md:text-lg lg:mt-4 lg:text-xl">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i)
              setAnimKey((prev) => prev + 1)
            }}
            className={`size-2 rounded-full transition-all ${
              i === current
                ? 'w-6 bg-white shadow-md'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Ir al slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
