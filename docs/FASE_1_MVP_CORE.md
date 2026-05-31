# FASE 1 — MVP Core (lo mínimo para cobrar)

### KODIRA Solutions · Guía paso a paso para hacerlo tú solo

### Duración estimada: 6 a 12 semanas

> **El objetivo de esta fase es brutal de simple:** que un instructor pueda subir un curso y que un alumno pueda registrarse, pagar y verlo. Nada más. Si logras eso, ya tienes un negocio que puede facturar.
>
> No añadas asesorías, ni marketplace, ni comunidad, ni IA todavía. Eso viene después. Resiste la tentación de "añadir una cosita más": es la trampa número uno que mata los proyectos en solitario.

---

# 🎯 OBJETIVO DE ESTA FASE

Construir el corazón de KODIRA: **autenticación, perfiles, cursos con video, pagos y dashboard del alumno**. Es el "Udemy mínimo" sobre el que luego montaremos todo lo demás.

# ✅ QUÉ TENDRÁS AL TERMINAR (criterios de salida)

- ✅ Un instructor puede publicar un curso con secciones, lecciones y videos.
- ✅ Un alumno puede registrarse, iniciar sesión, pagar (Stripe o Mercado Pago) y ver el curso.
- ✅ El progreso del alumno se guarda (qué lección completó, dónde quedó en el video).
- ✅ Los pagos reales funcionan en producción.
- ✅ Todo está publicado online (no solo en tu computadora).

---

# 🧠 CONCEPTOS QUE NECESITAS ENTENDER EN ESTA FASE

**Autenticación con tokens (JWT).** Cuando alguien inicia sesión, tu backend le entrega un "pase" firmado llamado **access token** (un JWT). En cada petición siguiente, el frontend envía ese pase y el backend comprueba la firma para saber quién eres, sin volver a pedir la contraseña. El access token dura poco (15 minutos) por seguridad; cuando caduca, el frontend usa un **refresh token** (que dura semanas) para pedir uno nuevo sin molestar al usuario. Esto ya viene resuelto en el prompt de auth; solo necesitas entender el porqué.

**Hashing de contraseñas.** Nunca guardas la contraseña tal cual. La pasas por una función de un solo sentido (argon2) que produce un "hash" irreversible. Cuando el usuario inicia sesión, vuelves a hashear lo que escribió y comparas hashes. Así, si alguien roba tu base de datos, no obtiene contraseñas. Esto no es opcional: es lo mínimo legal y ético.

**Documentos incrustados vs. referenciados (clave en MongoDB).** En MongoDB puedes meter datos dentro de otro documento (incrustado) o guardarlos aparte y solo apuntar con un id (referenciado). Regla práctica: incrustas lo que casi siempre lees junto y no crece sin límite (las secciones y lecciones van _dentro_ del curso); referencias lo que es una entidad propia o crece mucho (un usuario, un pago). Por eso en el curso las lecciones van incrustadas, pero el instructor es una referencia.

**Webhook.** Es una llamada que un servicio externo (Stripe, Mercado Pago, Cloudflare) le hace a tu backend para avisarte de que pasó algo: "este pago se completó", "este video terminó de procesarse". Es la **única fuente de verdad** para los pagos: jamás des por pagado algo solo porque el navegador del usuario lo diga, porque eso se puede falsificar trivialmente.

**Por qué los videos no pasan por tu servidor.** Un video pesa cientos de MB. Si pasara por tu backend, lo saturarías y pagarías un dineral en ancho de banda. En su lugar, el navegador del usuario sube el video **directamente** a Cloudflare Stream usando una URL firmada que tu backend genera, y tú solo guardas el `videoId` que te devuelve. Lo mismo con imágenes en Cloudflare R2.

---

# 📅 ORDEN RECOMENDADO Y TIEMPOS

El orden importa: cada módulo se apoya en el anterior. No saltes.

