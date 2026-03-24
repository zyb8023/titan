import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppLoggerService } from './providers/logger/logger.service';
import { SwaggerProviderService } from './providers/swagger/swagger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);
  const swaggerProviderService = app.get(SwaggerProviderService);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const port = configService.get<number>('app.port', 3000);

  app.useLogger(logger);
  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  swaggerProviderService.setup(app);

  await app.listen(port);

  logger.log(`应用已启动: ${await app.getUrl()}/${apiPrefix}`, 'Bootstrap');
}

void bootstrap();
