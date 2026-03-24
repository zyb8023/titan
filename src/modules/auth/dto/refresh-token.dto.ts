import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh Token，支持请求体传入，也支持 Authorization Bearer 传入',
  })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
