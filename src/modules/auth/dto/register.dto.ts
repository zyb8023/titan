import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'new-user@example.com', description: '注册邮箱' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', minLength: 8, description: '注册密码' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'ChangeMe123!', minLength: 8, description: '确认密码' })
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}
