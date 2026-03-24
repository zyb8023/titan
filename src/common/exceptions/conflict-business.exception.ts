import { HttpStatus } from '@nestjs/common';

import { AppException, type AppExceptionOptions } from './app.exception';
import { AppErrorCode } from './error-code.enum';

export class ConflictBusinessException extends AppException {
  constructor(message = '资源冲突', options: AppExceptionOptions = {}) {
    super(HttpStatus.CONFLICT, message, {
      errorCode: options.errorCode ?? AppErrorCode.RESOURCE_CONFLICT,
      ...(options.errors ? { errors: options.errors } : {}),
    });
  }
}
