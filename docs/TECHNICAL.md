# Anivex — Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication & Authorization](#authentication--authorization)
5. [Multi-Tenancy Pattern](#multi-tenancy-pattern)
6. [Database Schema](#database-schema)
7. [Service Layer](#service-layer)
8. [Custom Hooks](#custom-hooks)
9. [Feature Traceability Matrix](#feature-traceability-matrix)
10. [Document Storage System](#document-storage-system)
11. [Internationalization (i18n)](#internationalization-i18n)
12. [Component Patterns](#component-patterns)
13. [Routing & Page Structure](#routing--page-structure)
14. [Configuration](#configuration)
15. [Known Constraints](#known-constraints)

---

## 1. Architecture Overview

Anivex is a **multi-tenant SaaS** application for veterinary clinics. Each clinic (`clinica`) is an isolated tenant — all database queries are scoped by `id_clinica`, ensuring full data separation without separate schemas or databases.

```
Browser
  └── Next.js App Router (SSR disabled — all 'use client')
        ├── AuthContext          ← Supabase session management
        ├── LanguageContext      ← i18n (ES / EN)
        ├── ThemeProvider        ← dark / light / system
        └── Dashboard Shell
              ├── AppSidebar     ← navigation + logout
              └── Pages          ← each page is a ProtectedRoute
                    └── *-content.tsx   ← actual UI + data
                          └── Supabase client (lib/supabase.ts)
```

Data flow:
1. Page mounts → calls hook (`use-consultas`, `use-mascotas`, etc.)
2. Hook calls service function (`lib/services/*.ts`)
3. Service queries Supabase filtering by `id_clinica` from `AuthContext`
4. Result returned to component for render

---

## 2. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.x | App framework, App Router, Turbopack dev server |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.7.3 | Static typing |
| Tailwind CSS | ^4.2.0 | Utility-first styling |
| shadcn/ui | latest | Pre-built accessible components (Dialog, Sheet, Table…) |
| Radix UI | various | Headless primitives backing shadcn/ui |
| Supabase JS | ^2.99.2 | Auth, PostgreSQL queries, Storage |
| Recharts | 2.15.0 | Dashboard bar/line charts |
| Lucide React | ^0.564.0 | SVG icon set |
| date-fns | 4.1.0 | Date formatting and arithmetic |
| react-day-picker | 9.13.2 | Calendar date picker component |
| next-themes | ^0.4.6 | Dark/light/system theme switching |
| @vercel/analytics | 1.6.1 | Page-view analytics |

---

## 3. Project Structure

```
c:\xampp3\htdocs\anivex\
├── app/
│   ├── globals.css                    # Tailwind base + global styles
│   ├── layout.tsx                     # Root layout — wraps all providers
│   ├── page.tsx                       # Login page
│   └── dashboard/
│       ├── layout.tsx                 # Dashboard shell (SidebarProvider)
│       ├── page.tsx                   # Dashboard overview route
│       ├── dashboard-content.tsx      # Stats, charts, recent data
│       ├── owners/
│       │   ├── page.tsx               # Route wrapper
│       │   └── owners-content.tsx     # Dueños CRUD UI
│       ├── pets/
│       │   ├── page.tsx
│       │   └── pets-content.tsx       # Mascotas CRUD UI
│       ├── consultations/
│       │   ├── page.tsx
│       │   └── consultations-content.tsx  # Consultas + docs + detail sheet
│       ├── appointments/
│       │   ├── page.tsx
│       │   └── appointments-content.tsx   # Turnos calendar/list/filters
│       ├── vaccinations/
│       │   ├── page.tsx
│       │   └── vaccinations-content.tsx   # Vacunas CRUD
│       ├── surgeries/
│       │   ├── page.tsx
│       │   └── surgeries-content.tsx      # Cirugías + docs + status change
│       └── users/
│           └── page.tsx               # Usuarios de clínica
│
├── components/
│   ├── app-sidebar.tsx                # Sidebar nav + logout logic
│   ├── documentos-panel.tsx           # Reusable file attachment panel
│   ├── language-selector.tsx          # ES/EN toggle
│   ├── protected-route.tsx            # Auth guard HOC
│   ├── theme-provider.tsx             # next-themes wrapper
│   └── ui/                            # All shadcn/ui components (50+)
│
├── hooks/
│   ├── use-data.ts                    # Generic Supabase data hook
│   ├── use-duenos.ts
│   ├── use-mascotas.ts
│   ├── use-consultas.ts
│   ├── use-turnos.ts
│   ├── use-vacunas.ts
│   ├── use-cirugias.ts
│   ├── use-usuarios.ts
│   ├── use-user.ts                    # Current authenticated user
│   ├── use-mobile.ts                  # Responsive breakpoint
│   └── use-toast.ts                   # Toast notification hook
│
├── lib/
│   ├── auth-context.tsx               # AuthContext + useAuth hook
│   ├── language-context.tsx           # LanguageContext + useLanguage hook
│   ├── supabase.ts                    # Supabase client singleton
│   ├── translations.ts                # All translation strings (ES + EN)
│   ├── types.ts                       # All TypeScript interfaces
│   ├── utils.ts                       # cn() utility (clsx + tailwind-merge)
│   └── services/
│       ├── index.ts                   # Re-exports all services
│       ├── auth.ts
│       ├── duenos.ts
│       ├── mascotas.ts
│       ├── consultas.ts
│       ├── turnos.ts
│       ├── vacunas.ts
│       ├── cirugias.ts
│       ├── usuarios.ts
│       ├── clinicas.ts
│       ├── documentos.ts
│       └── users.ts
│
├── styles/
│   └── globals.css                    # Duplicate/alternate global styles
│
├── public/                            # Static assets
├── next.config.mjs                    # Next.js config
├── tsconfig.json
├── tailwind.config (via postcss.config.mjs)
└── components.json                    # shadcn/ui config
```

---

## 4. Authentication & Authorization

### Auth Flow

```
1. User submits email + password on /page.tsx (login)
2. signIn() → supabase.auth.signInWithPassword()
3. Supabase returns session + user
4. AuthContext onAuthStateChange fires
5. Fetches matching row from `usuarios` table by auth.uid
6. Stores { user, session, clinicaId, role } in context
7. ProtectedRoute checks context → redirects to "/" if unauthenticated
```

### Key files

| File | Responsibility |
|---|---|
| `lib/auth-context.tsx` | Creates `AuthContext`, exposes `useAuth()`, wraps `supabase.auth.onAuthStateChange` |
| `lib/services/auth.ts` | `signIn`, `signOut`, `signUp`, `resetPassword`, `updatePassword`, `getCurrentUser` |
| `components/protected-route.tsx` | HOC — redirects unauthenticated users to `/` |
| `components/app-sidebar.tsx` | Calls `signOut()` then unconditionally redirects + `router.refresh()` |

### Roles

| Role | Description |
|---|---|
| `admin` | Full access to all modules including users management |
| `veterinario` | Clinical access (consultations, surgeries, vaccinations) |
| `asistente` | Operational access (appointments, owners, pets) |

Role is stored in the `usuarios` table and exposed via `useAuth().role`.

---

## 5. Multi-Tenancy Pattern

Every query in every service file follows this pattern:

```ts
const { clinicaId } = useAuth()

// SELECT
supabase.from('consultas').select('*').eq('id_clinica', clinicaId)

// INSERT
supabase.from('consultas').insert({ ...data, id_clinica: clinicaId })

// UPDATE
supabase.from('consultas').update(data).eq('id', id).eq('id_clinica', clinicaId)

// DELETE
supabase.from('consultas').delete().eq('id', id).eq('id_clinica', clinicaId)
```

The `id_clinica` filter is applied on **every** operation — both as a data-isolation guard and as a defense-in-depth measure alongside RLS policies.

---

## 6. Database Schema

### `clinicas`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto |
| nombre | TEXT | clinic name |
| direccion | TEXT | |
| telefono | TEXT | |
| created_at | TIMESTAMPTZ | |

### `usuarios`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | → `auth.users(id)` |
| nombre | TEXT | display name |
| rol | TEXT | `admin \| veterinario \| asistente` |
| id_clinica | UUID FK | → `clinicas(id)` |
| created_at | TIMESTAMPTZ | |

### `duenos` (Owners)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| nombre | TEXT | |
| telefono | TEXT | |
| email | TEXT | |
| direccion | TEXT | |
| id_clinica | UUID FK | |
| created_at | TIMESTAMPTZ | |

### `mascotas` (Pets)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| nombre | TEXT | |
| especie | TEXT | dog, cat, etc. |
| raza | TEXT | breed |
| fecha_nacimiento | DATE | |
| sexo | TEXT | |
| peso | NUMERIC | kg |
| id_dueno | UUID FK | → `duenos(id)` |
| id_clinica | UUID FK | |
| created_at | TIMESTAMPTZ | |

### `tipos_vacuna` (Vaccine types)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| nombre | TEXT | |
| color | TEXT | hex/label for UI badge |
| id_clinica | UUID FK | |

### `tipos_cirugia` (Surgery types)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| nombre | TEXT | |
| descripcion | TEXT | |
| id_clinica | UUID FK | |

### `consultas` (Consultations)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| id_mascota | UUID FK | |
| id_usuario | UUID FK | attending vet |
| fecha | TIMESTAMPTZ | |
| motivo | TEXT | chief complaint |
| diagnostico | TEXT | |
| tratamiento | TEXT | |
| observaciones | TEXT | |
| id_clinica | UUID FK | |
| created_at | TIMESTAMPTZ | |

### `turnos` (Appointments)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| id_mascota | UUID FK | |
| id_usuario | UUID FK | assigned vet |
| fecha_hora | TIMESTAMPTZ | |
| estado | TEXT | `sin_atender \| atendido \| ausente` |
| notas | TEXT | |
| id_clinica | UUID FK | |
| created_at | TIMESTAMPTZ | |

### `vacunas` (Vaccinations)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| id_mascota | UUID FK | |
| id_tipo_vacuna | UUID FK | |
| fecha | DATE | administration date |
| proxima_dosis | DATE | next due date |
| id_clinica | UUID FK | |
| created_at | TIMESTAMPTZ | |

### `cirugias` (Surgeries)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| id_mascota | UUID FK | |
| id_usuario | UUID FK | surgeon |
| fecha | TIMESTAMPTZ | |
| tipo | TEXT | surgery type label |
| descripcion | TEXT | |
| resultado | TEXT | |
| estado | TEXT | `programado \| en_progreso \| exitosa \| complicaciones` |
| id_clinica | UUID FK | |
| created_at | TIMESTAMPTZ | |

### `documentos` (Documents)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| id_clinica | UUID FK | |
| tipo_entidad | TEXT | `consulta \| cirugia` |
| id_entidad | UUID | FK to consultas or cirugias |
| nombre | TEXT | original filename |
| url | TEXT | Supabase Storage path |
| created_at | TIMESTAMPTZ | |

---

## 7. Service Layer

All services live in `lib/services/` and share a common pattern: they accept data + `clinicaId`, call the Supabase client, and return typed results or throw errors.

### `auth.ts`
| Function | Signature | Description |
|---|---|---|
| `signIn` | `(email, password) → Session` | Supabase email/password login |
| `signOut` | `() → void` | Invalidates session |
| `signUp` | `(email, password) → User` | Register new auth user |
| `getCurrentUser` | `() → User \| null` | Returns current Supabase auth user |
| `resetPassword` | `(email) → void` | Sends password reset email |
| `updatePassword` | `(password) → void` | Updates authenticated user's password |

### `duenos.ts`
| Function | Description |
|---|---|
| `getDuenos(clinicaId)` | Fetch all owners for clinic |
| `getDuenoById(id)` | Fetch single owner |
| `createDueno(data)` | Create owner |
| `updateDueno(id, data)` | Update owner |
| `deleteDueno(id)` | Delete owner |
| `searchDuenos(clinicaId, query)` | Full-text search by name |

### `mascotas.ts`
| Function | Description |
|---|---|
| `getMascotas(clinicaId)` | All pets |
| `getMascotasConDueno(clinicaId)` | Pets with joined owner data |
| `getMascotaById(id)` | Single pet |
| `getMascotasByDueno(duenoId)` | Pets filtered by owner |
| `createMascota(data)` | Create pet |
| `updateMascota(id, data)` | Update pet |
| `deleteMascota(id)` | Delete pet |

### `consultas.ts`
| Function | Description |
|---|---|
| `getConsultas(clinicaId)` | All consultations |
| `getConsultasConDatos(clinicaId)` | Joined with pet + vet names |
| `getConsultasByMascota(mascotaId)` | Consultation history for a pet |
| `getConsultaById(id)` | Single consultation |
| `createConsulta(data)` | Create consultation |
| `updateConsulta(id, data)` | Update consultation |
| `deleteConsulta(id)` | Delete consultation |

### `turnos.ts`
| Function | Description |
|---|---|
| `getTurnos(clinicaId)` | All appointments |
| `getTurnosConDatos(clinicaId)` | Joined with pet + owner + vet |
| `getTurnosActivos(clinicaId)` | Only `sin_atender` appointments |
| `getTurnosByMascota(mascotaId)` | Appointments for a pet |
| `createTurno(data)` | Create appointment |
| `updateTurno(id, data)` | Update appointment |
| `deleteTurno(id)` | Delete appointment |

### `vacunas.ts`
| Function | Description |
|---|---|
| `getVacunas(clinicaId)` | All vaccinations |
| `getVacunasByMascota(mascotaId)` | Vaccination history for a pet |
| `getVacunasProximas(clinicaId, days)` | Upcoming doses within N days |
| `createVacuna(data)` | Create vaccination record |
| `updateVacuna(id, data)` | Update record |
| `deleteVacuna(id)` | Delete record |

### `cirugias.ts`
| Function | Description |
|---|---|
| `getCirugias(clinicaId)` | All surgeries |
| `getCirugiasConDatos(clinicaId)` | Joined with pet + vet |
| `getCirugiasByMascota(mascotaId)` | Surgeries for a pet |
| `getCirugiaById(id)` | Single surgery |
| `createCirugia(data)` | Create surgery |
| `updateCirugia(id, data)` | Update surgery |
| `deleteCirugia(id)` | Delete surgery |

### `documentos.ts`
| Function | Description |
|---|---|
| `getDocumentos(entidad, id)` | Get all docs for a consultation/surgery |
| `uploadDocumento(file, clinicaId, tipo, entityId)` | Upload to Supabase Storage + insert DB row |
| `deleteDocumento(doc)` | Delete from Storage + delete DB row |
| `getDocumentoUrl(path)` | Create signed URL (1-hour expiry) for private bucket |

Storage path format: `{clinicaId}/{tipo}/{entityId}/{timestamp}-{filename}`

### `usuarios.ts`
| Function | Description |
|---|---|
| `getUsuarios(clinicaId)` | All users in clinic |
| `getUsuarioById(id)` | Single user profile |
| `getVeterinarios(clinicaId)` | Only `veterinario` role users |
| `createUsuario(data)` | Create user profile |
| `updateUsuario(id, data)` | Update user |
| `deleteUsuario(id)` | Delete user profile |

---

## 8. Custom Hooks

Each data domain has a corresponding hook that wraps the service calls, manages loading/error state, and provides CRUD operations:

| Hook | File | Returns |
|---|---|---|
| `useAuth` | `lib/auth-context.tsx` | `{ user, session, clinicaId, role, loading }` |
| `useLanguage` | `lib/language-context.tsx` | `{ language, setLanguage, t }` |
| `useDuenos` | `hooks/use-duenos.ts` | `{ duenos, loading, createDueno, updateDueno, deleteDueno }` |
| `useMascotas` | `hooks/use-mascotas.ts` | `{ mascotas, loading, … }` |
| `useConsultas` | `hooks/use-consultas.ts` | `{ consultas, loading, … }` |
| `useTurnos` | `hooks/use-turnos.ts` | `{ turnos, loading, … }` |
| `useVacunas` | `hooks/use-vacunas.ts` | `{ vacunas, loading, … }` |
| `useCirugias` | `hooks/use-cirugias.ts` | `{ cirugias, loading, … }` |
| `useUsuarios` | `hooks/use-usuarios.ts` | `{ usuarios, loading, … }` |
| `useUser` | `hooks/use-user.ts` | Current user profile |
| `useMobile` | `hooks/use-mobile.ts` | `boolean` — viewport < 768px |
| `useToast` | `hooks/use-toast.ts` | `{ toast }` — wraps sonner |

---

## 9. Feature Traceability Matrix

| Feature | UI File | Hook | Service | DB Table |
|---|---|---|---|---|
| Login | `app/page.tsx` | — | `services/auth.ts` | `auth.users`, `usuarios` |
| Dashboard overview | `dashboard/dashboard-content.tsx` | useConsultas, useTurnos | consultas, turnos | `consultas`, `turnos` |
| Owners list/CRUD | `owners/owners-content.tsx` | `useDuenos` | `services/duenos.ts` | `duenos` |
| Pets list/CRUD | `pets/pets-content.tsx` | `useMascotas` | `services/mascotas.ts` | `mascotas` |
| Consultations CRUD | `consultations/consultations-content.tsx` | `useConsultas` | `services/consultas.ts` | `consultas` |
| Consultation documents | `components/documentos-panel.tsx` | — | `services/documentos.ts` | `documentos` + Storage |
| Appointment scheduling | `appointments/appointments-content.tsx` | `useTurnos` | `services/turnos.ts` | `turnos` |
| Appointment filters | `appointments/appointments-content.tsx` | — | — | — |
| Vaccination records | `vaccinations/vaccinations-content.tsx` | `useVacunas` | `services/vacunas.ts` | `vacunas`, `tipos_vacuna` |
| Surgery CRUD | `surgeries/surgeries-content.tsx` | `useCirugias` | `services/cirugias.ts` | `cirugias` |
| Surgery status change | `surgeries/surgeries-content.tsx` | `useCirugias` | `updateCirugia` | `cirugias.estado` |
| Surgery documents | `components/documentos-panel.tsx` | — | `services/documentos.ts` | `documentos` + Storage |
| Clinic users | `users/page.tsx` | `useUsuarios` | `services/usuarios.ts` | `usuarios` |
| i18n | `lib/language-context.tsx` | `useLanguage` | `lib/translations.ts` | — |
| Theme switching | `components/theme-provider.tsx` | — | next-themes | localStorage |
| Logout | `components/app-sidebar.tsx` | `useAuth` | `services/auth.ts` | — |

---

## 10. Document Storage System

### Architecture

Documents are stored in a **private** Supabase Storage bucket named `documentos`.

```
Bucket: documentos
└── {clinicaId}/
    ├── consulta/
    │   └── {consultaId}/
    │       └── {timestamp}-{originalFilename}
    └── cirugia/
        └── {cirugiaId}/
            └── {timestamp}-{originalFilename}
```

### Database row

For each uploaded file, a row is inserted into `documentos`:
```json
{
  "id_clinica": "...",
  "tipo_entidad": "consulta",
  "id_entidad": "...",
  "nombre": "original-name.pdf",
  "url": "clinicaId/consulta/entityId/1234567890-original-name.pdf"
}
```

### Access via signed URL

The bucket is private. Files are accessed via **1-hour signed URLs** generated by:

```ts
supabase.storage.from('documentos').createSignedUrl(path, 3600)
```

This ensures files are never publicly accessible and URLs expire automatically.

### `DocumentosPanel` component (`components/documentos-panel.tsx`)

Props:
| Prop | Type | Description |
|---|---|---|
| `tipoEntidad` | `'consulta' \| 'cirugia'` | Entity type |
| `idEntidad` | `string` | Entity UUID |
| `readonly` | `boolean` | Hides upload/delete buttons |

The panel:
- Lists existing documents with filename + open/delete actions
- Opens files by generating a signed URL and using `window.open()`
- Handles upload via `<input type="file">` (any file type)
- Shows toast notifications on success/error

---

## 11. Internationalization (i18n)

### Implementation

- `lib/language-context.tsx` — React context providing `{ language, setLanguage, t }`
- `lib/translations.ts` — flat key-value object with all strings in both languages
- `components/language-selector.tsx` — toggle button (ES / EN)
- Language preference persisted in `localStorage` under key `anivex-language`

### Usage in components

```tsx
const { t } = useLanguage()
// ...
<h1>{t('petsTitle')}</h1>
```

### Adding translations

Add to both `es` and `en` objects in `lib/translations.ts`:
```ts
export const translations = {
  es: { myNewKey: 'Mi texto en español' },
  en: { myNewKey: 'My text in English' }
}
```

---

## 12. Component Patterns

### Form isolation pattern (input lag fix)

All dialog forms are extracted into a **child component** and rendered with a `key` prop tied to a `dialogKey` counter. When the dialog opens, `dialogKey` increments, forcing a full remount and avoiding stale closure / state accumulation that caused typing lag:

```tsx
const [dialogKey, setDialogKey] = useState(0)

const openDialog = () => {
  setDialogKey(k => k + 1)
  setOpen(true)
}

// ...
<Dialog open={open}>
  <ConsultaForm key={dialogKey} onSubmit={handleSubmit} />
</Dialog>
```

Applied in: consultations, surgeries, vaccinations, appointments.

### Protected route

```tsx
// app/dashboard/consultations/page.tsx
export default function Page() {
  return (
    <ProtectedRoute>
      <ConsultationsContent />
    </ProtectedRoute>
  )
}
```

`ProtectedRoute` reads `useAuth().user` — redirects to `/` if null, shows spinner while loading.

### Sheet (detail view)

Detail views (consultation detail, surgery detail) use shadcn/ui `<Sheet>` with `side="right"` and an inner `ScrollArea` to handle variable-length content:

```tsx
<Sheet open={detailOpen} onOpenChange={setDetailOpen}>
  <SheetContent className="w-[600px] sm:max-w-[600px]">
    <ScrollArea className="h-full pr-4">
      {/* content */}
    </ScrollArea>
  </SheetContent>
</Sheet>
```

### Tabs in edit dialog

When editing a consultation or surgery, the dialog shows two tabs:
- **Datos** — form fields
- **Documentos** — `<DocumentosPanel>`

Tabs only appear in edit mode (when `selectedItem` is set), not when creating new records.

---

## 13. Routing & Page Structure

All routes are under `app/dashboard/` and protected by `ProtectedRoute`. Each route follows this pattern:

```
app/dashboard/{module}/
  page.tsx          ← thin wrapper, just renders ProtectedRoute + Content
  {module}-content.tsx  ← all state, UI, and data logic
```

| Route | Purpose |
|---|---|
| `/` | Login |
| `/dashboard` | Overview with stats and charts |
| `/dashboard/owners` | Dueños CRUD |
| `/dashboard/pets` | Mascotas CRUD |
| `/dashboard/consultations` | Consultas + documents + history |
| `/dashboard/appointments` | Turno calendar + list + status |
| `/dashboard/vaccinations` | Vacunaciones |
| `/dashboard/surgeries` | Cirugías + documents + status |
| `/dashboard/users` | Usuarios de la clínica |

---

## 14. Configuration

### `next.config.mjs`

```js
const nextConfig = {
  typescript: { ignoreBuildErrors: true },   // allows deploy with type warnings
  images: { unoptimized: true }              // for static export compatibility
}
```

### `tsconfig.json`

- `"strict": true`
- Path alias: `@/*` → `./`

### `components.json` (shadcn/ui)

- Style: `new-york`
- Base color: `neutral`
- CSS variables enabled
- Component path: `@/components/ui`

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |

These are the only two env vars. No server-side secrets are used — the app runs entirely client-side.

---

## 15. Known Constraints

| Constraint | Details |
|---|---|
| Client-side only | All components use `'use client'`. No RSC data fetching. |
| No server actions | All mutations go through Supabase client directly |
| TypeScript build errors ignored | `ignoreBuildErrors: true` in `next.config.mjs` |
| Images unoptimized | `unoptimized: true` — no Next.js image optimization |
| anon key exposed | `NEXT_PUBLIC_*` keys are visible in the browser. Security relies on Supabase RLS. **Enable RLS on all tables in production.** |
| Signed URLs expire | Document links are valid for 1 hour. Users must refresh to get new links. |
| No email verification | Supabase email confirmation can be enabled optionally. |
