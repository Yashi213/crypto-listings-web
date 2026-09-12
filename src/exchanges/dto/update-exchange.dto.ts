import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateExchangeDto } from './create-exchange.dto';

export class UpdateExchangeDto extends PartialType(CreateExchangeDto) {
  @ApiPropertyOptional({
    description:
      'Удалить текущий логотип (в JSON: true/false; в форме: 1, on, true)',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === true || value === 'true' || value === '1' || value === 'on') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  removeLogo?: boolean;
}
