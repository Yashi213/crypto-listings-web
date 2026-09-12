import { Module } from '@nestjs/common';
import { ListingsApiController } from './listings-api.controller';
import { ListingsSseService } from './listings-sse.service';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

@Module({
  controllers: [ListingsController, ListingsApiController],
  providers: [ListingsService, ListingsSseService],
  exports: [ListingsService],
})
export class ListingsModule {}