1. **Auth + Users** (1–2 semanas). Sin "quién eres", nada más funciona.
2. **Education: cursos y lecciones** (2–3 semanas). El módulo más grande.
3. **Storage y video** (3–5 días). Para que las lecciones tengan video.
4. **Education: inscripciones y progreso** (1–2 semanas).
5. **Payments** (1–2 semanas). Lo más delicado; tómate tu tiempo y prueba mucho.
6. **Frontend de todo lo anterior** (en paralelo, tu terreno).
7. **Publicar online + prueba real** (3–5 días).

---

# PARTE A — BACKEND (lo explico con calma)

Vamos a construir el backend módulo por módulo.

## A.1 Módulo de autenticación (`auth`) + usuarios (`users`)

Es lo primero porque todo lo demás necesita saber "quién eres".

**Qué hace:** registrar, iniciar sesión, devolver tokens, refrescarlos y proteger las rutas privadas. El `User` es **unificado**: una misma persona puede ser alumno, instructor, mentor y freelancer a la vez (es el gran diferenciador de KODIRA), por eso los roles son un array, no un único valor.

### 🤖 PROMPT F1-BE-1 — Auth + Users

```
Actúa como Backend Senior NestJS + MongoDB. Trabaja sobre el proyecto NestJS existente.

Crea dos módulos: `users` y `auth`.

MÓDULO users:
- Schema User en Mongoose con: email (único, en minúsculas), passwordHash
  (select:false para que nunca salga en las consultas), username (único),
  fullName, avatarUrl, bio, roles (array de enum: student/instructor/mentor/admin,
  default ['student']), emailVerified (default false), preferredLanguage, timezone,
  country, xp (0), currentStreak (0), referralCode (único), referredBy (ref User),
  referralCredits (0), stripeCustomerId, isActive (default true), lastLoginAt.
  timestamps true. Índices en email y username.
- UsersService con: create, findByEmail, findByUsername, findById, updateProfile,
  addRole (para cuando un alumno se vuelve también instructor).
- UsersController: GET /users/me, PUT /users/me, GET /users/:username (perfil público,
  oculta email y datos sensibles).

MÓDULO auth:
- Hash de contraseñas con argon2 (argon2id).
- JWT con Passport: access token (15 min) y refresh token (30 días, guardado
  hasheado en el usuario para poder invalidarlo en logout).
- JwtStrategy + JwtAuthGuard.
- Endpoints: POST /auth/register, POST /auth/login, POST /auth/refresh,
  POST /auth/logout, POST /auth/forgot-password, POST /auth/reset-password,
  POST /auth/verify-email.
- Decorador @CurrentUser() para obtener el usuario del token.
- Decorador @Roles() + RolesGuard para proteger rutas por rol.
- DTOs validados con class-validator (email válido, contraseña mínimo 8 caracteres
  con al menos un número).
- Al registrarse, generar automáticamente un referralCode único y disparar
  (en cola) un email de verificación con Resend.
- Rate limiting más estricto en login y forgot-password (anti fuerza bruta).

ENTREGA: todos los archivos completos con comentarios en español, y un par de
ejemplos de cómo llamar cada endpoint.
```

**Cómo probarlo:** entra a `http://localhost:8000/docs` (Swagger). Registra un usuario, haz login y copia el access token. En Swagger, pulsa "Authorize", pega el token y prueba `GET /users/me`: debe devolverte tu perfil. En Compass, mira la colección `users`: debe estar tu usuario, y el campo `passwordHash` debe ser un texto ilegible (nunca la contraseña en claro).

**Definición de "hecho":** puedes registrarte, iniciar sesión, acceder a una ruta protegida con el token y recibir un nuevo access token usando el refresh.

> **Errores comunes:** (1) El token "no autoriza" → revisa que en Swagger pusiste `Bearer ` antes del token si la config lo pide. (2) "JWT secret not defined" → falta `JWT_SECRET` en tu `.env`. (3) Ves el `passwordHash` al pedir el usuario → faltó el `select:false` en el schema.

## A.2 Módulo de educación (`education`)

El más grande de la fase. Maneja cursos, secciones, lecciones, inscripciones y progreso. Lo partimos en dos prompts para no abrumar a la IA ni a ti.

