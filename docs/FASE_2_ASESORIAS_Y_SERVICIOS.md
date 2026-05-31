# FASE 2 — Asesorías y Servicios (más formas de cobrar)

### KODIRA Solutions · Guía paso a paso para hacerlo tú solo

### Duración estimada: 6 a 10 semanas

> Ya tienes cursos que se venden. Ahora activamos las **otras dos fuentes de ingreso**: asesorías 1:1 (mentorías) y el marketplace de servicios freelance. El mismo usuario que aprende ahora también puede vender. Ese "perfil unificado" es lo que diferencia a KODIRA de Udemy o Fiverr por separado.

---

# 🎯 OBJETIVO DE ESTA FASE

Que cualquier usuario pueda **reservar y pagar una asesoría** con un mentor (con calendario y zonas horarias), y que un freelancer pueda **publicar un servicio, recibir pedidos y cobrar con protección de pago (escrow)**.

# ✅ QUÉ TENDRÁS AL TERMINAR

- ✅ Un usuario reserva y paga una sesión 1:1 con un mentor, viendo los huecos en su hora local.
- ✅ Un freelancer publica un servicio con 3 paquetes (básico/pro/premium).
- ✅ Un comprador hace un pedido; el dinero queda retenido hasta que se entrega (escrow).
- ✅ Hay chat en tiempo real entre usuarios, reseñas y un sistema básico de disputas.

---

# 🧠 CONCEPTOS QUE NECESITAS ENTENDER EN ESTA FASE

**Zonas horarias y por qué todo se guarda en UTC.** Un mentor en Argentina y un alumno en México deben ver el mismo hueco, cada uno en su hora local. Si guardaras "las 18:00" sin más, sería un caos. La regla de oro: **guarda siempre los instantes en UTC** (un tiempo universal sin zona) y conviértelos a la hora local **solo al mostrarlos** en el frontend. El backend nunca piensa en "horas locales"; piensa en UTC. El frontend traduce con una librería (luxon o date-fns-tz). Equivocarte aquí genera reservas a horas imposibles, así que tómatelo en serio.

**Qué es el escrow y por qué es obligatorio en un marketplace.** Cuando un comprador paga un servicio a un freelancer desconocido, ninguno confía en el otro: el comprador teme pagar y no recibir nada, el vendedor teme entregar y no cobrar. El escrow lo resuelve: el dinero del comprador queda **retenido por la plataforma** (no llega al vendedor todavía). Cuando el comprador confirma que recibió el trabajo, la plataforma **libera** el dinero al vendedor. Si hay problema, se abre una disputa. Sin escrow, tu marketplace no genera confianza y nadie lo usa.

**Por qué el dinero solo se mueve en el backend.** Igual que en la Fase 1, ningún cambio de dinero (retener, liberar, reembolsar) puede dispararse desde el navegador. Todo ocurre en webhooks verificados y en jobs programados del backend. El front solo _pide_ acciones; el backend decide y ejecuta.

**WebSockets (tiempo real).** El chat necesita que los mensajes lleguen al instante, sin que el usuario recargue. Eso no se hace con la API REST normal (que es pregunta-respuesta), sino con una conexión permanente abierta llamada WebSocket. NestJS lo gestiona con "Gateways" (Socket.IO). Tú defines eventos (`message:new`, `typing`) y el servidor los empuja a los clientes conectados.

**Salas de video.** Para las asesorías 1:1 necesitas videollamada. No la construyas tú: usa un servicio como **Daily.co** o **LiveKit**, que te dan una sala con una URL. Tu backend genera esa URL cuando la reserva se confirma y la guarda en el `Booking`.

---

# 📅 ORDEN RECOMENDADO Y TIEMPOS

