# Reglas del proyecto KODIRA

> Estas reglas las sigue CUALQUIER agente que trabaje en este repositorio: el SOLO Agent y los
> agentes personalizados (tech-lead, backend, frontend, QA), en TODAS las interacciones. Cada
> agente tiene además su propio prompt con su especialidad; esto es la base común que todos
> respetan. El contexto completo del producto está en los archivos FASE_0..FASE_5.md, y la
> referencia VISUAL del producto está en docs/kodira-design-showcase.html (ábrelo y replícalo).

## Producto
KODIRA es un estudio/consultora de desarrollo de software cuyo negocio PRINCIPAL son los servicios:
desarrollo web, desarrollo mobile, Odoo ERP (consultoría e implementación) y videojuegos con Unity
(más servicios a futuro). Además tiene una academia (cursos para developers) y, en el roadmap,
asesorías 1:1, marketplace de servicios, comunidad e IA ("KODI"). Audiencia: developers y empresas
hispanohablantes de España y LATAM. En la landing, los servicios van primero; los cursos son una parte.

## Estructura del monorepo (Turborepo + pnpm)
- `apps/api` → Backend NestJS. Corre en el puerto 8000, con prefijo `/api/v1`.
- `apps/web` → Frontend Next.js 14 (App Router). Corre en el puerto 3000.
- `apps/mobile` → App Expo. NO crear hasta la Fase 5.
- `packages/types` → Tipos TypeScript compartidos. ES EL CONTRATO. Lo importan `apps/api` Y `apps/web`.
- `packages/api-client` → Cliente HTTP tipado (axios) que apunta a NEXT_PUBLIC_API_URL, con
  interceptor de token de auth y refresh de 401.
- `packages/hooks` → Hooks de datos con React Query (TanStack Query), uno por recurso.
- `packages/ui` → Sistema de diseño compartido (tokens, primitivas de animación y componentes base).
  TODO el frontend se construye desde aquí (ver "Sistema de diseño compartido").
- `docs/API_CONTRACT.md` → Contrato legible. Lo mantiene el backend; el frontend solo lo lee.
- `docs/CONTRACT_REQUESTS.md` → El frontend pide aquí lo que falta; el backend lo resuelve.
- `docs/kodira-design-showcase.html` → Referencia visual viva (estética, animaciones, componentes).

## REGLA #1 — El contrato de API (la más importante)
- `packages/types` es la única definición de las formas de datos. `apps/api` y `apps/web`
  importan de ahí. Si un tipo cambia, cambia en un solo lugar.
- El backend es DUEÑO del contrato: mantiene `packages/types`, `docs/API_CONTRACT.md` y el
  Swagger (openapi.json) siempre sincronizados con el código real.
- El frontend SOLO consume lo que existe en el contrato. NUNCA inventa endpoints ni formas de
  datos. Si necesita algo que no existe, lo anota en `docs/CONTRACT_REQUESTS.md` y espera a que
  el backend lo entregue.
- Ningún cambio de backend puede romper el contrato sin actualizar el contrato y avisar.

## Stack y servicios
- Backend: NestJS + MongoDB Atlas (Mongoose) + Redis/Upstash + BullMQ.
- Frontend: Next.js 14 + TypeScript estricto + Tailwind + React Query + Framer Motion (motion).
- Servicios: Cloudflare R2/Stream (archivos y video), Stripe + Mercado Pago (pagos), OpenAI (IA),
  Resend (emails), PostHog (analítica), Sentry (errores).
- Despliegue: Vercel (`apps/web`) y Railway/Render (`apps/api`).

## Convenciones de código y API
- API REST: prefijo `/api/v1`. Health check en `/api/v1/health` (devuelve db y redis "up"/"down").
- Métodos: GET leer, POST crear, PATCH modificar, DELETE borrar.
- Enums: definidos una sola vez en `packages/types` y usados igual en todo el código.
- Validación: TODA entrada externa al backend se valida (class-validator / Zod).
- Errores: forma de error consistente en toda la API (código, mensaje, detalles). Nada de 500
  sin manejar; cada fallo previsible se traduce en un error claro y tipado.
