import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/is-public.decorator';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import type { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { AuthPayloadDto, AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthPayloadDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: '刷新 Access Token / Refresh Token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@CurrentUser() currentUser: JwtUser): Promise<AuthPayloadDto> {
    return this.authService.refresh(currentUser);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '退出登录并清除 Refresh Token' })
  @ApiOkResponse({
    schema: {
      example: {
        code: 200,
        data: null,
        message: 'success',
        timestamp: 1711180800000,
      },
    },
  })
  async logout(@CurrentUser('userId') userId: number): Promise<null> {
    await this.authService.logout(userId);
    return null;
  }
}
