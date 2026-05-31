# FASE 5 — Escala, Empresa y Móvil (crecer en serio)

### KODIRA Solutions · Guía paso a paso para hacerlo tú solo

### Duración estimada: 10 a 16 semanas (la más larga)

> KODIRA ya es un producto completo y rentable. Esta fase es para **escalar**: empresas, app móvil, bolsa de trabajo, productos digitales, bootcamps y todo lo que convierte una buena plataforma en un negocio grande. Aquí también incorporamos las **mejoras nuevas** del documento de análisis.
>
> **Aviso honesto para quien va solo:** esta fase es enorme y abarca cosas muy distintas (ventas B2B, app móvil, cumplimiento legal). No tienes que hacerla toda de golpe ni en orden. Elige lo que tu negocio pida primero según lo que veas en los datos. Y es el punto natural para empezar a delegar: tu primer contratado o socio probablemente entra aquí.

---

# 🎯 OBJETIVO DE ESTA FASE

Abrir KODIRA a **empresas** (B2B), lanzar la **app móvil**, cerrar el círculo con la **bolsa de trabajo** y reforzar **confianza/seguridad** ahora que hay mucho dinero y usuarios en juego.

# ✅ QUÉ TENDRÁS AL TERMINAR

- ✅ Planes de empresa: gestión de equipos, asignación de cursos, progreso del equipo, SSO.
- ✅ App móvil (iOS y Android) con lo esencial.
- ✅ Bolsa de trabajo que conecta el aprendizaje con empleo real.
- ✅ Marketplace de productos digitales (plantillas, código, ebooks).
- ✅ Bootcamps por cohorte y office hours grupales.
- ✅ Capa de confianza y seguridad (moderación, KYC lite, anti-fraude).
- ✅ API pública documentada.

---

# 🧠 CONCEPTOS QUE NECESITAS ENTENDER EN ESTA FASE

**Qué cambia al vender a empresas (B2B).** Hasta ahora vendías a personas (B2C). Una empresa compra "asientos" (seats): paga por, digamos, 50 licencias para sus empleados. Necesitas que un administrador de la empresa invite a su gente, les asigne cursos y vea el progreso del equipo en un panel. El cobro es recurrente (suscripción mensual/anual por número de asientos), no una compra única. Es otro modelo de negocio dentro del mismo producto.

**Qué es el SSO (inicio de sesión único).** Las empresas grandes no quieren que sus empleados creen otra contraseña: quieren que entren con la cuenta corporativa que ya tienen (Google Workspace, Microsoft, Okta). Eso es el SSO, y se implementa con protocolos estándar llamados **SAML** y **OIDC**. Cuando un empleado entra por SSO, tu backend lo reconoce y lo vincula a un usuario de KODIRA. Es casi un requisito para vender a empresas medianas y grandes.

**Qué es una API pública y por qué darla.** Algunas empresas querrán conectar KODIRA con sus propias herramientas (su sistema de RRHH, su intranet). Para eso les das una API pública con "API keys" (llaves de acceso) que les permiten leer datos de forma controlada. Empieza solo con lectura; escribir desde fuera es más arriesgado.

**Qué es KYC y por qué lo necesitas en el marketplace.** KYC ("conoce a tu cliente") es verificar la identidad de alguien antes de dejarle retirar dinero. En tu marketplace, antes de que un vendedor cobre lo retenido en escrow, conviene confirmar que es una persona real (documento, a veces cuenta bancaria). Esto previene fraude y lavado de dinero, y en muchos países es una obligación legal cuando mueves dinero de terceros. "KYC lite" significa una versión básica para empezar.

**Qué es la moderación de contenido.** Con miles de usuarios escribiendo en la comunidad, aparecerá spam, toxicidad y contenido inapropiado. No puedes leerlo todo a mano. Usas la API de moderación de OpenAI para clasificar automáticamente lo dudoso y mandarlo a una cola de revisión humana. Protege a tu comunidad y a tu marca.