- Multi-tenant: aislamiento estricto. Un tenant jamás ve datos de otro. Verificarlo siempre.
- TypeScript estricto en todo el repo. `typecheck` y `lint` deben pasar antes de dar algo por hecho.

## Patrones aprendidos (errores que NO se repiten)
Lecciones ya pagadas en este proyecto; respétalas siempre:
- En los schemas de Mongoose, pon tipo explícito en `@Prop({ type: ... })` en TODOS los campos
  opcionales y subdocumentos anidados (Section, Lesson, quiz, codeExercise, lessonProgress, etc.),
  para evitar el CannotDetermineTypeError al arrancar.
- Para comparar ObjectId usa SIEMPRE `.equals()` o `.toString()`, nunca `===` directo. Al consultar
  por ids (p.ej. enrollment por student + course), castea a ObjectId antes de la query; no confíes
  en el casteo implícito de Mongoose.
- En las cláusulas `implements`, usa interfaces/clases con nombre, nunca accesos indexados tipo
  `Tipo['x']` (rompe TypeScript).
- Si añades una dependencia en el código (p.ej. el AWS SDK), INSTÁLALA en el workspace correspondiente
  (`pnpm -C apps/api add ...`); no dejes imports de paquetes no instalados.
- En subidas prefirmadas a R2 con el AWS SDK v3, configura el S3Client con
  requestChecksumCalculation:"WHEN_REQUIRED" y responseChecksumValidation:"WHEN_REQUIRED", y NO firmes
  content-length, o el PUT falla con 403 SignatureDoesNotMatch.
- En Next.js, declara los hosts de imágenes externas en next.config.js (images.remotePatterns) o
  usa assets propios; nunca dejes un next/image apuntando a un host sin declarar.
- "Verificado" significa que arranca y funciona en runtime, no solo que pasa typecheck/lint. Los
  tests e2e in-memory NO prueban servicios externos reales (R2, etc.).

## Seguridad y secretos
- Los secretos van en `.env` (NUNCA en el código, NUNCA a GitHub). `.env.example` sí se sube, con
  las variables sin valores reales.
- Ningún agente crea cuentas en servicios externos. Si hace falta una credencial nueva, se le
  indica al dueño en una línea: qué variable poner en `.env` y de qué servicio sacarla.
- Nunca ejecutar código de usuario en el servidor (eso va a Judge0). Rate limiting en endpoints
  sensibles. Sanitizar entradas.

## Diseño (marca KODIRA) — tokens
- Modo oscuro por defecto. Fondo `#0B0B0F` (base), superficies `#13131C` y `#1A1A26`.
- Acentos: azul `#3B82F6`, violeta `#6366F1`. Gradiente de marca: `linear-gradient(120deg,#3B82F6,#6366F1)`,
  usado en glows, texto con gradiente y bordes, con mesura.
- Texto: `#F5F5F8` (principal), `#9B9BAC` (secundario), `#6A6A7A` (tenue). Líneas: `rgba(255,255,255,.08)`.
- Tipografía: Satoshi (títulos), Inter (texto), monoespaciada (JetBrains Mono) para acentos técnicos.
- Easing de marca: `cubic-bezier(.22,1,.36,1)`. Radios ~14-18px. Textura sutil de grano sobre fondos.
- Tono de voz: directo, concreto, técnico-amigable, sin clichés motivacionales.

## REGLA DE DISEÑO FRONTEND (OBLIGATORIA)
Aplica a TODO el frontend, no solo a la landing: la landing, y TODA la zona logueada (dashboard,
catálogo y detalle de cursos, aula virtual, panel de instructor, servicios, perfil, ajustes, y
cualquier pantalla futura). La referencia visual es `docs/kodira-design-showcase.html`: ábrelo y
replica ese nivel de estética, profundidad, animaciones y micro‑interacciones, o mejóralo.

Antes de escribir código de UI, el agente DEBE leer y aplicar las tres skills instaladas:
1. design-taste-frontend (Taste): reúne/define referencias reales antes de construir. Nunca maquetes
   sin referencia.