### 🤖 PROMPT F1-BE-2 — Cursos y lecciones

```
Actúa como Backend Senior NestJS + MongoDB.

Crea el módulo `education` con estos schemas (Mongoose):
- Course (curso): title, slug (único, autogenerado del título), description,
  shortDescription, instructor (ref User), category (ref Category),
  level (beginner/intermediate/advanced), language, price, discountPrice, isFree,
  thumbnailUrl, promoVideoUrl, tags, requirements, objectives, targetAudience,
  state (draft/review/published/archived, default draft), publishedAt,
  métricas (durationHours, lessonCount, enrollmentCount, rating, reviewCount,
  completionRate), dripEnabled, aiDescription, embedding (array de números, para
  la búsqueda por significado de fases futuras; déjalo vacío por ahora).
- Section y Lesson van INCRUSTADOS dentro de Course (arrays anidados).
  Section: title, order, lessons[].
  Lesson: title, order, type (video/text/quiz/code/live/resource), videoId,
  videoDuration, content, isFreePreview, dripDays, quiz (objeto), codeExercise
  (objeto con solutionCode), resourceUrls, transcript, subtitleUrl, aiSummary.
- Category: name, slug, icon, order.

CONTROLLERS (todos con validación; los privados con JwtAuthGuard):
- GET /courses (filtros: categoría, nivel, búsqueda por texto, rango de precio,
  isFree; paginado con page/limit; orden por popularidad o fecha). Solo published.
- GET /courses/:slug (detalle público; OCULTA solutionCode de los ejercicios y
  el content de lecciones que no sean isFreePreview si el usuario no está inscrito).
- POST /courses (solo rol instructor; crea en estado draft).
- PUT /courses/:id (solo el instructor dueño).
- POST /courses/:id/sections y PUT/DELETE para gestionar secciones y lecciones.
- POST /courses/:id/publish (cambia a published; valida que tenga al menos
  una sección con una lección y thumbnail; recalcula lessonCount y durationHours).
- GET /courses/categories.

REGLAS: solo el instructor dueño puede editar/publicar su curso (usa un guard
de propiedad). Genera el slug automáticamente y garantiza que sea único.

ENTREGA: archivos completos, comentados en español, con los DTOs de entrada.
```

### 🤖 PROMPT F1-BE-3 — Inscripciones y progreso

```
Actúa como Backend Senior NestJS + MongoDB.

En el módulo `education`, añade:
- Schema Enrollment: student (ref User), course (ref Course), enrolledAt,
  completedAt, lastActivity, progressPercentage (0-100), isCompleted,
  amountPaid, payment (ref Payment), certificate (ref Certificate),
  lessonProgress (array incrustado: lessonId, isCompleted, watchPercentage,
  lastPositionSeconds, quizScore, completedAt).
  Índice único compuesto (student + course) para no inscribirse dos veces.

ENDPOINTS:
- POST /courses/:id/enroll → si el curso es gratis, inscribe directo; si es de pago,
  rechaza con un mensaje pidiendo pasar por checkout (la inscripción de pago la
  crea el webhook de payments, no este endpoint).
- GET /me/courses → cursos en los que estoy inscrito, con su progreso y la última
  lección vista (para el botón "continuar donde quedé").
- GET /courses/:id/lessons → contenido completo SOLO si estoy inscrito; si no,
  solo las lecciones isFreePreview.
- POST /lessons/:id/progress → guarda lastPositionSeconds y watchPercentage.
- POST /lessons/:id/complete → marca la lección completada y recalcula
  progressPercentage del curso.

Cuando progressPercentage llegue a 100: marca isCompleted, pon completedAt y
dispara EN COLA (BullMQ) la generación del certificado (el job puede quedar
como stub por ahora, lo implementamos en una fase posterior).

ENTREGA: archivos completos comentados.
```

**Cómo probarlo:** crea un instructor (añádele el rol `instructor` desde Compass o un endpoint), crea un curso gratis con una lección, inscríbete con otro usuario y marca la lección como completada. El progreso debe subir a 100 y la inscripción marcarse completada.

