import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Response } from 'express';

import type { RequestWithUser } from '../interfaces/request-user.interface';
import { ProjectsRegistryService } from '../../modules/projects/projects-registry.service';
import { AppLoggerService } from '../../providers/logger/logger.service';
import { RequestContextService } from '../../providers/request-context/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly projectsRegistryService: ProjectsRegistryService,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLoggerService,
  ) {}

  use(request: RequestWithUser, response: Response, next: NextFunction): void {
    const requestId = this.resolveRequestId(request.headers['x-request-id']);
    const project = this.projectsRegistryService.resolveByPath(
      request.originalUrl,
      this.configService.get<string>('app.apiPrefix', 'api'),
    );
    const startAt = Date.now();

    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      this.logger.access({
        requestId,
        projectCode: project?.code,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        duration: Date.now() - startAt,
        userId: request.user?.userId ?? null,
        ip: this.resolveClientIp(request),
        userAgent: request.headers['user-agent'] ?? null,
        referer: request.headers.referer ?? null,
        contentLength: this.resolveContentLength(response),
      });
    });

    this.requestContextService.run(
      {
        requestId,
        method: request.method,
        path: request.originalUrl,
        startAt,
        projectCode: project?.code,
      },
      () => {
        // 所有异步链路都复用同一个上下文，便于日志与异常统一追踪。
        next();
      },
    );
  }

  private resolveRequestId(header: string | string[] | undefined): string {
    if (typeof header === 'string' && header.trim()) {
      return header.trim();
    }

    return randomUUID();
  }

  private resolveClientIp(request: RequestWithUser): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim() ?? null;
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0]?.trim() ?? null;
    }

    return request.ip ?? null;
  }

  private resolveContentLength(response: Response): number | null {
    const header = response.getHeader('content-length');

    if (typeof header === 'number') {
      return header;
    }

    if (typeof header === 'string') {
      const parsedValue = Number(header);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }
}
