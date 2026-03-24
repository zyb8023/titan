import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configure } from 'log4js';

import { RequestContextModule } from '../request-context/request-context.module';
import { RequestContextService } from '../request-context/request-context.service';
import { createLog4jsConfig } from './log4js.config';
import { AppLoggerService } from './logger.service';

@Global()
@Module({
  imports: [RequestContextModule],
  providers: [
    {
      provide: AppLoggerService,
      inject: [ConfigService, RequestContextService],
      useFactory: (configService: ConfigService, requestContextService: RequestContextService) => {
        configure(
          createLog4jsConfig(
            configService.get<string>('logger.dir', 'logs'),
            configService.get<string>('logger.level', 'info'),
          ),
        );

        return new AppLoggerService(requestContextService);
      },
    },
  ],
  exports: [AppLoggerService],
})
export class LoggerModule {}
