import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AUTH_STRATEGY_JWT } from '../../../common/constants/auth.constants';
import { AppErrorCode } from '../../../common/exceptions/error-code.enum';
import { AuthenticationException } from '../../../common/exceptions/authentication.exception';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import type { JwtUser } from '../../../common/interfaces/jwt-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH_STRATEGY_JWT) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.accessTokenSecret'),
    });
  }

  validate(payload: JwtPayload): JwtUser {
    if (payload.tokenType !== 'access') {
      throw new AuthenticationException('Access Token 无效', {
        errorCode: AppErrorCode.AUTH_INVALID_ACCESS_TOKEN,
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenType: payload.tokenType,
    };
  }
}