**La realidad de publicar una app móvil.** Publicar en App Store y Google Play no es solo "subir el código". Apple y Google revisan tu app (puede tardar días y rechazarte por detalles), necesitas cuentas de desarrollador de pago (Apple ~99 USD/año, Google ~25 USD una vez), e iconos, capturas y políticas de privacidad. Ten paciencia con el proceso de revisión: es normal que rechacen la primera versión por algo menor.

**Por qué la app reutiliza casi todo.** Como construiste el frontend en un monorepo con `api-client`, `types` y `hooks` compartidos, la app móvil consume **la misma API** y reutiliza esa lógica. Solo cambias la capa visual por componentes nativos. No reescribes el cerebro, solo la cara.

---

# 📅 ORDEN SUGERIDO (elige según tu negocio)

No es estrictamente secuencial. Prioridades típicas:

1. **Bolsa de trabajo** si tu gancho es "aprende y consigue empleo".
2. **Empresas (B2B) + SSO** si detectas demanda corporativa (suele dar los contratos más grandes).
3. **Trust & safety** en cuanto el volumen de usuarios o de dinero lo justifique (no lo dejes para el final si ya hay mucho movimiento).
4. **Productos digitales, bootcamps, office hours** como ampliaciones de ingreso.
5. **App móvil** cuando la web esté pulida y la demanda móvil sea real.

---

# PARTE A — BACKEND

## A.1 Empresas y equipos (B2B)

### 🤖 PROMPT F5-BE-1 — Módulo de empresas

```
Actúa como Backend Senior NestJS + MongoDB.

Crea el módulo `organizations`:
- Schema Organization: name, slug, ownerUser (ref User), plan (starter/growth/
  enterprise), seats (licencias contratadas), seatsUsed, billingInfo,
  stripeSubscriptionId, ssoConfig, isActive.
- Schema OrgMember: organization (ref Org), user (ref User), role (admin/member),
  assignedCourses (array ref Course), invitedAt, joinedAt, status (invited/active/removed).
ENDPOINTS:
- Crear organización, invitar miembros por email (crea usuario si no existe),
  aceptar invitación, asignar/quitar cursos a miembros o a todo el equipo,
  dashboard agregado de progreso del equipo, gestionar seats.
- Suscripción de empresa con Stripe (cobro recurrente por seats; ajustar al
  añadir/quitar asientos). Webhook que actualiza el estado de la suscripción.
REGLA: un usuario puede pertenecer a varias organizaciones; un curso asignado por
la empresa no se le cobra al empleado.
ENTREGA: archivos completos comentados.
```

### 🤖 PROMPT F5-BE-2 — SSO y API pública

```
Actúa como Backend Senior NestJS especializado en identidad.

1) SSO empresarial: soporta login con SAML y OIDC para clientes enterprise
   (passport-saml / openid-client). Cada organización configura su proveedor en
   ssoConfig. Al entrar por SSO, mapea o crea el User de KODIRA y lo vincula a la org.

2) API pública: sistema de API keys por organización (hasheadas, con scopes y
   rate limiting propio), documentada en Swagger en /public-docs. Empieza solo con
   endpoints de LECTURA (cursos, progreso del equipo, miembros). Registra el uso
   de cada key para poder auditar y, en el futuro, facturar por consumo.

ENTREGA: módulos completos + documentación de uso para el cliente.
```

## A.2 Bolsa de trabajo (cierra el círculo)

### 🤖 PROMPT F5-BE-3 — Job board

```
Actúa como Backend Senior NestJS + MongoDB.

Crea el módulo `jobs-board`:
- Schema JobPost: company (ref Organization), title, description, requiredSkills,
  level, modality (remote/hybrid/onsite), salaryRange, location, status
  (open/paused/closed), embedding (para el matching).
- Schema Application: job (ref JobPost), applicant (ref User), coverLetter, status
  (applied/reviewing/interview/rejected/hired), appliedAt.
ENDPOINTS:
- Empresas publican vacantes y ven candidatos con su perfil unificado adjunto
  automáticamente (cursos completados + skills verificadas + proyectos del showcase
  + certificados). Esa es la magia: el CV se arma solo con lo que el usuario hizo en KODIRA.
- Usuarios postulan y ven el estado de sus candidaturas.
- Matching IA: GET /jobs/recommended → sugiere vacantes según skills/roadmap del
  usuario (Atlas Vector Search comparando el embedding del perfil con los de las vacantes).
ENTREGA: archivos completos.
```

