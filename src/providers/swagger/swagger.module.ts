import { Global, Module } from '@nestjs/common';

import { SwaggerProviderService } from './swagger.service';

@Global()
@Module({
  providers: [SwaggerProviderService],
  exports: [SwaggerProviderService],
})
export class SwaggerProviderModule {}
