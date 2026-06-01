import type { ApiErrorResponse } from '@kodira/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getApiErrorResponse(error: unknown): ApiErrorResponse | undefined {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  const data = response.data;
  if (!isRecord(data)) return undefined;
  if (typeof data.statusCode !== 'number') return undefined;
  if (typeof data.code !== 'string') return undefined;
  if (typeof data.message !== 'string') return undefined;
  return data as ApiErrorResponse;
}

export function getApiStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  const status = response.status;
  return typeof status === 'number' ? status : undefined;
}

export function toAuthErrorMessage(error: unknown): string {
  const apiError = getApiErrorResponse(error);
  if (!apiError) return 'No se pudo completar la acción. Intenta de nuevo.';

  if (apiError.code === 'UNAUTHORIZED') return 'Email o contraseña incorrectos.';
  if (apiError.code === 'RATE_LIMITED')
    return 'Demasiados intentos. Espera un momento y vuelve a intentar.';

  if (apiError.code === 'CONFLICT') {
    const details = apiError.details as { key?: string } | undefined;
    if (details?.key === 'email') return 'Ese email ya está registrado.';
    if (details?.key === 'username') return 'Ese username ya está en uso.';
    return 'Ese dato ya está en uso.';
  }

  if (apiError.code === 'VALIDATION_ERROR') return 'Revisa los campos e intenta de nuevo.';

  return apiError.message || 'Ocurrió un error. Intenta de nuevo.';
}

