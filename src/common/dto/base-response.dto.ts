import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({ example: 200, description: '业务响应码' })
  code!: number;

  @ApiProperty({ example: 'success', description: '响应说明' })
  message!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: '请求追踪 ID',
  })
  requestId!: string;

  @ApiProperty({ example: 1711180800000, description: '服务端响应时间戳' })
  timestamp!: number;
}