1. **Mentoring: perfiles y disponibilidad** (1–2 semanas). El cálculo de huecos es lo fino.
2. **Mentoring: reservas con pago + video** (1–2 semanas).
3. **Marketplace: gigs** (1 semana).
4. **Marketplace: pedidos con escrow** (2 semanas). Lo más delicado de toda la app.
5. **Reviews + mensajería en tiempo real** (1–2 semanas).
6. **Frontend de todo** (en paralelo, tu terreno).

---

# PARTE A — BACKEND

## A.1 Módulo de asesorías (`mentoring`)

**El reto técnico de esta fase son las zonas horarias.** Guarda todo en UTC y convierte solo al mostrar (relee el concepto de arriba si dudas).

### 🤖 PROMPT F2-BE-1 — Mentores y disponibilidad

```
Actúa como Backend Senior NestJS + MongoDB.

Crea el módulo `mentoring`:
- Schema MentorProfile: user (ref User, único), bio, expertiseTags, introVideoUrl,
  isVerified, isActive, totalSessions, rating, reviewCount, responseTimeHours,
  hourlyRate, sessionTypes (array incrustado: name, durationMinutes, price,
  description, bufferAfterMinutes, maxPerDay), weeklyAvailability (array:
  dayOfWeek 0-6, startTime "HH:mm", endTime "HH:mm", todo interpretado en la
  timezone del mentor), blackoutDates (fechas bloqueadas puntuales), embedding.

ENDPOINTS:
- POST /mentors → convertirse en mentor (añade rol 'mentor' al usuario, crea perfil).
- PUT /mentors/me → editar mi perfil, tipos de sesión y disponibilidad.
- GET /mentors → listado con filtros (expertise, precio, rating) y paginado.
- GET /mentors/:id → perfil público + reseñas.
- GET /mentors/:id/availability?date=YYYY-MM-DD → calcula los huecos LIBRES de ese
  día: toma la disponibilidad semanal del mentor, le resta las reservas existentes
  y los buffers entre sesiones, respeta blackoutDates y maxPerDay. Devuelve los
  huecos como instantes UTC (ISO 8601). El front los convierte a la zona del usuario.

REGLAS: maneja todo internamente en UTC. No devuelvas huecos ya ocupados ni dentro
del buffer de otra sesión. No permitas huecos en el pasado.

ENTREGA: archivos completos comentados en español, con la lógica de cálculo de
huecos bien explicada paso a paso.
```

**Cómo probarlo:** crea un mentor con disponibilidad los lunes de 09:00 a 12:00 y sesiones de 60 min con 15 de buffer. Pide la disponibilidad de un lunes: deben salir huecos a las 09:00, 10:15 y 11:30 (en UTC, según la timezone del mentor). Reserva uno y vuelve a pedir: ese hueco debe desaparecer.

> **Error común:** los huecos salen corridos una o varias horas → estás mezclando hora local con UTC en el cálculo. Asegúrate de convertir la disponibilidad (que está en la timezone del mentor) a UTC antes de comparar con las reservas.

### 🤖 PROMPT F2-BE-2 — Reservas con pago y video

```
Actúa como Backend Senior NestJS + MongoDB.

En `mentoring`, añade:
- Schema Booking: mentor (ref User), mentee (ref User), sessionTypeId,
  startDatetime (UTC), endDatetime (UTC), menteeTimezone, status (pending_payment/
  confirmed/in_progress/completed/cancelled_mentor/cancelled_mentee/no_show),
  meetingUrl, recordingUrl, transcript, aiSummary, actionItems, preSessionNotes,
  mentorPrivateNotes, amount, payment (ref Payment).

ENDPOINTS:
- POST /mentors/:id/book → recibe { sessionTypeId, startDatetime (UTC),
  preSessionNotes }. Revalida en el servidor que el hueco SIGA libre (no confíes
  en el front), crea el Booking en pending_payment y genera el checkout reutilizando
  el módulo payments con concept='booking'.
- Webhook de pago confirmado → Booking a 'confirmed', genera la meetingUrl con
  Daily.co/LiveKit, y dispara emails de confirmación a ambos.
- GET /bookings → mis reservas como mentor y como mentee, filtrables por estado.
- PUT /bookings/:id/cancel → cancela respetando la política (ej. >24h antes sin
  penalización; <24h según reglas). Si procede reembolso, dispáralo desde payments.
- Recordatorios automáticos EN COLA (BullMQ con jobs programados): 24h, 2h y 15min
  antes de la sesión, por email y push.

Comisión KODIRA en asesorías: 15% (el mentor recibe el 85%).

ENTREGA: archivos completos.
```

