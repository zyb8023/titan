import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: '登录邮箱' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', minLength: 8, description: '登录密码' })
  @IsString()
  @MinLength(8)
  password!: string;
}
