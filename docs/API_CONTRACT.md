# Contrato de API — KODIRA

Fuente de verdad de los endpoints. Lo mantiene el Backend. El Frontend solo lo lee.

## Convenciones

- Prefijo global: `/api/v1`
- Swagger UI: `/api/v1/docs` (openapi: `docs/openapi.json`)

## Errores

Todos los errores siguen un shape consistente:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

## Health

### GET `/api/v1/health`

- **Auth**: pública
- **Respuesta 200**

```json
{
  "status": "ok",
  "db": "up",
  "redis": "up"
}
```

- **Notas**
  - `status` es `ok` cuando `db` y `redis` están `up`; si alguno está `down`, `status` es `degraded`.

## Auth

### POST `/api/v1/auth/register`

- **Auth**: pública
- **Body**

```json
{
  "email": "user@mail.com",
  "password": "password1",
  "username": "kodi_dev",
  "fullName": "Kodi Dev",
  "referralCode": null
}
```

- **Respuesta 201**

```json
{
  "tokens": {
    "tokenType": "Bearer",
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "accessTokenExpiresInSeconds": 900
  },
  "user": {
    "id": "665a...",
    "email": "user@mail.com",
    "username": "kodi_dev",
    "fullName": "Kodi Dev",
    "avatarUrl": null,
    "bio": null,
    "roles": ["student"],
    "emailVerified": false,
    "preferredLanguage": null,
    "timezone": null,
    "country": null,
    "xp": 0,
    "currentStreak": 0,
    "referralCode": "AB12CD34",
    "referralCredits": 0,
    "isActive": true,
    "lastLoginAt": "2026-05-31T00:00:00.000Z",
    "createdAt": "2026-05-31T00:00:00.000Z",
    "updatedAt": "2026-05-31T00:00:00.000Z"
  }
}
```

### POST `/api/v1/auth/login`

- **Auth**: pública
- **Body**

```json
{
  "email": "user@mail.com",
  "password": "password1"
}
```

- **Respuesta 200**: igual a `/auth/register` (mismo shape).

### POST `/api/v1/auth/refresh`

- **Auth**: pública
- **Body**

```json
{
  "refreshToken": "jwt..."
}
```

- **Respuesta 200**

```json
{
  "tokenType": "Bearer",
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "accessTokenExpiresInSeconds": 900
}
```

### POST `/api/v1/auth/logout`

- **Auth**: Bearer (JWT access token)
- **Respuesta 200**

```json
{ "ok": true }
```

### POST `/api/v1/auth/forgot-password`

- **Auth**: pública
- **Body**

```json
{ "email": "user@mail.com" }
```

- **Respuesta 200**

```json
{ "ok": true }
```

- **Notas**
  - Responde siempre `ok: true` incluso si el email no existe (anti enumeración).
  - Si Resend no está configurado, el email se omite (no-op) pero el endpoint funciona.

### POST `/api/v1/auth/reset-password`

- **Auth**: pública
- **Body**

```json
{
  "token": "opaque-token",
  "newPassword": "newpass1"
}
```

- **Respuesta 200**

```json
{ "ok": true }
```

### POST `/api/v1/auth/verify-email`

- **Auth**: pública
- **Body**

```json
{ "token": "opaque-token" }
```

- **Respuesta 200**

```json
{ "ok": true }
```

## Users

### GET `/api/v1/users/me`

- **Auth**: Bearer (JWT access token)
- **Respuesta 200**: `UserMe` (mismo shape que en `/auth/register` → `user`)

### PUT `/api/v1/users/me`

- **Auth**: Bearer (JWT access token)
- **Body**

```json
{
  "username": "kodi_dev2",
  "fullName": "Kodi Dev",
  "avatarUrl": null,
  "bio": "Hola",
  "preferredLanguage": "es",
  "timezone": "America/Caracas",
  "country": "VE"
}
```

- **Respuesta 200**: `UserMe`

### GET `/api/v1/users/:username`

- **Auth**: pública
- **Respuesta 200** (perfil público)

```json
{
  "id": "665a...",
  "username": "kodi_dev",
  "fullName": "Kodi Dev",
  "avatarUrl": null,
  "bio": null,
  "roles": ["student"],
  "xp": 0,
  "currentStreak": 0,
  "createdAt": "2026-05-31T00:00:00.000Z"
}
```

## Education

## Courses

### GET `/api/v1/courses`

