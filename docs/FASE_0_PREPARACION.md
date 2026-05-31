# FASE 0 — Preparación (antes de escribir código)

### KODIRA Solutions · Guía paso a paso para hacerlo tú solo

### Duración estimada: 3 a 7 días

> **Lee esto primero.** Estas guías están escritas para que las sigas aunque nunca hayas montado un backend desde cero. Donde algo es "de frontend", iré más rápido porque eso ya lo dominas. Donde es backend, infraestructura o marketing, lo explico con calma y desde los cimientos.
>
> **Regla de oro:** no te saltes la Fase 0. Es aburrida pero te ahorra semanas de caos después. Cada hora que inviertas aquí te ahorra tres más adelante.

---

# 🎯 OBJETIVO DE ESTA FASE

Dejar **todo el terreno preparado** para empezar a construir: cuentas creadas, herramientas instaladas, repositorios listos, conceptos entendidos y una idea clara de qué vas a hacer. Al terminar no habrás programado funcionalidades todavía, pero podrás arrancar la Fase 1 sin frenos ni sorpresas.

# ✅ QUÉ TENDRÁS AL TERMINAR

- Todas las cuentas de servicios creadas y sus credenciales guardadas a salvo.
- Las herramientas instaladas y verificadas en tu computadora.
- Dos repositorios en GitHub con su `.gitignore` y su flujo de trabajo claro.
- Un proyecto NestJS que arranca y responde en `/health`.
- Un proyecto Next.js que arranca y se ve en el navegador.
- El frontend leyendo datos reales del backend (el momento clave de la fase).
- El branding básico definido y las redes reservadas.
- Una landing de lista de espera capturando emails.

---

# 🧠 PARTE 0 — CONCEPTOS QUE NECESITAS ENTENDER ANTES DE EMPEZAR

Como vienes de frontend, hay piezas del backend que probablemente nunca tocaste. Te las explico en cristiano para que sepas qué estás montando y no copies prompts a ciegas.

**Qué es un backend, en realidad.** Tu frontend (Next.js) es lo que el usuario ve y toca en el navegador. Pero el navegador no puede guardar datos de forma segura ni compartirlos entre usuarios: si guardaras la contraseña de alguien en el navegador, cualquiera la vería. El backend es un programa que vive en un servidor (una computadora encendida 24/7 en internet), guarda los datos en una base de datos, decide quién puede ver qué, y le responde al frontend cuando este le pide algo. La conversación entre ambos se llama **API**.

**Qué es una API REST.** Es el "menú" de cosas que tu backend sabe hacer, expuestas como direcciones web. Por ejemplo `GET /api/v1/courses` significa "dame la lista de cursos" y `POST /api/v1/courses` significa "crea un curso nuevo". `GET` es para leer, `POST` para crear, `PATCH` para modificar y `DELETE` para borrar. Tu frontend hará estas llamadas y pintará en pantalla lo que reciba.

**Qué es NestJS y por qué lo elegimos.** Node.js te deja escribir un backend en JavaScript/TypeScript, pero por sí solo es un lienzo en blanco: tú decides toda la estructura, y eso, cuando no tienes experiencia, termina en caos. NestJS es un marco (framework) que te impone una estructura ordenada y modular: cada parte de tu app (usuarios, cursos, pagos) vive en su propio "módulo" con sus controladores y servicios. Como ya sabes TypeScript del frontend, te vas a sentir en casa. Piénsalo como el orden que daba Odoo, pero en tu idioma y sin la rigidez.

**Qué es MongoDB y en qué se diferencia de lo que conoces.** Una base de datos guarda tus datos de forma permanente. MongoDB es del tipo "NoSQL", lo que significa que no usa tablas con filas y columnas (como Excel o SQL), sino **colecciones** (como carpetas) que contienen **documentos** (objetos parecidos a JSON de JavaScript). Si un usuario en tu código es `{ nombre: "Ana", roles: ["alumno", "instructor"] }`, en MongoDB se guarda casi igual. Eso lo hace muy natural para alguien que viene de JS.

**Qué es Mongoose.** Es la librería que usaremos para hablar con MongoDB desde NestJS. Te deja definir "schemas" (la forma que debe tener cada documento) y te da métodos cómodos para buscar, crear y actualizar. Sin él tendrías que escribir consultas crudas y validar todo a mano.

