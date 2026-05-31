# CLAUDE.md — Reglas del proyecto KODIRA

> Este archivo lo leen TODOS los agentes antes de actuar. Es la fuente de reglas del repo.
> El contexto de producto completo está en los archivos `FASE_0..FASE_5.md`.

## Qué es KODIRA

Plataforma tech todo-en-uno: cursos + asesorías 1:1 + marketplace de servicios + comunidad

- IA ("KODI"). Audiencia: desarrolladores hispanohablantes de España y LATAM.

## Estructura del monorepo (Turborepo + pnpm)

```
apps/api    → Backend NestJS (corre en el puerto 8000, prefijo /api/v1)
apps/web    → Frontend Next.js 14 (App Router, corre en el puerto 3000)
apps/mobile → App Expo (NO crear hasta la Fase 5)
packages/types      → Tipos TypeScript compartidos. ES EL CONTRATO. Lo importan api Y web.
packages/api-client → Cliente HTTP tipado (axios) que apunta a NEXT_PUBLIC_API_URL,
                      con interceptor de token de auth y refresh de 401.
packages/hooks      → Hooks de datos con React Query (TanStack Query), uno por recurso.
packages/ui         → Componentes compartidos (Tailwind + Radix + cva).
docs/API_CONTRACT.md      → Contrato legible. Lo mantiene el backend; el frontend lo lee.
docs/CONTRACT_REQUESTS.md → El frontend pide aquí lo que falta; el backend lo resuelve.
```

## Stack y servicios

- Backend: NestJS + MongoDB Atlas (Mongoose) + Redis/Upstash + BullMQ.
- Frontend: Next.js 14 + TypeScript estricto + Tailwind + React Query.
- Servicios: Cloudflare R2/Stream (archivos y video), Stripe + Mercado Pago (pagos),
  OpenAI (IA), Resend (emails), PostHog (analítica), Sentry (errores).
- Despliegue: Vercel (apps/web, Root Directory = apps/web) y Railway/Render (apps/api).

## EL CONTRATO (la regla más importante)

- `packages/types` es la única definición de las formas de datos. Backend y frontend
  importan de ahí. Si un tipo cambia, cambia en un solo lugar.
- El BACKEND es dueño del contrato: mantiene `packages/types`, `docs/API_CONTRACT.md` y el
  Swagger (`/api/v1/docs` → openapi.json) siempre sincronizados con el código real.
- El FRONTEND solo consume lo que existe en el contrato. NUNCA inventa endpoints ni formas
  de datos. Si necesita algo que no existe, lo anota en `docs/CONTRACT_REQUESTS.md` y avisa
  al Tech Lead; espera a que el backend lo entregue.
- Ningún cambio de backend puede romper el contrato sin actualizar el contrato y avisar.

## Convenciones

- API: prefijo `/api/v1`. Health check en `/api/v1/health` (devuelve db y redis "up").
- Métodos REST: GET leer, POST crear, PATCH modificar, DELETE borrar.
- Enums: definidos una sola vez en `packages/types` y usados igual en todo el código.
- Validación: toda entrada externa al backend se valida (class-validator / Zod).
- Errores: forma de error consistente en toda la API (código, mensaje, detalles).
- Multi-tenant: aislamiento estricto, un tenant jamás ve datos de otro. Verificarlo siempre.
- Seguridad: los secretos van en `.env` (nunca en el código, nunca a GitHub). `.env.example`
  sí se sube, con las variables sin valores. Nunca ejecutar código de usuario en el
  servidor (eso va a Judge0).

## Tokens de diseño (marca KODIRA)

- Fondo `#0B0B0F`, azul `#3B82F6`, violeta `#6366F1`. Modo oscuro por defecto.
- Tipografías: Satoshi (títulos), Inter (texto).
- Tono de voz: directo, concreto, técnico-amigable, sin clichés motivacionales.
- Frontend usa los skills de diseño: design-taste-frontend (referencias), emil-design-eng
  (animaciones) e Impeccable (/audit, /critique, /polish contra el "AI slop").

## Definition of Done (resumen)

- Backend: typecheck + lint + tests pasan; contrato y `packages/types` actualizados; nota
  para el Tech Lead si afecta al frontend.
- Frontend: typecheck + lint pasan; consume el contrato real; maneja los 4 estados
  (cargando/vacío/error/éxito); pasó /audit, /critique, /polish y el recorrido de usabilidad.
- QA aprueba los flujos críticos y confirma que el contrato está alineado antes de cerrar.

## Idioma

Las explicaciones al dueño del producto van en español, breves y sin tecnicismos
innecesarios. El código y los identificadores, en inglés.
