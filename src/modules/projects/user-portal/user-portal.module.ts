import { Module } from '@nestjs/common';

import { UsersModule } from '../../users/users.module';
import { ProjectsSharedModule } from '../projects-shared.module';
import { UserPortalController } from './user-portal.controller';
import { UserPortalService } from './user-portal.service';

@Module({
  imports: [UsersModule, ProjectsSharedModule],
  controllers: [UserPortalController],
  providers: [UserPortalService],
})
export class UserPortalModule {}
