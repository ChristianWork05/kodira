import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserDocument } from '../../users/schemas/user.schema';

/**
 * Obtiene el usuario inyectado por JwtStrategy.validate()
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as UserDocument;
  },
);

