import { Module } from '@nestjs/common';
import { ListingsApiController } from './listings-api.controller';
import { ListingsResolver, TradingPairsResolver } from './listings.resolver';
import { ListingsSseService } from './listings-sse.service';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

@Module({
  controllers: [ListingsController, ListingsApiController],
  providers: [
    ListingsService,
    ListingsSseService,
    ListingsResolver,
    TradingPairsResolver,
  ],
  exports: [ListingsService],
})
export class ListingsModule {}
