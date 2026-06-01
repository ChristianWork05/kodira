export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  /**
   * Detalles opcionales (ej: errores de validación).
   * Se mantiene como unknown para no forzar un shape rígido aún.
   */
  details?: unknown;
}

