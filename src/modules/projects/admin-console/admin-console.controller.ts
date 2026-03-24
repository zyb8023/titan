import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProjectScope } from '../../../common/decorators/project-scope.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { JwtUser } from '../../../common/interfaces/jwt-user.interface';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UserListResponseDto, UserResponseDto } from '../../users/dto/user-response.dto';
import { UserEntity } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import {
  FrontendProjectOverviewDto,
  FrontendProjectOverviewResponseDto,
} from '../dto/frontend-project-overview.dto';
import { AdminConsoleService } from './admin-console.service';

@ApiTags('Admin Console')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@ProjectScope('admin-console')
@Controller('admin-console')
export class AdminConsoleController {
  constructor(
    private readonly adminConsoleService: AdminConsoleService,
    private readonly usersService: UsersService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: '获取管理后台模块概览' })
  @ApiOkResponse({ type: FrontendProjectOverviewResponseDto })
  async getOverview(@CurrentUser() user: JwtUser): Promise<FrontendProjectOverviewDto> {
    return this.adminConsoleService.getOverview(user.userId);
  }

  @Get('users')
  @ApiOperation({ summary: '管理后台获取用户列表' })
  @ApiOkResponse({ type: UserListResponseDto })
  async findAllUsers(): Promise<{ items: UserEntity[]; total: number }> {
    return this.usersService.findAll();
  }

  @Post('users')
  @ApiOperation({ summary: '管理后台创建用户' })
  @ApiOkResponse({ type: UserResponseDto })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }
}
