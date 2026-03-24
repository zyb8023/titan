import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

import type { RequestContextStore } from '../../common/interfaces/request-context.interface';

@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(context: RequestContextStore, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  get(): RequestContextStore | undefined {
    return this.asyncLocalStorage.getStore();
  }

  patch(patchValue: Partial<RequestContextStore>): void {
    const context = this.get();

    if (!context) {
      return;
    }

    Object.assign(context, patchValue);
  }
}
