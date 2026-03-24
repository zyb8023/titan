import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

import { AppErrorCode } from '../exceptions/error-code.enum';
import { AppLoggerService } from '../../providers/logger/logger.service';
import { RequestContextService } from '../../providers/request-context/request-context.service';

interface NormalizedException {
  message: string;
  errorCode: AppErrorCode;
  errors?: string[];
  trace?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();
    const status = this.getStatus(exception);
    const normalizedException = this.normalizeException(exception, status);
    const requestContext = this.requestContextService.get();

    const logPayload = {
      requestId: requestContext?.requestId,
      projectCode: requestContext?.projectCode,
      path: request.url,
      method: request.method,
      status,
      message: normalizedException.message,
      errorCode: normalizedException.errorCode,
      errors: normalizedException.errors,
      exceptionName: exception instanceof Error ? exception.name : 'UnknownException',
      trace: status >= HttpStatus.INTERNAL_SERVER_ERROR ? normalizedException.trace : undefined,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logPayload, undefined, AllExceptionsFilter.name);
    } else {
      this.logger.warn(logPayload, AllExceptionsFilter.name);
    }

    response.status(status).json({
      code: status,
      data: null,
      message: normalizedException.message,
      errorCode: normalizedException.errorCode,
      errors: normalizedException.errors,
      requestId: requestContext?.requestId,
      timestamp: Date.now(),
      path: request.url,
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.getPrismaStatus(exception);
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private normalizeException(exception: unknown, status: number): NormalizedException {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          message: response,
          errorCode: this.mapHttpStatusToErrorCode(status),
          trace: exception.stack,
        };
      }

      const exceptionResponse = response as Record<string, unknown>;
      const rawMessage = exceptionResponse.message;
      const rawErrorCode = exceptionResponse.errorCode;
      const errors = Array.isArray(rawMessage) ? rawMessage.map((item) => String(item)) : undefined;
      const message =
        typeof rawMessage === 'string'
          ? rawMessage
          : (errors?.[0] ??
            (typeof exceptionResponse.error === 'string'
              ? exceptionResponse.error
              : '请求处理失败'));

      return {
        message,
        errorCode: this.parseErrorCode(rawErrorCode, status),
        errors,
        trace: exception.stack,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        // 统一把 Prisma 已知错误转换为稳定的业务语义，避免直接向上游暴露底层错误文本。
        message: this.getPrismaMessage(exception),
        errorCode: this.getPrismaErrorCode(exception),
        trace: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        message:
          status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : exception.message,
        errorCode: this.mapHttpStatusToErrorCode(status),
        trace: exception.stack,
      };
    }

    return {
      message: 'Internal server error',
      errorCode: AppErrorCode.INTERNAL_SERVER_ERROR,
    };
  }

  private getPrismaStatus(exception: Prisma.PrismaClientKnownRequestError): number {
    switch (exception.code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2003':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private getPrismaMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    switch (exception.code) {
      case 'P2002':
        return this.buildUniqueConstraintMessage(exception);
      case 'P2003':
        return '数据关联校验失败';
      case 'P2025':
        return '目标数据不存在或已被删除';
      default:
        return '数据库操作失败';
    }
  }

  private buildUniqueConstraintMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    const target = exception.meta?.target;

    if (Array.isArray(target) && target.length > 0) {
      return `${target.join(', ')} 已存在`;
    }

    return '数据已存在，不能重复创建';
  }

  private getPrismaErrorCode(exception: Prisma.PrismaClientKnownRequestError): AppErrorCode {
    switch (exception.code) {
      case 'P2002':
        return AppErrorCode.RESOURCE_CONFLICT;
      case 'P2003':
        return AppErrorCode.DATA_RELATION_CONFLICT;
      case 'P2025':
        return AppErrorCode.RESOURCE_NOT_FOUND;
      default:
        return AppErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  private parseErrorCode(rawErrorCode: unknown, status: number): AppErrorCode {
    if (typeof rawErrorCode === 'string' && rawErrorCode in AppErrorCode) {
      return rawErrorCode as AppErrorCode;
    }

    return this.mapHttpStatusToErrorCode(status);
  }

  private mapHttpStatusToErrorCode(status: number): AppErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return AppErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return AppErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return AppErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return AppErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return AppErrorCode.RESOURCE_CONFLICT;
      default:
        return AppErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
