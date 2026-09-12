import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import '../../graphql/enums';
import { Paginated } from '../../graphql/paginated';

@ObjectType({ description: 'Автор отзыва' })
export class FeedbackUser {
  @Field(() => ID, { description: 'Идентификатор пользователя' })
  id: string;

  @Field({ description: 'Email' })
  email: string;

  @Field({ description: 'Отображаемое имя' })
  displayName: string;

  @Field(() => UserRole, { description: 'Роль' })
  role: UserRole;
}

@ObjectType({ description: 'Отзыв пользователя' })
export class Feedback {
  @Field(() => ID, { description: 'Идентификатор отзыва' })
  id: string;

  @Field({ description: 'Текст отзыва' })
  message: string;

  @Field(() => Int, { nullable: true, description: 'Оценка от 1 до 5' })
  rating?: number | null;

  @Field({ description: 'Дата создания' })
  createdAt: Date;

  @Field(() => ID, { description: 'ID автора' })
  userId: string;
}

@ObjectType({ description: 'Страница списка отзывов' })
export class FeedbackPage extends Paginated(Feedback) {}

@InputType({ description: 'Данные для создания отзыва' })
export class CreateFeedbackInput {
  @Field({ description: 'Текст (минимум 10 символов)' })
  @IsString()
  @MinLength(10)
  message: string;

  @Field(() => Int, { nullable: true, description: 'Оценка 1–5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field(() => String, { nullable: true, description: 'ФИО (вместе с email)' })
  @IsOptional()
  @ValidateIf(
    (o: CreateFeedbackInput) =>
      !!String(o.email ?? '').trim() || !!String(o.displayName ?? '').trim(),
  )
  @IsString()
  @MinLength(3)
  displayName?: string;

  @Field(() => String, { nullable: true, description: 'Email (вместе с ФИО)' })
  @IsOptional()
  @ValidateIf(
    (o: CreateFeedbackInput) =>
      !!String(o.email ?? '').trim() || !!String(o.displayName ?? '').trim(),
  )
  @IsEmail()
  email?: string;
}

@InputType({ description: 'Данные для частичного обновления отзыва' })
export class UpdateFeedbackInput {
  @Field(() => String, { nullable: true, description: 'Текст (минимум 10 символов)' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  message?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Оценка 1–5; null — сбросить оценку',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number | null;
}
