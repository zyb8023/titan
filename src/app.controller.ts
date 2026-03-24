import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from './common/decorators/is-public.decorator';
import { ProjectsRegistryService } from './modules/projects/projects-registry.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly projectsRegistryService: ProjectsRegistryService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '服务健康检查' })
  getHealth(): {
    status: string;
    service: string;
    env: string;
    projects: string[];
  } {
    return {
      status: 'ok',
      service: this.configService.get<string>('app.name', 'titan-base'),
      env: this.configService.get<string>('app.env', 'development'),
      // 通过注册中心统一维护项目清单，避免多处硬编码。
      projects: this.projectsRegistryService.listCodes(),
    };
  }
}
