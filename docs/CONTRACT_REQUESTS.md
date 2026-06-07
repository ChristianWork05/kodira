# Peticiones de contrato (Frontend → Backend)

El Frontend anota aquí lo que necesita y no existe aún. El Backend lo resuelve y lo marca como HECHO.

## 1) Listar cursos del instructor (para Studio)

- **Necesidad**: Studio debe listar los cursos del instructor autenticado (incluye drafts) y mostrar su temario (secciones + lecciones) para subir video/adjuntos sin depender de pedir un slug manual.
- **Estado**: HECHA
- **Endpoint**: `GET /api/v1/me/instructor/courses`
- **Query**: `{ page?: number; limit?: number; state?: draft|review|published|archived }`
- **Respuesta 200**: `ListInstructorCoursesResponse` (items con `sections.lessons` en forma mínima para Studio)
- **Motivo**: habilitar el flujo "instructor entra a Studio → elige curso → sube video por lección".

## 2) Leer progreso por lección en el Aula (reanudar y marcar completadas)

- **Necesidad**: el aula `/courses/[slug]/learn` debe reanudar desde `lastPositionSeconds` al cargar una lección y mostrar completadas desde backend (no localStorage).
- **Estado**: HECHA (Propuesta A)
- **Entrega**: `GET /api/v1/courses/:id/lessons` para inscritos incluye `lessonProgress` por lección:
  - `isCompleted: boolean`
  - `watchPercentage: number`
  - `lastPositionSeconds: number`
- **Motivo**: "continuar donde quedé" y estado completado deben ser consistentes en multi-dispositivo.

## 3) Leer detalle de un curso del instructor (vista completa, sin mutación)

- **Necesidad**: En Studio, al seleccionar un curso existente, el Front necesita el `Course` completo (descripción, precio, portada, secciones/lecciones completas con `videoUrl`, `videoDuration`, `resourceUrls`, etc.) para editar datos y gestionar el temario sin hacks.
- **Estado**: PENDIENTE
- **Endpoint propuesto**: `GET /api/v1/me/instructor/courses/:id`
- **Auth**: Bearer + rol `instructor` + dueño del curso
- **Respuesta 200**: `Course`
- **Motivo**: Evitar usar `PUT /api/v1/courses/:id` con body `{}` como “fetch” (semánticamente incorrecto).

## 4) Listar reseñas públicas de una oferta (Marketplace)

- **Necesidad**: En la ficha `/marketplace/[slug]` hay que mostrar reseñas reales, no hardcodeadas.
- **Estado**: PENDIENTE
- **Endpoint propuesto**: `GET /api/v1/offerings/:slug/reviews`
- **Auth**: pública
- **Respuesta 200**: `{ items: Review[]; page: number; limit: number; total: number; totalPages: number }`
- **Motivo**: Mostrar prueba social sin inventar datos y permitir paginación.
