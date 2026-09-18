import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import SuperTokens from 'supertokens-node';
import { errorHandler } from 'supertokens-node/framework/express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ELAPSED_TIME_HEADER } from './common/interceptors/elapsed-time.interceptor';
import { SWAGGER_COOKIE_AUTH } from './auth/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * X-Elapsed-Time для всех ответов (в т.ч. GraphQL/GraphiQL).
   * Interceptor для GraphQL часто опаздывает: headers уже ушли.
   */
  const expressAppEarly = app.getHttpAdapter().getInstance();
  expressAppEarly.use(
    (
      _req: import('express').Request,
      res: import('express').Response,
      next: import('express').NextFunction,
    ) => {
      const started = performance.now();
      // Express наследует перегруженный writeHead из Node, который ESLint
      // не умеет безопасно вывести при сохранении ссылки на метод.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalWriteHead = res.writeHead;
      res.writeHead = ((
        ...args: Parameters<typeof res.writeHead>
      ): ReturnType<typeof res.writeHead> => {
        if (!res.getHeader(ELAPSED_TIME_HEADER)) {
          res.setHeader(
            ELAPSED_TIME_HEADER,
            `${Math.round(performance.now() - started)}ms`,
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalWriteHead.apply(res, args);
      }) as typeof res.writeHead;
      next();
    },
  );

  /** SuperTokens cookies: origin сайта, credentials и заголовки SDK. */
  const websiteDomain = process.env.SUPERTOKENS_WEBSITE_DOMAIN?.trim();
  app.enableCors({
    origin: websiteDomain || true,
    credentials: true,
    allowedHeaders: ['content-type', ...SuperTokens.getAllCORSHeaders()],
    exposedHeaders: [
      'X-Elapsed-Time',
      'ETag',
      'Cache-Control',
      ...SuperTokens.getAllCORSHeaders(),
    ],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Listing Tracker API')
    .setDescription(
      'REST API (OpenAPI 3). Сессия SuperTokens — cookie sAccessToken.',
    )
    .setVersion('1.0')
    .addCookieAuth(
      SWAGGER_COOKIE_AUTH,
      {
        type: 'apiKey',
        in: 'cookie',
        name: SWAGGER_COOKIE_AUTH,
        description: 'Access token SuperTokens (после /auth/signin)',
      },
      SWAGGER_COOKIE_AUTH,
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(json());
  app.use(urlencoded({ extended: true }));

  /** Старые статические *.html из public — перенаправляем на Nest+Pug, иначе виден устаревший макет без БД и CRUD */
  const expressApp = app.getHttpAdapter().getInstance();
  const redirectOldHtml = (from: string, to: string) => {
    expressApp.get(from, (_req, res) => res.redirect(302, to));
  };
  redirectOldHtml('/listing.html', '/listing');
  redirectOldHtml('/feedback.html', '/feedback');
  redirectOldHtml('/privacy.html', '/privacy');
  redirectOldHtml('/terms.html', '/terms');

  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/' });
  const viewsDir = join(process.cwd(), 'views');
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('pug');
  expressApp.locals.basedir = viewsDir;

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  expressApp.use(errorHandler());
  await app.listen(port);
}
void bootstrap();
