import { Module } from '@nestjs/common';
import { ListingsApiController } from './listings-api.controller';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

@Module({
  controllers: [ListingsController, ListingsApiController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
