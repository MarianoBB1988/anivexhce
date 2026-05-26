"use client"

import { useState } from "react"
import { Menu, X, ChevronRight, MessageSquare, Brain, Shield, ArrowRight, Sparkles, Target, Zap, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SanaLogo } from "@/components/sana-chat"
import { ImageSlider } from "@/components/image-slider"
import Link from "next/link"

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{
 
        backgroundImage: "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,1.2)), url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ===== NAVBAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          {/* Logo */}
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 p-1.5">
              <SanaLogo className="size-full" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Sana
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo("nosotros")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sobre nosotros
            </button>
            <button onClick={() => scrollTo("sanavet")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              SanaVet
            </button>
            <button onClick={() => scrollTo("sanaia")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sana IA
            </button>
            <button onClick={() => scrollTo("equipo")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Equipo
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.97]"
            >
              Acceder a SanaVet
              <ArrowRight className="size-3.5" />
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground md:hidden hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-border/40 bg-background px-4 pb-6 pt-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <button onClick={() => scrollTo("nosotros")} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Target className="size-4 text-primary" />
                Sobre nosotros
              </button>
              <button onClick={() => scrollTo("sanavet")} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Sparkles className="size-4 text-accent" />
                SanaVet
              </button>
              <button onClick={() => scrollTo("sanaia")} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Brain className="size-4 text-primary" />
                Sana IA
              </button>
              <button onClick={() => scrollTo("equipo")} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Zap className="size-4 text-primary" />
                Equipo
              </button>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                Acceder a SanaVet
                <ArrowRight className="size-3.5" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section id="hero" className="relative pt-16">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-60 -right-60 size-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-60 -left-60 size-[500px] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 size-[300px] rounded-full bg-primary/[0.03] blur-3xl" />
        </div>

        {/* Banner slider con textos superpuestos */}
        <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-14">
          <div className="relative w-full h-56 sm:h-72 md:h-80 lg:h-96 overflow-hidden rounded-2xl">
            <ImageSlider />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-4xl text-center">
            {/* CTA */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.97] sm:w-auto"
              >
                Acceder a SanaVet
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => scrollTo("sanavet")}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border px-8 text-base font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground sm:w-auto"
              >
                Conocer más
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 gap-8 border-t border-border/40 pt-12 sm:grid-cols-3">
              {[
                { value: "Tecnología", label: "IA aplicada al diagnóstico" },
                { value: "Accesibilidad", label: "Consultas desde cualquier lugar" },
                { value: "Confianza", label: "Apoyo al profesional veterinario" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-sm font-bold text-primary">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOBRE NOSOTROS ===== */}
      <section id="nosotros" className="relative border-t border-border/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 right-0 size-[400px] -translate-y-1/2 rounded-full bg-primary/[0.02] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              Quiénes somos
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sobre{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Sana
              </span>
            </h2>

            <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
              <p>
                En <strong className="text-foreground">Sana</strong> desarrollamos soluciones digitales enfocadas en mejorar la conexión entre la tecnología y el profesional de la salud.
              </p>

              <p>
                Nuestro primer producto, <strong className="text-foreground">SanaVet</strong>, nace con el objetivo de brindar una experiencia veterinaria más moderna, accesible e inteligente, permitiendo a los usuarios realizar consultas y utilizar herramientas de análisis de imágenes como apoyo para obtener una orientación más integral.
              </p>

              <p>
                Creemos en el potencial de la innovación tecnológica para optimizar procesos, facilitar el acceso a la información y complementar el trabajo profesional veterinario mediante herramientas digitales intuitivas y eficientes.
              </p>

              <p>
                Trabajamos para crear soluciones que combinen tecnología, accesibilidad y confianza, impulsando una nueva forma de interacción entre las personas y el cuidado de sus mascotas.
              </p>
            </div>

            {/* Valores */}
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: "Innovación",
                  desc: "Tecnología de vanguardia aplicada a la salud veterinaria.",
                },
                {
                  icon: Shield,
                  title: "Confianza",
                  desc: "Soluciones seguras que complementan el trabajo profesional.",
                },
                {
                  icon: MessageSquare,
                  title: "Accesibilidad",
                  desc: "Atención veterinaria al alcance de más personas.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border/50 bg-card/50 p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SANAVET ===== */}
      <section id="sanavet" className="relative border-t border-border/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 size-[400px] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" />
              Nuestro producto
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SanaVet
              </span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Plataforma veterinaria integral con inteligencia artificial.
            </p>

            <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
              <p>
                Nuestra plataforma fue creada con el objetivo de acercar la atención veterinaria a más personas, permitiendo realizar consultas de manera simple y obtener una orientación inicial apoyada en herramientas tecnológicas avanzadas, incluyendo análisis de imágenes y asistencia digital.
              </p>

              <p>
                Creemos que la tecnología puede complementar el trabajo veterinario tradicional, ayudando a detectar señales importantes, agilizar procesos y ofrecer una atención más integral para cada mascota.
              </p>

              <p>
                Con <strong className="text-foreground">SanaVet</strong> trabajamos para construir una veterinaria moderna, accesible y enfocada en mejorar la comunicación entre profesionales y dueños de mascotas, priorizando siempre el bienestar animal, la confianza y la calidad del servicio.
              </p>
            </div>

            {/* Feature cards */}
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: "Consultas inteligentes",
                  desc: "Asistencia digital con IA para orientación inicial personalizada.",
                },
                {
                  icon: Brain,
                  title: "Análisis de imágenes",
                  desc: "Herramientas de diagnóstico por imagen como apoyo profesional.",
                },
                {
                  icon: Target,
                  title: "Gestión integral",
                  desc: "Historial clínico, turnos y seguimiento en un solo lugar.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border/50 bg-card/50 p-5 transition-all hover:border-accent/30 hover:shadow-md hover:shadow-accent/5"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.97]"
              >
                Acceder a SanaVet
                <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">
                Plataforma para profesionales y dueños de mascotas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SANA IA ===== */}
      <section id="sanaia" className="relative border-t border-border/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 size-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Brain className="size-3.5" />
              Asistente con inteligencia artificial
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Sana IA
              </span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Chatbot veterinario basado en Merck Veterinary, potenciado con inteligencia artificial.
            </p>

            <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
              <p>
                <strong className="text-foreground">Sana IA</strong> es nuestro asistente inteligente integrado en SanaVet, diseñado para acompañar a profesionales y dueños de mascotas en cada etapa del cuidado veterinario.
              </p>

              <p>
                Basado en el reconocido <strong className="text-foreground">Manual Merck de Veterinaria</strong>, Sana IA no solo te permite realizar consultas sobre síntomas, enfermedades y tratamientos, sino que también es capaz de analizar imágenes clínicas y evaluar historiales médicos completos para ofrecer una orientación más precisa y fundamentada.
              </p>

              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.03] p-6">
                <h3 className="text-base font-semibold text-foreground">Capacidades principales</h3>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="size-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Consultas veterinarias</p>
                      <p className="text-xs text-muted-foreground">Respondé preguntas sobre síntomas, enfermedades, medicamentos y tratamientos con respaldo del Merck Veterinary Manual.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <Activity className="size-3 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Análisis de imágenes</p>
                      <p className="text-xs text-muted-foreground">Subí imágenes clínicas para obtener un análisis preliminar que ayude en la detección de posibles anomalías.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Brain className="size-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Diagnóstico de historias clínicas</p>
                      <p className="text-xs text-muted-foreground">Analizá historiales clínicos completos para identificar patrones, señales de alerta y generar reportes de apoyo.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <p className="mt-6">
                Sana IA funciona como una herramienta de apoyo complementaria al criterio profesional, ayudando a detectar señales importantes, agilizar procesos y ofrecer una atención más integral para cada mascota.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.97]"
              >
                Probar Sana IA
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EQUIPO ===== */}
      <section id="equipo" className="relative border-t border-border/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 right-0 size-[300px] rounded-full bg-primary/[0.02] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                <Zap className="size-3.5" />
                El equipo
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Conocé a quienes hacen posible{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Sana
                </span>
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Un equipo multidisciplinario comprometido con la innovación tecnológica.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {/* Emmanuelle Poloni - CEO */}
              <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-center transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
                  <div className="flex size-full items-center justify-center rounded-full bg-background">
                    <span className="text-2xl font-bold text-primary">EP</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-foreground">Emmanuelle Poloni</h3>
                <p className="text-sm font-medium text-primary">CEO</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Lidera la visión estratégica de Sana, impulsando la innovación y el crecimiento de la compañía.
                </p>
              </div>

              {/* Matias Assanelli - Ventas y Asesoramiento */}
              <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-center transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
                  <div className="flex size-full items-center justify-center rounded-full bg-background">
                    <span className="text-2xl font-bold text-accent">MA</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-foreground">Matias Assanelli</h3>
                <p className="text-sm font-medium text-accent">CGO</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Orientado a brindar soluciones personalizadas, asesorando a profesionales y clínicas en la adopción de SanaVet.
                </p>
              </div>

              {/* Mariano Bastarreix - Desarrollo y Despliegue */}
              <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-center transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
                  <div className="flex size-full items-center justify-center rounded-full bg-background">
                    <span className="text-2xl font-bold text-primary">MB</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-foreground">Mariano Bastarreix</h3>
                <p className="text-sm font-medium text-primary">CTO</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Encargado del desarrollo tecnológico, la arquitectura de sistemas y el despliegue de las soluciones digitales de Sana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER / CTA FINAL ===== */}
      <footer className="border-t border-border/20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-xl bg-primary/10 p-3">
              <SanaLogo className="size-full" />
            </div>
            <h3 className="text-2xl font-bold sm:text-3xl">
              ¿Listo para transformar la atención veterinaria?
            </h3>
            <p className="mt-4 text-base text-muted-foreground">
              Accedé a SanaVet y descubrí una nueva forma de conectar la tecnología con el cuidado de las mascotas.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.97] sm:w-auto"
              >
                Acceder a SanaVet
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mt-16 border-t border-border/20 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Sana — Innovación tecnológica para la salud
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Hecho con ❤️ para transformar la veterinaria
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
