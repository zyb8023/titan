import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { UserEntity } from '../../users/entities/user.entity';

export class TokenPairDto {
  @ApiProperty({ description: 'Access Token' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh Token' })
  refreshToken!: string;
}

export class AccessibleProjectDto {
  @ApiProperty({ example: 'admin-console', description: '前端项目编码' })
  code!: string;

  @ApiProperty({ example: '管理后台', description: '前端项目名称' })
  name!: string;

  @ApiProperty({ example: 'admin-console', description: '路由前缀' })
  routePrefix!: string;

  @ApiProperty({ example: '面向运营和管理员的后台项目接口', description: '项目描述' })
  description!: string;

  @ApiProperty({
    example: ['auth', 'users', 'dashboard'],
    description: '可使用的能力清单',
    type: [String],
  })
  features!: string[];
}

export class AuthPayloadDto {
  @ApiProperty({ type: TokenPairDto, description: '令牌对' })
  tokens!: TokenPairDto;

  @ApiProperty({ type: UserEntity, description: '当前用户' })
  user!: UserEntity;

  @ApiProperty({
    description: '当前账号可访问的前端项目列表',
    type: [AccessibleProjectDto],
  })
  projects!: AccessibleProjectDto[];
}

export class AuthResponseDto extends BaseResponseDto {
  @ApiProperty({ type: AuthPayloadDto, description: '注册、登录或刷新结果' })
  data!: AuthPayloadDto;
}