> **Doble reserva (race condition):** si dos personas reservan el mismo hueco a la vez, podrías confirmarlo dos veces. Pídele a la IA que use una operación atómica de Mongo (por ejemplo, marcar el hueco como ocupado con `findOneAndUpdate` condicional) para que solo uno gane.

## A.2 Módulo de marketplace (`marketplace`)

Lo más delicado de toda la app: hay **dinero entre dos personas**. El escrow protege a ambos.

### 🤖 PROMPT F2-BE-3 — Servicios (gigs)

```
Actúa como Backend Senior NestJS + MongoDB.

Crea el módulo `marketplace`:
- Schema Gig: title, slug (único), seller (ref User), category (ref ServiceCategory),
  description, shortDescription, thumbnailUrl, galleryUrls, tags, faq (array
  pregunta/respuesta), state (draft/review/active/paused/rejected),
  sellerLevel (starter/verified/expert/kodira_pro), isFeatured, rating, reviewCount,
  orderCount, packages (array incrustado: packageType basic/standard/premium, name,
  description, price, deliveryDays, revisions, features), aiDescription, embedding.
- Schema ServiceCategory: name, slug, icon, order.

ENDPOINTS:
- POST /gigs → crear servicio (el front manda el wizard completo). Estado draft.
- PUT /gigs/:id → editar (solo el dueño, con guard de propiedad).
- POST /gigs/:id/publish → pasa a active (valida que tenga al menos un paquete y thumbnail).
- POST /gigs/:id/pause → pausar.
- GET /gigs → listado con filtros (categoría, rango de precio, días de entrega,
  rating, nivel del vendedor) y paginado.
- GET /gigs/:slug → detalle público.
- GET /gigs/categories.

ENTREGA: archivos completos comentados.
```

### 🤖 PROMPT F2-BE-4 — Pedidos con escrow

```
Actúa como Backend Senior NestJS especializado en marketplaces con escrow.

En `marketplace`, añade:
- Schema Order: orderNumber (autogenerado tipo KOD-000123), buyer (ref User),
  seller (ref User), gig (ref Gig), packageType, status (pending_payment/active/
  delivered/in_revision/completed/cancelled/disputed/refunded), price,
  platformFee (20%), sellerAmount (80%), escrowStatus (pending/held/released/
  refunded), deadline, extendedDeadline, revisionCount, maxRevisions, requirements,
  deliverableUrls, statusHistory (auditoría: estado, fecha, quién), payment.

FLUJO COMPLETO:
1. POST /gigs/:id/order → recibe { packageType, requirements }. Crea Order
   (pending_payment) + checkout.
2. Webhook de pago confirmado → escrowStatus='held' (dinero retenido por KODIRA),
   status='active', fija el deadline según deliveryDays del paquete. Idempotente.
3. POST /orders/:id/deliver → el vendedor sube entregables; status='delivered'.
   Notifica al comprador e inicia el contador de auto-liberación.
4. POST /orders/:id/accept → el comprador acepta; escrowStatus='released'
   (paga el 80% al vendedor), status='completed'.
5. POST /orders/:id/revision → el comprador pide revisión si quedan; status='in_revision'.
6. POST /orders/:id/dispute → abre disputa; status='disputed' (revisión manual por admin).
7. Job programado: si el comprador no responde en X días tras 'delivered',
   libera el pago al vendedor automáticamente.

REGLAS CRÍTICAS: el dinero solo se mueve en webhooks/jobs del backend, jamás desde
el front. Registra CADA cambio de estado en statusHistory (auditoría). Valida en
cada transición que quien la pide tiene derecho (el vendedor entrega, el comprador
acepta, etc.).

ENTREGA: archivos completos con una máquina de estados clara y comentada.
```

