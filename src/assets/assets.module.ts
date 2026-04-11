import { Module } from '@nestjs/common';
import { AssetsApiController } from './assets-api.controller';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';

@Module({
  controllers: [AssetsController, AssetsApiController],
  providers: [AssetsService],
})
export class AssetsModule {}
