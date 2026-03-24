import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../../common/enums/user-role.enum';

export class UserEntity {
  @ApiProperty({ example: 1, description: '用户 ID' })
  id!: number;

  @ApiProperty({ example: 'admin@example.com', description: '邮箱' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN, description: '角色' })
  role!: UserRole;

  @ApiProperty({ example: '2026-03-23T09:00:00.000Z', description: '创建时间' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-03-23T09:00:00.000Z', description: '更新时间' })
  updatedAt!: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
