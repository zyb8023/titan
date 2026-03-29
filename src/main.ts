import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppLoggerService } from './providers/logger/logger.service';
import { SwaggerProviderService } from './providers/swagger/swagger.service';

const resolveStartupUrl = async (
  app: Awaited<ReturnType<typeof NestFactory.create>>,
  apiPrefix: string,
): Promise<string> => {
  const appUrl = await app.getUrl();
  const normalizedApiPrefix = apiPrefix.replace(/^\/+|\/+$/g, '');
  const url = new URL(appUrl);

  // Nest 在本地未显式指定 host 时，常会返回 IPv6 loopback，这里统一转换为更直观的 localhost。
  if (url.hostname === '::1' || url.hostname === '::' || url.hostname === '0.0.0.0') {
    url.hostname = 'localhost';
  }

  url.pathname = normalizedApiPrefix ? `/${normalizedApiPrefix}` : '/';

  return url.toString().replace(/\/$/, '');
};

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

  logger.log(`应用已启动: ${await resolveStartupUrl(app, apiPrefix)}`, 'Bootstrap');
}

void bootstrap();
