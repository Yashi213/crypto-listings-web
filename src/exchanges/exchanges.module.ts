import { Module } from '@nestjs/common';
import { ExchangesApiController } from './exchanges-api.controller';
import { ExchangesResolver } from './exchanges.resolver';
import { ExchangesService } from './exchanges.service';
import { ExchangesController } from './exchanges.controller';

@Module({
  controllers: [ExchangesController, ExchangesApiController],
  providers: [ExchangesService, ExchangesResolver],
  exports: [ExchangesService],
})
export class ExchangesModule {}
