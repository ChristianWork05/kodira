# FASE 3 — Comunidad e IA básica (retención y magia)

### KODIRA Solutions · Guía paso a paso para hacerlo tú solo

### Duración estimada: 6 a 10 semanas

> Hasta ahora KODIRA vende. En esta fase logramos que la gente **se quede**: comunidad activa vinculada a los cursos, gamificación que engancha, y la primera versión de **KODI**, el asistente IA que es tu mayor diferenciador. La retención es lo que convierte un producto que factura en un negocio que crece.

---

# 🎯 OBJETIVO DE ESTA FASE

Construir la **comunidad** (espacios, canales, posts, eventos), la **gamificación** (XP, rachas, badges, ligas) y la **IA básica de KODI** (chat con contexto del curso). Esto sube la retención y hace que KODIRA se sienta "viva".

# ✅ QUÉ TENDRÁS AL TERMINAR

- ✅ Comunidad con espacios por tecnología y por curso (auto-ingreso al inscribirse).
- ✅ Canales de texto en tiempo real con bloques de código.
- ✅ Gamificación: XP, rachas diarias, badges y tabla de líderes con ligas semanales.
- ✅ KODI responde dudas sobre la lección que el alumno está viendo, citando el contenido real.
- ✅ Eventos/webinars con registro y recordatorios.

---

# 🧠 CONCEPTOS QUE NECESITAS ENTENDER EN ESTA FASE

**Qué es un embedding.** Un embedding es una forma de convertir un texto en una lista de números (un "vector") que captura su _significado_. Dos textos que hablan de lo mismo tienen vectores parecidos, aunque usen palabras distintas. Lo genera un modelo de OpenAI (`text-embedding-3-small`). Lo usamos para que KODI encuentre el contenido relevante por significado, no por coincidencia exacta de palabras.

**Qué es la búsqueda vectorial (Atlas Vector Search).** Una vez que cada lección tiene su embedding guardado, cuando el alumno pregunta algo, conviertes la pregunta en embedding y le pides a MongoDB Atlas: "dame las lecciones cuyo vector se parezca más a este". Eso es Atlas Vector Search, y reemplaza a herramientas separadas como pgvector o Pinecone. Todo vive en tu misma base de datos.

**Qué es RAG (y por qué KODI lo necesita).** RAG significa "generación aumentada por recuperación". El truco es: antes de pedirle una respuesta a la IA, primero **recuperas** el contenido real de tus cursos relevante a la pregunta (con la búsqueda vectorial) y se lo pasas al modelo como contexto. Así KODI no inventa: responde basándose en _tu_ material. Sin RAG, KODI sería un ChatGPT genérico que no conoce tus cursos y se inventa cosas. Con RAG, es un tutor que "leyó" tu contenido.

**Qué es el streaming (SSE).** Cuando KODI responde, no quieres que el usuario espere 10 segundos mirando una pantalla en blanco hasta tener el texto completo. El streaming envía la respuesta **palabra por palabra** según la genera el modelo, igual que ves a ChatGPT escribir. Técnicamente se hace con SSE (Server-Sent Events), una conexión donde el servidor va empujando trozos de texto.

**La psicología de la gamificación (por qué funciona).** Las rachas, el XP y las ligas no son adornos: son los mismos mecanismos que hacen que la gente abra Duolingo cada día. Una **racha** crea miedo a perder el progreso (la gente vuelve para no romperla). El **XP** da sensación de avance constante. Las **ligas** añaden competencia social. Bien hechos, multiplican tu retención sin que tengas que gastar en anuncios para traer de vuelta a la gente.

**Cuánto cuesta la IA y cómo no arruinarte.** Cada pregunta a KODI cuesta una fracción de céntimo (embedding + respuesta de GPT-4o). Para que no se dispare: usa `text-embedding-3-small` (barato) para los embeddings, genera el embedding de cada lección **una sola vez** (no en cada pregunta), pon rate limiting por usuario, y considera un modelo más barato (GPT-4o-mini) para preguntas simples. Empieza con un tope de gasto mensual en tu cuenta de OpenAI para dormir tranquilo.

---

# 📅 ORDEN RECOMENDADO Y TIEMPOS

1. **Comunidad: espacios, canales y mensajes** (1–2 semanas).
2. **Chat en tiempo real (Gateway WebSocket)** (1 semana).
3. **Gamificación** (1–2 semanas). Da retención inmediata.
4. **KODI con RAG** (2–3 semanas). Lo más nuevo; tómate tu tiempo.
5. **Eventos y webinars** (1 semana).
6. **Frontend de todo** (en paralelo, tu terreno).

