import { Module } from '@nestjs/common';

import { UsersModule } from '../../users/users.module';
import { ProjectsSharedModule } from '../projects-shared.module';
import { AdminConsoleController } from './admin-console.controller';
import { AdminConsoleService } from './admin-console.service';

@Module({
  imports: [UsersModule, ProjectsSharedModule],
  controllers: [AdminConsoleController],
  providers: [AdminConsoleService],
})
export class AdminConsoleModule {}
