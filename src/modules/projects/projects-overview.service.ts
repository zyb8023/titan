import { Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { FrontendProjectOverviewDto } from './dto/frontend-project-overview.dto';
import { ProjectsRegistryService } from './projects-registry.service';
import type { FrontendProjectCode } from './projects.registry';

@Injectable()
export class ProjectsOverviewService {
  constructor(
    private readonly projectsRegistryService: ProjectsRegistryService,
    private readonly usersService: UsersService,
  ) {}

  async buildOverview(
    projectCode: FrontendProjectCode,
    userId: number,
  ): Promise<FrontendProjectOverviewDto> {
    const project = this.projectsRegistryService.getByCodeOrThrow(projectCode);
    const currentUser = await this.usersService.findMe(userId);

    return {
      code: project.code,
      name: project.name,
      routePrefix: project.routePrefix,
      description: project.description,
      features: project.features,
      currentUser,
    };
  }
}
