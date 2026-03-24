import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PROJECT_SCOPE_KEY } from '../constants/auth.constants';
import { AppErrorCode } from '../exceptions/error-code.enum';
import { AuthorizationException } from '../exceptions/authorization.exception';
import type { RequestWithUser } from '../interfaces/request-user.interface';
import { ProjectsRegistryService } from '../../modules/projects/projects-registry.service';
import type { FrontendProjectCode } from '../../modules/projects/projects.registry';
import { RequestContextService } from '../../providers/request-context/request-context.service';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectsRegistryService: ProjectsRegistryService,
    private readonly requestContextService: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const scopedProject = this.reflector.getAllAndOverride<FrontendProjectCode | undefined>(
      PROJECT_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!scopedProject) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const routeProject = this.requestContextService.get()?.projectCode;

    if (routeProject && routeProject !== scopedProject) {
      throw new AuthorizationException('项目访问范围与当前路由不匹配', {
        errorCode: AppErrorCode.PROJECT_SCOPE_MISMATCH,
      });
    }

    if (!request.user) {
      throw new AuthorizationException('当前请求缺少用户上下文', {
        errorCode: AppErrorCode.REQUEST_USER_CONTEXT_MISSING,
      });
    }

    const canAccess = this.projectsRegistryService.canAccess(scopedProject, request.user.role);

    if (!canAccess) {
      throw new AuthorizationException('当前账号无权访问该前端项目', {
        errorCode: AppErrorCode.PROJECT_ACCESS_DENIED,
      });
    }

    // 守卫阶段再次补齐项目上下文，避免后续链路出现项目信息缺失。
    this.requestContextService.patch({
      projectCode: scopedProject,
    });

    return true;
  }
}