---

# PARTE A — BACKEND

## A.1 Módulo de comunidad (`community`)

### 🤖 PROMPT F3-BE-1 — Espacios, canales y mensajes

```
Actúa como Backend Senior NestJS + MongoDB.

Crea el módulo `community`:
- Schema Space: name, slug, description, icon, color, spaceType (technology/course/
  cohort/general), linkedCourse (ref Course, opcional), isPublic, members (array
  ref User), memberCount.
- Schema Channel: name, space (ref Space), type (text/voice/announcement), order.
- Schema Message (colección propia, no incrustada porque crece sin límite):
  channel (ref Channel), author (ref User), content, codeLanguage, attachmentUrls,
  replyTo (ref Message, para threads), reactions (array: emoji + users[]),
  isPinned, isDeleted. Índice (channel + createdAt desc) para paginar rápido.

ENDPOINTS:
- GET /community/spaces (los que puedo ver según membresía/visibilidad).
- POST /community/spaces (admin).
- GET /community/spaces/:id/channels.
- GET /community/channels/:id/messages (paginado con cursor, recientes primero).
- POST /community/channels/:id/messages (REST de respaldo; el tiempo real va por WS).
- Reacciones (toggle), pin (moderador), borrado lógico (isDeleted).

AUTO-INGRESO: escucha el evento de inscripción del módulo education y añade
automáticamente al alumno al Space vinculado a ese curso. Si el curso no tiene
Space, créalo al publicarse.

ENTREGA: archivos completos comentados.
```

**Cómo probarlo:** crea un espacio con un canal, publica un mensaje por REST y léelo. Luego inscribe a un alumno a un curso con espacio vinculado y confirma que aparece como miembro automáticamente.

### 🤖 PROMPT F3-BE-2 — Chat en tiempo real (Gateway)

```
Actúa como Backend Senior NestJS especializado en WebSockets.

Crea un ChatGateway (Socket.IO) en el módulo realtime, namespace /community:
- Autenticación del socket con el JWT (rechaza conexiones sin token válido).
- Eventos: join_channel, leave_channel, send_message, typing, react.
- send_message valida que el usuario sea miembro del espacio, guarda en MongoDB
  y reemite 'new_message' a todos los del canal.
- Configura el adaptador de Redis de Socket.IO para que escale entre varios
  servidores (los mensajes lleguen aunque los usuarios estén conectados a
  instancias distintas).
- Si un mencionado/destinatario está desconectado, dispara notificación push EN COLA.

ENTREGA: gateway completo + un cliente de ejemplo para el front que muestre cómo
conectarse, unirse a un canal y enviar/recibir mensajes.
```

> **Error común:** el chat funciona en local con un servidor, pero en producción con varias instancias los mensajes "no llegan" a algunos usuarios → falta el adaptador de Redis para Socket.IO, que es justo lo que sincroniza los servidores entre sí.

### 🤖 PROMPT F3-BE-3 — Eventos y webinars

```
Actúa como Backend Senior NestJS + MongoDB.

En `community`, añade:
- Schema Event: title, description, space (ref Space), host (ref User), startAt,
  endAt, type (webinar/office_hours/hackathon/challenge), meetingUrl, recordingUrl,
  attendees (array ref User), maxAttendees, isPublished.
ENDPOINTS: listar (próximos/pasados), crear (instructor/mentor), registrarse
(valida cupo), cancelar registro. Recordatorio EN COLA antes del evento (24h y 1h).
Al terminar, opción de guardar la grabación como recurso del curso vinculado.

ENTREGA: archivos completos.
```

## A.2 Módulo de gamificación (`gamification`)

Aquí está el motor de retención. Inspirado en Duolingo (relee la sección de conceptos sobre por qué funciona).

### 🤖 PROMPT F3-BE-4 — XP, rachas, badges y ligas