**Cómo probarlo:** haz un pedido de prueba completo en modo test: paga → confirma que el escrow queda en `held` → entrega como vendedor → acepta como comprador → confirma que el escrow pasa a `released`. Luego prueba el camino de la disputa y el de la auto-liberación (puedes bajar el plazo a unos minutos para la prueba).

> **Errores comunes:** (1) El dinero se libera sin que el comprador acepte → revisa quién puede llamar a cada endpoint. (2) La auto-liberación no salta → revisa que el job programado de BullMQ esté registrado y corriendo. (3) Un estado se puede repetir → valida las transciones permitidas (no se puede "entregar" un pedido ya completado).

## A.3 Reseñas y mensajería

### 🤖 PROMPT F2-BE-5 — Reviews + mensajería en tiempo real

```
Actúa como Backend Senior NestJS + MongoDB.

1) Módulo `reviews`:
- Schema Review: author (ref User), targetType (course/mentor/gig), targetId,
  rating (1-5), comment, response (respuesta opcional del vendedor/mentor). timestamps.
- POST /reviews → SOLO si el autor compró el curso / tuvo la sesión completada /
  completó el pedido (verifícalo). Un usuario no puede reseñar dos veces lo mismo.
- GET /reviews?targetType=&targetId= → listado paginado.
- Al crear/editar una review, recalcula EN COLA el rating y reviewCount del
  curso/mentor/gig correspondiente.

2) Mensajería directa 1:1 (no comunidad todavía):
- Schemas Conversation (participants[], lastMessageAt) y DirectMessage
  (conversation, sender, content, readBy[], attachmentUrls). Índices para listar
  rápido las conversaciones de un usuario.
- ENDPOINTS REST: listar mis conversaciones, abrir/crear una con otro usuario,
  historial paginado de mensajes, marcar como leído.
- Gateway de WebSocket (/dm) con Socket.IO: autenticado por token, eventos
  message:new, message:read, typing. Empuja el mensaje a los participantes conectados.
- Si el destinatario no está conectado, dispara notificación push/email EN COLA.

ENTREGA: archivos completos comentados.
```

---

# PARTE B — FRONTEND (tu terreno)

| Pantalla                   | Ruta               | Notas                                            |
| -------------------------- | ------------------ | ------------------------------------------------ |
| Catálogo de mentores       | `/mentors`         | Filtros por expertise, precio, rating            |
| Perfil de mentor + reserva | `/mentors/[id]`    | Calendario + huecos en tu zona horaria + pago    |
| Mis reservas               | `/bookings`        | Tabs próximas/pasadas, botón "Unirse", countdown |
| Marketplace                | `/services`        | Filtros y búsqueda de servicios                  |
| Detalle de servicio        | `/services/[slug]` | 3 paquetes, FAQ, botón contratar                 |
| Publicar servicio (wizard) | `/studio/gigs/new` | Paso a paso guiado, guarda borrador              |
| Pedidos                    | `/orders`          | Vista comprador y vendedor, timeline de estados  |
| Chat                       | `/messages`        | Mensajería en tiempo real con archivos           |

### 🤖 PROMPT F2-FE-1 — Widget de reserva con zonas horarias

