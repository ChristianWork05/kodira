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

- **Respuesta 200**

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

- **Respuesta 200**: igual a `/auth/register`.

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
