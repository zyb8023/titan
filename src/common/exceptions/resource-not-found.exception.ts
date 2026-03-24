import { HttpStatus } from '@nestjs/common';

import { AppException, type AppExceptionOptions } from './app.exception';
import { AppErrorCode } from './error-code.enum';

export class ResourceNotFoundException extends AppException {
  constructor(message = '目标资源不存在', options: AppExceptionOptions = {}) {
    super(HttpStatus.NOT_FOUND, message, {
      errorCode: options.errorCode ?? AppErrorCode.RESOURCE_NOT_FOUND,
      ...(options.errors ? { errors: options.errors } : {}),
    });
  }
}
