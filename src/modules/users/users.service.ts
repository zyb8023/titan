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

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictBusinessException('邮箱已存在', {
        errorCode: AppErrorCode.USER_EMAIL_ALREADY_EXISTS,
      });
    }

    // 密码在入库前统一做哈希，避免业务层遗漏。
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email: createUserDto.email,
        password: passwordHash,
        role: createUserDto.role ?? UserRole.USER,
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
    return new UserEntity(user);
  }
}
