import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExchangeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  logoUrl?: string;
}
