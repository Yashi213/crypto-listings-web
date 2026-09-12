import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Paginated } from '../../graphql/paginated';

@ObjectType({ description: 'Новость рынка' })
export class MarketNews {
  @Field(() => ID, { description: 'Идентификатор новости' })
  id: string;

  @Field({ description: 'Заголовок' })
  title: string;

  @Field({ description: 'Дата публикации' })
  publishedAt: Date;

  @Field({ description: 'URL изображения' })
  imageUrl: string;

  @Field({ description: 'Альтернативный текст изображения' })
  imageAlt: string;

  @Field(() => String, { nullable: true, description: 'Краткое содержание' })
  summary?: string | null;

  @Field(() => String, { nullable: true, description: 'Ссылка на источник' })
  sourceUrl?: string | null;

  @Field(() => Int, { description: 'Порядок сортировки на главной' })
  sortOrder: number;

  @Field(() => ID, { description: 'ID биржи-источника' })
  exchangeId: string;

  @Field({ description: 'Дата создания записи' })
  createdAt: Date;

  @Field({ description: 'Дата последнего обновления' })
  updatedAt: Date;
}

@ObjectType({ description: 'Страница списка новостей' })
export class MarketNewsPage extends Paginated(MarketNews) {}

@InputType({ description: 'Данные для создания новости' })
export class CreateMarketNewsInput {
  @Field({ description: 'Заголовок' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @Field({ description: 'Дата публикации (ISO-8601)' })
  @IsString()
  @MinLength(1)
  publishedAt: string;

  @Field({ description: 'URL изображения' })
  @IsString()
  @MinLength(1)
  imageUrl: string;

  @Field({ description: 'Альтернативный текст изображения' })
  @IsString()
  @MinLength(1)
  imageAlt: string;

  @Field(() => String, { nullable: true, description: 'Краткое содержание' })
  @IsOptional()
  @IsString()
  summary?: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на источник' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @Field(() => Int, { nullable: true, description: 'Порядок сортировки' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field(() => ID, { description: 'ID биржи' })
  @IsString()
  @MinLength(1)
  exchangeId: string;
}

@InputType({ description: 'Данные для частичного обновления новости' })
export class UpdateMarketNewsInput {
  @Field(() => String, { nullable: true, description: 'Заголовок' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @Field(() => String, { nullable: true, description: 'Дата публикации (ISO-8601)' })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @Field(() => String, { nullable: true, description: 'URL изображения' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field(() => String, { nullable: true, description: 'Альтернативный текст' })
  @IsOptional()
  @IsString()
  imageAlt?: string;

  @Field(() => String, { nullable: true, description: 'Краткое содержание' })
  @IsOptional()
  @IsString()
  summary?: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на источник' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @Field(() => Int, { nullable: true, description: 'Порядок сортировки' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field(() => ID, { nullable: true, description: 'ID биржи' })
  @IsOptional()
  @IsString()
  exchangeId?: string;
}
