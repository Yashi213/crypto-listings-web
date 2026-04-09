import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
