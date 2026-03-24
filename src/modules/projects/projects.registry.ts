import { UserRole } from '../../common/enums/user-role.enum';

export type FrontendProjectCode = 'admin-console' | 'user-portal';

export interface FrontendProjectDefinition {
  code: FrontendProjectCode;
  name: string;
  routePrefix: string;
  description: string;
  features: string[];
  allowedRoles: UserRole[];
}

export const FRONTEND_PROJECTS: FrontendProjectDefinition[] = [
  {
    code: 'admin-console',
    name: '管理后台',
    routePrefix: 'admin-console',
    description: '面向运营和管理员的后台项目接口',
    features: ['auth', 'users', 'dashboard', 'system-config'],
    allowedRoles: [UserRole.ADMIN],
  },
  {
    code: 'user-portal',
    name: '用户门户',
    routePrefix: 'user-portal',
    description: '面向终端用户的门户项目接口',
    features: ['auth', 'profile', 'content', 'notifications'],
    allowedRoles: [UserRole.ADMIN, UserRole.USER],
  },
];
