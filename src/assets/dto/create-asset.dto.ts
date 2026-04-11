import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  symbol!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  logoUrl?: string;
}