2. emil-design-eng (Emil Kowalski): animaciones e interacciones. Solo transform/opacity (GPU),
   duraciones ~200-400ms, easing personalizado, microinteracciones cuidadas, respeta prefers-reduced-motion.
3. Impeccable (pbakaus): mata el look genérico de IA. Antes de entregar, pasa /audit, /critique y
   /polish EN BUCLE (mín. 3 pasadas, subiendo el listón); si en este runtime no existen como comandos,
   aplica sus checklists manualmente. Respeta el contexto de marca de .impeccable.md.

Toda pantalla DEBE tener vida y movimiento: entradas con stagger al cargar/scroll, estados de hover
con feedback, transiciones suaves entre vistas, y profundidad (capas, glows, gradientes, grano) en
lugar de fondos planos. Toda pantalla maneja los 4 estados (cargando con skeleton, vacío con estilo,
error, éxito).

Anti‑patrones PROHIBIDOS: pantallas planas y estáticas sin animación; el look por defecto de Tailwind
(grises sobre blanco, sombras básicas, sin identidad); el típico "hero centrado + 3 tarjetas iguales";
todo del mismo tamaño/peso sin jerarquía; placeholders sin gracia. Si una pantalla parece una plantilla
o "no tiene vida", NO está terminada.

## Sistema de diseño compartido (packages/ui)
Para que TODA la app sea coherente y de calidad sin rehacer cada pantalla:
- Define en `packages/ui` los tokens (los de la sección de marca), las primitivas de animación
  (componentes/variants reutilizables de Framer Motion: reveal con stagger, fade, hover, etc.) y los
  componentes base: botones (primario/cristal/fantasma), tarjetas (sólida/borde-gradiente/glass/tilt),
  inputs, badges, toggles, tabs, barras de progreso, skeletons/spinners, nav y el layout shell de la app.
- Define el "app shell" de la zona logueada (estructura común: sidebar/topbar animados + área de
  contenido con transiciones de página).
- Toda pantalla nueva o rediseñada se construye DESDE estos componentes; no se reinventa cada vez.
  Cualquier patrón visual que se repita se sube a `packages/ui`.

## Landing y zona logueada (principios)
- La landing muestra TODA la visión de KODIRA para enamorar, pero con honestidad: lo que ya funciona
  se presenta como disponible; lo que aún no existe se etiqueta como "Próximamente" (lista de espera o
  "incluido en tu plan según se vaya lanzando"). NUNCA un checkout falso ni cobrar por lo inexistente.
- Servicios primero (web, mobile, Odoo, Unity); cursos como academia secundaria; equipo visible.
- La zona logueada debe sentirse igual de viva y premium que la landing (misma vara). Es el producto
  que usa el cliente día a día: cuídala igual o más que el escaparate.

## Definition of Done (para cualquier entrega)
- `typecheck` y `lint` pasan sin errores y el dev server arranca sin errores en runtime.
- Las pruebas de lo nuevo o modificado pasan (incluye casos de error y de permisos).
- Si cambió la API: `docs/API_CONTRACT.md`, openapi.json y `packages/types` actualizados.
- Si se añadieron variables: `.env.example` actualizado y se avisa al dueño qué credenciales proveer.
- En frontend: se construyó desde `packages/ui`; tiene animaciones y los 4 estados; pasó /audit,
  /critique y /polish (bucle) y un recorrido de usabilidad como usuario final; respeta la referencia
  visual y NO parece una plantilla.
- Lo que toca servicios externos (R2, pagos, etc.) se prueba de verdad (no solo tests in-memory).
- Nada se da por "terminado" sin verificar que funciona de punta a punta.

## Idioma y comunicación
- Las explicaciones al dueño van en español, breves y sin tecnicismos innecesarios.
- El código, los nombres de variables y los identificadores, en inglés.

Toda funcionalidad que cree o edite datos debe tener su interfaz en el front (formularios/modales con
packages/ui y los 4 estados). Swagger y los endpoints son SOLO para pruebas; el usuario final hace todo
desde el front, nunca llamando endpoints a mano.