```
Actúa como Frontend Engineer especializado en UIs de scheduling.
Crea el flujo de reserva en /mentors/[id]:
- Perfil del mentor (foto, bio, expertise, rating, reseñas, video intro).
- Widget sticky: selector de tipo de sesión + calendario + slots disponibles.
- Los slots vienen del backend en UTC; conviértelos a la zona horaria del usuario
  (detectada automáticamente, con luxon o date-fns-tz) y muéstralos con la etiqueta
  "tu hora local (GMT-X)". Permite cambiar la zona manualmente.
- Campo de notas pre-sesión + pago (Stripe Elements / checkout de Mercado Pago).
- Modal de confirmación tras reservar, con botón para añadir al calendario (.ics).
- Estados de carga, hueco que se ocupó mientras decidías (revalida antes de pagar).
Entrega componentes completos (Next 14, TS, Tailwind, React Query).
```

### 🤖 PROMPT F2-FE-2 — Wizard de publicación de servicio

```
Actúa como Frontend Senior.
Crea el wizard de publicación de gig en /studio/gigs/new, paso a paso:
1) Título + categoría + tags. 2) Descripción + galería (subida a R2 con URL firmada).
3) Los 3 paquetes (básico/pro/premium) con precio, días de entrega y revisiones.
4) FAQ. 5) Revisión y publicar.
Guarda borrador automáticamente en cada paso. Validación por paso. Entrega completo.
```

Para mensajería y pedidos reutiliza patrones de chat en tiempo real (cliente Socket.IO) y tablas con TanStack Table. El timeline de estados del pedido conviene mostrarlo como una línea de tiempo visual para que ambos entiendan en qué punto están.

---

# PARTE C — MARKETING (durante esta fase)

## C.1 Activa el lado de la oferta otra vez

El marketplace necesita vendedores. Tus mejores candidatos ya están dentro: **los alumnos que terminaron cursos**. Mándales un email automatizado al completar un curso invitándolos a ofrecer asesorías o servicios ("ya sabes esto, ahora cóbralo"). Es el círculo virtuoso del ecosistema y no te cuesta nada.

## C.2 Contenido que muestra el "todo en uno"

### 🤖 PROMPT F2-MKT-1 — Ideas de video del diferenciador

```
Usa el PROMPT MKT-2 de KODIRA_MARKETING.md para generar 30 ideas de TikTok/Reels,
pero enfoca al menos 10 en el mensaje "aprende Y trabaja en el mismo lugar"
(perfil unificado: el mismo usuario que toma un curso luego vende un servicio o
da asesorías). Incluye 3 guiones completos de 30 segundos listos para grabar.
```

## C.3 Email a tu base actual

Avisa por email (Resend) a todos los registrados que ahora pueden reservar asesorías y contratar/ofrecer servicios. Reactivar a quien ya tienes es mucho más barato que captar nuevos. Segmenta: a los alumnos ofréceles ser vendedores; a todos, las nuevas formas de aprender.

---

# 📋 CHECKLIST PARA CERRAR LA FASE 2

- [ ] Un usuario reserva y paga una asesoría; el calendario respeta zonas horarias.
- [ ] No se puede reservar un hueco ocupado ni dentro de un buffer (probado con dos reservas a la vez).
- [ ] Recordatorios automáticos de sesión funcionando (24h/2h/15min).
- [ ] La videollamada se genera al confirmar la reserva.
- [ ] Un freelancer publica un servicio con 3 paquetes.
- [ ] Un pedido pasa por todo el flujo: pago → escrow retenido → entrega → liberación.
- [ ] La disputa y la liberación automática funcionan.
- [ ] Cada cambio de estado del pedido queda registrado (auditoría).
- [ ] Reseñas funcionando (solo quien compró) y recalculando ratings.
- [ ] Chat en tiempo real entre usuarios operativo, con notificación cuando estás offline.
- [ ] **Prueba final:** completa una asesoría real Y un pedido real de principio a fin.

Cuando todo esté marcado, KODIRA ya tiene **tres fuentes de ingreso**. Pasa a la **FASE 3**.

---

_KODIRA Solutions — Fase 2 · Guía para ejecución en solitario_
