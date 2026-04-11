import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /** Dev: другой origin (в т.ч. localhost vs 127.0.0.1) не ломает Swagger Try it out. */
  app.enableCors({ origin: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Listing Tracker API')
    .setDescription('REST API (OpenAPI 3).')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

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

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}
bootstrap();
