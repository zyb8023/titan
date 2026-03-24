import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: '登录邮箱' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8, description: '登录密码' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER, description: '角色' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
