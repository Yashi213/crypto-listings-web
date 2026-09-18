import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AssetsController } from '../assets/assets.controller';
import { ExchangesController } from '../exchanges/exchanges.controller';
import { FeedbackController } from '../feedback/feedback.controller';
import { ListingsController } from '../listings/listings.controller';
import { MarketNewsController } from '../market-news/market-news.controller';
import { AuthModuleOptions } from './auth-module.options';
import { AUTH_MODULE_OPTIONS } from './auth.constants';
import { AuthGuard } from './auth.guard';
import { AuthPagesController } from './auth-pages.controller';
import { AuthService } from './auth.service';
import { LoginRedirectMiddleware } from './login-redirect.middleware';
import { SessionContextMiddleware } from './session-context.middleware';
import {
  initSuperTokens,
  SuperTokensInitService,
} from './supertokens-init.service';
import { SuperTokensMiddleware } from './supertokens.middleware';
import { ViewAuthInterceptor } from './view-auth.interceptor';

@Module({})
export class AuthModule implements NestModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    initSuperTokens(options);
    return {
      module: AuthModule,
      global: true,
      controllers: [AuthPagesController],
      providers: [
        { provide: AUTH_MODULE_OPTIONS, useValue: options },
        SuperTokensInitService,
        AuthService,
        AuthGuard,
        SuperTokensMiddleware,
        SessionContextMiddleware,
        LoginRedirectMiddleware,
        ViewAuthInterceptor,
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_INTERCEPTOR, useClass: ViewAuthInterceptor },
      ],
      exports: [AuthService, AuthGuard],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SuperTokensMiddleware).forRoutes('*');
    consumer.apply(SessionContextMiddleware).forRoutes('*');
    consumer
      .apply(LoginRedirectMiddleware)
      .forRoutes(
        AuthPagesController,
        FeedbackController,
        ListingsController,
        AssetsController,
        ExchangesController,
        MarketNewsController,
      );
  }
}
