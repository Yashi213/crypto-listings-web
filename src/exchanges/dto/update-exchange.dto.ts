import { PartialType } from '@nestjs/mapped-types';
import { Allow, IsOptional, IsString } from 'class-validator';
import { CreateExchangeDto } from './create-exchange.dto';

export class UpdateExchangeDto extends PartialType(CreateExchangeDto) {
  @Allow()
  @IsOptional()
  @IsString()
  removeLogo?: string;
}
