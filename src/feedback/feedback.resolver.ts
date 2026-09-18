import { NotFoundException } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { PublicAccess } from '../auth/public-access.decorator';
import { AuthRequired, Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../auth/auth.types';
import { paginatedComplexity } from '../graphql/complexity.util';
import { PaginationArgs } from '../graphql/pagination.args';
import { toPage } from '../graphql/paginated';
import { FeedbackService } from './feedback.service';
import {
  CreateFeedbackInput,
  Feedback,
  FeedbackPage,
  FeedbackUser,
  UpdateFeedbackInput,
} from './graphql/feedback.types';

@PublicAccess()
@Resolver(() => Feedback)
export class FeedbackResolver {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Query(() => Feedback, { description: 'Один отзыв по id' })
  feedback(
    @Args('id', { type: () => ID, description: 'ID отзыва' }) id: string,
  ) {
    return this.feedbackService.findOne(id);
  }

  @Query(() => FeedbackPage, {
    description: 'Список отзывов с пагинацией',
    complexity: paginatedComplexity,
  })
  async feedbacks(@Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.feedbackService.findAllPaginated(
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }

  @AuthRequired()
  @Mutation(() => Feedback, {
    description: 'Создать отзыв (только зарегистрированный пользователь)',
  })
  createFeedback(
    @Args('input') input: CreateFeedbackInput,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.feedbackService.create(
      {
        message: input.message,
        rating:
          input.rating !== undefined && input.rating !== null
            ? String(input.rating)
            : undefined,
      },
      actor,
    );
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Feedback, { description: 'Частично обновить отзыв' })
  updateFeedback(
    @Args('id', { type: () => ID, description: 'ID отзыва' }) id: string,
    @Args('input') input: UpdateFeedbackInput,
  ) {
    return this.feedbackService.update(id, {
      message: input.message,
      rating: input.rating,
    });
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean, { description: 'Удалить отзыв' })
  async removeFeedback(
    @Args('id', { type: () => ID, description: 'ID отзыва' }) id: string,
  ) {
    await this.feedbackService.remove(id);
    return true;
  }

  @ResolveField(() => FeedbackUser, { description: 'Автор отзыва' })
  user(
    @Parent()
    row: Feedback & { user?: FeedbackUser },
  ) {
    if (!row.user) {
      throw new NotFoundException(`Автор отзыва ${row.id} не найден`);
    }
    return row.user;
  }
}
