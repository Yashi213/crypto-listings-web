import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Paginated } from '../../graphql/paginated';

@ObjectType({ description: 'Криптобиржа' })
export class Exchange {
  @Field(() => ID, { description: 'Идентификатор биржи' })
  id: string;

  @Field({ description: 'Название биржи' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Сайт биржи' })
  website?: string | null;

  @Field(() => String, { nullable: true, description: 'URL логотипа' })
  logoUrl?: string | null;

  @Field({ description: 'Дата создания записи' })
  createdAt: Date;

  @Field({ description: 'Дата последнего обновления' })
  updatedAt: Date;
}

@ObjectType({ description: 'Страница списка бирж' })
export class ExchangePage extends Paginated(Exchange) {}

@InputType({ description: 'Данные для создания биржи' })
export class CreateExchangeInput {
  @Field({ description: 'Название' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name: string;

  @Field(() => String, { nullable: true, description: 'Сайт' })
  @IsOptional()
  @IsString()
  website?: string;

  @Field(() => String, { nullable: true, description: 'URL логотипа' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

@InputType({ description: 'Данные для частичного обновления биржи' })
export class UpdateExchangeInput {
  @Field(() => String, { nullable: true, description: 'Название' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @Field(() => String, { nullable: true, description: 'Сайт' })
  @IsOptional()
  @IsString()
  website?: string;

  @Field(() => String, { nullable: true, description: 'URL логотипа' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @Field(() => Boolean, { nullable: true, description: 'Удалить текущий логотип' })
  @IsOptional()
  removeLogo?: boolean;
}
