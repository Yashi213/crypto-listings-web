import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMarketNewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsString()
  @MinLength(1)
  publishedAt!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  imageUrl!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  imageAlt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sourceUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    return typeof value === 'number' ? value : parseInt(String(value), 10);
  })
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsString()
  @MinLength(1)
  exchangeId!: string;
}
