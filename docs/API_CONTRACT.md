# Contrato de API — KODIRA

Fuente de verdad de los endpoints. Lo mantiene el Backend. El Frontend solo lo lee.

## Convenciones

- Prefijo global: `/api/v1`
- Swagger UI: `/api/v1/docs` (openapi: `docs/openapi.json`)

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
