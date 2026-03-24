import type { INestApplication } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Injectable()
export class SwaggerProviderService {
  constructor(private readonly configService: ConfigService) {}

  setup(app: INestApplication): void {
    const swaggerEnabled = this.configService.get<boolean>('swagger.enabled', true);

    if (!swaggerEnabled) {
      return;
    }

    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');
    const swaggerConfig = new DocumentBuilder()
      .setTitle(this.configService.get<string>('swagger.title', 'Titan Base API'))
      .setDescription(
        this.configService.get<string>('swagger.description', 'NestJS 企业级后端脚手架'),
      )
      .setVersion(this.configService.get<string>('swagger.version', '1.0.0'))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          description: '请输入 Access Token',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
