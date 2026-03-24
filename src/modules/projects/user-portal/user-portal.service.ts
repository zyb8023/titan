import { Injectable } from '@nestjs/common';

import { FrontendProjectOverviewDto } from '../dto/frontend-project-overview.dto';
import { ProjectsOverviewService } from '../projects-overview.service';

@Injectable()
export class UserPortalService {
  constructor(private readonly projectsOverviewService: ProjectsOverviewService) {}

  async getOverview(userId: number): Promise<FrontendProjectOverviewDto> {
    return this.projectsOverviewService.buildOverview('user-portal', userId);
  }
}
