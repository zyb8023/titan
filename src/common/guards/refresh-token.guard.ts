import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AUTH_STRATEGY_REFRESH } from '../constants/auth.constants';
import { AppErrorCode } from '../exceptions/error-code.enum';
import { AuthenticationException } from '../exceptions/authentication.exception';

@Injectable()
export class RefreshTokenGuard extends AuthGuard(AUTH_STRATEGY_REFRESH) {
  handleRequest<TUser = unknown>(error: unknown, user: TUser, info?: { message?: string }): TUser {
    if (error || !user) {
      throw (
        error ??
        new AuthenticationException(info?.message ?? 'Refresh Token 无效', {
          errorCode: AppErrorCode.AUTH_INVALID_REFRESH_TOKEN,
        })
      );
    }

    return user;
  }
}