**Qué es Redis y por qué lo necesitas.** Redis es una base de datos súper rápida que vive en memoria. La usamos para dos cosas: guardar temporalmente datos que se piden mucho (caché, para no machacar MongoDB) y para las **colas de trabajos** (BullMQ). Una cola es una lista de tareas pesadas que no quieres hacer mientras el usuario espera (procesar un video, enviar 500 emails, generar un certificado). Las metes en la cola y un proceso aparte las va haciendo en segundo plano.

**Qué son las variables de entorno.** Tu código necesita secretos (la contraseña de la base de datos, la llave de Stripe, la de OpenAI). Esos secretos **jamás** se escriben dentro del código, porque el código se sube a GitHub y los verían todos. En su lugar van en un archivo `.env` que nunca se sube, y el código los lee desde ahí. El archivo `.env.example` es una copia sin valores reales que sí se sube, para que tú (o tu yo del futuro) sepan qué variables hacen falta.

**Cómo encaja todo (el mapa mental).** El navegador del usuario corre tu **Next.js**. Next.js llama por HTTP a tu **API NestJS**. NestJS lee y escribe datos en **MongoDB Atlas**, usa **Redis** para caché y colas, guarda archivos y video en **Cloudflare R2/Stream**, cobra con **Stripe/Mercado Pago**, manda emails con **Resend** y consulta a **OpenAI** cuando hace falta IA. Cada vez que algo falla, **Sentry** te avisa; y todo lo que hacen los usuarios lo registras en **PostHog** para entender qué funciona.

> No memorices esto. Vuelve a esta sección cuando una pieza te confunda. Para la Fase 1 ya te sonará familiar.

---

# PARTE A — INFRAESTRUCTURA Y CUENTAS (lo nuevo para ti)

## A.1 Instala las herramientas base

En tu computadora necesitas:

1. **Node.js** (versión 20 LTS o superior). Es el motor que ejecuta tanto Next.js como NestJS. Descárgalo de nodejs.org y elige la versión "LTS".
2. **pnpm** (gestor de paquetes, más rápido y ordenado que npm). Instálalo con `npm install -g pnpm`.
3. **Git** (control de versiones, para guardar el historial de tu código). Descárgalo de git-scm.com.
4. **Visual Studio Code** (tu editor).
5. **MongoDB Compass** (programa visual para ver tu base de datos, como un "Excel" para MongoDB).
6. Una herramienta de IA para programar: **Cursor** o **Claude Code**. Aquí pegarás los prompts de cada fase.

**Verifica que todo quedó bien.** Abre una terminal y escribe `node -v`, `pnpm -v` y `git --version`. Si los tres responden con números de versión, vas bien. Si alguno dice "command not found", reinstálalo y reinicia la terminal.

> **Error común:** instalaste Node pero la terminal sigue diciendo que no existe. Casi siempre se arregla cerrando y abriendo la terminal de nuevo (o reiniciando VS Code) para que cargue el PATH actualizado.

## A.2 Configura Git por primera vez (solo se hace una vez)

Para que tus guardados de código lleven tu nombre, ejecuta una sola vez:

```
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

**Concepto rápido de Git:** cada vez que terminas algo que funciona, haces un "commit" (una foto del estado de tu código con un mensaje que describe el cambio). Esos commits se suben a GitHub con "push". Si algo se rompe, puedes volver a un commit anterior. Trabajarás casi siempre en una rama llamada `main`; más adelante usarás ramas separadas para experimentar.

## A.3 Crea las cuentas de servicios

Crea cuenta (gratis para empezar) en cada uno. Anota usuario y contraseña en un **gestor de contraseñas** (Bitwarden, 1Password o el de tu navegador), **nunca en un archivo de texto suelto ni dentro del código**.

| Servicio                 | Para qué                               | Plan inicial                       |
| ------------------------ | -------------------------------------- | ---------------------------------- |
| **GitHub**               | Guardar tu código                      | Gratis                             |
| **MongoDB Atlas**        | Tu base de datos                       | Gratis (M0)                        |
| **Upstash**              | Redis (caché y colas)                  | Gratis                             |
| **Vercel**               | Publicar la web                        | Gratis                             |
| **Railway** o **Render** | Publicar el backend                    | ~$5/mes                            |
| **Cloudflare**           | Dominio, archivos (R2), video (Stream) | Gratis al inicio                   |
| **Stripe**               | Cobrar (global/España)                 | Gratis (comisión por venta)        |
| **Mercado Pago**         | Cobrar (LATAM)                         | Gratis (comisión por venta)        |
| **OpenAI**               | El cerebro de KODI                     | De pago por uso (~$5 para empezar) |
| **Resend**               | Enviar emails                          | Gratis (10k/mes)                   |
| **PostHog**              | Saber qué hacen los usuarios           | Gratis                             |
| **Sentry**               | Avisarte de errores                    | Gratis                             |

> **Consejo de seguridad:** activa la verificación en dos pasos (2FA) al menos en GitHub, Stripe, Mercado Pago y tu correo. Son las cuentas que, si te las roban, te hacen más daño.

## A.4 Configura MongoDB Atlas (tu base de datos) — paso a paso

Esta es la pieza más nueva para ti, así que vamos con calma:

1. Entra a Atlas y crea un **Cluster** (un servidor de base de datos). Elige el plan **M0 (gratis)** y la región más cercana a tus usuarios. Ponle un nombre como `kodira-cluster`.
2. En **Database Access**, crea un **usuario de base de datos** con su contraseña. Apúntala en tu gestor. Este usuario no es un usuario de tu app: es la credencial con la que tu backend se conecta a la base.
3. En **Network Access**, añade la IP `0.0.0.0/0` por ahora (significa "acepta conexiones desde cualquier lugar"). Es cómodo para desarrollar; en producción lo restringirás a la IP de tu servidor.
4. Pulsa **Connect → Drivers** y copia la **cadena de conexión** (`MONGODB_URI`). Se ve así: `mongodb+srv://usuario:password@cluster.mongodb.net/kodira`. Sustituye `password` por la contraseña real y añade el nombre de la base (`kodira`) al final antes de los parámetros. La usarás en tu backend.
5. Abre **MongoDB Compass**, pega esa misma cadena y conéctate. Ahora puedes ver tu base de datos visualmente: cuando tu backend cree usuarios o cursos, aparecerán aquí.

**Verifica:** en Compass deberías poder conectarte sin error. Aún no habrá colecciones (es normal, no has creado nada todavía).

> **Error común:** la conexión falla con "authentication failed". Casi siempre es porque dejaste la palabra `<password>` literal en la cadena en vez de poner tu contraseña real, o porque la contraseña tiene caracteres especiales (`@`, `#`, `/`) que hay que "escapar". Evítatelo usando una contraseña solo con letras y números.

## A.5 Configura Upstash (Redis) y el resto

En **Upstash** crea una base Redis gratuita y copia su `REDIS_URL`. Guárdala. En **Cloudflare**, **OpenAI**, **Resend**, etc., ve creando las llaves de API conforme las vayas necesitando en cada fase; no hace falta tenerlas todas hoy, pero sí dejar las cuentas abiertas.

## A.6 Compra el dominio

En Cloudflare (o donde prefieras) registra `kodira.solutions` o el dominio que elijas. Tenerlo desde el inicio te evita reconfigurar todo después y te da un correo profesional.

---

# PARTE B — REPOSITORIOS Y PROYECTOS BASE

## B.1 Crea los repositorios en GitHub

Crea **dos** repositorios privados:

- `kodira-backend` (tu API NestJS).
- `kodira-frontend` (tu web Next.js, y más adelante la app móvil).

Al crearlos, marca la opción de añadir un `.gitignore` para Node. Ese archivo le dice a Git qué cosas **no** subir, principalmente la carpeta `node_modules` (pesadísima y reconstruible) y tu archivo `.env` (¡tus secretos!). Confirma que `.env` está dentro de ese `.gitignore` antes de subir nada.

> **Error que cuesta caro:** subir el `.env` a GitHub por accidente. Si llega a pasar, considera esas llaves comprometidas: rótalas (genera nuevas) en cada servicio. Por eso revisas el `.gitignore` desde el día uno.

## B.2 Crea el proyecto del backend (NestJS)

Esto es nuevo para ti. Usa este prompt en tu herramienta de IA:

### 🤖 PROMPT F0-BACKEND-1 — Esqueleto del backend

