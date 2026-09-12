import { Module } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module';
import { AssetsApiController } from './assets-api.controller';
import { AssetsResolver } from './assets.resolver';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';

@Module({
  imports: [ListingsModule],
  controllers: [AssetsController, AssetsApiController],
  providers: [AssetsService, AssetsResolver],
  exports: [AssetsService],
})
export class AssetsModule {}
