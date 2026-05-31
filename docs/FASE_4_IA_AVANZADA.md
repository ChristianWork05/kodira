# FASE 4 — IA Avanzada y Personalización (KODIRA inteligente)

### KODIRA Solutions · Guía paso a paso para hacerlo tú solo

### Duración estimada: 6 a 10 semanas

> KODI ya responde dudas. Ahora lo convertimos en un verdadero **tutor y guía**: genera rutas de aprendizaje, recomienda cursos, conecta personas, resume sesiones y revisa código. Aquí KODIRA pasa de "una plataforma con IA" a "una plataforma que se adapta a cada persona", que es lo que justifica la suscripción y dispara el boca a boca.

---

# 🎯 OBJETIVO DE ESTA FASE

Llevar la IA del "responde preguntas" al "te guía": **roadmaps personalizados, recomendaciones, matching de mentores, resúmenes automáticos, revisión de código y onboarding inteligente**.

# ✅ QUÉ TENDRÁS AL TERMINAR

- ✅ KODI genera un roadmap de aprendizaje a medida según el objetivo del usuario.
- ✅ Recomendaciones de cursos basadas en historial y embeddings.
- ✅ Matching inteligente mentor ↔ mentee.
- ✅ Resumen automático y action items de cada asesoría.
- ✅ Revisión de código con feedback educativo en un sandbox real y seguro.
- ✅ Onboarding personalizado y detección/recuperación de abandono.

---

# 🧠 CONCEPTOS QUE NECESITAS ENTENDER EN ESTA FASE

**Cómo se "parecen" dos cosas (similitud de vectores).** Las recomendaciones y el matching funcionan comparando embeddings (los vectores de significado de la Fase 3). Para medir cuánto se parecen dos vectores se usa la "similitud coseno": un número entre 0 y 1, donde 1 es idéntico. Si el embedding del objetivo del usuario ("quiero ser desarrollador backend") se parece mucho al de un curso o al perfil de un mentor, ese es un buen match. No tienes que programar la fórmula: Atlas Vector Search la calcula por ti.

**Salir con salida estructurada (JSON) de la IA.** Para el roadmap necesitas que la IA devuelva datos ordenados (semanas, cursos, horas), no un texto suelto, para que tu frontend los pinte. El truco es pedirle explícitamente en el prompt que responda _solo_ en un formato JSON concreto, sin texto adicional, y luego parsear esa respuesta. Los modelos modernos tienen un "modo JSON" que garantiza que la salida sea JSON válido; úsalo.

**Qué es un sandbox y por qué nunca ejecutas código del usuario en tu servidor.** Cuando un alumno escribe código y le das a "ejecutar", ese código podría ser malicioso (borrar archivos, robar datos, tumbar tu servidor). Jamás lo corres en tu propia máquina. Lo mandas a **Judge0**, un servicio que lo ejecuta en una caja aislada y desechable (un "sandbox"), y solo te devuelve el resultado. Tu servidor nunca toca el código peligroso.

**Qué es la transcripción (Whisper).** Para resumir una asesoría, primero hay que convertir el audio de la grabación en texto. Eso lo hace el modelo Whisper de OpenAI: le pasas el audio, te devuelve la transcripción. Luego GPT-4o resume ese texto y saca los action items.

**Qué es un cron job (tarea programada).** El "tutor proactivo" y el cierre de ligas no los dispara un usuario: ocurren solos en momentos fijos (cada noche, cada lunes). Eso es un cron job: una tarea que tu sistema ejecuta en un horario. Lo gestionas con BullMQ (jobs repetibles) o con el scheduler de NestJS.

**Recordatorio de costes.** Esta fase llama mucho más a la IA. Mantén el control: cachea recomendaciones (no las recalcules en cada visita), usa modelos baratos (GPT-4o-mini) donde la calidad no sea crítica, y revisa tu gasto de OpenAI semanalmente. La IA es tu diferenciador, pero también puede ser tu mayor gasto si no la vigilas.

---

# 📅 ORDEN RECOMENDADO Y TIEMPOS

1. **Recomendaciones** (1 semana). Reaprovecha los embeddings que ya tienes.
2. **Roadmaps personalizados** (1–2 semanas).
3. **Matching de mentores + resúmenes de sesión** (1–2 semanas).
4. **Ejecución de código (Judge0) + code review** (2 semanas).
5. **Onboarding por objetivos + tutor proactivo** (1–2 semanas).
6. **Frontend de todo** (en paralelo, tu terreno).

---

# PARTE A — BACKEND

## A.1 Roadmaps y recomendaciones

### 🤖 PROMPT F4-BE-1 — Learning Path Engine

