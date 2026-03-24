import { Module } from '@nestjs/common';

import { AppCacheModule } from './cache/cache.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestContextModule } from './request-context/request-context.module';
import { SwaggerProviderModule } from './swagger/swagger.module';

@Module({
  imports: [
    // 统一收拢基础设施模块，避免 AppModule 随着底座能力增加而持续膨胀。
    RequestContextModule,
    LoggerModule,
    PrismaModule,
    AppCacheModule,
    SwaggerProviderModule,
  ],
  exports: [
    RequestContextModule,
    LoggerModule,
    PrismaModule,
    AppCacheModule,
    SwaggerProviderModule,
  ],
})
export class ProvidersModule {}