```
Actúa como Backend Senior NestJS + MongoDB especializado en gamificación.

Crea el módulo `gamification`:
- Schema Badge: key (único), name, description, iconUrl, xpReward, criteria.
- Schema UserBadge: user (ref User), badge (ref Badge), earnedAt. Único (user+badge).
- Schema League y LeagueMembership (para las ligas semanales).
- Usa los campos xp, currentStreak y lastActivityDate de User (añade si faltan).

LÓGICA (escucha eventos del resto de módulos vía un event emitter interno):
- Completar lección: +10 XP. Completar curso: +100 XP. Aprobar quiz: +20 XP.
  Primera actividad del día: +5 XP de bonus.
- Racha: al registrar actividad, si la última fue ayer, currentStreak += 1; si fue
  hoy, no cambia; si fue hace más de un día, se reinicia a 1. Actualiza lastActivityDate.
  Hazlo respetando la timezone del usuario (la medianoche es la suya, no la del servidor).
- Badges automáticos por hitos: primer curso completado, racha de 7/30/100 días,
  1000/10000 XP, primera venta, etc. Al cumplirse, crea el UserBadge y notifica.
- Ligas semanales: agrupa ~30 usuarios por liga (bronce/plata/oro/diamante). Un job
  semanal cierra la liga, los del top suben, los del fondo bajan, y reparte recompensas.

ENDPOINTS:
- GET /gamification/me/stats → mi XP, racha, badges, liga actual y posición.
- GET /gamification/leaderboard → tabla de líderes (de mi liga / global).
- GET /gamification/badges → todos los badges y cuáles tengo.

ENTREGA: archivos completos comentados, con la lógica de racha bien explicada.
```

> **Error sutil:** la racha se rompe a usuarios de otras zonas horarias porque calculas "ayer/hoy" con la hora del servidor. Calcúlalo siempre con la timezone del usuario.

## A.3 Módulo de IA — KODI básico (`ai`)

La primera versión: KODI responde dudas sobre la lección actual. La IA avanzada (roadmaps, recomendaciones, matching) va en la Fase 4.

### 🤖 PROMPT F3-BE-5 — KODI chat con RAG (Atlas Vector Search)

```
Actúa como AI Engineer Senior especializado en RAG con MongoDB Atlas.

Crea el módulo `ai` (KODI) en NestJS:
1) Embeddings: un job EN COLA que, al publicar o editar una lección/curso, parte el
   contenido en trozos (chunks) y genera su embedding con OpenAI
   (text-embedding-3-small), guardándolos en una colección 'content_chunks'
   (campo: courseId, lessonId, text, embedding). Genera el embedding UNA sola vez
   por trozo, no en cada pregunta.
2) Índice de Atlas Vector Search sobre el campo embedding (explica en el README
   paso a paso cómo crearlo en el panel de Atlas: nombre del índice, dimensiones
   del modelo, métrica de similitud).
3) Schema KodiThread: user (ref User), messages (role + content + at), context.
   Es la memoria de conversación por usuario.
4) Endpoint POST /ai/kodi/chat (streaming SSE):
   - Recibe { message, lessonId?, courseId? }.
   - Genera el embedding de la pregunta.
   - Hace $vectorSearch en Atlas para traer los trozos más relevantes (filtrando
     por courseId si viene, para no mezclar cursos).
   - Llama a GPT-4o con un system prompt que le ordena responder SOLO con base en el
     contexto recuperado, citar de qué lección sale y, si no lo sabe, decirlo.
   - Devuelve la respuesta en streaming (SSE) y la guarda en KodiThread.
5) Rate limiting específico de IA: 10 peticiones/min por usuario y un tope diario.

REGLA: KODI nunca inventa. Si el contexto no contiene la respuesta, lo dice y sugiere
preguntar en la comunidad.

ENTREGA: módulo completo + README de configuración del índice vectorial y de las
variables de entorno de OpenAI.
```

**Cómo probarlo:** publica un curso con contenido real, espera a que el job genere los embeddings (míralos en Compass, en `content_chunks`), y pregúntale a KODI algo que esté en el curso. Debe responder con info correcta y citar la lección. Luego pregúntale algo que NO esté: debe admitir que no lo sabe en vez de inventar.

> **Errores comunes:** (1) `$vectorSearch` da error → no creaste el índice en el panel de Atlas, o las dimensiones no coinciden con las del modelo. (2) KODI inventa → tu system prompt no es suficientemente estricto, o no le estás pasando el contexto recuperado. (3) La factura de OpenAI sube rápido → estás generando embeddings en cada pregunta en vez de una sola vez al publicar.

---

# PARTE B — FRONTEND (tu terreno)

