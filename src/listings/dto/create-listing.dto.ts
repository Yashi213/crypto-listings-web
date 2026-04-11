import { ListingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateListingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsEnum(ListingStatus)
  status!: ListingStatus;

  @IsString()
  @MinLength(1)
  dateAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  description?: string;

  @IsString()
  @MinLength(1)
  exchangeId!: string;

  @IsOptional()
  @IsString()
  assetId?: string;
}