## A.3 Productos digitales, bootcamps y confianza

### 🤖 PROMPT F5-BE-4 — Productos digitales + bootcamps + office hours grupales

```
Actúa como Backend Senior NestJS + MongoDB.

1) Productos digitales: extiende el marketplace para vender descargables (plantillas,
   código, ebooks): compra inmediata, SIN escrow ni plazos (no hay trabajo a entregar),
   entrega por URL firmada de R2 con caducidad. Schema DigitalProduct + flujo de compra
   + control de descargas.

2) Bootcamps por cohorte: Schema Cohort (curso base + fechas de inicio/fin +
   instructores + cupo + alumnos inscritos + precio), con su propio Space de comunidad
   y calendario de sesiones en vivo. Inscripción con cupo limitado.

3) Office hours grupales: extiende mentoring para sesiones 1-a-muchos (un mentor,
   varios asistentes, cupo, precio por asiento, sala de video compartida).

ENTREGA: archivos completos.
```

### 🤖 PROMPT F5-BE-5 — Confianza y seguridad (trust & safety)

```
Actúa como Backend Senior NestJS especializado en trust & safety.

Crea el módulo `moderation`:
- Schema Report: reporter, targetType (message/user/gig/course), targetId, reason,
  status (open/reviewing/resolved/dismissed), resolution.
- Moderación con IA: clasifica mensajes/posts por spam y toxicidad con la API de
  moderación de OpenAI; lo claramente dañino se oculta automáticamente y lo dudoso
  va a una cola de revisión humana.
- KYC lite para vendedores con escrow: verificación de identidad básica (proveedor
  como Stripe Identity) ANTES de poder retirar dinero acumulado.
- Reglas anti-fraude en pagos: límites para cuentas nuevas, detección de patrones
  sospechosos (muchas compras/reembolsos), bloqueo temporal y alertas.
- Panel de administración para revisar reportes, gestionar la cola de moderación y
  resolver disputas del marketplace.

ENTREGA: módulo completo + panel de admin de moderación.
```

---

# PARTE B — FRONTEND + APP MÓVIL

## B.1 Pantallas web nuevas

Dashboard de empresa (equipos, asignación de cursos, progreso agregado), bolsa de trabajo (publicar/postular), tienda de productos digitales, página de cohorte/bootcamp y panel de moderación para admin. Todo reaprovechando tus componentes y tu cliente de API.

## B.2 App móvil (Expo) — por fin

Ahora sí. Reaprovecha `packages/api-client`, `packages/types` y `packages/hooks` que ya creaste: la app móvil consume la **misma API**. No rehagas la lógica, solo la UI nativa.

### 🤖 PROMPT F5-FE-1 — App móvil base (Expo)

```
Actúa como Mobile Engineer Senior (React Native + Expo).
Crea la app móvil de KODIRA en apps/mobile (Expo Router), reutilizando
packages/api-client, packages/types y packages/hooks del monorepo.
Pantallas esenciales:
- Tabs: Descubrir, Mi aprendizaje, Comunidad, Perfil.
- Detalle de curso + aula virtual con reproductor de video nativo (expo-av/Stream).
- Notificaciones push (Expo Push) conectadas a tu backend.
- Modo offline: descargar lecciones para verlas sin internet.
- Login con los mismos tokens JWT del backend (guardados de forma segura con
  expo-secure-store).
Entrega estructura + pantallas principales completas + pasos para construir y
publicar con EAS Build.
```

