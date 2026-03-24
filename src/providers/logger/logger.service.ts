import { Injectable, type LoggerService } from '@nestjs/common';
import { getLogger } from 'log4js';

import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly appLogger = getLogger('app');
  private readonly errorLogger = getLogger('error');
  private readonly accessLogger = getLogger('access');

  constructor(private readonly requestContextService: RequestContextService) {}

  log(message: unknown, context?: string): void {
    this.appLogger.info(this.formatMessage(message, context));
  }

  error(message: unknown, trace?: string, context?: string): void {
    if (message && typeof message === 'object' && !Array.isArray(message)) {
      this.errorLogger.error(
        this.formatMessage(
          {
            ...message,
            ...(trace ? { trace } : {}),
          },
          context,
        ),
      );

      return;
    }

    this.errorLogger.error(this.formatMessage({ message, ...(trace ? { trace } : {}) }, context));
  }

  warn(message: unknown, context?: string): void {
    this.appLogger.warn(this.formatMessage(message, context));
  }

  debug(message: unknown, context?: string): void {
    this.appLogger.debug(this.formatMessage(message, context));
  }

  verbose(message: unknown, context?: string): void {
    this.appLogger.trace(this.formatMessage(message, context));
  }

  access(message: unknown, context = 'HTTP'): void {
    this.accessLogger.info(this.formatMessage(message, context));
  }

  private formatMessage(message: unknown, context?: string): string {
    const requestContext = this.requestContextService.get();
    const metadata = {
      requestId: requestContext?.requestId,
      projectCode: requestContext?.projectCode,
      context,
    };

    if (typeof message === 'string') {
      return JSON.stringify({
        ...metadata,
        message,
      });
    }

    if (message && typeof message === 'object') {
      return JSON.stringify({
        ...metadata,
        ...message,
      });
    }

    return JSON.stringify({
      ...metadata,
      message: String(message),
    });
  }
}
