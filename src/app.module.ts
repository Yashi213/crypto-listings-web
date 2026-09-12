import { join } from 'path';
import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { ListingsModule } from './listings/listings.module';
import { MarketNewsModule } from './market-news/market-news.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AssetsModule } from './assets/assets.module';
import { ComplexityPlugin } from './graphql/complexity.plugin';
import './graphql/enums';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      graphiql: true,
      playground: true,
      introspection: true,
    }),
    PrismaModule,
    AssetsModule,
    ExchangesModule,
    ListingsModule,
    MarketNewsModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService, ComplexityPlugin],
})
export class AppModule {}
