import { HttpStatus } from '@nestjs/common';

import { AppException, type AppExceptionOptions } from './app.exception';
import { AppErrorCode } from './error-code.enum';

export class AuthorizationException extends AppException {
  constructor(message = '无权执行当前操作', options: AppExceptionOptions = {}) {
    super(HttpStatus.FORBIDDEN, message, {
      errorCode: options.errorCode ?? AppErrorCode.FORBIDDEN,
      ...(options.errors ? { errors: options.errors } : {}),
    });
  }
}
