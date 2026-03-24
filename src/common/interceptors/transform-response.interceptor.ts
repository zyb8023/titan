import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { ApiResponse } from '../interfaces/api-response.interface';
import { RequestContextService } from '../../providers/request-context/request-context.service';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly requestContextService: RequestContextService) {}

  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const requestId = this.requestContextService.get()?.requestId ?? '';

    return next.handle().pipe(
      map((data) => ({
        code: 200,
        data,
        message: 'success',
        requestId,
        timestamp: Date.now(),
      })),
    );
  }
}