> **Error común:** puedes inscribirte dos veces al mismo curso → faltó el índice único compuesto `(student + course)`.

## A.3 Subida de videos y archivos (`storage`)

Hazlo antes de los pagos: así las lecciones ya tendrán video real cuando pruebes la compra.

### 🤖 PROMPT F1-BE-5 — Storage y video

```
Actúa como Backend Senior NestJS.

Crea un módulo `storage`:
- POST /storage/upload-url → recibe { fileName, contentType }; genera una URL
  firmada de Cloudflare R2 para que el navegador suba imágenes/recursos
  directamente (sin pasar por el servidor). Devuelve la URL de subida y la URL
  pública final del archivo. Valida tipo y tamaño máximo.
- POST /storage/video-upload-url → genera una URL de subida directa a
  Cloudflare Stream (tus upload) y devuelve el videoId para guardarlo en la lección.
- POST /storage/webhook/stream → webhook que Cloudflare Stream llama cuando el
  video terminó de procesarse; marca el video como listo y dispara EN COLA la
  transcripción (stub por ahora). Verifica la firma del webhook.

Solo usuarios con rol instructor pueden pedir URLs de subida.

ENTREGA: archivos completos + las variables de entorno necesarias (R2 y Stream).
```

## A.4 Módulo de pagos (`payments`)

El que convierte visitas en dinero. Integra **Stripe** (global/España) y **Mercado Pago** (LATAM). Es el módulo más delicado: pruébalo mucho en modo test antes de tocar dinero real.

### 🤖 PROMPT F1-BE-4 — Pagos Stripe + Mercado Pago

```
Actúa como Backend Senior NestJS especializado en pagos.

Crea el módulo `payments`:
- Schema Payment: user (ref User), provider (stripe/mercadopago),
  providerPaymentId, amount, currency, concept (course/booking/order/subscription),
  relatedId, status (pending/succeeded/failed/refunded), platformFee, sellerAmount,
  metadata. timestamps.

FLUJO DE COMPRA DE CURSO:
- POST /payments/checkout → recibe { courseId }. Lee el país/moneda del usuario;
  si es LATAM usa Mercado Pago, si no Stripe. Crea la sesión/preferencia de pago,
  crea un Payment en estado pending con el cálculo de comisión (instructor 70%,
  KODIRA 30%) y devuelve la URL de pago a la que redirigir.
- POST /payments/webhook/stripe → verifica la firma con el secret del webhook;
  si el evento es de pago exitoso, marca el Payment como succeeded y crea la
  Enrollment del curso (idempotente: si llega dos veces, no duplica).
- POST /payments/webhook/mercadopago → equivalente para Mercado Pago.
- GET /payments/transactions → historial del usuario.

REGLAS DE SEGURIDAD CRÍTICAS:
- La inscripción al curso SOLO se crea desde el webhook verificado, nunca desde
  el front ni desde el endpoint de checkout.
- Verifica SIEMPRE la firma del webhook; rechaza los que no la pasen.
- Haz los webhooks idempotentes (guarda el providerPaymentId y no proceses dos
  veces el mismo evento).

ENTREGA: archivos completos. Explica en el README cómo configurar los webhooks
en los paneles de Stripe y Mercado Pago, y cómo probar con tarjetas de prueba.
```

**Cómo probarlo (sin gastar dinero):** Stripe y Mercado Pago tienen **modo test** con tarjetas falsas. Para que el webhook llegue a tu `localhost`, usa el **Stripe CLI** (`stripe listen --forward-to localhost:8000/api/v1/payments/webhook/stripe`). Compra un curso con la tarjeta de prueba `4242 4242 4242 4242` y confirma que (1) el Payment pasa a `succeeded` y (2) se crea la Enrollment. Solo cuando esto funcione perfecto, activa el modo real.

