import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { ProjectsOverviewService } from './projects-overview.service';
import { ProjectsRegistryService } from './projects-registry.service';

@Module({
  imports: [UsersModule],
  providers: [ProjectsRegistryService, ProjectsOverviewService],
  exports: [ProjectsRegistryService, ProjectsOverviewService],
})
export class ProjectsSharedModule {}
