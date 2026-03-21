import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/' });
  const viewsDir = join(process.cwd(), 'views');
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('pug');
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.locals.basedir = viewsDir;

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}
bootstrap();