| Pantalla                | Ruta                               | Notas                                       |
| ----------------------- | ---------------------------------- | ------------------------------------------- |
| Comunidad               | `/community`                       | Lista de espacios, tipo Discord lite        |
| Canal                   | `/community/[spaceId]/[channelId]` | Mensajes en tiempo real + bloques de código |
| Eventos                 | `/community/events`                | Calendario + registro                       |
| Panel KODI              | dentro del aula virtual            | Chat lateral con streaming SSE              |
| Widgets de gamificación | en dashboard                       | Racha, XP, badges, mini-leaderboard         |

### 🤖 PROMPT F3-FE-1 — Panel de chat de KODI (streaming)

```
Actúa como Senior Frontend Engineer.
Crea KodiChatPanel para el aula virtual:
- Chat que consume POST /ai/kodi/chat por SSE (streaming token a token; muestra
  el texto apareciendo en vivo).
- Envía automáticamente lessonId y courseId de la lección actual como contexto.
- Burbujas de usuario/KODI, render de markdown y bloques de código con resaltado
  y botón de copiar.
- Muestra las "fuentes" que KODI citó (de qué lección salió la respuesta).
- Estado de "escribiendo...", manejo de errores y aviso amable al llegar al límite.
Stack: Next 14, TS, Tailwind. Entrega componente completo.
```

### 🤖 PROMPT F3-FE-2 — Comunidad estilo Discord lite

````
Actúa como Frontend Senior.
Crea la interfaz de comunidad:
- Sidebar de espacios + lista de canales.
- Vista de canal con mensajes en tiempo real (cliente Socket.IO), scroll infinito
  hacia arriba, indicador de "escribiendo", reacciones con emoji y threads.
- Editor que detecta bloques de código (con ```) y los muestra con resaltado.
- Reconexión automática del socket si se cae la red.
Entrega componentes completos.
````

Para los widgets de gamificación, anima el número de XP y la racha (Framer Motion): el movimiento es lo que engancha visualmente y da sensación de recompensa.

---

# PARTE C — MARKETING (durante esta fase)

## C.1 KODI es tu titular de marketing

La IA con contexto del curso es lo más "demo-eable" que tienes. Graba clips cortos mostrando a KODI respondiendo una duda real dentro de una lección. Ese tipo de video se comparte solo y comunica el diferenciador sin que tengas que explicarlo.

## C.2 La comunidad como prueba social

Una comunidad activa visible (gente preguntando, mostrando proyectos, recibiendo ayuda) convierte visitantes en registrados. Al principio tendrás que sembrar tú las conversaciones: haz preguntas, responde, comparte recursos. Una comunidad vacía espanta; una con vida atrae.

## C.3 Gamificación = contenido que se comparte

Las rachas y ligas dan motivos para volver y para presumir ("llevo 30 días seguidos aprendiendo a programar"). Diseña pantallas de hito que sean fáciles y bonitas de compartir en redes, con tu marca visible. Cada usuario compartiendo es publicidad gratis.

### 🤖 PROMPT F3-MKT-1 — Plan de comunidad y eventos

```
Actúa como Community Manager de plataformas tech.
Diseña el plan de los primeros 60 días de la comunidad de KODIRA:
calendario de eventos (office hours, code challenge semanal, webinar mensual),
cómo sembrar la conversación inicial, roles de la comunidad (moderadores, mentores
destacados), reglas de moderación y métricas de salud de la comunidad a vigilar.
Entrega un plan accionable semana a semana.
```

---

# 📋 CHECKLIST PARA CERRAR LA FASE 3

- [ ] Espacios de comunidad con auto-ingreso al inscribirse a un curso.
- [ ] Chat en tiempo real estable con varios usuarios a la vez (y probado en producción con el adaptador de Redis).
- [ ] Eventos con registro, cupo y recordatorios.
- [ ] XP, rachas diarias (respetando timezone) y badges otorgándose correctamente.
- [ ] Tabla de líderes y ligas semanales funcionando.
- [ ] Embeddings de cursos generándose una sola vez al publicar (visibles en Compass).
- [ ] KODI responde con base en el contenido real, cita la lección y admite cuando no sabe.
- [ ] Rate limiting de IA y tope de gasto en OpenAI configurados.
- [ ] **Prueba final:** un alumno completa lecciones, gana XP/racha, pregunta a KODI y participa en un canal — todo en una sola sesión fluida.

Cuando todo esté marcado, KODIRA ya **retiene**. Pasa a la **FASE 4**.

---

_KODIRA Solutions — Fase 3 · Guía para ejecución en solitario_
