import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AUTH_STRATEGY_REFRESH } from '../../../common/constants/auth.constants';
import { AppErrorCode } from '../../../common/exceptions/error-code.enum';
import { AuthenticationException } from '../../../common/exceptions/authentication.exception';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import type { JwtUser } from '../../../common/interfaces/jwt-user.interface';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

const extractRefreshToken = (request: Request): string | null => {
  const body = request.body as Partial<RefreshTokenDto> | undefined;
  const authorization = request.headers.authorization;

  if (body?.refreshToken) {
    return body.refreshToken;
  }

  if (authorization?.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '').trim();
  }

  return null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, AUTH_STRATEGY_REFRESH) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.refreshTokenSecret'),
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: JwtPayload): JwtUser {
    const refreshToken = extractRefreshToken(request);

    if (!refreshToken || payload.tokenType !== 'refresh') {
      throw new AuthenticationException('Refresh Token 无效', {
        errorCode: AppErrorCode.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenType: payload.tokenType,
      refreshToken,
    };
  }
}