### 🤖 PROMPT F5-FE-2 — Dashboard de empresa

```
Actúa como Frontend Senior.
Crea el dashboard B2B en /org:
- Gestión de miembros (invitar por email, asignar roles, quitar).
- Asignación de cursos a miembros individuales o al equipo completo.
- Progreso agregado del equipo (gráficas con Recharts: % de completación, actividad,
  cursos más vistos).
- Gestión de seats y facturación (ver factura, cambiar plan, añadir asientos).
Entrega componentes completos.
```

---

# PARTE C — MARKETING (durante esta fase)

## C.1 Ventas B2B (otro juego)

Las empresas no se venden con anuncios, se venden con **trato directo**. El gancho es el ROI de capacitación: "tu equipo aprende más rápido y lo demuestras con datos". El cierre es por contacto humano y demo, no por un botón de "comprar". Empieza por tu red y por empresas que ya tengan empleados usando KODIRA a título individual (un buen indicio de demanda).

## C.2 "Conseguí trabajo con KODIRA"

Con la bolsa de trabajo activa, tu mejor marketing son los **casos de contratación**. Cada persona que consigue empleo gracias a la plataforma es una historia que vale más que cualquier anuncio. Sistematiza recoger esas historias (un email automático al marcar una candidatura como "hired") y publícalas.

## C.3 App en las stores = nuevo canal

El lanzamiento en App Store y Google Play es un evento de contenido en sí mismo. Y el ASO (optimización de la ficha en las stores) es un canal de adquisición orgánico nuevo que no tenías. Incentiva a tus usuarios web a instalar la app (notificaciones, contenido offline, racha en el bolsillo).

### 🤖 PROMPT F5-MKT-1 — Go-to-market B2B + lanzamiento de app

```
Actúa como Head of Growth.
Diseña: (1) un plan de ventas B2B para KODIRA (perfil de empresa objetivo, secuencia
de outreach en LinkedIn, guion de demo, estructura de propuesta y pricing por seats),
y (2) un plan de lanzamiento de la app móvil (ASO básico: título, keywords,
descripción y capturas; campaña de lanzamiento; incentivo para que los usuarios web
instalen la app). Entrega ambos planes accionables.
```

---

# 📋 CHECKLIST PARA CERRAR LA FASE 5

- [ ] Empresas pueden comprar seats, invitar miembros, asignar cursos y ver el progreso del equipo.
- [ ] Cobro recurrente por seats funcionando (y ajustándose al cambiar de plan).
- [ ] SSO empresarial (SAML/OIDC) funcionando.
- [ ] API pública de lectura documentada y con API keys + rate limiting.
- [ ] Bolsa de trabajo: empresas publican, usuarios postulan con perfil unificado automático, matching IA de vacantes.
- [ ] Marketplace de productos digitales operativo (entrega por URL firmada).
- [ ] Bootcamps por cohorte y office hours grupales funcionando.
- [ ] Moderación con IA + revisión humana, KYC lite antes de retirar dinero, y reglas anti-fraude activas.
- [ ] App móvil publicada en App Store y Google Play con lo esencial (login, cursos, aula, comunidad, push, offline).
- [ ] **Prueba final:** una empresa capacita a su equipo, un usuario consigue trabajo vía la bolsa, y todo el flujo clave funciona también desde el móvil.

---

# 🚀 DESPUÉS DE LA FASE 5

Ya no hay "fases", hay **mejora continua**: escuchar a los usuarios, mirar los datos de PostHog para decidir qué mejorar, optimizar costos de infraestructura (ahora sí tiene sentido evaluar mover el backend a un VPS con Docker si los números lo justifican), internacionalizar a más idiomas y mercados, y seguir afinando a KODI. El producto está completo; el trabajo ahora es hacerlo crecer y sostenerlo. Si llegaste hasta aquí tú solo, ya no eres "alguien que sabe front": eres quien construyó una plataforma entera de punta a punta.

---

_KODIRA Solutions — Fase 5 · Guía para ejecución en solitario_
