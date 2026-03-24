import { HttpStatus } from '@nestjs/common';

import { AppException, type AppExceptionOptions } from './app.exception';
import { AppErrorCode } from './error-code.enum';

export class AuthenticationException extends AppException {
  constructor(message = '未授权访问', options: AppExceptionOptions = {}) {
    super(HttpStatus.UNAUTHORIZED, message, {
      errorCode: options.errorCode ?? AppErrorCode.UNAUTHORIZED,
      ...(options.errors ? { errors: options.errors } : {}),
    });
  }
}
