import { Module } from '@nestjs/common';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { MarketNewsApiController } from './market-news-api.controller';
import { MarketNewsService } from './market-news.service';
import { MarketNewsController } from './market-news.controller';
import { MarketNewsSseService } from './market-news-sse.service';

@Module({
  imports: [ExchangesModule],
  controllers: [MarketNewsController, MarketNewsApiController],
  providers: [MarketNewsService, MarketNewsSseService],
})
export class MarketNewsModule {}
