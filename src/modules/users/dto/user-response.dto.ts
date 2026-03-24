import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { UserEntity } from '../entities/user.entity';

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ type: UserEntity, description: '用户详情' })
  data!: UserEntity;
}

export class UserListPayloadDto {
  @ApiProperty({ type: [UserEntity], description: '用户列表' })
  items!: UserEntity[];

  @ApiProperty({ example: 1, description: '总数' })
  total!: number;
}

export class UserListResponseDto extends BaseResponseDto {
  @ApiProperty({ type: UserListPayloadDto, description: '列表数据' })
  data!: UserListPayloadDto;
}
