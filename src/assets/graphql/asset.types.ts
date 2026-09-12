import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Paginated } from '../../graphql/paginated';

@ObjectType({ description: 'Криптоактив (монета или токен)' })
export class Asset {
  @Field(() => ID, { description: 'Идентификатор актива' })
  id: string;

  @Field({ description: 'Тикер, например BTC' })
  symbol: string;

  @Field({ description: 'Полное название актива' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Описание актива' })
  description?: string | null;

  @Field(() => String, { nullable: true, description: 'Сайт проекта' })
  website?: string | null;

  @Field(() => String, { nullable: true, description: 'URL логотипа' })
  logoUrl?: string | null;

  @Field({ description: 'Дата создания записи' })
  createdAt: Date;

  @Field({ description: 'Дата последнего обновления' })
  updatedAt: Date;
}

@ObjectType({ description: 'Страница списка активов' })
export class AssetPage extends Paginated(Asset) {}

@InputType({ description: 'Данные для создания актива' })
export class CreateAssetInput {
  @Field({ description: 'Тикер' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  symbol: string;

  @Field({ description: 'Название' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name: string;

  @Field(() => String, { nullable: true, description: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true, description: 'Сайт' })
  @IsOptional()
  @IsString()
  website?: string;

  @Field(() => String, { nullable: true, description: 'URL логотипа' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

@InputType({ description: 'Данные для частичного обновления актива' })
export class UpdateAssetInput {
  @Field(() => String, { nullable: true, description: 'Тикер' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  symbol?: string;

  @Field(() => String, { nullable: true, description: 'Название' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @Field(() => String, { nullable: true, description: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string;

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
