import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { ListingsModule } from './listings/listings.module';
import { MarketNewsModule } from './market-news/market-news.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AssetsModule } from './assets/assets.module';

@Module({
  imports: [
    PrismaModule,
    AssetsModule,
    ExchangesModule,
    ListingsModule,
    MarketNewsModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
