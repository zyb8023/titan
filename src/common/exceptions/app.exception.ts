import type { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

import { AppErrorCode } from './error-code.enum';

export interface AppExceptionOptions {
  errorCode?: AppErrorCode;
  errors?: string[];
}

export class AppException extends HttpException {
  readonly errorCode: AppErrorCode;

  constructor(status: HttpStatus, message: string, options: AppExceptionOptions = {}) {
    const errorCode = options.errorCode ?? AppErrorCode.INTERNAL_SERVER_ERROR;

    super(
      {
        message,
        errorCode,
        ...(options.errors ? { errors: options.errors } : {}),
      },
      status,
    );

    this.errorCode = errorCode;
  }
}
