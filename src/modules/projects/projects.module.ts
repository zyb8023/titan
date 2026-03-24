import { Module } from '@nestjs/common';

import { AdminConsoleModule } from './admin-console/admin-console.module';
import { ProjectsSharedModule } from './projects-shared.module';
import { UserPortalModule } from './user-portal/user-portal.module';

@Module({
  imports: [
    ProjectsSharedModule,
    // 这里统一聚合所有前端项目模块，新增项目时只需要继续往这里注册。
    AdminConsoleModule,
    UserPortalModule,
  ],
  exports: [ProjectsSharedModule],
})
export class ProjectsModule {}
