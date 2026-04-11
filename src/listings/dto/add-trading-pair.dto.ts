import { IsString, MinLength } from 'class-validator';

export class AddTradingPairDto {
  @IsString()
  @MinLength(1)
  baseAssetId!: string;

  @IsString()
  @MinLength(1)
  quoteAssetId!: string;
}