```
Actúa como Arquitecto Backend Senior especializado en NestJS + MongoDB.

Crea el esqueleto inicial del backend de KODIRA con NestJS y TypeScript.

REQUISITOS:
- NestJS última versión, TypeScript en modo estricto.
- Conexión a MongoDB con @nestjs/mongoose (lee MONGODB_URI de variables de entorno).
- Conexión a Redis con ioredis (lee REDIS_URL).
- Configuración con @nestjs/config (carga el archivo .env, valida que existan
  las variables obligatorias al arrancar y falla con un mensaje claro si faltan).
- Validación global con ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
  + class-validator y class-transformer.
- Filtro global de excepciones que devuelva errores en formato JSON consistente
  { statusCode, message, error, timestamp, path }.
- Documentación Swagger en /docs.
- CORS configurado leyendo FRONTEND_URL.
- helmet para cabeceras de seguridad y rate limiting básico con @nestjs/throttler.
- Prefijo global de la API: /api/v1.
- Un endpoint de salud GET /api/v1/health que verifique conexión a MongoDB y Redis
  y responda { status: "ok", db: "up", redis: "up", uptime }.
- Logger estructurado (pino) con niveles configurables por entorno.
- Estructura de carpetas: src/common (guards, filters, interceptors, decorators),
  src/config, src/modules.
- Archivo .env.example con TODAS las variables y un comentario por cada una.
- README con instrucciones para correrlo en local con pnpm.
- Scripts en package.json: start:dev, build, start:prod, lint, test.

ENTREGA: todos los archivos con su contenido completo y los comandos exactos
para instalarlo y arrancarlo con pnpm. Explícame en lenguaje sencillo qué hace
cada carpeta.
```

Cuando lo tengas, crea tu archivo `.env` (copia de `.env.example`) y rellena `MONGODB_URI`, `REDIS_URL` y `FRONTEND_URL=http://localhost:3000`. Arráncalo con `pnpm install` y luego `pnpm start:dev`, y entra a `http://localhost:8000/api/v1/health`. Si ves `{ "status": "ok", "db": "up", "redis": "up" }`, **acabas de tener tu primer backend funcionando y conectado a tu base de datos real**.

> **Errores comunes aquí:** (1) `MONGODB_URI` mal copiada → revisa que tenga tu contraseña y el nombre de la base. (2) El puerto 8000 ocupado → cambia `PORT` en el `.env`. (3) "Cannot connect to Redis" → revisa la `REDIS_URL` de Upstash.

Haz tu primer commit: `git add . && git commit -m "Esqueleto backend NestJS funcionando" && git push`.

## B.3 Crea el proyecto del frontend (Next.js)

Esto ya lo dominas, así que rápido: monta el monorepo con Turborepo tal como está en `KODIRA_FRONTEND.md`.

### 🤖 PROMPT F0-FRONT-1 — Monorepo frontend

```
Actúa como Arquitecto Frontend Senior especializado en Turborepo + Next.js 14.

Crea el monorepo de KODIRA con:
- apps/web → Next.js 14 (App Router, TypeScript estricto, ESLint + Prettier)
- packages/ui → componentes compartidos (Tailwind + Radix + cva)
- packages/api-client → cliente HTTP tipado (axios) que apunta a NEXT_PUBLIC_API_URL,
  con interceptor que añade el token de auth y maneja refresh de token y errores 401.
- packages/types → tipos TypeScript compartidos con el backend (User, Course, etc.)
- packages/hooks → hooks con React Query (TanStack Query) para cada recurso.

INCLUYE:
- turbo.json con pipelines build/dev/lint/typecheck.
- Tailwind config compartido con los design tokens de KODIRA
  (fondo #0B0B0F, azul #3B82F6, violeta #6366F1; fuentes Satoshi display + Inter body).
- Modo oscuro por defecto.
- .env.example con NEXT_PUBLIC_API_URL.
- Una página de inicio mínima que llame al endpoint /api/v1/health del backend
  y muestre en pantalla si responde "ok" (verde) o no (rojo).
- README de setup.

ENTREGA: todos los archivos con su contenido.
```

Arráncalo (`pnpm dev`) y comprueba que la web carga en `http://localhost:3000`.

## B.4 Conecta los dos proyectos (el momento clave)

Con el backend corriendo en el puerto 8000 y el frontend en el 3000, tu página de inicio debe mostrar en verde que el backend responde "ok". Si lo ves, **front y back ya se hablan**. Este es el hito más importante de la Fase 0: a partir de aquí, todo lo demás es ir añadiendo módulos a una base que ya funciona.

