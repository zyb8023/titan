import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly eagerConnect: boolean;

  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.getOrThrow<string>('database.url'),
        },
      },
      log: ['warn', 'error'],
    });

    this.eagerConnect = configService.get<boolean>('database.eagerConnect', false);
  }

  async onModuleInit(): Promise<void> {
    // 开发环境允许延迟连接数据库，避免本地未起容器时直接阻塞服务启动。
    if (!this.eagerConnect) {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
