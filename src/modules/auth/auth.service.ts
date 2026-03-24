import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AppErrorCode } from '../../common/exceptions/error-code.enum';
import { AuthenticationException } from '../../common/exceptions/authentication.exception';
import type { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { ProjectsRegistryService } from '../projects/projects-registry.service';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import type { AccessibleProjectDto } from './dto/auth-response.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthPayload {
  user: UserEntity;
  tokens: TokenPair;
  projects: AccessibleProjectDto[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly projectsRegistryService: ProjectsRegistryService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthPayload> {
    const user = await this.usersService.findByEmailWithSecrets(loginDto.email);

    if (!user) {
      throw new AuthenticationException('邮箱或密码错误', {
        errorCode: AppErrorCode.AUTH_INVALID_CREDENTIALS,
      });
    }

    const isPasswordMatched = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordMatched) {
      throw new AuthenticationException('邮箱或密码错误', {
        errorCode: AppErrorCode.AUTH_INVALID_CREDENTIALS,
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.toUserEntity(user),
      tokens,
      projects: this.getAccessibleProjects(user.role),
    };
  }

  async refresh(currentUser: JwtUser): Promise<AuthPayload> {
    if (!currentUser.refreshToken) {
      throw new AuthenticationException('Refresh Token 缺失', {
        errorCode: AppErrorCode.AUTH_REFRESH_TOKEN_MISSING,
      });
    }

    const user = await this.usersService.findByEmailWithSecrets(currentUser.email);

    if (!user?.refreshTokenHash) {
      throw new AuthenticationException('Refresh Token 已失效', {
        errorCode: AppErrorCode.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    const isRefreshTokenMatched = await bcrypt.compare(
      currentUser.refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenMatched) {
      throw new AuthenticationException('Refresh Token 已失效', {
        errorCode: AppErrorCode.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.toUserEntity(user),
      tokens,
      projects: this.getAccessibleProjects(user.role),
    };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokenPair(
    userId: number,
    email: string,
    role: UserEntity['role'],
  ): Promise<TokenPair> {
    const accessTokenPayload = {
      sub: userId,
      email,
      role,
      tokenType: 'access' as const,
    };
    const refreshTokenPayload = {
      sub: userId,
      email,
      role,
      tokenType: 'refresh' as const,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.getOrThrow<string>('auth.accessTokenSecret'),
        expiresIn: this.configService.getOrThrow<string>('auth.accessTokenExpiresIn'),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.getOrThrow<string>('auth.refreshTokenSecret'),
        expiresIn: this.configService.getOrThrow<string>('auth.refreshTokenExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async persistRefreshToken(userId: number, refreshToken: string): Promise<void> {
    // Refresh Token 仅保存哈希值，避免明文泄露后可直接复用。
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, refreshTokenHash);
  }

  private getAccessibleProjects(role: UserEntity['role']): AccessibleProjectDto[] {
    return this.projectsRegistryService.listAccessibleByRole(role).map((project) => ({
      code: project.code,
      name: project.name,
      routePrefix: project.routePrefix,
      description: project.description,
      features: project.features,
    }));
  }
}
