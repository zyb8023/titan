import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProjectScope } from '../../../common/decorators/project-scope.decorator';
import type { JwtUser } from '../../../common/interfaces/jwt-user.interface';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { UserEntity } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import {
  FrontendProjectOverviewDto,
  FrontendProjectOverviewResponseDto,
} from '../dto/frontend-project-overview.dto';
import { UserPortalService } from './user-portal.service';

@ApiTags('User Portal')
@ApiBearerAuth('access-token')
@ProjectScope('user-portal')
@Controller('user-portal')
export class UserPortalController {
  constructor(
    private readonly userPortalService: UserPortalService,
    private readonly usersService: UsersService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: '获取用户门户模块概览' })
  @ApiOkResponse({ type: FrontendProjectOverviewResponseDto })
  async getOverview(@CurrentUser() user: JwtUser): Promise<FrontendProjectOverviewDto> {
    return this.userPortalService.getOverview(user.userId);
  }

  @Get('profile')
  @ApiOperation({ summary: '用户门户获取当前用户资料' })
  @ApiOkResponse({ type: UserResponseDto })
  async getProfile(@CurrentUser('userId') userId: number): Promise<UserEntity> {
    return this.usersService.findMe(userId);
  }
}
