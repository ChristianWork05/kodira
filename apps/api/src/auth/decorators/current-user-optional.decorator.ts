import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserDocument } from '../../users/schemas/user.schema';

export const CurrentUserOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument | null => {
    const req = ctx.switchToHttp().getRequest();
    return (req.user as UserDocument | undefined) ?? null;
  },
);