```
Actúa como AI Engineer Senior. Trabaja sobre el módulo `ai` existente.

Crea el generador de roadmaps personalizados:
- POST /ai/roadmap → recibe { goal, currentLevel, hoursPerWeek }.
- KODI analiza el objetivo, busca con Atlas Vector Search los cursos de la plataforma
  que encajan, y arma un plan por semanas con: cursos sugeridos (con horas estimadas),
  recursos, proyectos prácticos y la meta de carrera. Calcula tiempo total y costo total.
- IMPORTANTE: la IA debe devolver SOLO JSON válido con esta forma:
  { goal, totalWeeks, totalHours, totalCost, weeks: [{ weekNumber, focus,
    items: [{ type: course|project|resource, refId, title, hours }] }] }.
  Usa el modo JSON del modelo y parsea con manejo de errores.
- Guarda el roadmap en el perfil del usuario para seguir su avance y poder regenerarlo.
- Solo recomienda cursos que EXISTEN en la plataforma (no inventes); si faltan,
  márcalo como "hueco de contenido" (útil para saber qué cursos crear).

ENTREGA: endpoint completo + esquema JSON de salida documentado + manejo de errores
de parseo.
```

### 🤖 PROMPT F4-BE-2 — Motor de recomendaciones

```
Actúa como AI Engineer Senior.
En `ai`, crea POST /ai/recommend:
- Combina (a) embeddings de los cursos que el usuario ya tomó/vio, (b) sus skills y
  objetivos, (c) popularidad/rating del curso.
- Calcula un score por curso y devuelve los 10 más relevantes que aún NO ha tomado,
  cada uno con una razón legible ("porque completaste React, esto te dará el siguiente paso").
- Cachea el resultado por usuario en Redis (con expiración) y recalcula cuando el
  usuario completa un curso o cambia sus objetivos.
ENTREGA: endpoint + lógica de scoring explicada paso a paso.
```

**Cómo probarlo:** crea un usuario que completó un curso de, digamos, "React básico". Pide recomendaciones: deben aparecer cursos relacionados (React avanzado, Next.js) y no el que ya hizo, cada uno con su razón. Pide un roadmap con un objetivo claro: debe salir JSON válido con cursos que existen de verdad.

> **Error común:** el roadmap a veces recomienda cursos inventados → tu prompt no restringe la IA a los cursos reales recuperados. Pásale la lista de cursos existentes como contexto y prohíbele salir de ahí.

## A.2 Matching de mentores y resúmenes de sesión

### 🤖 PROMPT F4-BE-3 — Matching mentor/mentee + resumen de sesión

```
Actúa como AI Engineer Senior.

1) POST /ai/match-mentor → recibe { goal }. Compara el embedding del objetivo con
   los embeddings de los perfiles de mentores (genera el embedding del perfil al
   crearlo/editarlo). Devuelve los 5 mejores con un score de compatibilidad (0-100)
   y una razón del match. Filtra por mentores activos y con disponibilidad.

2) Resumen automático de asesorías (jobs EN COLA, tras la sesión):
   - Job 1: toma la grabación, la transcribe con Whisper, guarda transcript en Booking.
   - Job 2: con la transcripción, GPT-4o genera resumen, lista de action items y
     próximos pasos sugeridos. Guarda aiSummary y actionItems en la Booking y los
     envía a mentor y mentee por email.
   - Maneja el caso de que no haya grabación (sesión sin grabar).

ENTREGA: endpoints + processors de cola completos, con manejo de errores y reintentos.
```

## A.3 Revisión de código con sandbox real

### 🤖 PROMPT F4-BE-4 — Ejecución de código (Judge0) + code review IA

```
Actúa como Backend Senior NestJS.

Crea el servicio de ejercicios de código:
- POST /lessons/:id/code-submit → recibe { code, language }. Lo ejecuta de forma
  segura con Judge0 (API) contra los testCases del ejercicio (entrada esperada/
  salida esperada). Devuelve: tests pasados/fallados, salida, errores y tiempo.
- Si pasa todos los tests, marca codePassed en el lessonProgress y suma XP.
- POST /ai/code-review → recibe el código del alumno y el enunciado; KODI da
  feedback educativo (qué mejorar, buenas prácticas, complejidad) SIN entregar la
  solución directa (para no quitarle el aprendizaje).
- Límite de envíos por minuto para no saturar Judge0.

REGLA DE SEGURIDAD INNEGOCIABLE: nunca ejecutes código del usuario en tu propio
servidor. Judge0 lo aísla en su sandbox; tú solo envías y recibes resultados.

ENTREGA: módulo completo + variables de entorno de Judge0 + cómo usar la versión
self-hosted o la de pago.
```

## A.4 Onboarding inteligente y detección de abandono

### 🤖 PROMPT F4-BE-5 — Onboarding por objetivos + tutor proactivo

```
Actúa como Backend Senior NestJS + AI Engineer.

1) Onboarding: POST /users/me/goals → guarda el objetivo elegido al registrarse
   (primer trabajo / subir de nivel / aprender tecnología X / vender servicios) y
   nivel actual. Con eso, GET /home/personalized arma un home a medida (roadmap
   inicial + cursos sugeridos + a qué comunidad unirse + primer paso concreto).

2) Tutor proactivo (cron jobs):
   - Cada noche, detecta usuarios inactivos (sin actividad N días) y, según su curso
     y objetivo, KODI genera un mensaje motivacional PERSONALIZADO (email + push):
     "Llevas 3 días sin avanzar en React, ¿retomamos en la lección X?". No spamees:
     máximo uno cada pocos días y permite desactivarlos.
   - Predicción de fecha de finalización del curso según el ritmo actual del alumno,
     mostrada en su dashboard como motivación.

ENTREGA: endpoints + cron jobs completos, con opción de que el usuario gestione sus
notificaciones.
```

