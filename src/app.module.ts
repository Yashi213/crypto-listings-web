import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { authOptionsFromEnv } from './auth/auth-module.options';
import { AuthModule } from './auth/auth.module';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { PrismaModule } from './prisma/prisma.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { ListingsModule } from './listings/listings.module';
import { MarketNewsModule } from './market-news/market-news.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AssetsModule } from './assets/assets.module';
import { ElapsedTimeInterceptor } from './common/interceptors/elapsed-time.interceptor';
import { EtagInterceptor } from './common/interceptors/etag.interceptor';
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
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 5_000,
    }),
    AuthModule.forRoot(authOptionsFromEnv()),
    ObjectStorageModule,
    PrismaModule,
    AssetsModule,
    ExchangesModule,
    ListingsModule,
    MarketNewsModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ComplexityPlugin,
    { provide: APP_INTERCEPTOR, useClass: ElapsedTimeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EtagInterceptor },
  ],
})
export class AppModule {}