- **Auth**: pública
- **Query** (opcionales)
  - `page` (default 1)
  - `limit` (default 20, max 50)
  - `categorySlug`
  - `level` (`beginner|intermediate|advanced`)
  - `q` (búsqueda de texto)
  - `isFree` (`true|false`)
  - `minPrice`, `maxPrice`
  - `sort` (`popular|new`)
- **Respuesta 200**

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 1
}
```

### GET `/api/v1/courses/:slug`

- **Auth**: pública (Bearer opcional)
- **Respuesta 200**: `Course`
- **Notas**
  - `solutionCode` nunca se expone en este endpoint.
  - Si el usuario no está inscrito, las lecciones que no sean `isFreePreview` vienen con `content`/`videoId` en `null`.

### POST `/api/v1/courses`

- **Auth**: Bearer + rol `instructor`
- **Crea** el curso en `draft` (slug autogenerado)
- **Respuesta 201**: `Course` (vista instructor)

### PUT `/api/v1/courses/:id`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 200**: `Course` (vista instructor)

### POST `/api/v1/courses/:id/sections`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 201**: `Course` (vista instructor)

### PUT `/api/v1/courses/:id/sections/:sectionId`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 200**: `Course` (vista instructor)

### DELETE `/api/v1/courses/:id/sections/:sectionId`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 200**

```json
{ "ok": true }
```

### POST `/api/v1/courses/:id/sections/:sectionId/lessons`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 201**: `Course` (vista instructor)

### PUT `/api/v1/courses/:id/sections/:sectionId/lessons/:lessonId`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 200**: `Course` (vista instructor)

### DELETE `/api/v1/courses/:id/sections/:sectionId/lessons/:lessonId`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 200**

```json
{ "ok": true }
```

### POST `/api/v1/courses/:id/publish`

- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Valida**
  - `thumbnailUrl` presente
  - ≥1 sección con ≥1 lección
- **Respuesta 200**: `Course` (ya en `published`)

### GET `/api/v1/courses/categories`

- **Auth**: pública
- **Respuesta 200**: `Category[]`

## Education — Enrollments & Progress

### POST `/api/v1/courses/:id/enroll`

- **Auth**: Bearer (alumno)
- **Regla**
  - Si el curso es gratis → inscribe
  - Si el curso es de pago → rechaza y pide pasar por checkout
- **Respuesta 201**: `Enrollment`

### GET `/api/v1/me/courses`

- **Auth**: Bearer
- **Respuesta 200**: lista paginada de mis cursos con progreso y `lastLessonId`

### GET `/api/v1/me/instructor/courses`

- **Auth**: Bearer + rol `instructor`
- **Query**: `page`, `limit`, `state?`
- **Respuesta 200**: lista paginada de mis cursos como instructor (incluye drafts) con su temario (secciones y lecciones con `id/title`)

### GET `/api/v1/courses/:id/lessons`

- **Auth**: Bearer
- **Regla**
  - Si estoy inscrito → devuelve el contenido completo (sin `solutionCode`) y `lessonProgress` por lección
  - Si no estoy inscrito → solo lecciones `isFreePreview` traen `content/videoId`; el resto viene null

### POST `/api/v1/lessons/:id/progress`

- **Auth**: Bearer
- **Body**

```json
{ "watchPercentage": 25, "lastPositionSeconds": 90 }
```

- **Respuesta 200**

```json
{ "ok": true }
```

### POST `/api/v1/lessons/:id/complete`

- **Auth**: Bearer
- **Respuesta 200**

```json
{ "ok": true, "progressPercentage": 100, "isCompleted": true }
```

## Storage

### POST `/api/v1/storage/upload-url`

- **Auth**: Bearer + rol `instructor` (y debe ser dueño del curso)
- **Body**

```json
{
  "kind": "video",
  "filename": "intro.mp4",
  "contentType": "video/mp4",
  "sizeBytes": 123456,
  "courseId": "665a...",
  "lessonId": "665b..."
}
```

- **Validaciones**
  - `kind`: `video|image|attachment`
  - `video` → `video/mp4|video/webm`, max 2 GB
  - `image` → `image/png|image/jpeg|image/webp`, max 5 MB
  - `attachment` → `application/pdf|application/zip|application/x-zip-compressed`, max 50 MB
  - Si viene `lessonId`, debe pertenecer a ese `courseId`
- **Respuesta 200**

```json
{
  "uploadUrl": "https://... (PUT prefirmado, caduca ~10 min)",
  "publicUrl": "https://.../courses/{courseId}/{kind}/{uuid}.{ext}",
  "key": "courses/{courseId}/{kind}/{uuid}.{ext}"
}
```
