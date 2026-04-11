import { Module } from '@nestjs/common';
import { FeedbackApiController } from './feedback-api.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';

@Module({
  controllers: [FeedbackController, FeedbackApiController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
