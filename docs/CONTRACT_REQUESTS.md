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
