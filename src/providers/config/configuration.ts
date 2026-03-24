const toBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
};

export const configuration = () => ({
  app: {
    name: process.env.APP_NAME ?? 'titan',
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    eagerConnect:
      process.env.DATABASE_EAGER_CONNECT !== undefined
        ? toBoolean(process.env.DATABASE_EAGER_CONNECT, true)
        : (process.env.NODE_ENV ?? 'development') === 'production',
  },
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  swagger: {
    enabled: toBoolean(process.env.SWAGGER_ENABLED, true),
    title: process.env.SWAGGER_TITLE ?? 'Titan Base API',
    description: process.env.SWAGGER_DESCRIPTION ?? 'NestJS 企业级后端脚手架',
    version: process.env.SWAGGER_VERSION ?? '1.0.0',
  },
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    dir: process.env.LOG_DIR ?? 'logs',
  },
  cache: {
    enabled: toBoolean(process.env.CACHE_ENABLED, true),
    driver: process.env.CACHE_DRIVER ?? 'redis',
    ttl: Number(process.env.CACHE_TTL ?? 300),
    redis: {
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD ?? '',
      db: Number(process.env.REDIS_DB ?? 0),
    },
  },
});