> **Error común:** la web no logra llamar al backend y la consola del navegador muestra un error de **CORS**. Significa que tu backend no está autorizando al frontend. Revisa que `FRONTEND_URL=http://localhost:3000` esté en el `.env` del backend y que el CORS lo esté leyendo.

---

# PARTE C — MARKETING (prepara el terreno en paralelo)

No necesitas el producto terminado para empezar a construir audiencia. De hecho, empezar ahora es una ventaja enorme: cuando lances, ya tendrás a quién venderle. Mientras programas, ve haciendo esto.

## C.1 Define el branding (medio día)

Usando `KODIRA_MARKETING.md` como base, deja fijos: el **logo** (puedes generarlo con IA y refinarlo), los **colores** (fondo oscuro `#0B0B0F`, azul `#3B82F6`, violeta `#6366F1`), las **tipografías** (Satoshi para títulos, Inter para texto) y el **tono de voz** (directo, concreto, técnico-amigable, sin clichés motivacionales). Anota todo en un documento de una página: será tu "biblia de marca" y evitará que cada pieza se vea distinta.

## C.2 Reserva los nombres en redes

Crea (aunque vacías) las cuentas de **Instagram, TikTok, LinkedIn, X/Twitter y YouTube** con el mismo nombre de usuario. Que nadie te lo quite. Pon el mismo logo y una bio corta de una línea en todas.

## C.3 Crea una landing de "lista de espera"

Antes de tener producto, una página simple que diga qué es KODIRA y capture emails. Sirve para validar interés y para tener a quién avisar el día del lanzamiento. Conéctala a Resend o a una herramienta de newsletter para guardar los correos. Pon un contador de "X personas ya en la lista" para crear prueba social.

### 🤖 PROMPT F0-MKT-1 — Copy de la lista de espera

```
Actúa como Copywriter Senior de SaaS educativo.

Escribe el copy de una landing de lista de espera para KODIRA Solutions:
plataforma tech todo-en-uno (cursos + asesorías 1:1 + marketplace de servicios
+ comunidad + IA "KODI"). Audiencia: desarrolladores hispanohablantes 20-40 años
de España y LATAM. Tono: directo, concreto, sin clichés (estilo Stripe/Linear).

Entrega:
- Headline (máx 8 palabras).
- Subheadline (2 líneas).
- 3 bullets de valor centrados en beneficios, no en features.
- Texto del botón de "unirse a la lista".
- Mensaje de confirmación post-registro.
- 3 variantes del headline para hacer pruebas A/B.
- Una sección de "preguntas frecuentes" con 4 preguntas y respuestas.
```

## C.4 Empieza a publicar (build in public)

Documenta que estás construyendo KODIRA. Un post a la semana mostrando avances (una captura del backend funcionando, una decisión de diseño, un problema que resolviste) genera audiencia antes del lanzamiento, es gratis y te obliga a mantener el ritmo. La gente se engancha a las historias en marcha, no a los productos terminados.

---

# 📋 CHECKLIST PARA CERRAR LA FASE 0

- [ ] Entiendes a grandes rasgos qué es el backend, la API, MongoDB, Redis y las variables de entorno.
- [ ] Node, pnpm, Git, VS Code, Compass y Cursor/Claude Code instalados y verificados.
- [ ] Git configurado con tu nombre y correo.
- [ ] Todas las cuentas de servicios creadas, con 2FA en las críticas y credenciales guardadas a salvo.
- [ ] Cluster de MongoDB Atlas creado y visible en Compass.
- [ ] Redis (Upstash) creado y su URL guardada.
- [ ] Dominio comprado.
- [ ] Repos `kodira-backend` y `kodira-frontend` en GitHub, con `.env` dentro del `.gitignore`.
- [ ] Backend NestJS arranca y `/api/v1/health` responde "ok" con db y redis "up".
- [ ] Frontend Next.js arranca y se ve en el navegador.
- [ ] El frontend muestra en verde que el backend responde.
- [ ] Primer commit subido a GitHub en ambos repos.
- [ ] Branding definido (logo, colores, tipografías, tono) en una página.
- [ ] Cuentas de redes reservadas + landing de lista de espera publicada y capturando emails.

Cuando todo esté marcado, pasa a la **FASE 1**.

---

_KODIRA Solutions — Fase 0 · Guía para ejecución en solitario_
