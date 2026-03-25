# Anivex — Veterinary Clinic Management SaaS

A multi-tenant veterinary clinic management platform built with Next.js, Supabase, and Tailwind CSS. Designed for veterinary clinics to manage owners, pets, consultations, appointments, vaccinations, surgeries, and clinical documents.

---

## Features

- **Multi-tenant SaaS** — each clinic has its own isolated data
- **Role-based access** — `admin`, `veterinario`, `asistente`
- **Owners & Pets management** — full CRUD with linked records
- **Clinical consultations** — history per pet with file attachments
- **Appointment scheduling** — calendar + list view, status tracking
- **Vaccinations** — vaccination records with next-dose reminders
- **Surgeries** — surgical records with status workflow and file attachments
- **Document attachments** — upload/view/delete files on consultations and surgeries
- **Dashboard overview** — charts, upcoming appointments, recent consultations
- **i18n** — Spanish / English (persisted in localStorage)
- **Dark / Light / System theme**
- **Analytics** — Vercel Analytics included

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 15.x |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.7.3 |
| Styling | Tailwind CSS | ^4.2.0 |
| Component Library | shadcn/ui + Radix UI | latest |
| Backend / Auth / DB | Supabase | ^2.99.2 |
| Storage | Supabase Storage | — |
| Charts | Recharts | 2.15.0 |
| Icons | Lucide React | ^0.564.0 |
| Date Picker | react-day-picker + date-fns | 9.13.2 / 4.1.0 |
| Themes | next-themes | ^0.4.6 |
| Analytics | @vercel/analytics | 1.6.1 |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MarianoBB1988/anivex.git
cd anivex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project → **Settings → API**.

### 4. Set up the Supabase database

Run the following SQL in your Supabase **SQL Editor**:

```sql
-- Clinics
CREATE TABLE clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users / Profiles
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'veterinario', 'asistente')),
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owners
CREATE TABLE duenos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets
CREATE TABLE mascotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  especie TEXT,
  raza TEXT,
  fecha_nacimiento DATE,
  sexo TEXT,
  peso NUMERIC,
  id_dueno UUID REFERENCES duenos(id),
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaccine types
CREATE TABLE tipos_vacuna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  color TEXT,
  id_clinica UUID REFERENCES clinicas(id)
);

-- Surgery types
CREATE TABLE tipos_cirugia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  id_clinica UUID REFERENCES clinicas(id)
);

-- Consultations
CREATE TABLE consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_mascota UUID REFERENCES mascotas(id),
  id_usuario UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ NOT NULL,
  motivo TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  observaciones TEXT,
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_mascota UUID REFERENCES mascotas(id),
  fecha_hora TIMESTAMPTZ NOT NULL,
  estado TEXT DEFAULT 'sin_atender' CHECK (estado IN ('sin_atender', 'atendido', 'ausente')),
  id_usuario UUID REFERENCES usuarios(id),
  notas TEXT,
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaccinations
CREATE TABLE vacunas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_mascota UUID REFERENCES mascotas(id),
  id_tipo_vacuna UUID REFERENCES tipos_vacuna(id),
  fecha DATE NOT NULL,
  proxima_dosis DATE,
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surgeries
CREATE TABLE cirugias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_mascota UUID REFERENCES mascotas(id),
  id_usuario UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ NOT NULL,
  tipo TEXT,
  descripcion TEXT,
  resultado TEXT,
  estado TEXT DEFAULT 'programado',
  id_clinica UUID REFERENCES clinicas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica UUID REFERENCES clinicas(id),
  tipo_entidad TEXT NOT NULL CHECK (tipo_entidad IN ('consulta', 'cirugia')),
  id_entidad UUID NOT NULL,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Set up Supabase Storage

In your Supabase project, go to **Storage** and create a bucket called **`documentos`**.

> Set the bucket to **private** (the app uses signed URLs for secure access).

### 6. Enable Row Level Security (recommended)

Enable RLS on all tables and add policies scoped to `id_clinica` to ensure each clinic only sees its own data.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/                        # Next.js App Router
  page.tsx                  # Login
  layout.tsx                # Root layout (providers)
  dashboard/
    page.tsx                # Overview dashboard
    owners/                 # Dueños
    pets/                   # Mascotas
    consultations/          # Consultas clínicas
    appointments/           # Turnos
    vaccinations/           # Vacunas
    surgeries/              # Cirugías
    users/                  # Usuarios de clínica

components/                 # Shared UI components
  app-sidebar.tsx
  documentos-panel.tsx
  protected-route.tsx
  language-selector.tsx
  ui/                       # shadcn/ui components

hooks/                      # Custom React hooks
lib/
  auth-context.tsx
  language-context.tsx
  types.ts
  supabase.ts
  translations.ts
  services/                 # Supabase service functions
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT
