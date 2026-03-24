import { ExecutionContext, Injectable, type CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { AUTH_STRATEGY_JWT, IS_PUBLIC_KEY } from '../constants/auth.constants';
import { AppErrorCode } from '../exceptions/error-code.enum';
import { AuthenticationException } from '../exceptions/authentication.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard(AUTH_STRATEGY_JWT) implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): ReturnType<CanActivate['canActivate']> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context) as ReturnType<CanActivate['canActivate']>;
  }

  handleRequest<TUser = unknown>(error: unknown, user: TUser, info?: { message?: string }): TUser {
    if (error || !user) {
      throw (
        error ??
        new AuthenticationException(info?.message ?? '未授权访问', {
          errorCode: AppErrorCode.UNAUTHORIZED,
        })
      );
    }

    return user;
  }
}