> **Errores comunes:** (1) El webhook nunca llega → no configuraste el reenvío con el CLI en local, o la URL en producción está mal. (2) "Webhook signature verification failed" → el `STRIPE_WEBHOOK_SECRET` no coincide, o estás parseando el body como JSON antes de verificar (el webhook necesita el body _crudo_). (3) La inscripción se duplica → falta la idempotencia.

## A.5 Publica el backend online

Hasta ahora corre en tu computadora. Hay que ponerlo en internet:

1. Sube el código a GitHub (`git push`).
2. En **Railway** (o Render), conecta el repo `kodira-backend`.
3. Pega todas las variables de entorno (las del `.env`, con las llaves de producción).
4. Railway lo construye y te da una URL pública (ej. `https://kodira-api.up.railway.app`).
5. En Atlas, en Network Access, añade la IP del servidor de Railway (o deja `0.0.0.0/0` por ahora).
6. Configura los webhooks de Stripe y Mercado Pago apuntando a esa URL pública.
7. Comprueba que `/api/v1/health` responde "ok" desde internet.

---

# PARTE B — FRONTEND (rápido, esto ya lo dominas)

Construye estas pantallas. Te dejo el qué y un prompt por bloque; la implementación fina es tu terreno.

| Pantalla          | Ruta                                    | Notas                                                 |
| ----------------- | --------------------------------------- | ----------------------------------------------------- |
| Landing           | `/`                                     | Hero, features, 6 cursos destacados, pricing, FAQ     |
| Registro / Login  | `/register`, `/login`                   | Guarda los tokens; refresca el access con el refresh  |
| Catálogo          | `/courses`                              | Filtros (categoría, nivel, precio) + búsqueda         |
| Detalle de curso  | `/courses/[slug]`                       | Temario, instructor, botón comprar → checkout         |
| Aula virtual      | `/courses/[slug]/learn`                 | Player de video + temario lateral + marcar completada |
| Dashboard alumno  | `/dashboard`                            | Mis cursos + progreso + "continuar donde quedé"       |
| Studio instructor | `/studio`                               | Crear/editar curso, subir videos, publicar            |
| Resultado de pago | `/payments/success`, `/payments/cancel` | Páginas a las que vuelve el usuario tras pagar        |

### 🤖 PROMPT F1-FE-1 — Cliente de API tipado

```
Actúa como Frontend Senior. En packages/api-client, crea un cliente tipado (axios)
para la API de KODIRA con: interceptor que añade el access token, lógica de refresh
automático cuando el access caduca (cola las peticiones mientras refresca, evita
bucles si el refresh también falla → manda a login), manejo de errores con mensajes
amigables, y métodos para: auth (register/login/refresh/logout/forgotPassword),
courses (list/get/create/update/publish/enroll/sections), lessons (progress/complete),
payments (checkout/transactions), storage (uploadUrl/videoUploadUrl), users (me/update).
Tipos compartidos en packages/types (que reflejen los schemas del backend).
Entrega código completo.
```

### 🤖 PROMPT F1-FE-2 — Aula virtual (lo más complejo del front)

```
Actúa como Senior Frontend Engineer.
Crea el Aula Virtual en apps/web/app/(dashboard)/courses/[slug]/learn/page.tsx con:
- VideoPlayer con HLS.js (Cloudflare Stream entrega HLS), controles custom,
  velocidades 0.5x–2x, atajos de teclado, Picture-in-Picture, y guardado de la
  última posición.
- CurriculumSidebar: secciones y lecciones, estado completado/en curso/bloqueado,
  barra de progreso del curso, salto a cualquier lección desbloqueada.
- Guardado de progreso: POST /lessons/:id/progress cada 5s (con debounce); al
  terminar el video o pulsar "marcar completada", POST /lessons/:id/complete y
  avanza a la siguiente lección.
- Estados de carga y error claros; optimista al marcar completada.
- Layout: video grande + sidebar a la derecha en desktop; en móvil video arriba
  + tabs (Contenido / Temario / Recursos).
Stack: Next 14, TypeScript, Tailwind, React Query. Entrega componentes completos.
```

