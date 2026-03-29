import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { UserRole } from '../../common/enums/user-role.enum';
import { ConflictBusinessException } from '../../common/exceptions/conflict-business.exception';
import { AppErrorCode } from '../../common/exceptions/error-code.enum';
import { ResourceNotFoundException } from '../../common/exceptions/resource-not-found.exception';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';

type PublicUserRecord = Pick<User, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>;
type UserWithSecrets = Pick<
  User,
  'id' | 'email' | 'password' | 'role' | 'refreshTokenHash' | 'createdAt' | 'updatedAt'
>;
type CreateUserInput = Pick<CreateUserDto, 'email' | 'password'> & {
  role: UserRole;
};
type RegisterUserInput = Pick<CreateUserDto, 'email' | 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role ?? UserRole.USER,
    });
  }

  async register(registerUserInput: RegisterUserInput): Promise<UserEntity> {
    return this.createUser({
      email: registerUserInput.email,
      password: registerUserInput.password,
      role: UserRole.USER,
    });
  }

  async findMe(userId: number): Promise<UserEntity> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ResourceNotFoundException('用户不存在', {
        errorCode: AppErrorCode.USER_NOT_FOUND,
      });
    }

    return this.toUserEntity(user);
  }

  async findAll(): Promise<{ items: UserEntity[]; total: number }> {
    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prismaService.user.count(),
    ]);

    return {
      items: users.map((user) => this.toUserEntity(user)),
      total,
    };
  }

  async findByEmailWithSecrets(email: string): Promise<UserWithSecrets | null> {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        refreshTokenHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRefreshToken(userId: number, refreshTokenHash: string | null): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  toUserEntity(user: PublicUserRecord): UserEntity {
    // 这里显式挑选可对外暴露的字段，避免把带有敏感信息的查询对象直接序列化到响应中。
    return new UserEntity({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  private async createUser(createUserInput: CreateUserInput): Promise<UserEntity> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createUserInput.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictBusinessException('邮箱已存在', {
        errorCode: AppErrorCode.USER_EMAIL_ALREADY_EXISTS,
      });
    }

    // 用户创建入口统一走这里，保证注册与后台建人使用相同的密码与唯一性策略。
    const passwordHash = await bcrypt.hash(createUserInput.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email: createUserInput.email,
        password: passwordHash,
        role: createUserInput.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toUserEntity(user);
  }
}
