import { SetMetadata } from '@nestjs/common';

import { PROJECT_SCOPE_KEY } from '../constants/auth.constants';
import type { FrontendProjectCode } from '../../modules/projects/projects.registry';

export const ProjectScope = (projectCode: FrontendProjectCode): MethodDecorator & ClassDecorator =>
  SetMetadata(PROJECT_SCOPE_KEY, projectCode);
