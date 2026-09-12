import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { ListingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import '../../graphql/enums';
import { Paginated } from '../../graphql/paginated';

@ObjectType({ description: 'Листинг актива на бирже' })
export class Listing {
  @Field(() => ID, { description: 'Идентификатор листинга' })
  id: string;

  @Field({ description: 'Название листинга' })
  title: string;

  @Field(() => ListingStatus, { description: 'Предстоящий или недавний' })
  status: ListingStatus;

  @Field({ description: 'Дата листинга' })
  dateAt: Date;

  @Field(() => String, { nullable: true, description: 'Описание или особенности' })
  description?: string | null;

  @Field(() => ID, { description: 'ID биржи' })
  exchangeId: string;

  @Field(() => ID, { nullable: true, description: 'ID основного актива' })
  assetId?: string | null;

  @Field({ description: 'Дата создания записи' })
  createdAt: Date;

  @Field({ description: 'Дата последнего обновления' })
  updatedAt: Date;
}

@ObjectType({ description: 'Страница списка листингов' })
export class ListingPage extends Paginated(Listing) {}

@ObjectType({ description: 'Торговая пара листинга' })
export class TradingPair {
  @Field(() => ID, { description: 'Идентификатор пары' })
  id: string;

  @Field(() => ID, { description: 'ID листинга' })
  listingId: string;

  @Field(() => ID, { description: 'ID базового актива' })
  baseAssetId: string;

  @Field(() => ID, { description: 'ID котируемого актива' })
  quoteAssetId: string;

  @Field({ description: 'Дата добавления пары' })
  createdAt: Date;
}

@ObjectType({ description: 'Страница торговых пар' })
export class TradingPairPage extends Paginated(TradingPair) {}

@InputType({ description: 'Данные для создания листинга' })
export class CreateListingInput {
  @Field({ description: 'Название' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @Field(() => ListingStatus, { description: 'Статус листинга' })
  @IsEnum(ListingStatus)
  status: ListingStatus;

  @Field({ description: 'Дата листинга (ISO-8601)' })
  @IsString()
  @MinLength(1)
  dateAt: string;

  @Field(() => String, { nullable: true, description: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { description: 'ID биржи' })
  @IsString()
  @MinLength(1)
  exchangeId: string;

  @Field(() => ID, { nullable: true, description: 'ID основного актива' })
  @IsOptional()
  @IsString()
  assetId?: string;
}

@InputType({ description: 'Данные для частичного обновления листинга' })
export class UpdateListingInput {
  @Field(() => String, { nullable: true, description: 'Название' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @Field(() => ListingStatus, { nullable: true, description: 'Статус' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @Field(() => String, { nullable: true, description: 'Дата листинга (ISO-8601)' })
  @IsOptional()
  @IsString()
  dateAt?: string;

  @Field(() => String, { nullable: true, description: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true, description: 'ID биржи' })
  @IsOptional()
  @IsString()
  exchangeId?: string;

  @Field(() => ID, { nullable: true, description: 'ID основного актива' })
  @IsOptional()
  @IsString()
  assetId?: string;
}

@InputType({ description: 'Активы для новой торговой пары' })
export class AddTradingPairInput {
  @Field(() => ID, { description: 'ID базового актива' })
  @IsString()
  @MinLength(1)
  baseAssetId: string;

  @Field(() => ID, { description: 'ID котируемого актива' })
  @IsString()
  @MinLength(1)
  quoteAssetId: string;
}
