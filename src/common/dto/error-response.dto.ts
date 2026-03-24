import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponseDto } from './base-response.dto';

export class ErrorResponseDto extends BaseResponseDto {
  @ApiProperty({ example: null, nullable: true, description: '失败场景固定为 null' })
  data!: null;

  @ApiProperty({
    example: 'USER_NOT_FOUND',
    description: '稳定的业务错误码，前端应优先依赖该字段做分支判断',
  })
  errorCode!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['email must be an email'],
    description: '字段级或明细错误列表',
  })
  errors?: string[];

  @ApiPropertyOptional({ example: '/api/auth/login', description: '请求路径' })
  path?: string;
}
