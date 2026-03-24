import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

import { AppCacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const cacheEnabled = configService.get<boolean>('cache.enabled', true);
        const ttl = configService.get<number>('cache.ttl', 300);

        if (!cacheEnabled) {
          return {
            ttl,
          };
        }

        const driver = configService.get<string>('cache.driver', 'redis');

        if (driver === 'memory') {
          return {
            ttl,
            max: 1000,
          };
        }

        const password = configService.get<string>('cache.redis.password');

        return {
          ttl,
          store: await redisStore({
            socket: {
              host: configService.get<string>('cache.redis.host', '127.0.0.1'),
              port: configService.get<number>('cache.redis.port', 6379),
            },
            // 本地 Redis 常见场景是不设密码，这里只在有值时才传认证信息。
            ...(password ? { password } : {}),
            database: configService.get<number>('cache.redis.db', 0),
          }),
        };
      },
    }),
  ],
  providers: [AppCacheService],
  exports: [NestCacheModule, AppCacheService],
})
export class AppCacheModule {}
