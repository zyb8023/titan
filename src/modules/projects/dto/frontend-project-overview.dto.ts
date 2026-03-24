import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { UserEntity } from '../../users/entities/user.entity';

export class FrontendProjectOverviewDto {
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
    description: '该前端项目可用的后端能力清单',
    type: [String],
  })
  features!: string[];

  @ApiProperty({ type: UserEntity, description: '当前登录用户' })
  currentUser!: UserEntity;
}

export class FrontendProjectOverviewResponseDto extends BaseResponseDto {
  @ApiProperty({ type: FrontendProjectOverviewDto, description: '项目信息' })
  data!: FrontendProjectOverviewDto;
}
