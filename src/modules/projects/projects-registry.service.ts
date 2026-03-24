import { Injectable } from '@nestjs/common';

import { UserRole } from '../../common/enums/user-role.enum';
import { AppErrorCode } from '../../common/exceptions/error-code.enum';
import { ResourceNotFoundException } from '../../common/exceptions/resource-not-found.exception';
import {
  FRONTEND_PROJECTS,
  type FrontendProjectDefinition,
  type FrontendProjectCode,
} from './projects.registry';

@Injectable()
export class ProjectsRegistryService {
  list(): FrontendProjectDefinition[] {
    return FRONTEND_PROJECTS;
  }

  listCodes(): string[] {
    return FRONTEND_PROJECTS.map((project) => project.code);
  }

  findByCode(code: FrontendProjectCode): FrontendProjectDefinition | undefined {
    return FRONTEND_PROJECTS.find((project) => project.code === code);
  }

  getByCodeOrThrow(code: FrontendProjectCode): FrontendProjectDefinition {
    const project = this.findByCode(code);

    if (!project) {
      throw new ResourceNotFoundException(`前端项目 ${code} 未注册`, {
        errorCode: AppErrorCode.PROJECT_NOT_FOUND,
      });
    }

    return project;
  }

  listAccessibleByRole(role: UserRole): FrontendProjectDefinition[] {
    return FRONTEND_PROJECTS.filter((project) => project.allowedRoles.includes(role));
  }

  canAccess(projectCode: FrontendProjectCode, role: UserRole): boolean {
    const project = this.findByCode(projectCode);
    return project ? project.allowedRoles.includes(role) : false;
  }

  resolveByPath(path: string, apiPrefix: string): FrontendProjectDefinition | undefined {
    const normalizedPath = path.split('?')[0];
    const apiPathPrefix = `/${apiPrefix}/`;
    const trimmedPath = normalizedPath.startsWith(apiPathPrefix)
      ? normalizedPath.slice(apiPathPrefix.length)
      : normalizedPath.replace(/^\//, '');
    const routePrefix = trimmedPath.split('/')[0];

    if (!routePrefix) {
      return undefined;
    }

    return FRONTEND_PROJECTS.find((project) => project.routePrefix === routePrefix);
  }
}