> **Cuidado con ser pesado:** un tutor proactivo mal calibrado se siente como spam y la gente se da de baja. Respeta límites de frecuencia, permite silenciarlo y haz los mensajes útiles, no insistentes.

---

# PARTE B — FRONTEND (tu terreno)

| Pantalla / componente     | Dónde            | Notas                                            |
| ------------------------- | ---------------- | ------------------------------------------------ |
| Quiz de onboarding        | tras el registro | Pregunta objetivo → home personalizado           |
| Roadmap visual            | `/roadmap`       | Línea de tiempo por semanas, progreso, regenerar |
| Recomendaciones           | dashboard        | Carrusel "para ti" con la razón del match        |
| Editor de código (Monaco) | aula virtual     | Sandbox + correr tests + feedback de KODI        |
| Resumen de sesión         | `/bookings/[id]` | Resumen, action items, próximos pasos            |

### 🤖 PROMPT F4-FE-1 — Editor de código en el aula

```
Actúa como Senior Frontend Engineer.
Crea MonacoCodeEditor para el aula virtual:
- Editor Monaco (el de VS Code) con el lenguaje del ejercicio y tema oscuro acorde a KODIRA.
- Botón "Ejecutar tests" → POST /lessons/:id/code-submit → muestra cada test
  pasado/fallado, la salida y los errores de forma clara.
- Botón "Pedir feedback a KODI" → POST /ai/code-review → muestra el feedback en panel lateral.
- Historial de intentos y botón de "reiniciar al código inicial".
Entrega componente completo (Next 14, TS, Tailwind).
```

### 🤖 PROMPT F4-FE-2 — Roadmap visual + onboarding

```
Actúa como Frontend Senior.
1) Onboarding: quiz de 3-4 preguntas tras el registro (objetivo, nivel, horas/semana)
   que llama a /users/me/goals y redirige al home personalizado.
2) Roadmap visual en /roadmap: línea de tiempo por semanas con cursos, recursos y
   proyectos; marca el avance, muestra tiempo y costo totales, y permite regenerarlo.
   Datos de /ai/roadmap.
Entrega componentes completos con animaciones suaves (Framer Motion).
```

---

# PARTE C — MARKETING (durante esta fase)

## C.1 El roadmap personalizado es un imán de registros

"Dime tu objetivo y la IA te arma el plan exacto" es un gancho potentísimo. Considera una versión **pública (sin login)** del generador de roadmaps como herramienta de captación: la persona la usa, ve el valor inmediato, y se registra para guardarlo y empezar. Es de las mejores formas de convertir curiosos en usuarios.

### 🤖 PROMPT F4-MKT-1 — Campaña del roadmap IA

```
Actúa como Growth Marketer.
Diseña una campaña alrededor de "Roadmap de carrera tech generado por IA":
- 5 ideas de video corto mostrando el generador en acción.
- Copy de anuncio para Meta/Google con el ángulo "deja de aprender al azar".
- Diseño del lead magnet gratuito (el roadmap público) y el flujo que lleva al registro.
- 3 asuntos de email para invitar a tu base a probarlo.
Entrega todo accionable.
```

## C.2 Casos de éxito tempranos

Ya tienes usuarios con resultados reales (terminaron cursos, consiguieron clientes, dieron asesorías). Conviértelos en testimonios en video (usa el PROMPT MKT-5 de `KODIRA_MARKETING.md`). Nada vende como resultados reales y verificables: muestra el "antes y después".

---

# 📋 CHECKLIST PARA CERRAR LA FASE 4

- [ ] KODI genera roadmaps en JSON válido y coherentes con los cursos reales (no inventa).
- [ ] Recomendaciones personalizadas con su "razón" visible y cacheadas.
- [ ] Matching de mentores con score de compatibilidad y razón.
- [ ] Resumen + action items automáticos tras cada asesoría (con y sin grabación).
- [ ] Editor de código ejecuta tests reales en Judge0 (nunca en tu servidor) y KODI da feedback sin dar la solución.
- [ ] Onboarding por objetivos arma un home personalizado.
- [ ] Mensajes proactivos a usuarios inactivos funcionando, sin spamear y con opción de silenciar.
- [ ] Gasto de OpenAI bajo control (caché + modelos adecuados + revisión semanal).
- [ ] **Prueba final:** un usuario nuevo elige su objetivo, recibe un roadmap, toma un curso recomendado, resuelve un ejercicio con feedback de KODI y, si se ausenta, recibe un mensaje proactivo.

Cuando todo esté marcado, KODIRA ya se siente **inteligente y personal**. Pasa a la **FASE 5**.

---

_KODIRA Solutions — Fase 4 · Guía para ejecución en solitario_