Para el resto de pantallas (landing, catálogo, detalle, dashboard, studio) usa los prompts FE de `KODIRA_FRONTEND.md` — siguen siendo válidos, solo apuntan ahora al backend NestJS.

### Publica la web

Conecta `kodira-frontend` a **Vercel**, pon la variable `NEXT_PUBLIC_API_URL` con la URL de tu backend en Railway, y listo: deploy automático cada vez que hagas push. Recuerda actualizar `FRONTEND_URL` en el backend con tu dominio real de Vercel para que el CORS lo permita.

---

# 🔒 CHECKLIST DE SEGURIDAD DEL MVP (no la saltes)

- [ ] Contraseñas hasheadas con argon2; nunca se devuelve el `passwordHash`.
- [ ] Webhooks de pago con verificación de firma e idempotencia.
- [ ] Inscripción creada solo desde el webhook, nunca desde el front.
- [ ] Rutas privadas protegidas con `JwtAuthGuard`; rutas de instructor con `RolesGuard` y guard de propiedad.
- [ ] `ValidationPipe` global con whitelist (rechaza campos no esperados).
- [ ] Secretos solo en variables de entorno; `.env` fuera de Git.
- [ ] Rate limiting en login y recuperación de contraseña.
- [ ] CORS limitado a tu dominio real en producción.

---

# PARTE C — MARKETING (durante esta fase)

El producto y el marketing avanzan en paralelo.

## C.1 Consigue a tus primeros instructores (la oferta)

Sin cursos no hay nada que vender. Antes de lanzar, contacta personalmente a 3–5 desarrolladores con conocimiento que vender (el perfil "Marcos" del documento de marketing). Ofréceles el 70% de comisión y ayuda real para montar su primer curso (incluso grábalo tú con ellos si hace falta). Con 3 buenos cursos ya puedes lanzar; no necesitas un catálogo enorme.

## C.2 Prepara el copy de conversión

### 🤖 PROMPT F1-MKT-1 — Copy de la landing

```
Usa el PROMPT MKT-1 completo de KODIRA_MARKETING.md para generar el copy de la
landing: hero, sección de features, testimonios (placeholder por ahora), bloque de
pricing (Gratis / Pro $29 mes / Pro anual $199), FAQ y CTAs. Pídele además 3
variantes del hero para probar cuál convierte mejor con PostHog.
```

## C.3 Contenido "build in public"

Sigue mostrando avances 1–2 veces por semana. Cuando el aula virtual funcione, graba un video corto mostrándola en acción: ese tipo de contenido convierte muy bien a la lista de espera en registros.

## C.4 Mide desde el día 1

Instala **PostHog** en la web y configura como mínimo estos eventos del embudo: `registro`, `ver_curso`, `iniciar_checkout`, `compra_completada`. Sin esto estarás a ciegas y no sabrás dónde se cae la gente. Revisa el embudo cada semana.

---

# 📋 CHECKLIST PARA CERRAR LA FASE 1

- [ ] Registro, login y refresh de tokens funcionando.
- [ ] Un instructor puede crear, editar, subir videos y publicar un curso.
- [ ] El catálogo y el detalle de curso se ven y filtran bien.
- [ ] El aula virtual reproduce video y guarda el progreso (y el "continuar donde quedé" funciona).
- [ ] El checkout cobra de verdad con Stripe y con Mercado Pago (probado primero en modo test).
- [ ] La inscripción se crea SOLO desde el webhook verificado e idempotente.
- [ ] Backend publicado en Railway y frontend en Vercel, con CORS correcto.
- [ ] Checklist de seguridad del MVP completa.
- [ ] 3+ cursos reales cargados por instructores reales.
- [ ] PostHog midiendo el embudo registro → compra.
- [ ] **Prueba final:** una persona externa se registra, paga y ve un curso completo sin tu ayuda.

Cuando todo esté marcado, **ya tienes un producto que factura**. Pasa a la **FASE 2**.

---

_KODIRA Solutions — Fase 1 · Guía para ejecución en solitario_
