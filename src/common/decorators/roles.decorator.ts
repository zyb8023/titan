import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../constants/auth.constants';
import type { UserRole } from '../enums/user-role.enum';

export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
