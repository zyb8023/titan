import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { JwtUser } from '../interfaces/jwt-user.interface';
import type { RequestWithUser } from '../interfaces/request-user.interface';

export const CurrentUser = createParamDecorator(
  (property: keyof JwtUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!property) {
      return request.user;
    }

    return request.user?.[property];
  },
);
