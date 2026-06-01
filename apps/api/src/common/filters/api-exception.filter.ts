import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';
import type { ApiErrorCode, ApiErrorResponse } from '@kodira/types';
import type { ValidationError } from 'class-validator';

/**
 * Filtro global para normalizar TODAS las respuestas de error.
 *
 * Nota: evitamos filtrar "a mano" por endpoint y mantenemos un shape único:
 * { statusCode, code, message, details? }
 */
@Catch()
export class ApiExceptionFilter extends BaseExceptionFilter {
  static validationException(errors: ValidationError[]): BadRequestException {
    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors.map((e) => ({
        property: e.property,
        constraints: e.constraints ?? undefined,
      })),
    } satisfies Omit<ApiErrorResponse, 'statusCode'>);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const normalized = this.normalizeException(exception);
    response.status(normalized.statusCode).json(normalized);
  }

  private normalizeException(exception: unknown): ApiErrorResponse {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      // Si ya viene en nuestro formato, lo respetamos.
      if (typeof res === 'object' && res !== null && 'code' in res) {
        const maybe = res as Partial<ApiErrorResponse> & {
          code?: ApiErrorCode;
          message?: string;
          details?: unknown;
        };
        const code = maybe.code ?? this.mapHttpStatusToCode(statusCode);
        const message =
          typeof maybe.message === 'string'
            ? maybe.message
            : exception.message || 'Request failed';
        return {
          statusCode,
          code,
          message,
          details: maybe.details,
        };
      }

      // Formato por defecto de Nest.
      const defaultMessage =
        typeof res === 'string'
          ? res
          : typeof (res as any)?.message === 'string'
            ? (res as any).message
            : exception.message || 'Request failed';

      return {
        statusCode,
        code: this.mapExceptionToCode(exception),
        message: defaultMessage,
        details:
          typeof res === 'object' && res !== null ? (res as any) : undefined,
      };
    }

    // Errores no controlados: evitamos filtrar stack al cliente.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };
  }

  private mapExceptionToCode(exception: HttpException): ApiErrorCode {
    if (exception instanceof BadRequestException) return 'VALIDATION_ERROR';
    if (exception instanceof UnauthorizedException) return 'UNAUTHORIZED';
    if (exception instanceof ForbiddenException) return 'FORBIDDEN';
    if (exception instanceof NotFoundException) return 'NOT_FOUND';
    if (exception instanceof ConflictException) return 'CONFLICT';
    if (exception instanceof ThrottlerException) return 'RATE_LIMITED';
    return this.mapHttpStatusToCode(exception.getStatus());
  }

  private mapHttpStatusToCode(statusCode: number): ApiErrorCode {
    switch (statusCode) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}

