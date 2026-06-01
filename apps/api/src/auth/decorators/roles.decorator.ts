import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@kodira/types';

export const ROLES_KEY = 'roles';

/**
 * Ej:
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

