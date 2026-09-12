import { Module } from '@nestjs/common';
import { FeedbackApiController } from './feedback-api.controller';
import { FeedbackResolver } from './feedback.resolver';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';

@Module({
  controllers: [FeedbackController, FeedbackApiController],
  providers: [FeedbackService, FeedbackResolver],
  exports: [FeedbackService],
})
export class FeedbackModule {}
