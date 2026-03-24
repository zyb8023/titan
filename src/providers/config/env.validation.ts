import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

const toBoolean = (value: unknown): boolean => value === true || value === 'true';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string = 'development';

  @IsString()
  @IsNotEmpty()
  APP_NAME: string = 'titan';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  API_PREFIX: string = 'api';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @Transform(({ value, obj }) =>
    value === undefined ? String(obj.NODE_ENV ?? 'development') === 'production' : toBoolean(value),
  )
  @IsBoolean()
  DATABASE_EAGER_CONNECT!: boolean;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @Transform(({ value }) => (value === undefined ? true : toBoolean(value)))
  @IsBoolean()
  SWAGGER_ENABLED: boolean = true;

  @IsString()
  @IsNotEmpty()
  SWAGGER_TITLE: string = 'Titan Base API';

  @IsString()
  @IsNotEmpty()
  SWAGGER_DESCRIPTION: string = 'NestJS 企业级后端脚手架';

  @IsString()
  @IsNotEmpty()
  SWAGGER_VERSION: string = '1.0.0';

  @IsString()
  @IsNotEmpty()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsNotEmpty()
  LOG_DIR: string = 'logs';

  @Transform(({ value }) => (value === undefined ? true : toBoolean(value)))
  @IsBoolean()
  CACHE_ENABLED: boolean = true;

  @IsString()
  @IsIn(['memory', 'redis'])
  CACHE_DRIVER: string = 'redis';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  CACHE_TTL: number = 300;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string = '127.0.0.1';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  REDIS_PORT: number = 6379;

  @IsString()
  REDIS_PASSWORD: string = '';

  @Type(() => Number)
  @IsInt()
  @Min(0)
  REDIS_DB: number = 0;

  @IsOptional()
  @IsEmail()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {})).join(', ');

    throw new Error(`环境变量校验失败: ${messages}`);
  }

  return validatedConfig;
}
