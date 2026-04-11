import { Module } from '@nestjs/common';
import { ExchangesApiController } from './exchanges-api.controller';
import { ExchangesService } from './exchanges.service';
import { ExchangesController } from './exchanges.controller';

@Module({
  controllers: [ExchangesController, ExchangesApiController],
  providers: [ExchangesService],
  exports: [ExchangesService],
})
export class ExchangesModule {}
